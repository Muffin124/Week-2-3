import { Injectable, effect, inject, signal } from '@angular/core';
import { components } from './api'; 

export type ReceiptItem = components['schemas']['ReceiptItem']; 

export interface ExpenseRecord { 
    id: string, 
    merchantName: string, 
    date: string, 
    totalAmount: number,
    items: ReceiptItem[]
    createdAt: string, 
}

export type FinancialTransactionType = 'income' | 'expense';

export interface FinancialTransaction {
    id: string;
    type: FinancialTransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
    createdAt: string;
}

export interface ChatHistoryMessage {
    role: 'user' | 'assistant';
    content: string;
}

const STORAGE_KEY = 'expenseRecords' ; 
const TRANSACTIONS_STORAGE_KEY = 'financialTransactions';
const CHAT_HISTORY_STORAGE_KEY = 'chatHistory';
@Injectable({ 
    providedIn: 'root'
})
export class StorageService { 


    private expensesSignal = signal<ExpenseRecord[]>(this.loadFromStorage()); 
    private transactionsSignal = signal<FinancialTransaction[]>(this.loadTransactions());
    private chatHistorySignal = signal<ChatHistoryMessage[]>(this.loadChatHistory());


    readonly expenses = this.expensesSignal.asReadonly();
    readonly transactions = this.transactionsSignal.asReadonly();
    readonly chatHistory = this.chatHistorySignal.asReadonly();
    
    constructor() {
        effect(() => { 
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.expensesSignal()));
        });
        effect(() => {
            localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(this.transactionsSignal()));
        });
        effect(() => {
            localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(this.chatHistorySignal()));
        });
}

    addExpense(RecipeAnalysisResult: components['schemas']['ReceiptAnalysisResponse']) {
        if (!this.isValidReceipt(RecipeAnalysisResult)) {
            throw new Error('Cannot save an invalid receipt.');
        }
        const newExpense: ExpenseRecord = { 
            id: crypto.randomUUID(), 
            merchantName: RecipeAnalysisResult.merchantName,
            date: RecipeAnalysisResult.date, 
            totalAmount: RecipeAnalysisResult.totalAmount, 
            items: RecipeAnalysisResult.items, 
            createdAt: new Date().toISOString(), 
        }
        this.expensesSignal.update(expenses => [...expenses, newExpense])
        this.transactionsSignal.update(transactions => [...transactions, {
            id: newExpense.id,
            type: 'expense',
            amount: newExpense.totalAmount,
            category: 'Zakupy',
            description: newExpense.merchantName,
            date: newExpense.date,
            createdAt: newExpense.createdAt
        }]);

    }

    addTransaction(transaction: Omit<FinancialTransaction, 'id' | 'createdAt'>): void {
        this.transactionsSignal.update(current => [...current, {
            ...transaction,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        }]);
    }

    deleteTransaction(id: string): void {
        this.transactionsSignal.update(current => current.filter(transaction => transaction.id !== id));
    }

    deleteExpense(id: string ): void 
    { 
        this.expensesSignal.update(current => current.filter(curr => curr.id !== id))
        this.deleteTransaction(id);
    }

    addChatMessage(message: ChatHistoryMessage): void {
        this.chatHistorySignal.update(current => [...current, message].slice(-20));
    }

    clearChatHistory(): void {
        this.chatHistorySignal.set([]);
    }


    loadFromStorage(): ExpenseRecord[] {
        return this.parseArray<ExpenseRecord>(STORAGE_KEY)
            .filter((expense): expense is ExpenseRecord => this.isStoredExpense(expense));
    }

    private loadTransactions(): FinancialTransaction[] {
        const transactions = this.parseArray<FinancialTransaction>(TRANSACTIONS_STORAGE_KEY)
            .filter((transaction): transaction is FinancialTransaction =>
                this.isStoredTransaction(transaction));
        const transactionIds = new Set(transactions.map(transaction => transaction.id));
        const receiptTransactions = this.loadFromStorage()
            .filter(expense => !transactionIds.has(expense.id))
            .map(expense => ({
                id: expense.id,
                type: 'expense' as const,
                amount: expense.totalAmount,
                category: 'Zakupy',
                description: expense.merchantName,
                date: expense.date,
                createdAt: expense.createdAt
            }));
        return [...transactions, ...receiptTransactions];
    }

    private loadChatHistory(): ChatHistoryMessage[] {
        return this.parseArray<ChatHistoryMessage>(CHAT_HISTORY_STORAGE_KEY)
            .filter((message): message is ChatHistoryMessage =>
                typeof message === 'object' &&
                message !== null &&
                ((message as ChatHistoryMessage).role === 'user' ||
                    (message as ChatHistoryMessage).role === 'assistant') &&
                typeof (message as ChatHistoryMessage).content === 'string' &&
                Boolean(message.content.trim()));
    }

    private parseArray<T>(key: string): T[] {
        const saved = localStorage.getItem(key);
        if (!saved) {
            return [];
        }
        try {
            const parsed: unknown = JSON.parse(saved);
            return Array.isArray(parsed) ? parsed as T[] : [];
        } catch {
            return [];
        }
    }

    private isValidReceipt(receipt: components['schemas']['ReceiptAnalysisResponse']): boolean {
        return typeof receipt.merchantName === 'string' &&
            Boolean(receipt.merchantName.trim()) &&
            /^\d{4}-\d{2}-\d{2}$/.test(receipt.date) &&
            Number.isFinite(receipt.totalAmount) &&
            receipt.totalAmount > 0 &&
            receipt.items.length > 0 &&
            receipt.items.every(item =>
                typeof item.name === 'string' &&
                Boolean(item.name.trim()) &&
                Number.isFinite(item.price) &&
                item.price > 0 &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0) &&
            Math.abs(receipt.items.reduce((sum, item) => sum + item.price * item.quantity, 0) -
                receipt.totalAmount) <= 0.01;
    }

    private isStoredExpense(value: unknown): value is ExpenseRecord {
        if (typeof value !== 'object' || value === null) return false;
        const expense = value as ExpenseRecord;
        return typeof expense.id === 'string' &&
            typeof expense.merchantName === 'string' &&
            typeof expense.date === 'string' &&
            Number.isFinite(expense.totalAmount) &&
            Array.isArray(expense.items);
    }

    private isStoredTransaction(value: unknown): value is FinancialTransaction {
        if (typeof value !== 'object' || value === null) return false;
        const transaction = value as FinancialTransaction;
        return typeof transaction.id === 'string' &&
            (transaction.type === 'income' || transaction.type === 'expense') &&
            Number.isFinite(transaction.amount) &&
            transaction.amount > 0 &&
            typeof transaction.category === 'string' &&
            typeof transaction.description === 'string' &&
            typeof transaction.date === 'string';
    }
}