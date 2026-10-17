import { Injectable } from '@nestjs/common';
import { runChatAgent } from '../agents/chat-agent.js';
import type { ChatRequest } from '../agents/chat-agent.js';

@Injectable()
export class ChatService {
  chat(request: ChatRequest): Promise<{ reply: string }> {
    return runChatAgent(request);
  }
}