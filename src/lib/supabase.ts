import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:', {
    url: supabaseUrl ? 'Present' : 'Missing',
    key: supabaseAnonKey ? 'Present' : 'Missing'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
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
    email_leads: {
      Row: {
        id: string;
        email: string;
        source: string;
        context: string | null;
        session_id: string | null;
        status: 'new' | 'contacted' | 'converted' | 'unqualified';
        created_at: string;
        updated_at: string;
      };
      Insert: {
        id?: string;
        email: string;
        source?: string;
        context?: string | null;
        session_id?: string | null;
        status?: 'new' | 'contacted' | 'converted' | 'unqualified';
        created_at?: string;
        updated_at?: string;
      };
      Update: {
        id?: string;
        email?: string;
        source?: string;
        context?: string | null;
        session_id?: string | null;
        status?: 'new' | 'contacted' | 'converted' | 'unqualified';
        created_at?: string;
        updated_at?: string;
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

// Email lead capture functions
export async function captureEmailLead(
  email: string, 
  sessionId: string | null = null, 
  context: string | null = null,
  source: string = 'chat'
) {
  try {
    const { data, error } = await supabase
      .from('email_leads')
      .upsert({
        email: email.toLowerCase().trim(),
        session_id: sessionId,
        context,
        source
      }, {
        onConflict: 'email',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      // If it's a duplicate email, that's okay - we still captured it
      if (error.code === '23505') {
        console.log('Email already exists in leads:', email);
        return { success: true, isNew: false, email };
      }
      throw error;
    }

    return { success: true, isNew: true, data };
  } catch (error) {
    console.error('Error capturing email lead:', error);
    return { success: false, error };
  }
}

export async function getEmailLeads(limit: number = 50) {
  const { data, error } = await supabase
    .from('email_leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function updateLeadStatus(id: string, status: 'new' | 'contacted' | 'converted' | 'unqualified') {
  const { error } = await supabase
    .from('email_leads')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}