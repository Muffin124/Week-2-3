import { TestBed } from '@angular/core/testing';

import { ReceiptAnalyzerService } from './receipt-analyzer';

describe('ReceiptAnalyzerService', () => {
  let service: ReceiptAnalyzerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceiptAnalyzerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
