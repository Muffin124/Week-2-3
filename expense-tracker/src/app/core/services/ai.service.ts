import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../services/environments';

// Interfejsy dopasowane do DTO z NestJS
export interface ChatRequest {
  prompt: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatResponse {
  response: string;
}

export interface ReceiptAnalysisResponse {
  merchant?: string;
  date?: string;
  totalAmount?: number;
  items?: { name: string; price: number }[];
  category?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}


  chat(prompt: string, history: ChatRequest['history'] = []): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/api/ai/chat`, {
      prompt,
      history
    });
  }

  analyzeReceipt(imageBase64: string): Observable<ReceiptAnalysisResponse> {
    return this.http.post<ReceiptAnalysisResponse>(`${this.apiUrl}/api/receipts/analyze`, {
      image: imageBase64
    });
  }
}