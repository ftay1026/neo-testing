# Neo AI Coach

Neo is an AI-powered coaching assistant that helps you achieve your personal and professional goals through personalized coaching.

## Overview

Neo uses advanced artificial intelligence to provide:
- Personalized coaching conversations
- Actionable insights and recommendations

This project is built with modern web technologies to deliver a smooth, responsive experience across all devices.

## Technical Stack

- **Frontend**: Next.js 14 (React framework)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Payment Processing**: HitPay
- **AI Integration**: Anthropic Claude and OpenAI API

## Getting Started

### Prerequisites
- Node.js 18 or later
- npm, yarn, pnpm, or bun package manager
- Supabase account
- HitPay account
- OpenAI API key

### Installation

1. Open the repository
2. Navigate to the web-app directory:
   ```bash
   cd web-app
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```
4. Set up environment variables (copy `.env.example` to `.env.local` and fill in your credentials)

### Running the Project

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Creator Tools / Lab

- Visit [http://localhost:3000/lab](http://localhost:3000/lab) while running the dev server to open the Prompt Lab. A quick-access link appears in the bottom-right corner whenever `NODE_ENV` is not set to production.
- Provide OpenAI credentials by copying `.env.local.example` to `.env.local` and setting `OPENAI_API_KEY` (and optionally `OPENAI_BASE_URL` if you use a proxy).
- When no `OPENAI_API_KEY` is configured the lab automatically returns mocked A/B responses with randomized latency and token counts so you can prototype safely without secrets.

## Deployment

The recommended way to deploy this application is using [Vercel](https://vercel.com), which provides seamless integration with Next.js projects.

## Support

If you encounter any issues or have questions, please create an issue in the repository or contact the support team.
