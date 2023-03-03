export interface SlackEvent {
	type: 'url_verification' | 'event_callback';
	event?: {
		type: 'app_mention';
		user: string;
		text: string;
		ts: string;
		channel: string;
		event_ts: string;
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

	async sendMessage(channel: string, message: string, timestamp?: string): Promise<void> {
		const url = `${this.baseURL}/chat.postMessage`;

		const payload = timestamp
			? {
					channel: channel,
					text: message,
					thread_ts: timestamp,
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

	// FIXME(janne): add request validation
	async getEvent(request: Request): Promise<SlackEvent> {
		return await request.json<SlackEvent>();
	}

	/*
	async validateRequest(request: Request): Promise<boolean> {
		const timestamp = request.headers.get('x-slack-request-timestamp')

		// remove starting 'v0=' from the signature header
		const signatureStr = request.headers.get('x-slack-signature')?.substring(3)
		console.log(signatureStr)
		if (!signatureStr) return false

		const signature = hexToBytes(signatureStr)
		console.log(this.signingSecret);

		const content = await request.text()
		const authString = `${this.signatureVersion}:${timestamp}:${content}`
		let encoder = new TextEncoder()
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(this.signingSecret),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		)
		const verified = await crypto.subtle.verify(
			"HMAC",
			key,
			signature,
			encoder.encode(authString)
		)

		console.log(verified);

		return verified
	}

	 */
}

function hexToBytes(hex: string) {
	const bytes = new Uint8Array(hex.length / 2);
	for (let c = 0; c < hex.length; c += 2) {
		bytes[c / 2] = parseInt(hex.substring(c, 2), 16);
	}
	return bytes.buffer;
}
