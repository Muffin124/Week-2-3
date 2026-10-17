import { Injectable } from '@nestjs/common';
import { runReceiptAgent } from '../agents/receipt-agent.js';
import type { ReceiptRequest } from '../agents/receipt-agent.js';

@Injectable()
export class ReceiptsService {
  analyze(request: ReceiptRequest) {
    return runReceiptAgent(request);
  }
}