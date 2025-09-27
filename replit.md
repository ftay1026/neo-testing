# NEO AI Coach - Project Setup

## Overview
NEO is an AI-powered coaching assistant built with Next.js that helps users achieve personal and professional goals through personalized AI conversations. The project has been successfully imported and configured to run in the Replit environment.

## Current State
- ✅ **Frontend**: Next.js application running on port 5000
- ✅ **Dependencies**: All npm packages installed via pnpm
- ✅ **Build System**: Next.js with Turbopack for fast development
- ✅ **Deployment**: Configured for autoscale deployment
- ⚠️ **Database**: Supabase configuration needed (environment variables required)

## Recent Changes (September 27, 2025)
- Imported GitHub project and set up in Replit environment
- Installed Node.js 20 and pnpm package manager
- Fixed Next.js configuration for Replit proxy environment
- Configured frontend workflow to run on port 5000 with proper host binding
- Set up deployment configuration for production builds
- Created environment variables template

## Project Architecture
- **Frontend Framework**: Next.js 15.2.3 with React 19
- **Styling**: Tailwind CSS with custom components
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL with migration files
- **Payment Processing**: HitPay integration
- **AI Integration**: Anthropic Claude and OpenAI APIs
- **State Management**: SWR for server state
- **UI Components**: Radix UI primitives with custom theming

## Required Environment Variables
The following environment variables need to be configured in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `ANTHROPIC_API_KEY` - For AI chat functionality
- `OPENAI_API_KEY` - For AI chat functionality
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `HITPAY_API_KEY` - For payment processing

## Key Features
- AI-powered coaching conversations
- User authentication with Google OAuth
- Project management and file uploads
- Memory extraction and chat history
- Subscription management with HitPay
- Responsive design with dark theme

## Development Status
✅ **Working**: Frontend server, UI rendering, routing, build system
⚠️ **Needs Configuration**: Database connection, AI APIs, authentication, payment processing

## User Preferences
- Uses pnpm as package manager
- Prefers TypeScript with strict configuration
- Uses Tailwind CSS for styling
- Follows Next.js App Router patterns