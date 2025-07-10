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
    
    // Security check
    if (latestUserMessage?.role === 'user') {
      const securityCheck = knowledgeBase.checkSecurity(latestUserMessage.content);
      if (securityCheck.isViolation) {
        return 'Jag kan inte hjälpa med det. Låt oss hålla konversationen professionell och fokusera på hur Axie Studio kan hjälpa dig med digitala lösningar.';
      }
    }
    
    // Check if we need specific information
    let systemPrompt = `Du är en professionell AI-assistent för Axie Studio som hjälper användare på svenska. 
    Du är vänlig, hjälpsam och ger alltid svar på svenska.
    
    När användaren vill boka något, identifiera vilken tjänst de är intresserade av och svara med:
    - "BOOKING_INTENT:onboarding" för allmän konsultation eller onboarding
    - "BOOKING_INTENT:website" för hemsidor eller webbdesign
    - "BOOKING_INTENT:booking-system" för bokningssystem
    - "BOOKING_INTENT:app-development" för apputveckling
    - "BOOKING_INTENT:complete-service" för kompletta lösningar
    
    Följ alltid med ett vänligt meddelande efter BOOKING_INTENT.`;
    
    // Add relevant context if needed
    if (latestUserMessage?.role === 'user' && knowledgeBase.needsSpecificInformation(latestUserMessage.content)) {
      const relevantContext = knowledgeBase.getRelevantContext(latestUserMessage.content);
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