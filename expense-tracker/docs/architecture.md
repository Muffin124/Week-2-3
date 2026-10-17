# Spendwise AI architecture

This document is the source of truth for the AI flow shown in the architecture
diagram. The current proof of concept deliberately keeps the orchestration in one
model request, while making each reasoning stage explicit in the prompt.

```mermaid
flowchart LR
    UI[Angular Chat UI] -->|message + receipts + transactions + last 10 turns| API[ChatController / Node API]
    API --> ORCH[AI Orchestrator]
    ORCH --> RAG[(ReceiptVectorStore\nhashed embeddings)]
    RAG -->|top 8 matching records| FIN[Financial Agent]
    RAG -->|top 8 matching records| CTX[Context Agent]
    RAG -->|top 8 matching records| PAT[Pattern Agent]
    FIN --> CRITIC[Critic / Validator]
    CTX --> CRITIC
    PAT --> CRITIC
    MEM[(Browser StorageService\nlocalStorage chatHistory)] --> ORCH
    CRITIC --> RESP[Response Agent]
    RESP -->|reply JSON| API
    API -->|HTTP response { reply }| UI
```

## Retrieval and memory

- `StorageService` is an **Angular frontend service**. It persists receipts,
  transactions, and chat turns in browser `localStorage`; it is not a backend
  database.
- Before every chat request, the UI sends the current financial records and the
  previous conversation turns. The API keeps only the last 10 valid
  user/assistant messages before adding them to the model prompt.
- `ReceiptVectorStore` creates deterministic hashed token embeddings for receipt
  and transaction summaries and retrieves the eight highest-scoring records.
  This is an embedded in-memory RAG index suitable for the PoC. A multi-user
  deployment should replace it with a persistent vector provider such as
  pgvector, keyed by user ID.

## Orchestration strategy

The stages run **sequentially as explicit sections of one model request**:

1. Financial Agent calculates totals, balances, date ranges, and comparisons.
2. Context Agent selects only retrieved receipt/transaction evidence relevant to
   the question.
3. Pattern Agent identifies recurring merchants or unusual changes only when
   supported by the evidence.
4. Critic/Validator checks every claim and number against retrieved evidence and
   rejects unsupported claims.
5. Response Agent formats the validated result for the Angular UI.

Keeping these stages in one request makes the PoC deterministic and cheap. They
can later become parallel model calls followed by a real aggregation step.
The system prompt, stage instructions, retrieved JSON, and conversation history
are assembled in [`chat-agent.ts`](../backend/src/agents/chat-agent.ts).

## Return flow

The response path is `Response Agent -> Node API -> Angular HttpClient ->
ChatComponent`. The component renders `reply`, stores the assistant turn in
`StorageService`, and displays an error when the API or model returns no usable
content.
