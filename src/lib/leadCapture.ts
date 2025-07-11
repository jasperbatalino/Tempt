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
  private webhookUrls: string[];

  constructor() {
    // Production and test webhook URLs
    this.webhookUrls = [
      'https://asdfasfdsvd.app.n8n.cloud/webhook/b9ba15bd-54b9-45d4-97ca-cdb31437ea11',
      'https://asdfasfdsvd.app.n8n.cloud/webhook-test/b9ba15bd-54b9-45d4-97ca-cdb31437ea11'
    ];
    
    if (!this.webhookUrls.length) {
      console.error('N8N Webhook URL not configured');
      throw new Error('N8N Webhook URL missing from environment variables');
    }
    
    console.log('N8N Webhook URLs configured:', this.webhookUrls);
  }

  // Extract email from text using regex
  extractEmail(text: string): string | null {
    // Enhanced email regex to catch more formats including Gmail
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi;
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
      'min email', 'mitt telefonnummer', 'nå mig', 'återkoppla', 'genom',
      'boka tid', 'konsultation', 'träffa', 'prata mer', 'diskutera',
      'offert', 'prisuppgift', 'mer information', 'vill veta mer',
      'kan du kontakta', 'kontakta mig genom'
    ];

    const englishTriggers = [
      'contact me', 'call me', 'email me', 'reach out', 'get in touch',
      'my email', 'my phone', 'reach me', 'follow up', 'get back to me', 'through',
      'book appointment', 'consultation', 'meet', 'discuss more',
      'quote', 'pricing', 'more information', 'want to know more',
      'can you contact', 'contact me through'
    ];

    const triggers = language === 'sv' ? swedishTriggers : englishTriggers;
    return triggers.some(trigger => lowerMessage.includes(trigger));
  }

  // Send lead data to both N8N webhooks
  async sendToWebhooks(leadData: LeadData): Promise<WebhookResponse & { n8nResponse?: string }> {
    try {
      const webhookData = {
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
      };

      // Send to both webhooks simultaneously
      const webhookPromises = this.webhookUrls.map(async (url, index) => {
        console.log(`Sending lead to webhook: ${url}`);
        
        // Use POST request with JSON body for N8N webhooks
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(webhookData)
        });

        if (!response.ok) {
          console.error(`Webhook ${url} failed: ${response.status}`);
          return { success: false, url, status: response.status, responseText: '' };
        }

        // Get response text for N8N confirmation
        const responseText = await response.text();
        console.log(`Webhook ${url} success`);
        return { success: true, url, status: response.status, responseText, isProduction: index === 0 };
      });

      const results = await Promise.allSettled(webhookPromises);
      const successResults = results.filter(r => r.status === 'fulfilled' && r.value.success);
      const successCount = successResults.length;
      
      if (successCount > 0) {
        console.log(`${successCount}/${this.webhookUrls.length} webhooks succeeded`);
        
        // Get N8N response from production webhook (first one)
        const productionResult = successResults.find(r => r.status === 'fulfilled' && r.value.isProduction);
        const n8nResponse = productionResult?.status === 'fulfilled' ? productionResult.value.responseText : undefined;
        
        return { 
          success: true, 
          message: `Lead sent to ${successCount} webhook(s)`,
          n8nResponse 
        };
      } else {
        throw new Error('All webhooks failed');
      }
    } catch (error) {
      console.error('Error sending to webhooks:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown webhook error',
        n8nResponse: undefined
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

      const webhookResult = await this.sendToWebhooks(leadData);
      
      if (webhookResult.success) {
        // Save to database as well
        try {
          await this.saveToDatabase(leadData);
        } catch (dbError) {
          console.error('Database save failed:', dbError);
          // Continue even if database save fails
        }

        const response = language === 'sv' 
          ? `Perfekt! Tack för din kontaktinformation${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}. Vi kommer att kontakta dig så snart som möjligt för att diskutera dina behov. Vill du veta mer om våra tjänster medan du väntar? Vi erbjuder webbplatser, bokningssystem, appar och kompletta digitala lösningar.`
          : `Perfect! Thank you for your contact information${email ? ` (${email})` : ''}${phone ? ` (${phone})` : ''}. We will contact you as soon as possible to discuss your needs. Would you like to know more about our services while you wait? We offer websites, booking systems, apps, and complete digital solutions.`;

        return {
          hasContactIntent: true,
          leadCaptured: true,
          email: email || undefined,
          phone: phone || undefined,
          response,
          n8nResponse: webhookResult.n8nResponse
        };
      } else {
        const response = language === 'sv'
          ? 'Tack för ditt intresse! Vi kommer att kontakta dig så snart som möjligt. Du kan också kontakta Stefan direkt på stefan@axiestudio.se eller +46 735 132 620. Vill du veta mer om våra tjänster medan du väntar?'
          : 'Thank you for your interest! We will contact you as soon as possible. You can also contact Stefan directly at stefan@axiestudio.se or +46 735 132 620. Would you like to know more about our services while you wait?';
        
        return {
          hasContactIntent: true,
          leadCaptured: false,
          response
        };
      }
    } else {
      // User wants contact but didn't provide info - ask for it
      const response = language === 'sv'
        ? 'Absolut! Jag skulle gärna hjälpa dig. Kan du dela din e-postadress eller telefonnummer så kan vi kontakta dig så snart som möjligt för en kostnadsfri konsultation?'
        : 'Absolutely! I\'d be happy to help you. Could you share your email address or phone number so we can contact you as soon as possible for a free consultation?';
      
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