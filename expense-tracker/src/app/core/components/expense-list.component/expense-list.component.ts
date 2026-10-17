import { Component, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../services/storage-sevice.service';
import type { ReceiptAnalysisResult } from '../../services/receipt-analyzer';

interface CategoryChartItem {
  category: string;
  amount: number;
  percentage: number;
}

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.css']
})
export class ExpenseListComponent {
  private readonly storageService = inject(StorageService);

  readonly expenses = this.storageService.expenses;
  readonly transactions = this.storageService.transactions;
  readonly incomes = computed(() =>
    this.transactions().filter(transaction => transaction.type === 'income')
  );
  transactionType: 'income' | 'expense' = 'income';
  transactionAmount = '';
  transactionCategory = '';
  transactionDescription = '';
  transactionDate = new Date().toISOString().slice(0, 10);
  merchantName = '';
  itemName = '';
  itemCategory = 'Food';
  itemPrice = '';
  itemQuantity = '1';
  pendingItems: ReceiptAnalysisResult['items'] = [];

  readonly grandTotal = computed<number>(() => {
    const list = this.expenses();
    if (!list || !list.length) return 0;
    return list.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
  });

  readonly balance = computed(() =>
    this.transactions()
      .filter(transaction => transaction.date.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((total, transaction) =>
      total + (transaction.type === 'income' ? transaction.amount : -transaction.amount), 0)
  );

  readonly categoryChart = computed<CategoryChartItem[]>(() => {
    const totals = new Map<string, number>();
    for (const expense of this.expenses()) {
      for (const item of expense.items) {
        const amount = (item.price || 0) * (item.quantity || 1);
        totals.set(item.category, (totals.get(item.category) || 0) + amount);
      }
    }
    const total = Array.from(totals.values()).reduce((sum, amount) => sum + amount, 0);
    return Array.from(totals.entries())
      .sort(([, first], [, second]) => second - first)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0
      }));
  });

  addTransaction(): void {
    if (this.transactionType === 'expense') {
      this.addManualReceipt();
      return;
    }

    const amount = Number(this.transactionAmount);
    if (!Number.isFinite(amount) || amount <= 0 || !this.transactionCategory || !this.transactionDate) return;

    this.storageService.addTransaction({
      type: this.transactionType,
      amount,
      category: this.transactionCategory,
      description: this.transactionDescription || this.transactionCategory,
      date: this.transactionDate
    });
    this.transactionAmount = '';
    this.transactionDescription = '';
  }

  private addManualReceipt(): void {
    const price = Number(this.itemPrice);
    const quantity = Number(this.itemQuantity);
    if (!this.merchantName || !this.itemName || !this.transactionDate
      || !Number.isFinite(price) || price <= 0
      || !Number.isInteger(quantity) || quantity <= 0) {
      return;
    }

    this.pendingItems = [...this.pendingItems, {
      name: this.itemName,
      price,
      category: this.itemCategory as ReceiptAnalysisResult['items'][number]['category'],
      quantity
    }];
    this.itemName = '';
    this.itemPrice = '';
    this.itemQuantity = '1';
  }

  saveManualReceipt(): void {
    if (!this.merchantName || !this.transactionDate || this.pendingItems.length === 0) return;

    const receipt: ReceiptAnalysisResult = {
      merchantName: this.merchantName,
      date: this.transactionDate,
      totalAmount: this.pendingItems.reduce((total, item) => total + item.price * item.quantity, 0),
      items: this.pendingItems
    };
    this.storageService.addExpense(receipt);
    this.merchantName = '';
    this.pendingItems = [];
  }

  removePendingItem(index: number): void {
    this.pendingItems = this.pendingItems.filter((_, itemIndex) => itemIndex !== index);
  }

  deleteTransaction(id: string): void {
    this.storageService.deleteTransaction(id);
  }

  deleteExpense(id: string | number): void {
    this.storageService.deleteExpense(String(id));
  }
}