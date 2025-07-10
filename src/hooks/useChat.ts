import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabase';
import { generateResponse, ChatMessage } from '../lib/openai';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uuidv4(),
      role: 'assistant',
      content: 'Hej! Jag är din AI-assistent. Hur kan jag hjälpa dig idag?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4());

  const saveMessage = useCallback(async (message: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      await supabase.from('messages').insert({
        session_id: sessionId,
        role: message.role,
        content: message.content
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }, [sessionId]);

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading || !content.trim()) return;

    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);

    // Add thinking message
    const thinkingMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: 'Tänker...',
      timestamp: new Date(),
      isLoading: true
    };

    setMessages(prev => [...prev, thinkingMessage]);

    try {
      // Prepare messages for OpenAI
      const chatMessages: ChatMessage[] = messages
        .filter(msg => !msg.isLoading)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      chatMessages.push({ role: 'user', content: content.trim() });

      // Generate response
      const response = await generateResponse(chatMessages);
      
      // Remove thinking message and add real response
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(assistantMessage);

      // Check for booking intent
      if (response.includes('BOOKING_INTENT')) {
        return { hasBookingIntent: true, response };
      }

      return { hasBookingIntent: false, response };

    } catch (error) {
      // Remove thinking message and add error message
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Ursäkta, jag har problem med anslutningen just nu. Försök igen om ett ögonblick.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [messages, isLoading, saveMessage]);

  return {
    messages,
    isLoading,
    sendMessage,
    sessionId
  };
}