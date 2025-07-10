import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Calendar, X, MessageCircle, Loader2 } from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Hej! Jag är din AI-assistent. Hur kan jag hjälpa dig idag?",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendToN8n = useCallback(async (message: string) => {
    if (isSending) return; // Prevent rapid sends
    
    setIsSending(true);
    
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: message,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    
    // Add thinking message with loading animation
    const thinkingMsg: Message = {
      id: (Date.now() + 0.5).toString(),
      sender: 'bot',
      text: 'Tänker...',
      timestamp: new Date(),
      isLoading: true
    };
    
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const res = await fetch(
        "https://asdfasfdsvd.app.n8n.cloud/webhook/20a4008a-cb43-45ca-b4db-1e3f8c38f6d8",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        }
      );

      const responseText = await res.text();
      console.log('Raw response:', responseText); // Debug log
      
      // Clean up the response and parse JSON
      const cleanedResponse = responseText.replace(/\\n/g, '').replace(/\\/g, '');
      const data = JSON.parse(cleanedResponse);
      
      console.log('Parsed data:', data); // Debug log
      
      // Replace thinking message with actual response
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.reply || "Jag förstår att du vill boka något. Låt mig öppna kalendern för dig.",
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMsg]);

      if (data.intent === "book_calendar") {
        // Small delay for smooth transition
        setTimeout(() => {
          setCalendarUrl(data.link || "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0QR3uRxVB7rb4ZHqJ1qYmz-T0e2CFtV5MYekvGDq1qyWxsV_Av3nP3zEGk0DrH2HqpTLoXuK0h");
          setShowCalendar(true);
        }, 300);
      }

    } catch (error) {
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Jag har problem med anslutningen just nu. Försök igen om ett ögonblick.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      // Re-enable sending after 600ms to prevent spam
      setTimeout(() => setIsSending(false), 600);
    }
  }, [isSending]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      sendToN8n(input.trim());
    }
  }, [input, isSending, sendToN8n]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const closeCalendar = useCallback(() => {
    setShowCalendar(false);
  }, []);

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AI-Assistent</h1>
            <p className="text-sm text-gray-500">Alltid här för att hjälpa</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start space-x-3 ${
              msg.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.sender === 'user' 
                ? 'bg-gradient-to-r from-green-400 to-blue-500' 
                : 'bg-gradient-to-r from-purple-400 to-pink-500'
            }`}>
              {msg.sender === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Message Bubble */}
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transition-all duration-300 ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                : msg.isLoading 
                  ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-gray-600 border border-blue-200 animate-pulse'
                  : 'bg-white text-gray-800 shadow-sm border border-gray-100'
            }`}>
              <div className="flex items-center space-x-2">
                {msg.isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                )}
                <p className="text-sm leading-relaxed">{msg.text}</p>
              </div>
              <p className={`text-xs mt-1 ${
                msg.sender === 'user' ? 'text-blue-100' : msg.isLoading ? 'text-blue-400' : 'text-gray-400'
              }`}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Optimized Input Form */}
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
                isSending 
                  ? 'bg-gray-100 border border-gray-300 text-gray-500' 
                  : 'bg-gray-50 border border-gray-200'
              }`}
              disabled={isSending}
            />
            {isSending && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className={`w-12 h-12 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-lg transform ${
              isSending 
                ? 'bg-gray-400 cursor-not-allowed scale-95' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 hover:shadow-xl hover:scale-105 active:scale-95'
            }`}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>

      {/* Optimized Calendar Modal */}
      {showCalendar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Boka Din Tid</h2>
                  <p className="text-sm text-gray-500">Välj en tid som passar dig</p>
                </div>
              </div>
              <button
                onClick={closeCalendar}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Calendar Iframe */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl overflow-hidden" style={{ height: '600px' }}>
                <iframe
                  src={calendarUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  title="Bokningskalender"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;