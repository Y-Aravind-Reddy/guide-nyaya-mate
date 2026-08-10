// Server-only helpers for Knowledge Base ingestion (text extraction, chunking, embeddings).

const TEXT_TYPES = ["txt", "md", "markdown", "csv", "json"];

/** Best-effort text extraction from an uploaded file buffer. */
export function extractText(fileType: string, buffer: ArrayBuffer): string {
  const ext = (fileType || "").toLowerCase().replace(".", "");
  const decoder = new TextDecoder("utf-8", { fatal: false });
  let text = decoder.decode(buffer);

  if (ext === "json") {
    try {
      const parsed = JSON.parse(text);
      text = flattenJson(parsed);
    } catch {
      /* keep raw */
    }
  }

  // For binary formats (pdf/docx) we can only salvage embedded readable runs.
  if (!TEXT_TYPES.includes(ext)) {
    text = text.replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]+/g, " ");
  }

  return text.replace(/\u0000/g, "").replace(/[ \t]+/g, " ").trim();
}

function flattenJson(value: unknown, depth = 0): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => flattenJson(v, depth + 1)).join("\n");
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${flattenJson(v, depth + 1)}`)
      .join("\n");
  }
  return "";
}

export type Chunk = {
  index: number;
  title: string | null;
  text: string;
  tokenCount: number;
  section: string | null;
};

/**
 * Semantic-ish chunking: split on markdown headings / blank lines, then pack
 * paragraphs into chunks bounded by an approximate token budget. Consecutive
 * chunks share an overlap block so facts split across a boundary stay
 * retrievable from either side.
 */
export function chunkText(text: string, maxTokens = 300, overlapTokens = 60): Chunk[] {
  if (!text.trim()) return [];

  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buffer: string[] = [];
  let currentSection: string | null = null;
  let bufferTokens = 0;

  const flush = () => {
    if (!buffer.length) return;
    const body = buffer.join("\n\n");
    chunks.push({
      index: chunks.length,
      title: currentSection,
      text: body,
      tokenCount: estimateTokens(body),
      section: currentSection,
    });
    // Carry the tail of this chunk into the next one for context overlap.
    const carry: string[] = [];
    let carried = 0;
    for (let i = buffer.length - 1; i >= 0; i--) {
      const t = estimateTokens(buffer[i]);
      if (carried + t > overlapTokens) break;
      carry.unshift(buffer[i]);
      carried += t;
    }
    buffer = carry;
    bufferTokens = carried;
  };

  for (const block of blocks) {
    const headingMatch = block.match(/^(#{1,6})\s+(.+)$/m);
    if (headingMatch && block.length < 120) {
      flush();
      buffer = [];
      bufferTokens = 0;
      currentSection = headingMatch[2].trim();
    }
    const blockTokens = estimateTokens(block);
    if (bufferTokens + blockTokens > maxTokens && buffer.length) flush();
    buffer.push(block);
    bufferTokens += blockTokens;
  }
  // Final flush must not re-carry, so clear afterwards.
  if (buffer.length) {
    const body = buffer.join("\n\n");
    const last = chunks[chunks.length - 1];
    if (!last || last.text !== body) {
      chunks.push({
        index: chunks.length,
        title: currentSection,
        text: body,
        tokenCount: estimateTokens(body),
        section: currentSection,
      });
    }
  }

  return chunks.map((c, i) => ({ ...c, index: i }));
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Global serialization gate: only ONE embedding request may be in flight at a
 * time per worker instance. Prevents bursts of concurrent requests from
 * tripping the gateway's rate limiter (the original cause of mass 429s).
 */
let embeddingQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = embeddingQueue.then(task, task);
  // keep the chain alive regardless of individual failures
  embeddingQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/** Batch cap for google/gemini-embedding-* is 100 inputs per request. */
const MAX_BATCH = 50;

/**
 * Generate embeddings for a batch of texts via the Lovable AI Gateway.
 *
 * - Requests are serialized (one in flight at a time).
 * - Large input sets are split into batches of {@link MAX_BATCH}.
 * - Transient failures (429 / 5xx) are retried up to 5 times with exponential
 *   backoff + jitter (~1s, 2s, 4s, 8s, 16s, capped at 20s), honouring
 *   `Retry-After` when supplied.
 * - Permanent failures (400/401/403/404) are NOT retried.
 */
export async function embedTexts(
  texts: string[],
  model = "google/gemini-embedding-001",
  attempts = 5,
): Promise<number[][]> {
  if (!texts.length) return [];
  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += MAX_BATCH) {
    const batch = texts.slice(i, i + MAX_BATCH);
    out.push(...(await enqueue(() => embedBatch(batch, model, attempts))));
  }
  return out;
}

async function embedBatch(
  texts: string[],
  model: string,
  attempts: number,
): Promise<number[][]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  let lastError = "";
  for (let attempt = 0; attempt < attempts; attempt++) {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({ model, input: texts }),
    });

    if (res.ok) {
      const json = (await res.json()) as { data?: { embedding: number[] }[] };
      return (json.data ?? []).map((d) => d.embedding);
    }

    const detail = await res.text().catch(() => "");
    lastError = `Embedding request failed (${res.status}): ${detail.slice(0, 200)}`;

    // 400/401/403/404 are permanent: retrying cannot help.
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === attempts - 1) break;

    const retryAfter = Number(res.headers.get("retry-after"));
    const backoff =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(retryAfter * 1000, 20_000)
        : Math.min(1000 * 2 ** attempt, 20_000);
    const wait = backoff + Math.floor(Math.random() * 400);
    console.warn(
      JSON.stringify({
        event: "embedding_retry",
        attempt: attempt + 1,
        status: res.status,
        wait_ms: wait,
        inputs: texts.length,
      }),
    );
    await sleep(wait);
  }

  console.error(
    JSON.stringify({ event: "embedding_failure", inputs: texts.length, error: lastError }),
  );
  throw new Error(lastError || "Embedding request failed");
}


export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/** SHA-256 hex digest of a buffer or string — used for duplicate detection. */
export async function sha256Hex(input: ArrayBuffer | string): Promise<string> {
  const data =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Heuristic chunk quality score (0-1): rewards well-sized, sectioned chunks and
 * penalises very short or very long fragments.
 */
export function scoreChunk(text: string, tokenCount: number, hasSection: boolean): number {
  let score = 0.5;
  if (tokenCount >= 80 && tokenCount <= 400) score += 0.25;
  if (tokenCount < 30) score -= 0.25;
  if (tokenCount > 600) score -= 0.15;
  if (hasSection) score += 0.1;
  if (/\d/.test(text)) score += 0.05; // contains concrete facts/figures
  return Math.max(0, Math.min(1, Number(score.toFixed(2))));
}

/** Map a knowledge category to a RAG chunk_type enum value. */
export function chunkTypeForCategory(category: string | null | undefined): string | null {
  const c = (category ?? "").toLowerCase();
  if (c.includes("procedure") || c.includes("service")) return "procedure";
  if (c.includes("faq")) return "faq";
  if (c.includes("legal") || c.includes("right") || c.includes("topic")) return "legal_topic";
  if (c.includes("scheme")) return "scheme";
  if (c.includes("glossary")) return "glossary";
  if (c.includes("template")) return "template";
  return "document";
}
