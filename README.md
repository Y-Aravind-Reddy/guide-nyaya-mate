# ⚖️ NyayaMate AI
### Your Trusted AI Guide for Legal Rights & Government Services

**NyayaMate AI** is an AI-powered citizen guidance platform designed to simplify Indian legal rights, government services, public welfare schemes, and official procedures through clear explanations, step-by-step guidance, and source-backed AI responses.

> Making legal knowledge and government services easier to understand and access for every citizen.

<p align="center">
  <a href="https://guide-nyava-mate.lovable.app">🌐 Live Demo</a> ·
  <a href="#features">Features</a> ·
  <a href="#technology-stack">Technology Stack</a> ·
  <a href="#getting-started">Getting Started</a>
</p>

---

## 📌 Table of Contents

- Overview
- Problem Statement
- Solution
- Features
- AI and RAG Architecture
- Technology Stack
- Application Modules
- Data Sources and Trust
- Security and Accessibility
- Getting Started
- Project Status
- Future Enhancements
- Disclaimer
- Contributing
- License

## 🚀 Overview

Accessing legal information and government services can be confusing. Citizens often need to navigate multiple websites, understand complex legal terminology, and identify the correct procedures and documents.

NyayaMate AI brings essential citizen guidance into one platform, helping users explore legal rights, government services, welfare schemes, important laws, and complaint procedures.

The platform combines a searchable knowledge base with AI-powered retrieval to provide understandable answers and relevant official references.

**Live application:** https://guide-nyava-mate.lovable.app

## 🎯 Problem Statement

Citizens frequently face challenges such as:

- Understanding legal rights and laws written in complex language.
- Finding the correct government service or application procedure.
- Identifying required documents, eligibility criteria, fees, and steps.
- Locating trustworthy government websites and official resources.
- Understanding where and how to submit complaints or grievances.
- Finding relevant legal provisions when facing a particular issue.

## 💡 Our Solution

NyayaMate AI provides a unified citizen guidance experience with:

- AI-assisted legal and government information.
- Step-by-step government service guides.
- Searchable legal topics, laws, schemes, and FAQs.
- Complaint templates and practical procedural guidance.
- Official-source references to help users verify information.
- A searchable knowledge base supporting retrieval-augmented generation (RAG).

## ✨ Features

### 🤖 AI-Powered Legal and Government Assistant
- Conversational guidance for citizen queries.
- Retrieval-augmented generation (RAG).
- Relevant knowledge-base retrieval.
- Source citations where available.
- Conversation history and usage limits.
- Legal-information disclaimer to clarify the assistant's limitations.

### 🏛️ Government Services
Guides for services such as:

- Aadhaar enrolment and updates.
- PAN card assistance.
- Passport applications.
- Driving licences and vehicle services.
- Birth, death, domicile, and other certificates.
- Property and documentation procedures.
- Pension, healthcare, employment, and welfare services.

### ⚖️ Legal Knowledge Center
- Constitution of India resources.
- Bharatiya Nyaya Sanhita (BNS).
- Bharatiya Nagarik Suraksha Sanhita (BNSS).
- Bharatiya Sakshya Adhiniyam (BSA).
- Legal rights and topic guides.
- Law sections and related topics.
- Plain-language legal explanations.

### 📚 Knowledge and Information
- Government schemes and benefits.
- Frequently asked questions.
- Legal glossary.
- Official-source directory.
- Complaint templates.
- Searchable public information.

### 👤 User Features
- Account registration and login.
- Password reset.
- Personal dashboard.
- Saved items and bookmarks.
- Profile and settings.
- Chat history.

### 🛠️ Administration
- Knowledge-base management.
- Document ingestion and synchronisation.
- Content health monitoring.
- AI usage and retrieval analytics.
- Official-source verification workflows.
- Review queues and launch-readiness monitoring.

## 🧠 AI and RAG Architecture

NyayaMate AI uses a retrieval-augmented generation workflow to ground AI responses in available knowledge-base content.

```text
User Question
     |
     v
Query Processing
     |
     v
Knowledge Retrieval
     |
     v
Relevant Document Chunks
     |
     v
Context-Grounded AI Generation
     |
     v
Answer + Available Source Citations
```

### Knowledge Ingestion Pipeline

```text
Official Documents / CMS Content
              |
              v
       Text Extraction
              |
              v
        Text Chunking
              |
              v
     Embedding Generation
              |
              v
    PostgreSQL + pgvector
              |
              v
       AI Retrieval System
```

The ingestion pipeline processes supported knowledge-base content into searchable chunks and embeddings. Newly added content becomes available to the AI after successful processing and synchronisation.

AI answers can still be incomplete or incorrect. Legal provisions and procedural details should be verified against authoritative sources.

## 🧰 Technology Stack

