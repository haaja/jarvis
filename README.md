# Jarvis

Your friendly neighbourhood chatbot. I run on cloudflare workers and pass messages between openai api and slack.

## Setup

You'll need the following things to run me
1. Account at [cloudflare.com](https://cloudflare.com)
2. Account on [platform.openai.com](https://platform.openai.com/)
3. Slack Workspace

### Installation

1. Create API key to [OpenAI's API](https://platform.openai.com/account/api-keys).
2. Install [Slack bot application](https://api.slack.com/apps) and grant the following scopes to it `app_mention:read`, `chat:write` and `chat:write.public`.
3. Take note of the Bot User oauth token and signing secret as you will need those later.
4. Install project dependencies with `yarn install`.
5. Login to cloudflare `yarn wrangler login`.
6. Create secrets to cloudflare and paste the corresponding values when prompted.
```sh
yarn wrangler secret put OPENAI_API_KEYS
yarn wrangler secret put SLACK_BOT_TOKEN
yarn wrangler secret put SLACK_SIGNING_SECRET
```

7. Deploy the application `yarn wrangler deploy`.
8. Copy the resulting URL and subscribe to event `app_mention` in Slack application events. The url should look something like `https://jarvis.${yourSubdomain}.workers.dev/events`.
9. Invite the application to your favorite channel and talk to it i.e. `@Jarvis
	 what is the airspeed velocity of an unladen swallow?`.

