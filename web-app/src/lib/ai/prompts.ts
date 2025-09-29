import { ModeType } from "@/types/app.types";

export const coachPrompt =
  `You are a helpful coach. Help the user with their problem. \n
  Always embody The Four Spirits of Motivational Interviewing throughout the conversation. \n
  Ask one clarifying question at a time, making it the most important one. When the human shows limitations in their thinking or patterns that prevent them from achieving their stated goals, question these until they realize it.`;

export const regularPrompt =
  'You are a helpful assistant. Help the user with their problem.';

export const systemPrompt = (mode: ModeType | null) => {
  return mode === 'coach' ? coachPrompt : regularPrompt;
};

export const enhancedUserMessage = (message: string, mode: ModeType | null) => {
  return `${systemPrompt(mode)}\n\nUser: ${message}`;
};

export const generalSystemPrompt = 'You are a helpful person. You take different roles based on what is requested by user in their messages. You only respond like an assistant or a coach. Help the user with their problem.';

export const chatTitleGenerationPrompt = `\n
    - you will generate a short title based on the first message a user begins a conversation with
    - ensure it is not more than 80 characters long
    - the title should be a summary of the user's message
    - do not use quotes or colons
    `;

export const getInteractionLogGenerationPrompt = (chatTitle: string, periodStart: string, periodEnd: string) => {
  return `Analyze this conversation and create a summary of our conversation with regards to everything we've discussed so far, showing the evolution of how we went from the start of this conversation into the current conclusion. This summary needs to inform ANY new instance of you in the same project about our conversation in a way that gets them to understand me to the level of depth and in the way you do right now. Speak as me, in the first person. Include a timestamp.
\n\n
Additional requirements:  
- Include context from previous logs but emphasize recent developments. 
- Include a timestamp. 
- Use markdown formatting for structure. 
\n\n
The chat is titled "${chatTitle}" and this session covers ${new Date(periodStart).toLocaleDateString()} to ${new Date(periodEnd).toLocaleDateString()}.`;
};