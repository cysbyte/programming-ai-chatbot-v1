export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface ChatPayload {
    messages: Message[];
    model: string;
    high: boolean;
}

interface ChatResponse {
    response: string;
}

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3000';

export const systemPrompt = `
You are a senior full-stack developer assistant specializing in React, Node.js, TypeScript, and Express. Help users write, debug, and improve their code. Include code snippets and explain them clearly
`;

export async function callGptChat(
    prompt: Message[],
    model: string = 'gpt-4o',
    high: boolean = true
): Promise<ChatResponse> {
    const conversation: Message[] = [
        { role: 'system', content: systemPrompt },
    ];
    conversation.push(...prompt);
    console.log('conversation', conversation);

    const payload: ChatPayload = {
        messages: conversation,
        model,
        high
    };

    console.log('payload', payload);

    try {
        const response = await fetch(`${AI_SERVICE_URL}/gpt-chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error calling GPT chat:', error);
        throw error;
    }
}


