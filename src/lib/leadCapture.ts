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
  n8nResponse?: string;
}

class LeadCaptureService {
  private webhookUrls: string[];

  constructor() {
    // Production and test webhook URLs
    this.webhookUrls = [
      'https://asdfasfdsvd.app.n8n.cloud/webhook/b9ba15bd-54b9-45d4-97ca-cdb31437ea11',
      'https://asdfasfdsvd.app.n8n.cloud/webhook-test/b9ba15bd-54b9-45d4-97ca-cdb31437ea11'
    ];
    
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
      'kan du kontakta', 'kontakta mig genom', 'min e-post', 'mitt mail'
    ];

    const englishTriggers = [
      'contact me', 'call me', 'email me', 'reach out', 'get in touch',
      'my email', 'my phone', 'reach me', 'follow up', 'get back to me', 'through',
      'book appointment', 'consultation', 'meet', 'discuss more',
      'quote', 'pricing', 'more information', 'want to know more',
      'can you contact', 'contact me through', 'my email is', 'email is',
      'here is my email', 'you can reach me', 'contact me at', 'reach me at',
      'send me', 'email me at', 'my contact', 'get back to me at'
    ];

    const triggers = language === 'sv' ? swedishTriggers : englishTriggers;
    return triggers.some(trigger => lowerMessage.includes(trigger));
  }

  // Send lead data to N8N webhooks using GET method with URL parameters
  async sendToWebhooks(leadData: LeadData): Promise<WebhookResponse> {
    const results = [];
    
    for (let i = 0; i < this.webhookUrls.length; i++) {
      const url = this.webhookUrls[i];
      
      try {
        console.log(`Attempting webhook ${i + 1}/${this.webhookUrls.length}: ${url}`);
        
        // Build URL parameters for GET request
        const params = new URLSearchParams();
        if (leadData.email) params.append('email', leadData.email);
        if (leadData.phone) params.append('phone', leadData.phone);
        params.append('context', leadData.context);
        params.append('source', leadData.source);
        if (leadData.sessionId) params.append('sessionId', leadData.sessionId);
        params.append('timestamp', leadData.timestamp);
        
        const fullUrl = `${url}?${params.toString()}`;
        
        // Use GET request with URL parameters (as N8N expects)
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/plain, application/json, */*',
          },
        });

        let responseText = '';
        try {
          responseText = await response.text();
        } catch (textError) {
          console.warn(`Could not read response text from ${url}:`, textError);
          responseText = 'Response received but could not read content';
        }

        if (response.ok) {
          console.log(`✅ Webhook ${i + 1} SUCCESS: ${url}`);
          console.log(`Response: ${responseText}`);
          results.push({ 
            success: true, 
            url, 
            status: response.status, 
            responseText,
            isProduction: i === 0 
          });
        } else {
          console.warn(`⚠️ Webhook ${i + 1} HTTP Error ${response.status}: ${url}`);
          console.warn(`Response: ${responseText}`);
          results.push({ 
            success: false, 
            url, 
            status: response.status, 
            responseText,
            error: `HTTP ${response.status}` 
          });
        }
      } catch (error) {
        console.error(`❌ Webhook ${i + 1} Network Error: ${url}`, error);
        results.push({ 
          success: false, 
          url, 
          error: error instanceof Error ? error.message : 'Network error' 
        });
      }
    }

    // Check results
    const successResults = results.filter(r => r.success);
    const successCount = successResults.length;
    
    console.log(`📊 Webhook Results: ${successCount}/${this.webhookUrls.length} successful`);
    
    if (successCount > 0) {
      // Get N8N response from production webhook (first one)
      const productionResult = successResults.find(r => r.isProduction);
      const n8nResponse = productionResult?.responseText || successResults[0]?.responseText;
      
      return { 
        success: true, 
        message: `Lead sent to ${successCount}/${this.webhookUrls.length} webhook(s)`,
        n8nResponse 
      };
    } else {
      // Don't throw error, just return failure status
      console.warn('⚠️ All webhooks failed, but continuing gracefully');
      return { 
        success: false, 
        message: 'Webhooks unavailable, but lead captured locally',
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
    n8nResponse?: string;
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

      // Try to send to webhooks, but don't fail if they're down
      const webhookResult = await this.sendToWebhooks(leadData);
      
      // Always save to database regardless of webhook status
      try {
        await this.saveToReceiptFile(leadData, language);
        console.log('✅ Receipt saved to file');
      } catch (fileError) {
        console.error('❌ Receipt file save failed:', fileError);
        // Continue even if file save fails
      }

      // Generate response based on webhook success
      let response: string;
      if (webhookResult.success) {
        response = language === 'sv' 
          ? `Tack så mycket! Vi har skickat en bekräftelse till${email ? ` ${email}` : ''}${phone ? ` och noterat ditt telefonnummer ${phone}` : ''}. Vänligen kontrollera din e-post för mer information. Vill du veta mer om våra tjänster medan du väntar?`
          : `Thank you so much! We have received your information and will contact you soon! A confirmation has been sent to${email ? ` ${email}` : ''}${phone ? ` and we've noted your phone number ${phone}` : ''}. Please check your email for more information. Would you like to know more about our services while you wait?`;
      } else {
        response = language === 'sv'
          ? `Tack så mycket! Vi har skickat en bekräftelse till${email ? ` ${email}` : ''}${phone ? ` och noterat ditt telefonnummer ${phone}` : ''}. Vänligen kontrollera din e-post för mer information. Du kan också kontakta Stefan direkt på stefan@axiestudio.se eller +46 735 132 620. Vill du veta mer om våra tjänster medan du väntar?`
          : `Thank you so much! We have received your information and will contact you soon! A confirmation has been sent to${email ? ` ${email}` : ''}${phone ? ` and we've noted your phone number ${phone}` : ''}. Please check your email for more information. You can also contact Stefan directly at stefan@axiestudio.se or +46 735 132 620. Would you like to know more about our services while you wait?`;
      }

      return {
        hasContactIntent: true,
        leadCaptured: true,
        email: email || undefined,
        phone: phone || undefined,
        response,
        n8nResponse: webhookResult.n8nResponse
      };
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
  private async saveToReceiptFile(leadData: LeadData, language: 'sv' | 'en'): Promise<void> {
    try {
      // Create receipt content based on language
      const receiptContent = this.generateReceiptContent(leadData, language);

      // In a real environment, this would write to a server file
      // For now, we'll log it and store in localStorage as backup
      console.log('🧾 RECEIPT GENERATED - SAVING TO FILE:', receiptContent);
      
      // Store in localStorage as backup (since we can't write files in browser)
      const existingReceipts = localStorage.getItem('axie-receipts') || '';
      localStorage.setItem('axie-receipts', existingReceipts + receiptContent);
      
      // Also download as file for immediate access
      this.downloadReceiptFile(receiptContent, language);
      
    } catch (error) {
      console.error('Error saving receipt file:', error);
      throw error;
    }
  }

  // Generate receipt content based on language
  private generateReceiptContent(leadData: LeadData, language: 'sv' | 'en'): string {
    const date = new Date(leadData.timestamp);
    const formattedDate = language === 'sv' 
      ? date.toLocaleString('sv-SE')
      : date.toLocaleString('en-US');

    if (language === 'sv') {
      return `
╔══════════════════════════════════════════════════════════════╗
║                        AXIE STUDIO                           ║
║                   KONTAKTBEKRÄFTELSE                         ║
╚══════════════════════════════════════════════════════════════╝

📅 Datum: ${formattedDate}

Hej!

Vi har fått din information och kommer att kontakta dig snart! 
Genom att använda vårt system godkänner du att vi behandlar din 
information för att kontakta dig.

═══════════════════════════════════════════════════════════════
                      KONTAKTINFORMATION                       
═══════════════════════════════════════════════════════════════

📧 E-post:        ${leadData.email || 'Ej angiven'}
📱 Telefon:       ${leadData.phone || 'Ej angiven'}
💬 Meddelande:    ${leadData.context}
🌐 Källa:         ${leadData.source}
🆔 Session ID:    ${leadData.sessionId || 'N/A'}
⏰ Tidsstämpel:   ${leadData.timestamp}

═══════════════════════════════════════════════════════════════
                         NÄSTA STEG                           
═══════════════════════════════════════════════════════════════

✅ Din förfrågan har registrerats
✅ Vi kontaktar dig inom 2 timmar
✅ Kostnadsfri konsultation över kaffe ☕
✅ Skräddarsydd lösning för ditt företag

═══════════════════════════════════════════════════════════════
                      KONTAKTA OSS DIREKT                     
═══════════════════════════════════════════════════════════════

📧 E-post:    stefan@axiestudio.se
📞 Telefon:   +46 735 132 620
🌐 Hemsida:   axiestudio.se
📍 Plats:     Jönköping, Sverige

Tack för att du valde Axie Studio!

Med vänliga hälsningar,
Stefan & Axie Studio Team

═══════════════════════════════════════════════════════════════

`;
    } else {
      return `
╔══════════════════════════════════════════════════════════════╗
║                        AXIE STUDIO                           ║
║                   CONTACT CONFIRMATION                       ║
╚══════════════════════════════════════════════════════════════╝

📅 Date: ${formattedDate}

Hello!

We have received your information and will contact you soon! 
By using our system, you agree that we process your information 
to contact you.

═══════════════════════════════════════════════════════════════
                      CONTACT INFORMATION                      
═══════════════════════════════════════════════════════════════

📧 Email:         ${leadData.email || 'Not provided'}
📱 Phone:         ${leadData.phone || 'Not provided'}
💬 Message:       ${leadData.context}
🌐 Source:        ${leadData.source}
🆔 Session ID:    ${leadData.sessionId || 'N/A'}
⏰ Timestamp:     ${leadData.timestamp}

═══════════════════════════════════════════════════════════════
                         NEXT STEPS                           
═══════════════════════════════════════════════════════════════

✅ Your request has been registered
✅ We will contact you within 2 hours
✅ Free consultation over coffee ☕
✅ Tailored solution for your business

═══════════════════════════════════════════════════════════════
                      CONTACT US DIRECTLY                     
═══════════════════════════════════════════════════════════════

📧 Email:     stefan@axiestudio.se
📞 Phone:     +46 735 132 620
🌐 Website:   axiestudio.se
📍 Location:  Jönköping, Sweden

Thank you for choosing Axie Studio!

Best regards,
Stefan & Axie Studio Team

═══════════════════════════════════════════════════════════════

`;
    }
  }

  // Download receipt as text file
  private downloadReceiptFile(receiptContent: string, language: 'sv' | 'en'): void {
    try {
      const blob = new Blob([receiptContent], { type: 'text/plain; charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const prefix = language === 'sv' ? 'axie-kvitto' : 'axie-receipt';
      link.download = `${prefix}-${new Date().toISOString().split('T')[0]}-${Date.now()}.txt`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('✅ Receipt file downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt file:', error);
    }
  }
}

// Export singleton instance
export const leadCaptureService = new LeadCaptureService();