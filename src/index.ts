import { Bot } from './bot';
import { OpenAIClient } from './api/openai';
import { SlackClient } from './api/slack';

interface Environment {
	OPENAI_API_KEY: string;
	SLACK_BOT_TOKEN: string;
	SLACK_SIGNING_SECRET: string;
	SLACK_VERIFICATION_TOKEN: string;
}

export default {
	async fetch(request: Request, env: Environment, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (request.method !== 'POST') {
			const body = JSON.stringify({ error: 'not found' });
			return new Response(body, {
				headers: {
					'content-type': 'application/json',
				},
				status: 404,
				statusText: 'Not Found',
			});
		}
		switch (url.pathname) {
			case '/events':
				const bot = new Bot(
					new OpenAIClient(env.OPENAI_API_KEY),
					new SlackClient(env.SLACK_BOT_TOKEN, env.SLACK_SIGNING_SECRET)
				);
				return await bot.handleRequest(request, ctx);
			default:
				return new Response('not found', {
					status: 404,
					statusText: 'Not Found',
				});
		}
	},
};
