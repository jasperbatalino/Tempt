import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase, createChatSession, saveMessage, loadChatHistory, updateSessionTitle } from '../lib/supabase';
import { generateResponse, ChatMessage } from '../lib/openai';
import { leadCaptureService } from '../lib/leadCapture';
import { knowledgeBase } from '../lib/knowledgeBase';

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
        // Check if Supabase is properly configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Supabase configuration missing. Please check your .env file.');
          // Continue with offline mode - just show welcome message
          const welcomeMessage: Message = {
            id: uuidv4(),
            role: 'assistant',
            content: 'Hej! Jag är Axie, din AI-assistent från Axie Studio. 🚀\n\nJag hjälper dig med:\n• Professionella webbplatser\n• Bokningssystem\n• Mobilappar\n• E-handelslösningar\n\nHur kan jag hjälpa dig idag?\n\n⚠️ Obs: Chathistorik sparas inte just nu på grund av anslutningsproblem.',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
          setIsInitialized(true);
          return;
        }

        // Create new session
        const session = await createChatSession();
        setSessionId(session.id);

        // Add welcome message
        const welcomeMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Hej! Jag är Axie, din AI-assistent från Axie Studio. 🚀\n\nJag hjälper dig med:\n• Professionella webbplatser\n• Bokningssystem\n• Mobilappar\n• E-handelslösningar\n\nHur kan jag hjälpa dig idag?',
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

    // Enhanced language detection using knowledge base
    const detectedLanguage = knowledgeBase.detectLanguage(content);
    console.log(`🌍 DETECTED LANGUAGE: ${detectedLanguage} for message: "${content}"`);

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

      // Enhanced lead capture with better language handling
      const leadResult = await leadCaptureService.processMessage(
        userMessage.content,
        detectedLanguage,
        sessionId
      );

      // If lead was captured, show confirmation message
      if (leadResult.leadCaptured && leadResult.response) {
        // Add thinking message first
        const thinkingMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: detectedLanguage === 'sv' ? 'Behandlar din förfrågan...' : 'Processing your request...',
          timestamp: new Date(),
          isLoading: true
        };

        setMessages(prev => [...prev, thinkingMessage]);

        // Wait 2 seconds for realistic processing time
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Remove thinking message and add lead confirmation
        setMessages(prev => prev.filter(msg => !msg.isLoading));
        
        const leadConfirmationMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: leadResult.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, leadConfirmationMessage]);
        await saveMessage(sessionId, 'assistant', leadConfirmationMessage.content);
        
        return { hasBookingIntent: false, response: leadResult.response, leadCaptured: true };
      }

      // If user wants contact but didn't provide info, ask for it
      if (leadResult.hasContactIntent && !leadResult.leadCaptured && leadResult.response) {
        // Add thinking message first
        const thinkingMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: detectedLanguage === 'sv' ? 'Tänker...' : 'Thinking...',
          timestamp: new Date(),
          isLoading: true
        };

        setMessages(prev => [...prev, thinkingMessage]);

        // Wait 1 second for thinking animation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Remove thinking message and add request for contact info
        setMessages(prev => prev.filter(msg => !msg.isLoading));
        
        const contactRequestMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: leadResult.response,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, contactRequestMessage]);
        await saveMessage(sessionId, 'assistant', contactRequestMessage.content);
        
        return { hasBookingIntent: false, response: leadResult.response };
      }

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
        content: detectedLanguage === 'sv' ? 'Tänker...' : 'Thinking...',
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

      // Check for booking confirmation (only open modal on confirmation)
      const bookingMatch = response.match(/BOOKING_CONFIRMED:(\w+)/);
      if (bookingMatch) {
        const serviceType = bookingMatch[1];
        return { hasBookingIntent: true, serviceType, response };
      }

      return { hasBookingIntent: false, response };

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove thinking message and add graceful error message
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      const detectedLanguage = knowledgeBase.detectLanguage(content);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: detectedLanguage === 'sv' 
          ? 'Ursäkta, jag har tillfälliga anslutningsproblem. Ditt meddelande har sparats och vi kommer att kontakta dig. Du kan också nå Stefan direkt på stefan@axiestudio.se eller +46 735 132 620.'
          : 'Sorry, I\'m having temporary connection issues. Your message has been saved and we will contact you. You can also reach Stefan directly at stefan@axiestudio.se or +46 735 132 620.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      // Don't throw error to prevent app crash
      return { hasBookingIntent: false, response: errorMessage.content };
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