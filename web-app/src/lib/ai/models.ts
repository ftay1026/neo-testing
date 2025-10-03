export const DEFAULT_CHAT_MODEL: string = 'chat-model';

interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Chat model',
    description: 'Primary model for all-purpose chat',
  },
];

// Lab models for prompt testing
export const labModels = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Latest Claude Sonnet model'
  },
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    description: 'Enhanced Claude Sonnet model'
  },
  {
    id: 'gpt-4.1-2025-04-14',
    name: 'GPT-4.1',
    description: 'OpenAI GPT-4.1'
  },
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    description: 'OpenAI GPT-5 Mini'
  },
];