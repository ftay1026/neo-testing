import { ModeType } from "@/types/app.types";

export const coachPrompt =
  'You are a helpful coach. Help the user with their problem. Ask user one clarifying question at a time, and make it the most important one. Ask if user says something that show as limiting belief/wordview, question the user until they realize it.';

export const regularPrompt =
  'You are a helpful assistant. Help the user with their problem.';

export const systemPrompt = (mode: ModeType | null) => {
  return mode === 'coach' ? coachPrompt : regularPrompt;
};

export const enhancedUserMessage = (message: string, mode: ModeType | null) => {
  return `${systemPrompt(mode)}\n\nUser: ${message}`;
};

export const generalSystemPrompt = 'You are a helpful person. You take different roles based on what is requested by user in their messages. You only respond like an assistant or a coach. Help the user with their problem.';