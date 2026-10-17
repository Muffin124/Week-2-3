import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { ChatService } from './chat-service.service';

describe('ChatService', () => {
  let service: ChatService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('returns the assistant content and sends financial context', async () => {
    const responsePromise = service.GenerateChatMessage(
      'What can I cook?',
      [{
        id: 'receipt-1',
        merchantName: 'Market',
        date: '2026-09-03',
        totalAmount: 10,
        items: [{
          name: 'Eggs',
          price: 10,
          category: 'Food',
          quantity: 1
        }],
        createdAt: '2026-09-03T10:00:00.000Z'
      }],
      [{
        id: 'income-1',
        type: 'income',
        amount: 3000,
        category: 'Salary',
        description: 'Monthly salary',
        date: '2026-09-01',
        createdAt: '2026-09-01T10:00:00.000Z'
      }]
    );

    const request = http.expectOne(request => request.url.includes('/api/ai/chat'));
    expect(request.request.method).toBe('POST');
    expect(request.request.body.message).toBe('What can I cook?');
    expect(request.request.body.expenses[0].items[0].name).toBe('Eggs');
    expect(request.request.body.transactions[0].description).toBe('Monthly salary');

    request.flush({
      reply: 'You can make an omelette.'
    });

    await expect(responsePromise).resolves.toBe('You can make an omelette.');
  });

  it('throws when the API returns no assistant content', async () => {
    const responsePromise = service.GenerateChatMessage('Summarize my budget');
    const request = http.expectOne(request => request.url.includes('/api/ai/chat'));

    request.flush({ choices: [] });

    await expect(responsePromise).rejects.toThrow('empty or invalid response');
  });
});
