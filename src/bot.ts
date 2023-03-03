import { Message, OpenAIClient } from './api/openai';
import { SlackClient, SlackEvent } from './api/slack';

const baseMessage: Message = {
	role: 'system',
	content: 'You are a helpful assistant',
};

export class Bot {
	private readonly openaiClient: OpenAIClient;
	private readonly slackClient: SlackClient;

	constructor(openaiClient: OpenAIClient, slackClient: SlackClient) {
		this.openaiClient = openaiClient;
		this.slackClient = slackClient;
	}

	async handleRequest(request: Request, context: ExecutionContext): Promise<Response> {
		const body = await request.text();
		const validRequest = await this.slackClient.validateRequest(request.headers, body);
		if (!validRequest) {
			const body = JSON.stringify({ error: 'invalid signature' });
			return new Response(body, {
				headers: {
					'content-type': 'application/json',
				},
				status: 400,
				statusText: 'Bad Request',
			});
		}

		const event: SlackEvent = await this.slackClient.getEvent(body);
		if (event.type === 'url_verification') {
			return this.slackClient.handleChallenge(event);
		}

		context.waitUntil(this.respond(event));
		const responseBody = JSON.stringify({ status: 'ok' });
		return new Response(responseBody, {
			headers: {
				'content-type': 'application/json',
			},
			status: 200,
			statusText: 'ok',
		});
	}

	async respond(event: SlackEvent): Promise<void> {
		const { event: subEvent } = event;

		if (subEvent && subEvent.type === 'app_mention') {
			const { channel, text, thread_ts } = subEvent;
			const msg: Message = {
				role: 'assistant',
				content: text,
			};
			const reply = await this.openaiClient.sendQuery([baseMessage, msg]);
			await this.slackClient.sendMessage(channel, reply.content, thread_ts);
		}
	}
}
