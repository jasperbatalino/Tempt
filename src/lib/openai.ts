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
        return 'Jag kan inte hjälpa med det. Låt oss hålla konversationen professionell och fokusera på hur Axie Studio kan hjälpa dig med digitala lösningar! 🚀';
      }
    }
    
    // Check if we need specific information
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
    
    BOKNINGSLOGIK:
    När användaren vill boka något, identifiera tjänsten och svara med:
    - "BOOKING_SUGGEST:onboarding" för allmän konsultation eller onboarding
    - "BOOKING_SUGGEST:website" för hemsidor eller webbdesign
    - "BOOKING_SUGGEST:booking-system" för bokningssystem
    - "BOOKING_SUGGEST:app-development" för apputveckling
    - "BOOKING_SUGGEST:complete-service" för kompletta lösningar
    
    När användaren säger "boka", "ja", "absolut", "säkert", "okej" eller bekräftar bokning:
    - "BOOKING_CONFIRMED:onboarding" för att öppna bokningsmodalen direkt
    
    SVARSREGLER:
    - Använd emojis för att visa entusiasm och energi! 🚀💪⭐🎯✨
    - När användaren säger "boka" → använd BOOKING_CONFIRMED:onboarding direkt
    - BOOKING_CONFIRMED/BOOKING_SUGGEST ska ALDRIG synas för användaren
    - Ingen markdown-formatering - bara ren text med emojis
    - Fokusera på värde och fördelar, inte bara funktioner
    - Nämn alltid våra garantier: 99.9% drifttid, kostnadsfri konsultation, inga bindningstider
    
    EXEMPEL PÅ BRA SVAR:
    "Fantastiskt! 🚀 Axie Studio är #1 för digitala lösningar. Vi erbjuder professionella webbplatser från 8,995 kr + 495 kr/månad med 99.9% drifttid och kostnadsfri konsultation över kaffe! ☕ Vill du boka en tid?"`;
    
    // Add relevant context if needed
    if (latestUserMessage?.role === 'user' && knowledgeBase.needsSpecificInformation(latestUserMessage.content)) {
      const relevantContext = knowledgeBase.getRelevantContext(latestUserMessage.content);
      if (relevantContext) {
        systemPrompt += `\n\nRELEVANT FÖRETAGSINFORMATION:\n${relevantContext}`;
      }
    }

    // Add lead capture instructions
    systemPrompt += `\n\nKONTAKTHANTERING:
    - Lead capture-systemet hanterar automatiskt e-post och telefonnummer
    - Fokusera på att ge värdefull information om Axie Studios tjänster
    - Vid kontaktfrågor: nämn Stefan på stefan@axiestudio.se eller +46 735 132 620
    - Betona alltid kostnadsfri konsultation över kaffe! ☕
    
    PRISINFORMATION - GE ALLTID SPECIFIKA PRISER:
    WEBBPLATS PAKET: 8,995 kr startavgift + 495 kr/månad
    COMMERCE PAKET: 10,995 kr startavgift + 895 kr/månad  
    BOKNINGSSYSTEM PAKET: 10,995 kr startavgift + 995 kr/månad
    KOMPLETT PAKET: 14,995 kr startavgift + 1,495 kr/månad
    
    + Kostnadsfri konsultation över kaffe ☕
    + Inga bindningstider - avsluta när som helst
    + 99.9% drifttid garanterat
    + 24/7 support
    
    När användaren frågar "hur mycket" eller "vad kostar" - GE ALLTID specifika priser! 💰`;

    // Always include context security guidelines
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

    return completion.choices[0]?.message?.content || 'Ursäkta, jag kunde inte generera ett svar.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Kunde inte ansluta till AI-tjänsten');
  }
}