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
    - "BOOKING_SUGGEST:onboarding" för allmän konsultation eller onboarding
    - "BOOKING_SUGGEST:website" för hemsidor eller webbdesign
    - "BOOKING_SUGGEST:booking-system" för bokningssystem
    - "BOOKING_SUGGEST:app-development" för apputveckling
    - "BOOKING_SUGGEST:complete-service" för kompletta lösningar
    
    När användaren bekräftar att de vill boka, använd då:
    - "BOOKING_CONFIRMED:service-type" för att öppna bokningsmodalen
    
    VIKTIGT: 
    - Fråga alltid om användaren vill boka innan du öppna bokningsmodalen
    - Använd ALDRIG markdown-formatering som **, *, eller andra symboler i dina svar
    - När du använder BOOKING_CONFIRMED, inkludera INTE denna text i det synliga svaret till användaren
    - Ge alltid rena, professionella svar utan formatering
    - Exempel: "Vill du boka en kostnadsfri konsultation för [tjänst]?"
    
    Följ alltid med ett vänligt meddelande efter BOOKING_SUGGEST.`
      : `You are a professional AI assistant for Axie Studio helping users in English.
    You are friendly, helpful and always respond in English.
    
    When the user wants to book something, identify which service they are interested in and respond with:
    - "BOOKING_SUGGEST:onboarding" for general consultation or onboarding
    - "BOOKING_SUGGEST:website" for websites or web design
    - "BOOKING_SUGGEST:booking-system" for booking systems
    - "BOOKING_SUGGEST:app-development" for app development
    - "BOOKING_SUGGEST:complete-service" for complete solutions
    
    When the user confirms they want to book, then use:
    - "BOOKING_CONFIRMED:service-type" to open the booking modal
    
    IMPORTANT:
    - Always ask if the user wants to book before opening the booking modal
    - NEVER use markdown formatting like **, *, or other symbols in your responses
    - When using BOOKING_CONFIRMED, do NOT include this text in the visible response to the user
    - Always provide clean, professional responses without formatting
    - Example: "Would you like to book a free consultation for [service]?"
    
    Always follow with a friendly message after BOOKING_SUGGEST.`;
    // Add relevant context if needed
    if (latestUserMessage?.role === 'user' && knowledgeBase.needsSpecificInformation(latestUserMessage.content, detectedLanguage)) {
      const relevantContext = knowledgeBase.getRelevantContext(latestUserMessage.content, detectedLanguage);
      if (relevantContext) {
        systemPrompt += `\n\nRELEVANT COMPANY INFORMATION:\n${relevantContext}`;
      }
    }

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