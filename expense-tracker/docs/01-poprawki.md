# Spendwise — Feature Specification v2

**Feature Branch**: `kamil_cynar/expense-tracker`

**Created**: 2026-09-18

**Status**: Draft for implementation / correction

## 1. Product context

Spendwise is an Angular-based personal finance proof of concept with a grounded AI assistant. The system combines structured financial records (receipts, income, expenses) with an AI-backed chat experience that explains spending patterns, compares periods, and answers questions using saved evidence.

The current repository already contains the core building blocks:

- Angular frontend for the expense tracker and chat UI
- localStorage-based persistence in `StorageService`
- Node.js backend API for AI orchestration and receipt analysis
- receipt parsing via a provider-backed model endpoint
- retrieval layer using a lightweight in-memory vector index for financial evidence
- validation of empty/invalid responses before returning results to the UI

This specification is based on the assessment summary, the current implementation, and the gaps identified in the evaluation: stricter SDD discipline, clearer backend debugging, stronger guardrails, and more explicit validation/testing.

## 2. Goal

Enable a user to understand their finances through a read-only AI assistant that:

- parses receipts and records money movements,
- calculates monthly balance and category totals,
- explains current spending trends with evidence,
- answers questions grounded only in saved receipts, transactions, and chat history,
- rejects unsupported or fabricated claims.

## 3. Scope

### In scope

- Manual and scanned receipt entry
- Expense and income tracking
- Monthly balance calculation
- Spending-by-category visualization
- Evidence-backed AI chat assistant
- Response validation and error reporting
- Basic backend request validation and configuration checks

### Out of scope

- Real bank integrations
- Multi-user authentication and accounts
- Persistent production-grade vector database
- Payment execution or write actions via AI
- PII-heavy external services or broad personal-data processing

## 4. User personas

### Primary user

A private household user who wants to understand where money is going, why their balance changed, and what they can do next without manually analyzing receipts and transactions.

### Secondary user

A demo/user-testing participant who needs a simple financial overview and an explainable AI assistant to validate spending decisions.

## 5. Core user journeys

### User Story 1 — Add and understand a receipt (Priority: P1)

A user can add a receipt manually or by image analysis, then see the merchant, items, total, and category information persisted in the app.

**Why this priority**: Receipt data is the foundation of the assistant and the financial model.

**Independent Test**: Add one receipt with multiple items and verify saved total equals `sum(price * quantity)`.

**Acceptance scenarios**:

1. Given a store and two products, when the user saves the receipt, then the app stores both items and the total is the sum of `price * quantity`.
2. Given an uploaded receipt image, when the analysis succeeds, then the app stores a validated merchant name, date, total, and item list.

---

### User Story 2 — Track income and expenses over a month (Priority: P1)

A user can record income and expense events and see the current-month balance update immediately.

**Why this priority**: The assistant needs reliable structured data to answer financial questions.

**Independent Test**: Add income and expense records and calculate the expected balance.

**Acceptance scenarios**:

1. Given current-month income of 4000 PLN and expenses of 1250 PLN, when the user opens the dashboard, then the displayed balance is 2750 PLN.
2. Given an expense or income transaction, when it is saved, then the transaction appears in the category summary and balance calculations.

---

### User Story 3 — Ask grounded questions about spending (Priority: P1)

A user can ask the AI assistant to explain a monthly balance change, compare categories, or identify top spending drivers using evidence from their saved data.

**Why this priority**: This is the primary value proposition of the product.

**Independent Test**: Ask a question using saved data, then confirm the reply references stored records and not invented values.

**Acceptance scenarios**:

1. Given saved receipts and financial transactions, when the user asks about this month’s spending, then the assistant returns an answer based on stored evidence.
2. Given no relevant evidence is found, when the user asks a question, then the assistant responds explicitly that the evidence is missing instead of guessing.

---

### User Story 4 — Receive grounded recipe or product advice (Priority: P2)

