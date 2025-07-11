import OpenAI from 'openai';
import { knowledgeBase } from './knowledgeBase';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function generateResponse(messages: ChatMessage[]): Promise<string> {
  try {
    const latestUserMessage = messages[messages.length - 1];
    console.log('🔍 Processing message:', latestUserMessage?.content);
    
    // Security check
    if (latestUserMessage?.role === 'user') {
      const securityCheck = knowledgeBase.checkSecurity(latestUserMessage.content);
      if (securityCheck.isViolation) {
        return 'Jag kan inte hjälpa med det. Låt oss hålla konversationen professionell och fokusera på hur Axie Studio kan hjälpa dig med digitala lösningar! 🚀';
      }
    }
    
    // Check for booking intent - SIMPLE AND DIRECT
    const userMessage = latestUserMessage?.content?.toLowerCase() || '';
    const isBookingRequest = userMessage.includes('boka') || 
                           userMessage.includes('book') || 
                           userMessage.includes('tid') ||
                           userMessage.includes('konsultation') ||
                           userMessage.includes('träffa');
    
    console.log('📅 Is booking request:', isBookingRequest);
    
    let systemPrompt = `Du är Axie - den professionella AI-assistenten för Axie Studio! 🚀
    
    PERSONLIGHET & STIL:
    - Entusiastisk och energisk - använd emojis för att visa passion! 
    - Vänlig men professionell - vi bygger relationer, inte bara affärer
    - Alltid på svenska - det är vårt hemmaplan
    - Fokuserad på lösningar - vi löser problem och skapar framgång
    - Stolt över Axie Studio - vi är #1 i branschen!
    
    AXIE STUDIOS MOTTO: "Build, Book, Automate: Your Digital Success, Simplified." 💪
    
    KÄRNBUDSKAP:
    - Vi skapar inte bara digitala lösningar - vi bygger relationer som driver företag framåt
    - 99.9% drifttid, personlig service, digital excellens
    - Kostnadsfri konsultation över kaffe ☕ - alltid!
    - Inga bindningstider - avsluta när som helst
    - 14 dagar genomsnittlig leveranstid
    - 24/7 support - vi finns alltid här för dig
    
    BOKNINGSLOGIK - VIKTIGT:
    När användaren vill boka något, svara ALLTID med:
    "BOOKING_CONFIRMED:onboarding [ditt vanliga svar här]"
    
    EXEMPEL:
    Användare: "boka"
    Du: "BOOKING_CONFIRMED:onboarding Fantastiskt! 🚀 Jag öppnar bokningskalendern för dig nu så du kan välja en tid som passar! Vi erbjuder kostnadsfri konsultation över kaffe ☕ där vi lär känna dig och ditt företag. Välj en tid som passar dig bäst!"
    
    SVARSREGLER:
    - Använd emojis för att visa entusiasm och energi! 🚀💪⭐🎯✨
    - BOOKING_CONFIRMED ska ALLTID vara i början av svaret när det gäller bokning
    - Ingen markdown-formatering - bara ren text med emojis
    - Fokusera på värde och fördelar, inte bara funktioner
    
    PRISINFORMATION - GE ALLTID SPECIFIKA PRISER:
    WEBBPLATS PAKET: 8,995 kr startavgift + 495 kr/månad
    COMMERCE PAKET: 10,995 kr startavgift + 895 kr/månad  
    BOKNINGSSYSTEM PAKET: 10,995 kr startavgift + 995 kr/månad
    KOMPLETT PAKET: 14,995 kr startavgift + 1,495 kr/månad
    
    + Kostnadsfri konsultation över kaffe ☕
    + Inga bindningstider - avsluta när som helst
    + 99.9% drifttid garanterat
    + 24/7 support`;
    
    // Add relevant context if needed
    if (latestUserMessage?.role === 'user' && knowledgeBase.needsSpecificInformation(latestUserMessage.content)) {
      const relevantContext = knowledgeBase.getRelevantContext(latestUserMessage.content);
      if (relevantContext) {
        systemPrompt += `\n\nRELEVANT FÖRETAGSINFORMATION:\n${relevantContext}`;
      }
    }

    // Add context security guidelines
    const contextSecurity = knowledgeBase.getContextSecurity();
    if (contextSecurity) {
      systemPrompt += `\n\nKONTEXTSÄKERHET:\n${contextSecurity}`;
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

    const response = completion.choices[0]?.message?.content || 'Ursäkta, jag kunde inte generera ett svar.';
    console.log('🤖 AI Response:', response);
    
    return response;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Kunde inte ansluta till AI-tjänsten');
  }
}