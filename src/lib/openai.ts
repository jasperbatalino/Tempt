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
    
    // Detect language
    const detectedLanguage = latestUserMessage?.role === 'user' 
      ? knowledgeBase.detectLanguage(latestUserMessage.content)
      : 'sv';
    
    // Security check
    if (latestUserMessage?.role === 'user') {
      const securityCheck = knowledgeBase.checkSecurity(latestUserMessage.content, detectedLanguage);
      if (securityCheck.isViolation) {
        return detectedLanguage === 'sv' 
          ? 'Jag kan inte hjälpa med det. Låt oss hålla konversationen professionell och fokusera på hur Axie Studio kan hjälpa dig med digitala lösningar.'
          : 'I cannot help with that. Let\'s keep the conversation professional and focus on how Axie Studio can help you with digital solutions.';
      }
    }
    
    // Check if we need specific information
    let systemPrompt = detectedLanguage === 'sv' 
      ? `Du är en professionell AI-assistent för Axie Studio som hjälper användare på svenska. 
    Du är vänlig, hjälpsam och ger alltid svar på svenska.
    
    När användaren vill boka något, identifiera vilken tjänst de är intresserade av och svara med:
    - "BOOKING_INTENT:onboarding" för allmän konsultation eller onboarding
    - "BOOKING_INTENT:website" för hemsidor eller webbdesign
    - "BOOKING_INTENT:booking-system" för bokningssystem
    - "BOOKING_INTENT:app-development" för apputveckling
    - "BOOKING_INTENT:complete-service" för kompletta lösningar
    
    Följ alltid med ett vänligt meddelande efter BOOKING_INTENT.`
      : `You are a professional AI assistant for Axie Studio helping users in English.
    You are friendly, helpful and always respond in English.
    
    When the user wants to book something, identify which service they are interested in and respond with:
    - "BOOKING_INTENT:onboarding" for general consultation or onboarding
    - "BOOKING_INTENT:website" for websites or web design
    - "BOOKING_INTENT:booking-system" for booking systems
    - "BOOKING_INTENT:app-development" for app development
    - "BOOKING_INTENT:complete-service" for complete solutions
    
    Always follow with a friendly message after BOOKING_INTENT.`;
    // Add relevant context if needed
    if (latestUserMessage?.role === 'user' && knowledgeBase.needsSpecificInformation(latestUserMessage.content, detectedLanguage)) {
      const relevantContext = knowledgeBase.getRelevantContext(latestUserMessage.content, detectedLanguage);
      if (relevantContext) {
        systemPrompt += `\n\nRELEVANT COMPANY INFORMATION:\n${relevantContext}`;
      }
    }

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

    return completion.choices[0]?.message?.content || 'Ursäkta, jag kunde inte generera ett svar.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Kunde inte ansluta till AI-tjänsten');
  }
}