const DIMENSIONS = 64;
function tokenize(value) {
    return value.toLowerCase().match(/[a-ząćęłńóśźż0-9]+/gi) ?? [];
}
function embed(value) {
    const vector = Array(DIMENSIONS).fill(0);
    for (const token of tokenize(value)) {
        let hash = 2166136261;
        for (const character of token) {
            hash ^= character.charCodeAt(0);
            hash = Math.imul(hash, 16777619);
        }
        const index = Math.abs(hash) % DIMENSIONS;
        vector[index] += 1;
    }
    return vector;
}
function cosineSimilarity(left, right) {
    let dot = 0;
    let leftLength = 0;
    let rightLength = 0;
    for (let index = 0; index < DIMENSIONS; index += 1) {
        dot += left[index] * right[index];
        leftLength += left[index] ** 2;
        rightLength += right[index] ** 2;
    }
    return leftLength && rightLength
        ? dot / Math.sqrt(leftLength * rightLength)
        : 0;
}
export class ReceiptVectorStore {
    constructor(documents) {
        this.entries = documents.map((document) => ({
            ...document,
            vector: embed(document.text),
        }));
    }
    search(query, limit = 8) {
        const queryVector = embed(query);
        return this.entries
            .map(({ vector, ...document }) => ({
            ...document,
            score: cosineSimilarity(queryVector, vector),
        }))
            .sort((left, right) => right.score - left.score)
            .slice(0, limit);
    }
}
export function buildFinancialDocuments(expenses, transactions) {
    const receiptDocuments = expenses.map((expense, index) => {
        const value = asRecord(expense);
        const items = Array.isArray(value.items) ? value.items : [];
        const itemNames = items
            .map((item) => asRecord(item).name)
            .filter((name) => typeof name === 'string')
            .join(', ');
        const merchant = typeof value.merchantName === 'string' ? value.merchantName : 'Unknown merchant';
        return {
            id: typeof value.id === 'string' ? value.id : `receipt-${index + 1}`,
            text: `${merchant} ${value.date ?? ''} ${itemNames} total ${value.totalAmount ?? ''}`,
            metadata: { source: 'receipt', record: expense },
        };
    });
    const transactionDocuments = transactions.map((transaction, index) => {
        const value = asRecord(transaction);
        return {
            id: typeof value.id === 'string' ? value.id : `transaction-${index + 1}`,
            text: `${value.type ?? ''} ${value.category ?? ''} ${value.description ?? ''} ${value.date ?? ''} amount ${value.amount ?? ''}`,
            metadata: { source: 'transaction', record: transaction },
        };
    });
    return [...receiptDocuments, ...transactionDocuments];
}
function asRecord(value) {
    return typeof value === 'object' && value !== null
        ? value
        : {};
}