| Component | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| Routing | TanStack Router |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS v4 |
| UI components | shadcn/ui |
| Backend platform | Lovable Cloud |
| Database | PostgreSQL |
| Authentication | Backend authentication and role-based access |
| Vector retrieval | pgvector |
| AI embeddings | Gemini embeddings |
| AI generation | Configured AI model/provider |
| File storage | Backend storage |
| Deployment | Lovable-hosted application |

*Confirm the exact configured AI model, provider, and package versions before publishing this list.*

## 🗂️ Application Modules

The application includes the following modules:

| Module | Purpose |
|---|---|
| Public website | Introduces the platform and its services |
| Government Services | Procedures, eligibility, documents, and service guides |
| Legal Rights | Citizen rights and legal information |
| Legal Knowledge Center | Laws, articles, sections, and related topics |
| Schemes | Government schemes and benefits |
| Official Sources | Directory of official information sources |
| AI Chat | Conversational knowledge retrieval |
| Knowledge Base | Document management and ingestion |
| Admin Dashboard | Content, usage, and operational monitoring |
| User Dashboard | Saved content, profile, and chat history |

## 🔐 Security and Accessibility

NyayaMate AI incorporates security and accessibility measures, including:

- Database row-level security policies.
- Role-based access control.
- Protected authenticated routes.
- Server-side AI usage limits.
- Secret-protected backend operations.
- Official-source verification metadata.
- Keyboard navigation and visible focus indicators.
- Accessible form labels and page landmarks.
- Reduced-motion support.
- Accessibility improvements inspired by WCAG and GIGW.

These features do not by themselves establish formal GIGW or WCAG conformance. A complete audit and remediation process is required before claiming compliance.

## 📖 Data Sources and Trust

The platform is designed to prioritise authoritative Indian public-information sources, including:

- [India Code](https://www.indiacode.nic.in/)
- [Legislative Department](https://legislative.gov.in/)
- [India.gov.in](https://www.india.gov.in/)
- [UIDAI](https://uidai.gov.in/)
- [Passport Seva](https://passportindia.gov.in/)
- [National Legal Services Authority](https://nalsa.gov.in/)

Use official sources to verify legal text, amendments, eligibility criteria, fees, deadlines, and application procedures.

Source availability and freshness can change. Each source should be checked individually.

## ⚙️ Getting Started

### Prerequisites

- Node.js version supported by the project.
- npm or the package manager specified in the repository.
- Access to the required backend and AI service configuration.
- Required environment variables and API credentials.

### Installation

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd YOUR_PROJECT_DIRECTORY
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables using the project's documented example file. Never commit real API keys, database passwords, or service-role secrets.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL shown in your terminal.

### Production Build

```bash
npm run build
```

Use the scripts defined in `package.json` for testing, linting, and previewing the production build.

**Important:** This repository uses a Lovable-managed backend. Local development requires the appropriate backend configuration; cloning the frontend alone does not automatically reproduce the production database, authentication, storage, or AI services.

## 📊 Project Status

**Current stage: Beta / Demo Day**

The latest project inventory reported:

- 31 government service guides.
- 25 legal topics.
- 98 FAQs.
- 62 glossary terms.
- 41 active official-source records.
- 231 knowledge documents and 250 embedded chunks at the reported audit point.
- AI chat with RAG, citations, conversation history, and usage limits.
- User dashboard and administrative tools.

These are historical audit figures, not guaranteed live counts. Update this section after the next database audit and AI answer-quality evaluation.

## 🛣️ Future Enhancements

- Expand verified government service coverage.
- Improve multilingual content across all pages.
- Add broader authoritative legal-document coverage.
- Develop legal case-law search using reliable public sources.
- Evaluate AI answer accuracy and unsupported claims.
- Improve citation precision and source freshness.
- Complete legal expert review of content under review.
- Expand automated testing and monitoring.
- Improve accessibility through manual and automated audits.
- Prepare for a controlled public beta.

## ⚠️ Disclaimer

NyayaMate AI is an informational and educational guidance platform. It does not replace a qualified lawyer, official government authority, or professional legal advice.

AI-generated information may be incomplete, outdated, or incorrect. Users should verify important information against official sources and consult a qualified legal professional when appropriate.

NyayaMate AI is not an official government website and does not claim government affiliation or endorsement.

## 🤝 Contributing

Contributions that improve accessibility, content quality, source verification, security, and user experience are welcome.

Before contributing:

1. Discuss substantial changes through an issue.
2. Avoid submitting personal or sensitive information.
3. Verify legal claims against authoritative sources.
4. Never commit credentials, private data, or production secrets.
5. Include appropriate tests for code changes.

## 📄 License

Choose and add a license before accepting external contributions or redistributing the code.

If you intend to use the MIT License, create a `LICENSE` file containing the official MIT license text and confirm that you have the rights to license all included code and assets.

---

**Built with the goal of making legal and government information easier to understand, discover, and verify for every citizen.**

**NyayaMate AI — Your Trusted AI Guide for Legal Rights & Government Services.**
