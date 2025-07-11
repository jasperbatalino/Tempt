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
    
    // Always use Swedish
    const detectedLanguage = 'sv';
    
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
    - "BOOKING_SUGGEST:onboarding" för allmän konsultation eller onboarding
    - "BOOKING_SUGGEST:website" för hemsidor eller webbdesign
    - "BOOKING_SUGGEST:booking-system" för bokningssystem
    - "BOOKING_SUGGEST:app-development" för apputveckling
    - "BOOKING_SUGGEST:complete-service" för kompletta lösningar
    
    När användaren säger "boka", "ja", "absolut" eller bekräftar bokning, använd då:
    - "BOOKING_CONFIRMED:onboarding" för att öppna bokningsmodalen direkt
    
    VIKTIGT: 
    - När användaren säger "boka" - använd BOOKING_CONFIRMED:onboarding direkt
    - Använd ALDRIG markdown-formatering 
    - BOOKING_CONFIRMED ska INTE synas i svaret till användaren
    - Ge alltid rena, professionella svar utan formatering
    
    // Add relevant context if needed
    if (latestUserMessage?.role === 'user' && knowledgeBase.needsSpecificInformation(latestUserMessage.content)) {
      const relevantContext = knowledgeBase.getRelevantContext(latestUserMessage.content);
      if (relevantContext) {
        systemPrompt += `\n\nRELEVANT COMPANY INFORMATION:\n${relevantContext}`;
      }
    }

    // Add lead capture instructions
    systemPrompt += `\n\nLEAD CAPTURE INSTRUCTIONS:
    - If user provides email or phone number and wants contact, the system will automatically handle lead capture
    - Don't ask for contact information yourself - the lead capture system handles this
    - Focus on providing helpful information about Axie Studio services
    - If user asks about contact, mention they can reach Stefan at stefan@axiestudio.se or +46 735 132 620
    
    PRICING INFORMATION - ALWAYS provide specific prices when asked:
    WEBBPLATS PAKET: 8,995 kr startavgift + 495 kr/månad
    COMMERCE PAKET: 10,995 kr startavgift + 895 kr/månad  
    BOKNINGSSYSTEM PAKET: 10,995 kr startavgift + 995 kr/månad
    KOMPLETT PAKET: 14,995 kr startavgift + 1,495 kr/månad
    
    When user asks "hur mycket" or "vad kostar" - ALWAYS give specific prices from the knowledge base!`;

    // Always include context security guidelines
    const contextSecurity = knowledgeBase.getContextSecurity();
    if (contextSecurity) {
      systemPrompt += `\n\nCONTEXT SECURITY GUIDELINES:\n${contextSecurity}`;
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