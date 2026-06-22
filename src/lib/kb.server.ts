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
 * paragraphs into chunks bounded by an approximate token budget.
 */
export function chunkText(text: string, maxTokens = 350): Chunk[] {
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
    buffer = [];
    bufferTokens = 0;
  };

  for (const block of blocks) {
    const headingMatch = block.match(/^(#{1,6})\s+(.+)$/m);
    if (headingMatch && block.length < 120) {
      flush();
      currentSection = headingMatch[2].trim();
    }
    const blockTokens = estimateTokens(block);
    if (bufferTokens + blockTokens > maxTokens && buffer.length) flush();
    buffer.push(block);
    bufferTokens += blockTokens;
  }
  flush();

  return chunks;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

/** Generate embeddings for a batch of texts via the Lovable AI Gateway. */
export async function embedTexts(
  texts: string[],
  model = "google/gemini-embedding-001",
): Promise<number[][]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
  if (!texts.length) return [];

  const res = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({ model, input: texts }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Embedding request failed (${res.status}): ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as { data?: { embedding: number[] }[] };
  return (json.data ?? []).map((d) => d.embedding);
}

export function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
