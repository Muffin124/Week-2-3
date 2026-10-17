# Spendwise - AI Upskill 1-Pager

## Problem

Receipt data and personal finance records are difficult to understand quickly.

## Solution

An Angular AI assistant sends receipt and chat requests to the Node agent API. The API keeps
provider credentials private, builds a small vector index over receipt/transaction summaries,
retrieves relevant evidence, and answers grounded questions using the user's own records.

## AI capability

- Multimodal receipt extraction.
- RAG chat over a receipt/transaction vector index.
- Conversation memory persisted in the browser and injected as the last 10 turns.
- Recipe recommendations limited to saved food items.
- Financial summaries based on stored transactions.

## Architecture

The multi-agent architecture is shown in [`architecture.md`](architecture.md). Angular sends
the question, financial records, and conversation history to the Router/Orchestrator. The
orchestrator retrieves relevant records from the vector index, runs Finance, Context, and
Pattern stages sequentially in one deterministic model request, and applies Critic/Fact Checker
validation before the Response Agent formats the answer. The response returns through the API
and HTTP client to the Angular chat UI, where it is rendered and persisted in
`StorageService`. The stages are deliberately explicit so they can be split into parallel
model calls when the PoC moves to a multi-agent runtime.

## Tech stack and tools

Angular 21, TypeScript, RxJS, Vitest, OpenAPI, EPAM Dial API, Node.js, in-memory vector index,
localStorage, VS Code with Copilot.

## SDD proof

Receipt and grounded-chat requirements are specified in `specs/ai-expense-assistant.md`, implemented in services/components, and covered by unit tests.

## Value and next steps

The PoC removes manual calculations and demonstrates practical grounded AI. Next steps are a
secure persistent backend, category budgets, and alerts.