A user can ask whether they have ingredients or products relevant to a meal or shopping context, and the assistant should base the answer on saved receipts and product entries.

**Why this priority**: This is a useful persona-level scenario that proves grounding and retrieval quality.

**Independent Test**: Provide receipts containing eggs and milk, then ask about them and verify the reply is grounded in those entries.

**Acceptance scenarios**:

1. Given saved products include eggs and milk, when the user asks what recipe inputs they have, then the assistant answers using those saved items.
2. Given the product is not in storage, when the user asks about it, then the assistant states it is not in the saved records.

---

### User Story 5 — See error states for invalid AI output (Priority: P1)

If the AI provider returns no assistant content or a malformed payload, the user must receive a reliable error instead of silent failure.

**Why this priority**: Invalid AI responses are a critical integration risk and must be visible to the user.

**Independent Test**: Simulate an empty model response and ensure the service rejects it with a UI-visible error.

**Acceptance scenarios**:

1. Given the provider returns no assistant content, when the request reaches the UI, then the service rejects the response and the UI displays an error.
2. Given the provider returns invalid JSON or an empty receipt object, when the analysis endpoint is called, then the app fails clearly and preserves user trust.

---

## 6. Functional requirements

### FR-001: Receipt structure
The system MUST support receipt records with:

- merchant name
- date
- total amount
- list of purchased items

Each item MUST contain:

- name
- price
- category
- quantity

### FR-002: Multi-item receipt entry
Users MUST be able to add multiple receipt items in a single receipt record and save them as one transaction.

### FR-003: Transactions
Users MUST be able to record income and expense transactions with:

- amount
- category
- description
- date
- type

### FR-004: Monthly balance
The application MUST calculate monthly balance as current-month income minus current-month expenses.

### FR-005: Category analytics
The system MUST aggregate spending by category and present these values in the UI.

### FR-006: AI grounded context
Every chat request MUST include:

- saved receipts
- financial transactions
- recent conversation history (last 10 turns)

### FR-007: Evidence retrieval
The backend MUST build a local vector index from financial records and retrieve the most relevant evidence before composing the model prompt.

### FR-008: Deterministic orchestration
The backend MUST run explicit analytical stages for:

- Finance
- Context
- Pattern
- Critic/Validator
- Response formatting

The current proof of concept may keep these stages in one model call, but they MUST remain visible and deterministic.

### FR-009: Grounded-only answer policy
The assistant MUST NOT invent products, financial records, categories, merchants, or totals that are not present in user records or retrieved evidence.

### FR-010: Error handling
The backend and frontend MUST reject empty, malformed, or unsupported AI responses and show a clear user-facing error.

### FR-011: Guardrails and safety
The system MUST implement basic guardrails for:

- invalid model payload rejection,
- missing configuration detection,
- request-size validation,
- prompt injection risk mitigation through constrained system prompts,
- no exposure of provider secrets in source code,
- no PII leakage in prompts or logs beyond what is required for local demo use.

### FR-012: SDD compliance
The implementation MUST be driven by written acceptance scenarios and tests. Bug fixes and feature work MUST trace back to a user-visible requirement or acceptance scenario.

## 7. Edge cases

- Empty or malformed request body in the backend API.
- Missing `DIAL_API_KEY` or missing model endpoints.
- Empty provider response, or JSON without assistant content.
- User asks a question with no matching saved data.
- Receipt items with negative or invalid totals.
- Large images or over-sized payloads.
- Unrealistic category values or unsupported merchant names.
- Duplicate transaction IDs or stale records in localStorage.

## 8. Non-functional requirements

### NFR-001: Security
The system MUST never store real API keys in source control. Secrets MUST be loaded from environment variables.

### NFR-002: Reliability
The API MUST fail predictably with explicit HTTP status codes and user-facing errors instead of crashing silently.

### NFR-003: Performance
The system MUST respond to basic chat requests within a reasonable demo timeframe using the lightweight in-memory retrieval approach.

