import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';
import { generateUUID } from '@/lib/utils';
import { Database } from '@/types/database.types';
import { type UIMessage, type Attachment } from 'ai';
import type { Json } from '@/types/database.types';

// Types
export type Chat = Database['public']['Tables']['chats']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

export const getUser = cache(async (supabase: SupabaseClient<Database>) => {
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
});

export const getUserDetails = cache(async (supabase: SupabaseClient<Database>) => {
  const { data: userDetails } = await supabase
    .from('profiles')
    .select('*')
    .single();
  return userDetails;
});

// Chat Operations

// Create a new chat
export async function saveChat(
  supabase: SupabaseClient<Database>,
  id: string,
  title: string,
  projectId: string,
  parentChatId: string | null,
  chatSummary: string | null,
  visibility: 'private' | 'public' = 'private'
) {
  const { error } = await supabase.from('chats').insert({
    id,
    title,
    project_id: projectId,
    parent_chat_id: parentChatId,
    visibility,
    inheritance_summary: chatSummary
  });

  console.log("New chat created with ID:", id);

  if (error) throw error;
  return id;
}

// Get all chats for the current user
export async function getChatsByUserId(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('chats')
    .select('*, projects!inner(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

//Get memory chat for current user
export async function getMemoryChats(supabase: any, project_id: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*, projects!inner(name, description, is_default)')
    .eq('title', "Memories")
    .eq('project_id', project_id)
    .order('created_at', { ascending: false }); // Get newest first 

  if (error) throw error;
  
  // Always return the first (most recent) one, or null if none exist
  return data?.[0] || null;
}

// Get a specific chat by ID
export async function getChatById(supabase: SupabaseClient<Database>, id: string) {
  // HINT: The result could be null, if the chat does not exist
  const { data, error } = await supabase
    .from('chats')
    .select('*, projects!inner(name, description, is_default)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

// Delete a chat and its messages
export async function deleteChatById(supabase: SupabaseClient<Database>, id: string) {
  // Messages will be deleted automatically due to the ON DELETE CASCADE constraint
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// Update chat visibility
export async function updateChatVisibility(
  supabase: SupabaseClient<Database>,
  chatId: string,
  visibility: 'private' | 'public'
) {
  const { error } = await supabase
    .from('chats')
    .update({ visibility })
    .eq('id', chatId);

  if (error) throw error;
  return true;
}

// Message Operations

// Save new messages
export async function saveMessages(
  supabase: SupabaseClient<Database>,
  messages: Array<{
    id?: string;
    chat_id: string;
    role: 'user' | 'assistant' | 'system';
    parts: UIMessage['parts'];
    attachments?: Attachment[];
    created_at: string;
  }>
) {
  // Add UUIDs to messages that don't have IDs
  const messagesWithIds = messages.map(message => ({
    ...message,
    id: message.id || generateUUID(),
    attachments: message.attachments as unknown as Json,
    parts: message.parts as unknown as Json,
  }));

  const { error } = await supabase
    .from('messages')
    .insert(messagesWithIds);

  if (error) throw error;
  return true;
}

// Get all messages for a chat
export async function getMessagesByChatId(supabase: SupabaseClient<Database>, chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

// Delete messages after a specific timestamp
export async function deleteMessagesByChatIdAfterTimestamp(
  supabase: SupabaseClient<Database>,
  chatId: string,
  timestamp: string
) {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('chat_id', chatId)
    .gte('created_at', timestamp);

  if (error) throw error;
  return true;
}

// Generate a title for a chat based on the first message
export async function generateChatTitle(message: string) {
  // Simplified for now - would use AI to generate a real title
  // In a real implementation, we would call an AI endpoint
  return message.slice(0, 30) + (message.length > 30 ? '...' : '');
}

// Update chat title
export async function updateChatTitle(
  supabase: SupabaseClient<Database>,
  chatId: string,
  title: string
) {
  const { error } = await supabase
    .from('chats')
    .update({ title })
    .eq('id', chatId);

  if (error) throw error;
  return true;
}

// Get all user direct file documents
export async function getUserDirectDocuments(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('documents')
    .select('title, id, content, created_at, updated_at')
    .eq('is_direct_file', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get all user projects
export async function getUserProjects(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, is_default, created_at, updated_at')
    .order('is_default', { ascending: false }) // Default project first
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get the user's default project
export async function getUserDefaultProject(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, is_default, created_at, updated_at')
    .eq('is_default', true)
    .single();

  if (error) throw error;
  return data;
}

// Get a specific project by ID
export async function getProjectById(supabase: SupabaseClient<Database>, projectId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, is_default, created_at, updated_at')
    .eq('id', projectId)
    .single();

  if (error) throw error;
  return data;
}

// Get chats for a specific project
export async function getChatsByProjectId(supabase: SupabaseClient<Database>, projectId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('id, title, visibility, created_at')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get documents for a specific project
export async function getDocumentsByProjectId(supabase: SupabaseClient<Database>, projectId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('id, name, title, content, file_type, is_direct_file, created_at, updated_at')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Create a new project
export async function createProject(
  supabase: SupabaseClient<Database>,
  name: string,
  description?: string
) {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name,
      description,
      is_default: false
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Update a project
export async function updateProject(
  supabase: SupabaseClient<Database>,
  projectId: string,
  updates: { name?: string; description?: string }
) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', projectId)
    .eq('is_default', false) // Prevent updating default project
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Delete a project (only non-default projects)
export async function deleteProject(supabase: SupabaseClient<Database>, projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('is_default', false); // Prevent deleting default project

  if (error) throw error;
  return true;
}

// Get all user direct file documents for a specific project
export async function getUserDirectDocumentsByProjectId(supabase: SupabaseClient<Database>, projectId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('title, id, content, created_at, updated_at')
    .eq('project_id', projectId)
    .eq('is_direct_file', true)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Get recently accessed projects with activity information
export async function getRecentProjects(supabase: SupabaseClient<Database>, limit: number = 8) {
  const { data, error } = await supabase
    .rpc('get_recent_projects_with_activity', {
      p_limit: limit
    });

  if (error) throw error;
  return data;
}

export async function getUserMemories(supabase: SupabaseClient<Database>) {
  const { data: memories, error } = await supabase
    .from('memories')
    .select(`
      id,
      title,
      content,
      category,
      created_at,
      updated_at
    `)
    .order('created_at', { ascending: false });
  console.log('SSR memories:', memories);

  if (error) throw error;
  return memories || [];
}