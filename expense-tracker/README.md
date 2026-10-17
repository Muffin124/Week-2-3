# Spendwise - AI Expense Assistant

Spendwise is an Angular proof of concept for receipt understanding and grounded
personal-finance analysis. The browser application stores demo data locally and
calls a NestJS TypeScript API for receipt analysis and evidence-backed chat.
Provider credentials stay on the backend.

## Features

- Receipt image analysis into merchant, date, total, products, categories, and quantities.
- Manual multi-item receipt entry.
- Income and expense tracking.
- Current-month balance calculation.
- Spending-by-category visualization.
- Floating, read-only AI assistant grounded in saved receipts and transactions.
- Validation of request payloads, receipt totals, model responses, and oversized uploads.
- Visible frontend errors for failed or invalid API responses.

## Project structure

```text
src/                    Angular application
  app/core/components/  Receipt scanner, dashboard, and chat UI
  app/core/services/    Storage, chat, and receipt API services
backend/src/            NestJS TypeScript agent API
docs/                   Architecture, specification, and demo documentation
```

## AI Upskill deliverables

- [Feature specification and acceptance scenarios](docs/01-poprawki.md)
- [Architecture overview](docs/architecture.md)
- [Architecture data-flow diagram](docs/SpendWise%20Architecture.svg)
- [1-page use-case content](docs/ai-upskill-1-pager.md)
- [NestJS TypeScript agent API](backend/src/main.ts)

The editable one-pager presentation is kept outside this project folder at
`Week 2-3/Kamil_Cynar - AI_Upskill.2026.pptx`.

## Prerequisites

- Node.js 20 or newer
- npm
- A configured DIAL-compatible model endpoint for backend calls

## Installation

Install dependencies for the Angular application and backend:

```bash
npm install
npm --prefix backend install
```

## Development

Start the Angular frontend:

```bash
npm start
```

In a second terminal, configure the backend and start the API:

```bash
# PowerShell
$env:DIAL_API_KEY = "your-api-key"
$env:DIAL_CHAT_URL = "https://your-chat-endpoint"
$env:DIAL_RECEIPT_URL = "https://your-receipt-endpoint"
npm run start:api
```

Open <http://localhost:4200/>.

The backend listens on port `3001` by default. Set `PORT` to use another port.
The frontend expects the API at `http://localhost:3001`.

## Docker

Copy `.env.example` to `.env` and set the DIAL credentials and model URLs, then
build and start both containers:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open <http://localhost:4200/>. The Angular container serves the production
build with Nginx, and the NestJS API is available at
<http://localhost:3001/health>. Stop the containers with `docker compose down`.

## API

### `GET /health`

Returns a basic service status:

```json
{ "status": "ok" }
```

### `POST /api/ai/chat`

Request:

```json
{
  "message": "Where did I spend the most this month?",
  "expenses": [],
  "transactions": [],
  "history": []
}
```

The API builds an in-memory deterministic vector index from the supplied
financial records, retrieves relevant evidence, and runs the explicit
Finance, Context, Pattern, Critic/Validator, and Response stages in one
constrained model request.

Response:

```json
{ "reply": "..." }
```

Only the last 10 valid user/assistant messages from `history` are used by the
backend. The Angular `StorageService` keeps up to 20 chat messages locally.

### `POST /api/receipts/analyze`

Request:

```json
{
  "imageBase64": "<base64 image data>",
  "mimeType": "image/jpeg"
}
```

The backend returns a validated receipt object. It rejects empty payloads,
non-image MIME types, invalid item data, and totals that do not match
`sum(price * quantity)`.

## Build and tests

Build the Angular frontend:

```bash
npm run build
```

Build the backend:

```bash
npm run build:api
```

Run the Angular unit tests:

```bash
npm test
```

The focused test suite covers storage behavior, chat response validation, and
receipt service behavior.

## Security and configuration

Never commit provider credentials. Configure `DIAL_API_KEY`, `DIAL_CHAT_URL`,
and `DIAL_RECEIPT_URL` as environment variables in the terminal that starts
the backend. The Angular application contains no provider key.

The current vector index and browser storage are intended for a single-user
demo. A production deployment should add authentication, server-side
persistence, user isolation, and a persistent vector provider such as
pgvector.

## SDD workflow

1. Review the acceptance scenarios in [docs/01-poprawki.md](docs/01-poprawki.md).
2. Implement the smallest change that satisfies a user-visible requirement.
3. Add or update a focused unit test.
4. Run `npm test`, `npm run build`, and `npm run build:api`.
5. Verify the relevant frontend and API error states before the demo.
