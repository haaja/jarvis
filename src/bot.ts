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

	// FIXME(janne): add request validation
	async handleEvents(request: Request): Promise<Response> {
		/*
		if (! await this.slackClient.validateRequest(request)) {
			const body = JSON.stringify({ error: 'invalid request'})
			return new Response(body, {
				headers: {
					'content-type': 'application/json',
				},
				status: 400,
				statusText: 'Bad Request',
			})
		}
		 */

		const event: SlackEvent = await this.slackClient.getEvent(request);
		if (event.type === 'url_verification') {
			return this.slackClient.handleChallenge(event);
		}

		const { event: subEvent } = event;

		console.log(subEvent);

		if (subEvent && subEvent.type === 'app_mention') {
			const { channel, text } = subEvent;
			const msg: Message = {
				role: 'assistant',
				content: text,
			};
			const reply = await this.openaiClient.sendQuery([baseMessage, msg]);
			await this.slackClient.sendMessage(channel, reply.content);
		}

		const body = JSON.stringify({ status: 'ok' });
		return new Response(body, {
			headers: {
				'content-type': 'application/json',
			},
			status: 200,
			statusText: 'ok',
		});
	}
}
