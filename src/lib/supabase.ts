import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      chat_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
      };
    };
  };
};

// Helper functions for chat operations
export async function createChatSession(title?: string) {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({ title: title || 'Ny Konversation' })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function saveMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      role,
      content
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function loadChatHistory(sessionId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const { error } = await supabase
    .from('chat_sessions')
    .update({ title })
    .eq('id', sessionId);

  if (error) throw error;
}