### NFR-004: Observability
The backend SHOULD log configuration errors, invalid payloads, provider failures, and request issues in a structured way for debugging.

### NFR-005: Maintainability
The system SHOULD keep the logic modular: UI services, storage, backend agent layer, and retrieval logic are separated by responsibility.

## 9. Technical architecture aligned with current code

### Frontend

- Angular app with route-based shell and expense tracker components
- `StorageService` persists `ExpenseRecord`, `FinancialTransaction`, and chat history in `localStorage`
- `ChatService` sends `{ message, expenses, transactions, history }` to the backend API
- `ReceiptAnalyzerService` submits image data to the receipt endpoint

### Backend

- Node.js TypeScript server listens on port 3001
- `/health` endpoint validates service availability
- `/api/ai/chat` executes the chat agent
- `/api/receipts/analyze` executes receipt analysis
- `callModel` centralizes model provider integration and validation

### Retrieval and orchestration

- `buildFinancialDocuments()` builds a local retrieval corpus from expenses and transactions
- `ReceiptVectorStore` performs similarity ranking over saved records
- `runChatAgent` fetches relevant evidence and sends it to the model with explicit orchestrator instructions
- `runReceiptAgent` validates input and parses the provider response as JSON

### Guardrails implemented in the repo

- Empty or missing `message` is rejected
- Invalid/empty provider response is rejected
- `imageBase64` and `mimeType` are validated before processing
- Request body is checked for valid JSON shape
- `maxBodySize` prevents oversized payloads

## 10. Acceptance criteria

- Users can store multiple receipt items in a single receipt.
- Monthly balance is calculated correctly and displayed in the UI.
- AI chat uses saved receipts and transactions as grounding evidence.
- If the provider response is empty or invalid, the app returns a visible error.
- The app does not store secret keys in source control.
- `npm test` and `npm run build` are part of the definition of done for each feature slice.

## 11. Quality gates

- Unit tests cover storage and chat response parsing.
- `npm test` passes.
- `npm run build` passes.
- No provider secret is committed to the repository.
- Feature work is tied to an acceptance scenario.
- Critical assumptions and failing behaviors are documented before implementation.

## 12. Risks and corrective actions based on the evaluation

### Risk 1 — Weak SDD discipline
The repository must keep each implementation change tied to a scenario, requirement, and test.

Corrective action:
- add or update a specification before writing code,
- keep user stories small and independently testable,
- verify the implementation against the acceptance criteria before demo readiness.

### Risk 2 — Backend debugging issues
The backend must be systematically tested against concrete payloads and error states.

Corrective action:
- verify API behavior with sample JSON payloads,
- test invalid responses, empty payloads, and missing env configuration,
- inspect logs and runtime failures before final demo.

### Risk 3 — Guardrails insufficient
The system must not rely on the model to self-correct in unsafe scenarios.

Corrective action:
- enforce validation at the HTTP boundary,
- prohibit unsupported claims in prompts,
- keep system prompts explicit and constrained,
- avoid sending raw personal data beyond the demo dataset.

### Risk 4 — Missing test suite
A working PoC without automated coverage is fragile.

Corrective action:
- add focused unit tests for storage, reply parsing, and invalid response handling,
- keep coverage aligned with the most business-critical flows.

## 13. Definition of done

A feature is done only when:

- the user story is implemented,
- the relevant acceptance scenario is satisfied,
- a focused test exists,
- the code builds successfully,
- the behavior is validated manually or by automated tests,
- no secret or sensitive data is committed.

## 14. Implementation note for the current repo

The current code already satisfies the basic structure of the PoC. The next improvement phase should focus on tightening specification compliance and reliability:

1. formalize feature requirements in a single canonical spec,
2. align code with those scenarios,
3. add or repair unit tests for parsing and storage,
4. validate backend responses and configuration errors,
5. add explicit guardrails for unsupported model outputs and privacy-sensitive content.
