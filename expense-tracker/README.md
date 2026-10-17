# Spendwise

Spendwise is an AI-assisted expense tracker for turning paper receipts into
organized, searchable financial records. Scan a receipt to extract its items
and totals, track income and spending, and ask questions about saved records
through a context-aware chat assistant.

## Features

- **AI receipt scanning** — upload a receipt image and extract the merchant,
  date, item names, categories, quantities, prices, and total.
- **Manual transaction entry** — add income or build an expense receipt from
  individual items.
- **Spending overview** — review your balance, income and expense history, and
  spending by category.
- **Financial chat assistant** — ask questions about saved receipts and
  transactions; responses are grounded in retrieved records.
- **Local-first storage** — receipts, transactions, and chat history are stored
  in the browser using `localStorage`.
- **Containerized deployment** — run the Angular frontend and NestJS API with
  Docker Compose.

## Technology

- Angular 21 and TypeScript
- NestJS 11 and TypeScript
- AI model API with an OpenAI-compatible chat-completions interface
- Docker, Docker Compose, and Nginx

## How it works

The Angular application handles receipt uploads, transaction entry, and
financial summaries. It stores user data in browser `localStorage` and sends
receipt images or the current financial records to the NestJS API when an AI
feature is used.

For chat, the API builds a temporary in-memory index from the provided
financial records, retrieves relevant entries, and asks the configured model
to produce an evidence-based answer. The prompt describes explicit financial
analysis, context, pattern-checking, validation, and response stages in one
model request. Receipt analysis results are validated by the API before they
are returned to the frontend.

See the [architecture overview](docs/architecture.md) for more detail.

## Getting started

### Prerequisites

- Node.js 20 or newer and npm
- An API key and model endpoints compatible with the backend's chat-completions
  request format

### Run locally

Install the frontend and backend dependencies:

```bash
npm install
npm --prefix backend install
```

Start the API in a separate terminal. The following examples use PowerShell;
replace the endpoint URLs and key with your own configuration:

```powershell
$env:DIAL_API_KEY = "your-api-key"
$env:DIAL_CHAT_URL = "https://your-chat-endpoint"
$env:DIAL_RECEIPT_URL = "https://your-receipt-endpoint"
npm run start:api
```

Start the frontend in another terminal:

```bash
npm start
```

Open <http://localhost:4200/>. The API listens on
<http://localhost:3001/> by default.

### Run with Docker Compose

Create a `.env` file based on `.env.example`, set your own model API key and
endpoint URLs, then start the services:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open <http://localhost:4200/>. The API health endpoint is available at
<http://localhost:3001/health>. Stop the services with:

```bash
docker compose down
```

## API overview

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Check whether the API is running. |
| `POST /api/receipts/analyze` | Analyze a receipt image and return validated receipt data. |
| `POST /api/ai/chat` | Answer a question using the supplied financial records and conversation history. |

The backend expects `DIAL_API_KEY`, `DIAL_CHAT_URL`, and `DIAL_RECEIPT_URL`.
For Docker Compose, `PORT` defaults to `3001`, and `CORS_ORIGIN` defaults to
`http://localhost:4200`.

## Development

Build the frontend and backend:

```bash
npm run build
npm run build:api
```

Run the frontend unit tests:

```bash
npm test
```

## Current scope

Spendwise is a single-user prototype. Financial records and chat history live
in browser storage, while the chat retrieval index exists only for the duration
of an API request. The application does not currently provide user accounts,
cloud synchronization, or persistent server-side financial storage.
