import { Module } from '@nestjs/common';
import { ChatModule } from './chat/chat.module.js';
import { HealthController } from './health.controller.js';
import { ReceiptsModule } from './receipts/receipts.module.js';

@Module({
  imports: [ChatModule, ReceiptsModule],
  controllers: [HealthController],
})
export class AppModule {}