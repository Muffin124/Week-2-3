import { callModel } from '../model-client.js';
import { buildFinancialDocuments, ReceiptVectorStore } from '../rag-store.js';

const SYSTEM_PROMPT =
  'You are the Response Agent for a read-only financial assistant. ' +
  'The Router performs Finance, Context, and Pattern analysis, then Critic validation, ' +
  'as explicit stages in one model request. ' +
  'Use only retrieved records and conversation history. Never invent financial records or products. ' +
  'If evidence is missing, say so explicitly. Keep suggestions grounded in saved items.';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message?: unknown;
  expenses?: unknown[];
  transactions?: unknown[];
  history?: unknown;
}

export async function runChatAgent({
  message,
  expenses,
  transactions,
  history = [],
}: ChatRequest): Promise<{ reply: string }> {
  if (typeof message !== 'string' || !message.trim()) {
    throw new TypeError('message must be a non-empty string.');
  }
  if (expenses !== undefined && !Array.isArray(expenses)) {
    throw new TypeError('expenses must be an array.');
  }
  if (transactions !== undefined && !Array.isArray(transactions)) {
    throw new TypeError('transactions must be an array.');
  }
  if (history !== undefined && !Array.isArray(history)) {
    throw new TypeError('history must be an array.');
  }

  const store = new ReceiptVectorStore(buildFinancialDocuments(expenses ?? [], transactions ?? []));
  const retrieved = store.search(message.trim());
  const retrievedContext = JSON.stringify(retrieved.map(({ id, score, metadata }) => ({
    id,
    relevance: Number(score.toFixed(3)),
    ...metadata,
  })));
  const safeHistory = (Array.isArray(history) ? history : [])
    .filter(isChatMessage)
    .slice(-10);
  const agentPlan = [
    'Finance Agent: calculate totals, balances, date ranges, and category comparisons from evidence.',
    'Context Agent: use only the retrieved receipt/transaction records relevant to the question.',
    'Pattern Agent: identify recurring merchants or unusual changes only when supported by evidence.',
    'Critic/Validator: reject unsupported claims and check every number against the evidence.',
    'Response Agent: produce the concise final answer for the Angular chat UI.',
  ].join('\n');
  const payload = await callModel(process.env['DIAL_CHAT_URL'], {
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...safeHistory,
      {
        role: 'user',
        content: `${agentPlan}\n\nQuestion:\n${message.trim()}\n\nRetrieved evidence from the receipt vector store (JSON):\n${retrievedContext}`,
      },
    ],
  });

  const reply = payload.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('The chat model returned an empty or invalid response.');
  }

  return { reply };
}

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    ((value as ChatMessage).role === 'user' ||
      (value as ChatMessage).role === 'assistant') &&
    typeof (value as ChatMessage).content === 'string' &&
    Boolean((value as ChatMessage).content.trim())
  );
}
