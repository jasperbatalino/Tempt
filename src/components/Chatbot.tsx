import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, User, Loader2 } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import BookingModal from './BookingModal';
import ConfirmationModal from './ConfirmationModal';

const Chatbot = () => {
  const { messages, isLoading, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [detectedService, setDetectedService] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [leadData, setLeadData] = useState<{ email?: string; phone?: string; n8nResponse?: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    setInput('');

    // Check if user is confirming a booking
    const isBookingConfirmation = /^(ja|yes|boka|book|absolutely|definitely|sure|ok|okay)$/i.test(messageContent.trim());
    
    // If it's a booking confirmation and we have a suggested service, convert to booking intent
    if (isBookingConfirmation && messages.length > 0) {
      const lastAssistantMessage = messages.slice().reverse().find(m => m.role === 'assistant');
      if (lastAssistantMessage?.content.includes('BOOKING_SUGGEST:')) {
        const suggestMatch = lastAssistantMessage.content.match(/BOOKING_SUGGEST:(\w+)/);
        if (suggestMatch) {
          const serviceType = suggestMatch[1];
          // Add the confirmation message with booking intent
          const confirmationMessage = `${messageContent} BOOKING_CONFIRMED:${serviceType}`;
          
          try {
            const result = await sendMessage(confirmationMessage);
            if (result?.hasBookingIntent && result?.serviceType) {
              setDetectedService(result.serviceType);
              setTimeout(() => {
                setShowBooking(true);
              }, 500);
            }
          } catch (error) {
            console.error('Error sending confirmation message:', error);
          }
          return;
        }
      }
    }
    try {
      const result = await sendMessage(messageContent);
      
      // Check for lead capture confirmation
      if (result?.leadCaptured) {
        // Lead confirmation is now handled in the chat message itself
        // No modal needed as per user request
      }
      
      if (result?.hasBookingIntent && result?.serviceType) {
        setDetectedService(result.serviceType);
        setTimeout(() => {
          setShowBooking(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Don't show error to user - the useChat hook handles it gracefully
    }
  }, [input, isLoading, sendMessage]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  }, []);

  const closeCalendar = useCallback(() => {
    setShowBooking(false);
    setDetectedService('');
  }, []);

  const closeConfirmation = useCallback(() => {
    setShowConfirmation(false);
    setLeadData({});
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white border-2 border-gray-200">
            <img 
              src="/axie-logo.png" 
              alt="Axie Studio AI" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Axie</h1>
            <p className="text-sm text-gray-500">Axie Studios AI</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 animate-in slide-in-from-bottom-4 duration-300 ${
              msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' 
                ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                : 'bg-white border-2 border-gray-200 overflow-hidden'
            }`}>
              {msg.role === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <img 
                  src="/axie-logo.png" 
                  alt="Axie" 
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transition-all duration-300 ${
              msg.role === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : msg.isLoading 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-gray-600 border border-blue-200'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100'
            }`}>
              <div className="flex items-center space-x-2">
                {msg.isLoading && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content
                    .replace(/BOOKING_CONFIRMED:\w+/g, '')
                    .replace(/BOOKING_SUGGEST:\w+/g, '')
                    .replace('BOOKING_INTENT', '')
                    .trim() || msg.content}
                </p>
              </div>
              <p className={`text-xs mt-1 ${
                msg.role === 'user' ? 'text-blue-100' : msg.isLoading ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSubmit} className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Skriv ditt meddelande..."
              className={`w-full px-4 py-3 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                isLoading 
                  ? 'bg-gray-100 border border-gray-300 text-gray-500' 
                  : 'bg-gray-50 border border-gray-200'
              }`}
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`w-12 h-12 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-lg transform ${
              isLoading 
                ? 'bg-gray-400 cursor-not-allowed scale-95' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Booking Modal */}
      <BookingModal 
        isOpen={showBooking}
        onClose={closeCalendar}
        detectedService={detectedService}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={closeConfirmation}
        email={leadData.email}
        phone={leadData.phone}
        n8nResponse={leadData.n8nResponse}
      />
    </div>
  );
};

export default Chatbot;