export interface SlackEvent {
	type: 'url_verification' | 'event_callback';
	event?: {
		type: 'app_mention';
		user: string;
		text: string;
		ts: string;
		channel: string;
		event_ts: string;
		thread_ts?: string;
	};
	token?: string;
	team_id?: string;
	api_app_id?: string;
	event_id?: string;
	event_time?: string;
	authed_users?: string[];
	challenge?: string;
}

interface sendMessageResponse {
	ok: boolean;
	error?: string;
	channel?: string;
	ts?: string;
	message?: {
		text: string;
		username: string;
		bot_id: string;
		attachments: [
			{
				text: string;
				id: number;
				fallback: string;
			}
		];
		type: string;
		subtype: string;
		ts: string;
	};
}

export class SlackClient {
	private readonly botToken: string;
	private readonly signingSecret: string;
	private readonly baseURL = 'https://slack.com/api';
	private readonly signatureVersion = 'v0';

	constructor(botToken: string, signingKey: string) {
		this.botToken = botToken;
		this.signingSecret = signingKey;
	}

	async sendMessage(channel: string, message: string, threadTs?: string): Promise<void> {
		const url = `${this.baseURL}/chat.postMessage`;

		const payload = threadTs
			? {
					channel: channel,
					text: message,
					thread_ts: threadTs,
			  }
			: {
					channel: channel,
					text: message,
			  };
		const headers = {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${this.botToken}`,
		};

		const response = await fetch(url, {
			method: 'post',
			body: JSON.stringify(payload),
			headers: headers,
		});

		const data: sendMessageResponse = await response.json();

		if (!data.ok) {
			throw new Error(`failed to send message: ${data.error}`);
		}
	}

	async handleChallenge(event: SlackEvent): Promise<Response> {
		const body = JSON.stringify({ challenge: event.challenge });

		return new Response(body, {
			headers: {
				'content-type': 'application/json',
			},
			status: 200,
			statusText: event.challenge,
		});
	}

	async getEvent(body: string): Promise<SlackEvent> {
		return await JSON.parse(body);
	}

	async validateRequest(headers: Headers, body: string): Promise<boolean> {
		const timestamp = headers.get('x-slack-request-timestamp');

		// remove the version prefix from signature
		const signatureStr = headers.get('x-slack-signature')?.substring(3);
		if (!signatureStr) {
			return false;
		}

		const signature = signatureToBytes(signatureStr);
		const authString = `${this.signatureVersion}:${timestamp}:${body}`;

		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(this.signingSecret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		);
		return await crypto.subtle.verify('HMAC', key, signature, encoder.encode(authString));
	}
}

const signatureToBytes = (signature: string) => {
	const bytes = new Uint8Array(signature.length / 2);
	for (let c = 0; c < signature.length; c += 2) {
		bytes[c / 2] = parseInt(signature.substring(c, c + 2), 16);
	}
	return bytes.buffer;
};
