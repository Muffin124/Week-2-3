import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service.js';
import { ChatRequestDto } from './dto/chat-request.dto.js';

@Controller('api/ai/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  chat(@Body() request: ChatRequestDto): Promise<{ reply: string }> {
    return this.chatService.chat(request);
  }
}