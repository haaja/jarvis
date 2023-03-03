import { d } from 'vitest/dist/index-220c1d70';

export interface Message {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

interface OpenAIChatRequest {
	model: 'gpt-3.5-turbo' | 'gpt-3.5-turbo-0301';
	messages: Message[];
	temperature?: number;
	top_p?: number;
	n?: number;
	stream?: boolean;
	stop?: string | string[];
	max_tokens?: number;
	presence_penalty?: number;
	frequency_penalty?: number;
	logit_bias?: number;
	user?: string;
}

interface OpenAIChatResponse {
	id?: string;
	object?: string;
	created?: number;
	choices?: [
		{
			index: number;
			message: Message;
			finish_reason: string;
		}
	];
	usage?: {
		prompt_tokens: number;
		completion_tokens: number;
		total_tokens: number;
	};
	error?: {
		message: string;
		type: string;
		param?: any;
		code?: any;
	};
}

export interface BotReply {
	role: string;
	content: string;
}

export class OpenAIClient {
	private readonly baseUrl = 'https://api.openai.com/v1';
	private readonly token: string;

	constructor(token: string) {
		this.token = token;
	}

	async sendQuery(messages: Message[]): Promise<BotReply> {
		const url = `${this.baseUrl}/chat/completions`;
		const payload: OpenAIChatRequest = {
			model: 'gpt-3.5-turbo',
			messages: messages,
		};

		const headers = {
			Authorization: `Bearer ${this.token}`,
			'content-type': 'application/json',
		};

		const response = await fetch(url, {
			method: 'post',
			body: JSON.stringify(payload),
			headers: headers,
		});

		if (!response.ok) {
			console.log(`response from openai: ${response.statusText}`);
			const data: OpenAIChatResponse = await response.json();
			throw new Error(data.error?.message);
		}

		const data: OpenAIChatResponse = await response.json();

		if (data.choices && data.choices.length > 0) {
			return data.choices[0].message;
		}

		throw new Error('did not receive choises for query');
	}
}
