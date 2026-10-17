import { Component, inject, signal } from '@angular/core'
import { ChatService } from '../../services/chat-service.service' 
import { StorageService } from '../../services/storage-sevice.service'
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
interface UIResponse { 
    sender: 'user' | 'assistant', 
    text: string 
}

@Component({ 
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.css'],
    imports: [CommonModule, FormsModule]
})


export class ChatComponent { 
    private chatService = inject(ChatService)
    private storageService = inject(StorageService)

    messages = signal<UIResponse[]>(this.storageService.chatHistory().map(message => ({
        sender: message.role,
        text: message.content
    }))); 
    isOpen = signal(false);
    userInput = signal<string>('')
    isLoading = signal<boolean>(false)
    errorMessage = signal<string | null>(null)

    open(): void {
        this.isOpen.set(true);
    }

    close(): void {
        if (!this.isLoading()) {
            this.isOpen.set(false);
        }
    }


    async sendMessage() { 
        const text = this.userInput().trim()
        if(!text || this.isLoading()) return; 

        const history = this.storageService.chatHistory();
        this.messages.update(prev => [...prev, {sender: 'user', text}])
        this.storageService.addChatMessage({ role: 'user', content: text });

        this.userInput.set('')
        this.isLoading.set(true)
        this.errorMessage.set(null)

        try { 
            const responseText = await this.chatService.GenerateChatMessage(
                text,
                this.storageService.expenses(),
                this.storageService.transactions(),
                history
            )
            this.messages.update(prev => [...prev, {sender: 'assistant', text: responseText}])
            this.storageService.addChatMessage({ role: 'assistant', content: responseText });
        }
        catch(e) { 
            console.error('Error has occured while generating response', e )
            this.errorMessage.set('Unable to get a response. Please try again.')
        }
        finally{ 
            this.isLoading.set(false)
        }
    }
}