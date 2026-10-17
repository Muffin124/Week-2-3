import { Body, Controller, Post } from '@nestjs/common';
import { ReceiptsService } from './receipts.service.js';
import { AnalyzeReceiptDto } from './dto/analyze-receipt.dto.js';
import type { ReceiptAnalysis } from '../agents/receipt-agent.js';

@Controller('api/receipts/analyze')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  analyze(@Body() request: AnalyzeReceiptDto): Promise<ReceiptAnalysis> {
    return this.receiptsService.analyze(request);
  }
}