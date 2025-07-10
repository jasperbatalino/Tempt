import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase, createChatSession, saveMessage, loadChatHistory, updateSessionTitle } from '../lib/supabase';
import { generateResponse, ChatMessage } from '../lib/openai';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize chat session
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Create new session
        const session = await createChatSession();
        setSessionId(session.id);

        // Add welcome message
        const welcomeMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Hej! Jag är Axie, din AI-assistent från Axie Studio. Hur kan jag hjälpa dig idag?',
          timestamp: new Date()
        };

        setMessages([welcomeMessage]);

        // Save welcome message to database
        await saveMessage(session.id, 'assistant', welcomeMessage.content);
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setIsInitialized(true);
      }
    };

    initializeChat();
  }, []);

  // Generate session title from first user message
  const generateSessionTitle = useCallback((firstMessage: string) => {
    const words = firstMessage.trim().split(' ');
    const title = words.slice(0, 6).join(' ');
    return title.length > 50 ? title.substring(0, 47) + '...' : title;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (isLoading || !content.trim() || !sessionId) return;

    setIsLoading(true);

    try {
      // Add user message to UI
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage]);

      // Save user message to database
      await saveMessage(sessionId, 'user', userMessage.content);

      // Update session title if this is the first user message
      const isFirstUserMessage = messages.filter(m => m.role === 'user').length === 0;
      if (isFirstUserMessage) {
        const title = generateSessionTitle(userMessage.content);
        await updateSessionTitle(sessionId, title);
      }

      // Add thinking message
      const thinkingMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Tänker...',
        timestamp: new Date(),
        isLoading: true
      };

      setMessages(prev => [...prev, thinkingMessage]);

      // Prepare messages for OpenAI
      const chatMessages: ChatMessage[] = messages
        .filter(msg => !msg.isLoading && msg.role !== 'assistant' || msg.content !== 'Hej! Jag är din AI-assistent. Hur kan jag hjälpa dig idag?')
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

      // Save assistant message to database
      await saveMessage(sessionId, 'assistant', assistantMessage.content);

      // Check for booking intent
      const bookingMatch = response.match(/BOOKING_INTENT:(\w+)/);
      if (bookingMatch) {
        const serviceType = bookingMatch[1];
        return { hasBookingIntent: true, serviceType, response };
      }

      return { hasBookingIntent: false, response };

    } catch (error) {
      console.error('Error sending message:', error);
      
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
  }, [messages, isLoading, sessionId, generateSessionTitle]);

  // Load chat history for existing session
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const history = await loadChatHistory(sessionId);
      const loadedMessages: Message[] = history.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at)
      }));
      
      setMessages(loadedMessages);
      setSessionId(sessionId);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    sessionId,
    isInitialized,
    loadSession
  };
}