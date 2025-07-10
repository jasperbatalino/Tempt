import OpenAI from 'openai';

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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Du är en professionell AI-assistent för Axie Studio som hjälper användare på svenska. 
          Du är vänlig, hjälpsam och ger alltid svar på svenska.
          
          När användaren vill boka något, identifiera vilken tjänst de är intresserade av och svara med:
          - "BOOKING_INTENT:onboarding" för allmän konsultation eller onboarding
          - "BOOKING_INTENT:website" för hemsidor eller webbdesign
          - "BOOKING_INTENT:booking-system" för bokningssystem
          - "BOOKING_INTENT:app-development" för apputveckling
          - "BOOKING_INTENT:complete-service" för kompletta lösningar
          
          Följ alltid med ett vänligt meddelande efter BOOKING_INTENT.`
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