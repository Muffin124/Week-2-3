import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReceiptAnalyzerService, ReceiptAnalysisResult } from '../../services/receipt-analyzer';
import { StorageService } from '../../services/storage-sevice.service';
import { ExpenseListComponent } from '../expense-list.component/expense-list.component'
import { ChatComponent } from '../chat.component/chat.component'

export interface CategorySummary {
  name: string;
  totalCost: number;
  count: number;
  percentage: number;
}

@Component({ 
    selector: 'app-receipt-scanner', 
    standalone: true, 
    templateUrl: './receipt-scanner.component.html',
    styleUrls: ['./receipt-scanner.component.css'],
    imports: [CommonModule, ExpenseListComponent, ChatComponent]
})
export class ReceiptScannerComponent { 
    private readonly analyzerService = inject(ReceiptAnalyzerService); 
    private readonly expenseStorage = inject(StorageService);

    receiptData = signal<ReceiptAnalysisResult | null>(null); 
    isLoading = signal<boolean>(false); 
    errorMessage = signal<string | null>(null);

    categorySummaries = computed<CategorySummary[]>(() => { 
        const data = this.receiptData();
        
        if (!data || !data.items || !data.items.length) {
            return []; 
        }

        const total = data.totalAmount || 1; 
        const groups = new Map<string, { totalCost: number; count: number }>(); 
        
        for (const item of data.items) { 
            const itemQty = (item as any).quantity ?? 1; 
            const itemPrice = (item as any).price ?? 0;
            const categoryName = item.category ?? 'Other';

            const current = groups.get(categoryName) || { totalCost: 0, count: 0 }; 

            groups.set(categoryName, { 
                totalCost: current.totalCost + (itemPrice * itemQty), 
                count: current.count + itemQty
            });
        }

        return Array.from(groups.entries()).map(([name, stat]) => ({ 
            name,
            totalCost: stat.totalCost, 
            count: stat.count,
            percentage: Math.round((stat.totalCost / total) * 100) 
        }));
    });

    async onFileSelected(event: Event) { 
        const file = (event.target as HTMLInputElement).files?.[0]; 
        if (!file) return; 
        this.errorMessage.set(null);
        if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
            this.errorMessage.set('Choose an image smaller than 10 MB.');
            return;
        }

        this.isLoading.set(true); 

        try { 
            const base64 = await this.convertFileToBase64(file); 
            const result = await this.analyzerService.AnalyzeReceiptImage(base64); 
            this.receiptData.set(result); 
        } catch (error) { 
            console.error('Error analyzing receipt:', error); 
            this.errorMessage.set('Unable to analyze the receipt. Please try again.');
        } finally { 
            this.isLoading.set(false); 
        }
    }

    
    saveToStorage(data: ReceiptAnalysisResult): void {
        try {
            this.expenseStorage.addExpense(data);
            this.receiptData.set(null);
        } catch (error) {
            console.error('Error saving receipt:', error);
            this.errorMessage.set('The receipt could not be saved because its data is invalid.');
        }
    }

    private convertFileToBase64(file: File): Promise<string> { 
        return new Promise((resolve, reject) => { 
            const reader = new FileReader(); 
            reader.readAsDataURL(file); 
            reader.onload = () => { 
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);  
            };
            reader.onerror = (error) => reject(error); 
        });
    }
}