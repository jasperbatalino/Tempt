import OpenAI from 'openai';
import { knowledgeBase } from './knowledgeBase';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Note: In production, use a backend API
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateResponse(messages: ChatMessage[]): Promise<string> {
  try {
    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1];
    
    // Enhanced language detection - look at conversation context
    let detectedLanguage: 'sv' | 'en' = 'sv';
    if (latestUserMessage?.role === 'user') {
      detectedLanguage = knowledgeBase.detectLanguage(latestUserMessage.content);
      
      // Check previous messages for language consistency
      const recentUserMessages = messages.slice(-3).filter(m => m.role === 'user');
      if (recentUserMessages.length > 1) {
        const languageVotes = recentUserMessages.map(m => knowledgeBase.detectLanguage(m.content));
        const englishCount = languageVotes.filter(l => l === 'en').length;
        const swedishCount = languageVotes.filter(l => l === 'sv').length;
        
        // Use majority language from recent conversation
        detectedLanguage = englishCount > swedishCount ? 'en' : 'sv';
      }
    }
    
    // Security check
    if (latestUserMessage?.role === 'user') {
      const securityCheck = knowledgeBase.checkSecurity(latestUserMessage.content, detectedLanguage);
      if (securityCheck.isViolation) {
        return detectedLanguage === 'sv' 
          ? 'Jag kan inte hjälpa med det. Låt oss hålla konversationen professionell och fokusera på hur Axie Studio kan hjälpa dig med digitala lösningar.'
          : 'I cannot help with that. Let\'s keep the conversation professional and focus on how Axie Studio can help you with digital solutions.';
      }
    }
    
    // Enhanced system prompt with better multilingual handling
    let systemPrompt = detectedLanguage === 'sv' 
      ? `Du är Axie, en professionell AI-assistent för Axie Studio. Du hjälper användare på svenska med våra digitala lösningar.
    
    SPRÅKHANTERING:
    - Svara ALLTID på svenska, även om användaren byter till engelska
    - Var naturlig och vänlig i din kommunikation
    - Använd aldrig markdown-formatering (**, *, etc.)
    
    BOKNINGSHANTERING:
    När användaren vill boka något eller säger "boka tid", "ja", "visst":
    - ALLTID lägg till BOOKING_CONFIRMED:service-type i slutet av ditt svar
    - Tjänsttyper: onboarding, website, booking-system, app-development, complete-service
    - Exempel: "Perfekt! Jag öppnar bokningskalendern för dig. BOOKING_CONFIRMED:onboarding"
    - Exempel: "Absolut! Låt oss boka en tid. BOOKING_CONFIRMED:onboarding"
    
    PRISER (alltid inkludera när användaren frågar):
    • Webbplats: 8,995 kr start + 495 kr/mån
    • E-handel: 10,995 kr start + 895 kr/mån  
    • Bokningssystem: 10,995 kr start + 995 kr/mån (MEST POPULÄR)
    • Komplett paket: 14,995 kr start + 1,495 kr/mån (BÄST VÄRDE)
    • Alla priser exkl. moms, inga bindningstider
    
    KONTAKTHANTERING:
    - Lead capture-systemet hanterar automatiskt e-post/telefon
    - Fokusera på att ge värdefull information om våra tjänster
    - Vid kontaktförfrågningar, be om e-post/telefon för uppföljning`
      : `You are Axie, a professional AI assistant for Axie Studio. You help users in English with our digital solutions.
    
    LANGUAGE HANDLING:
    - ALWAYS respond in English, even if user switches to Swedish
    - Be natural and friendly in your communication
    - Never use markdown formatting (**, *, etc.)
    
    BOOKING MANAGEMENT:
    When user wants to book something or says "book", "yes", "sure":
    - ALWAYS add BOOKING_CONFIRMED:service-type at the end of your response
    - Service types: onboarding, website, booking-system, app-development, complete-service
    - Example: "Perfect! I'll open the booking calendar for you. BOOKING_CONFIRMED:onboarding"
    
    PRICING (always include when user asks):
    // Check for booking confirmation words (ja, yes, etc.) in context
    const isBookingConfirmation = latestUserMessage?.role === 'user' && 
      /^(ja|yes|boka|book|absolutely|definitely|sure|ok|okay|säkert|visst)$/i.test(latestUserMessage.content.trim());
    
    if (isBookingConfirmation) {
      systemPrompt += `\n\nBOOKING CONFIRMATION DETECTED: User is confirming a booking. ALWAYS include BOOKING_CONFIRMED:onboarding at the end of your response.`;
    }

    • Website: 8,995 SEK setup + 495 SEK/month
    • E-commerce: 10,995 SEK setup + 895 SEK/month
    • Booking System: 10,995 SEK setup + 995 SEK/month (MOST POPULAR)
    • Complete Package: 14,995 SEK setup + 1,495 SEK/month (BEST VALUE)
    • All prices exclude VAT, no binding contracts
    
    CONTACT HANDLING:
    - Lead capture system automatically handles email/phone
    - Focus on providing valuable information about our services
    - For contact requests, ask for email/phone for follow-up`;

    // Add relevant context based on conversation
    if (latestUserMessage?.role === 'user') {
      const needsInfo = knowledgeBase.needsSpecificInformation(latestUserMessage.content, detectedLanguage);
      if (needsInfo) {
        const relevantContext = knowledgeBase.getRelevantContext(latestUserMessage.content, detectedLanguage);
        if (relevantContext) {
          systemPrompt += `\n\nRELEVANT INFORMATION:\n${relevantContext}`;
        }
      }
    }

    // Enhanced booking detection
    const bookingKeywords = detectedLanguage === 'sv' 
      ? ['boka', 'bokning', 'tid', 'träffa', 'konsultation', 'möte', 'book', 'booking']
      : ['book', 'booking', 'appointment', 'meeting', 'consultation', 'schedule', 'boka', 'bokning'];
    
    const hasBookingIntent = latestUserMessage?.role === 'user' && 
      bookingKeywords.some(keyword => latestUserMessage.content.toLowerCase().includes(keyword));
    
    if (hasBookingIntent) {
      // Determine service type from conversation context
      const content = latestUserMessage.content.toLowerCase();
      let serviceType = 'onboarding'; // default
      
      if (content.includes('website') || content.includes('hemsida') || content.includes('webbplats')) {
        serviceType = 'website';
      } else if (content.includes('app') || content.includes('mobilapp')) {
        serviceType = 'app-development';
      } else if (content.includes('booking') || content.includes('bokning')) {
        serviceType = 'booking-system';
      } else if (content.includes('complete') || content.includes('komplett') || content.includes('everything')) {
        serviceType = 'complete-service';
      }
      
      systemPrompt += `\n\nBOOKING DETECTED: User wants to book ${serviceType}. ALWAYS include BOOKING_CONFIRMED:${serviceType} at the end of your response to trigger the booking modal.`;
    }

    // Price inquiry detection
    const priceKeywords = detectedLanguage === 'sv' 
      ? ['pris', 'kostnad', 'kostar', 'betala', 'avgift']
      : ['price', 'cost', 'pricing', 'how much', 'fee', 'charge'];
    
    const hasPriceInquiry = latestUserMessage?.role === 'user' && 
      priceKeywords.some(keyword => latestUserMessage.content.toLowerCase().includes(keyword));
    
    if (hasPriceInquiry) {
      systemPrompt += `\n\nPRICE INQUIRY DETECTED: User is asking about pricing. Include detailed pricing information in your response.`;
    }

    // Contact intent detection
    const contactKeywords = detectedLanguage === 'sv' 
      ? ['kontakta', 'ring', 'mejla', 'hör av', 'email', 'telefon', '@']
      : ['contact', 'email', 'call', 'reach', 'get back', '@'];
    
    const hasContactIntent = latestUserMessage?.role === 'user' && 
      contactKeywords.some(keyword => latestUserMessage.content.toLowerCase().includes(keyword));
    
    if (hasContactIntent) {
      systemPrompt += `\n\nCONTACT INTENT DETECTED: User wants to be contacted. The lead capture system will handle this automatically.`;
    }

    // Add context security
    const contextSecurity = knowledgeBase.getContextSecurity();
    if (contextSecurity) {
      systemPrompt += `\n\nCONTEXT GUIDELINES:\n${contextSecurity}`;
    }

    console.log(`🤖 AI SYSTEM - Language: ${detectedLanguage}, Booking: ${hasBookingIntent}, Price: ${hasPriceInquiry}, Contact: ${hasContactIntent}`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    let response = completion.choices[0]?.message?.content || 'Ursäkta, jag kunde inte generera ett svar.';
    
    // Clean up response - remove any booking tags from visible text
    const cleanResponse = response
      .replace(/BOOKING_CONFIRMED:\w+/g, '')
      .replace(/BOOKING_SUGGEST:\w+/g, '')
      .trim();

    return cleanResponse || response;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Kunde inte ansluta till AI-tjänsten');
  }
}