import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { UIMessage, CoreAssistantMessage, CoreToolMessage } from "ai"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getURL = (path: string = '') => {
  // Check if NEXT_PUBLIC_FORWARDED_URL is set and non-empty only in development env. Set this to local dev server or proxy server (ngrok, codespace) URL in development env.
  // Check if NEXT_PUBLIC_SITE_URL is set and non-empty in production env. Set this to your site URL in production env.
  let url =
    process.env.NEXT_PUBLIC_FORWARDED_URL &&
    process.env.NEXT_PUBLIC_FORWARDED_URL.trim() !== ''
      ? process.env.NEXT_PUBLIC_FORWARDED_URL
      : // Fall back to NEXT_PUBLIC_SITE_URL if forwarded URL is not set
        process.env.NEXT_PUBLIC_SITE_URL &&
        process.env.NEXT_PUBLIC_SITE_URL.trim() !== ''
          ? process.env.NEXT_PUBLIC_SITE_URL
          : // If not set, check for NEXT_PUBLIC_VERCEL_URL, which is automatically set by Vercel.
            process.env.NEXT_PUBLIC_VERCEL_URL &&
              process.env.NEXT_PUBLIC_VERCEL_URL.trim() !== ''
            ? process.env.NEXT_PUBLIC_VERCEL_URL
            : // If neither is set, default to localhost for local development.
              'http://localhost:3000/';

  // Trim the URL and remove trailing slash if exists.
  url = url.replace(/\/+$/, '');
  // Make sure to include `https://` when not localhost.
  url = url.includes('http') ? url : `https://${url}`;
  // Ensure path starts without a slash to avoid double slashes in the final URL.
  path = path.replace(/^\/+/, '');

  // Concatenate the URL and the path.
  return path ? `${url}/${path}` : url;
};

type ResponseMessageWithoutId = CoreToolMessage | CoreAssistantMessage;
type ResponseMessage = ResponseMessageWithoutId & { id: string };

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface ApplicationError extends Error {
  info: string;
  status: number;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error(
      'An error occurred while fetching the data.',
    ) as ApplicationError;

    error.info = await res.json();
    error.status = res.status;

    throw error;
  }

  return res.json();
};

export function getMostRecentUserMessage(messages: Array<UIMessage>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function getTrailingMessageId({
  messages,
}: {
  messages: Array<ResponseMessage>;
}): string | null {
  const trailingMessage = messages.at(-1);

  if (!trailingMessage) return null;

  return trailingMessage.id;
}

export function isSameTime(time1: string | Date, time2: string | Date, toleranceMs = 0): boolean {
  const t1 = time1 instanceof Date ? time1.getTime() : new Date(time1).getTime();
  const t2 = time2 instanceof Date ? time2.getTime() : new Date(time2).getTime();
  
  return Math.abs(t1 - t2) <= toleranceMs;
}

/**
 * Get the display name for a project
 * Shows "General Chats" for the default project instead of "Default Project"
 */
export const getProjectDisplayName = (name: string, isDefault: boolean): string => {
  return isDefault && name === 'Default Project' ? 'General Chats' : name;
};

/**
 * Check if a project is the default "General Chats" project
 */
export const isGeneralChatsProject = (name: string, isDefault: boolean): boolean => {
  return isDefault && name === 'Default Project';
};

// Check if the user is an admin based on their email
export function isAdminUser(email: string | undefined | null): boolean {
  if (!email) return false;
  
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  return adminEmails.includes(email.toLowerCase());
}