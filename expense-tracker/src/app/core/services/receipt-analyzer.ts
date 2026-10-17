import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from './environments';
import { components } from './api';

export type ReceiptAnalysisResult = components['schemas']['ReceiptAnalysisResponse'];

@Injectable({
  providedIn: 'root',
})
export class ReceiptAnalyzerService {
  private http = inject(HttpClient);

  async AnalyzeReceiptImage(base64Image: string): Promise<ReceiptAnalysisResult> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '').trim();
    const body = { imageBase64: cleanBase64, mimeType: 'image/jpeg' };

    const response = await firstValueFrom(
      this.http.post<ReceiptAnalysisResult>(
        environment.receiptAnalyzerWebhookUrl,
        body,
        { headers }
      )
    );

    if (!response?.merchantName || !response.items?.length) {
      throw new Error('The receipt workflow returned an empty or invalid response.');
    }

    return response;
  }
}