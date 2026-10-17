import {Injectable } from "@angular/core"; 
import { inject } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment_chat} from './environments'
import { firstValueFrom } from 'rxjs'
import type { ChatHistoryMessage, ExpenseRecord, FinancialTransaction } from './storage-sevice.service'

interface DialChatResponse {
    reply?: string;
}

@Injectable ({ 
    providedIn: 'root'
})

export class ChatService {
    private http = inject(HttpClient)

    async GenerateChatMessage(
        message: string,
        expenses: ExpenseRecord[] = [],
        transactions: FinancialTransaction[] = [],
        history: ChatHistoryMessage[] = []
    ): Promise<string>{ 
        const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

        const body = {
            message,
            expenses,
            transactions,
            history
        };

        const response = await firstValueFrom(      
            this.http.post<DialChatResponse>(environment_chat.chatWebhookUrl, body, { headers })
        )

        const reply = response.reply?.trim();
        if (!reply) {
            throw new Error('The chat API returned an empty or invalid response.');
        }

        return reply;
    }
} 