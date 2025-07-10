// Lead Capture System for N8N Webhook Integration

interface LeadData {
  email?: string;
  phone?: string;
  context: string;
  source: string;
  sessionId?: string;
  timestamp: string;
}

interface WebhookResponse {
  success: boolean;
  message?: string;
}

class LeadCaptureService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;
    
    if (!this.webhookUrl) {
      console.error('N8N Webhook URL not configured');
      throw new Error('N8N Webhook URL missing from environment variables');
    }
  }

  // Extract email from text using regex
  extractEmail(text: string): string | null {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const matches = text.match(emailRegex);
    return matches ? matches[0] : null;
  }

  // Extract phone number from text (Swedish and international formats)
  extractPhone(text: string): string | null {
    // Swedish phone patterns: +46, 07, 08, etc.
    const phonePatterns = [
      /\+46\s?[0-9\s-]{8,12}/g,           // +46 70 123 45 67
      /0[0-9]{1,2}[\s-]?[0-9\s-]{6,10}/g, // 070-123 45 67, 08-123 456
      /[0-9]{3}[\s-]?[0-9]{3}[\s-]?[0-9]{2,4}/g // 070 123 4567
    ];

    for (const pattern of phonePatterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Clean up the phone number
        return matches[0].replace(/\s+/g, ' ').trim();
      }
    }
    return null;
  }

  // Detect if user wants to be contacted
  detectContactIntent(message: string, language: 'sv' | 'en'): boolean {
    const lowerMessage = message.toLowerCase();
    
    const swedishTriggers = [
      'kontakta mig', 'ring mig', 'mejla mig', 'hör av er', 'få kontakt',
      'min email', 'mitt telefonnummer', 'nå mig', 'återkoppla',
      'boka tid', 'konsultation', 'träffa', 'prata mer', 'diskutera',
      'offert', 'prisuppgift', 'mer information', 'vill veta mer'
    ];

    const englishTriggers = [
      'contact me', 'call me', 'email me', 'reach out', 'get in touch',
      'my email', 'my phone', 'reach me', 'follow up', 'get back to me',
      'book appointment', 'consultation', 'meet', 'discuss more',
      'quote', 'pricing', 'more information', 'want to know more'
    ];

    const triggers = language === 'sv' ? swedishTriggers : englishTriggers;
    return triggers.some(trigger => lowerMessage.includes(trigger));
  }

  // Send lead data to N8N webhook
  async sendToWebhook(leadData: LeadData): Promise<WebhookResponse> {
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: leadData.email,
          phone: leadData.phone,
          context: leadData.context,
          source: leadData.source,
          sessionId: leadData.sessionId,
          timestamp: leadData.timestamp,
          // Additional metadata
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          url: window.location.href
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, message: result.message };
    } catch (error) {
      console.error('Error sending to webhook:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Process message and capture lead if detected
  async processMessage(
    message: string, 
    language: 'sv' | 'en', 
    sessionId?: string
  ): Promise<{ 
    hasContactIntent: boolean; 
    leadCaptured: boolean; 
    email?: string; 
    phone?: string;
    response?: string;
  }> {
    const hasContactIntent = this.detectContactIntent(message, language);
    
    if (!hasContactIntent) {
      return { hasContactIntent: false, leadCaptured: false };
    }

    const email = this.extractEmail(message);
    const phone = this.extractPhone(message);

    // Only send to webhook if we have contact information
    if (email || phone) {
      const leadData: LeadData = {
        email: email || undefined,
        phone: phone || undefined,
        context: message,
        source: 'chat',
        sessionId,
        timestamp: new Date().toISOString()
      };

      const webhookResult = await this.sendToWebhook(leadData);
      
      if (webhookResult.success) {
        // Save to database as well
        try {
          await this.saveToDatabase(leadData);
        } catch (dbError) {
          console.error('Database save failed:', dbError);
          // Continue even if database save fails
        }

        const response = language === 'sv' 
          ? `Tack! Jag har registrerat din kontaktinformation${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}. Stefan kommer att kontakta dig inom kort för att diskutera dina behov.`
          : `Thank you! I've registered your contact information${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}. Stefan will contact you shortly to discuss your needs.`;

        return {
          hasContactIntent: true,
          leadCaptured: true,
          email: email || undefined,
          phone: phone || undefined,
          response
        };
      } else {
        const response = language === 'sv'
          ? 'Tack för ditt intresse! Det blev ett tekniskt problem, men du kan alltid kontakta Stefan direkt på stefan@axiestudio.se eller +46 735 132 620.'
          : 'Thank you for your interest! There was a technical issue, but you can always contact Stefan directly at stefan@axiestudio.se or +46 735 132 620.';
        
        return {
          hasContactIntent: true,
          leadCaptured: false,
          response
        };
      }
    } else {
      // User wants contact but didn't provide info - ask for it
      const response = language === 'sv'
        ? 'Jag skulle gärna hjälpa dig! Kan du dela din e-postadress eller telefonnummer så kan Stefan kontakta dig för en kostnadsfri konsultation?'
        : 'I\'d be happy to help you! Could you share your email address or phone number so Stefan can contact you for a free consultation?';
      
      return {
        hasContactIntent: true,
        leadCaptured: false,
        response
      };
    }
  }

  // Save lead to Supabase database
  private async saveToDatabase(leadData: LeadData): Promise<void> {
    try {
      const { supabase } = await import('./supabase');
      
      const { error } = await supabase
        .from('email_leads')
        .insert({
          email: leadData.email,
          phone: leadData.phone,
          context: leadData.context,
          source: leadData.source,
          session_id: leadData.sessionId,
          status: 'new'
        });

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const leadCaptureService = new LeadCaptureService();