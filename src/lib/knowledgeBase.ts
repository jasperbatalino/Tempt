// Knowledge Base System for Axie Studio AI Assistant

interface KnowledgeFile {
  name: string;
  content: string;
  keywords: string[];
  language: 'sv' | 'en';
}

class KnowledgeBase {
  private files: KnowledgeFile[] = [];
  private isLoaded = false;

  async loadKnowledgeBase(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load all knowledge files for both languages
      const [
        securitySvResponse, securityEnResponse,
        contextSecurityResponse,
        companyInfoSvResponse, companyInfoEnResponse,
        servicesSvResponse, servicesEnResponse
      ] = await Promise.all([
        fetch('/src/data/security-sv.txt'),
        fetch('/src/data/security-en.txt'),
        fetch('/src/data/context-security.txt'),
        fetch('/src/data/company-info-sv.txt'),
        fetch('/src/data/company-info-en.txt'),
        fetch('/src/data/company-services-sv.txt'),
        fetch('/src/data/company-services-en.txt')
      ]);

      const [
        securitySvContent, securityEnContent,
        contextSecurityContent,
        companyInfoSvContent, companyInfoEnContent,
        servicesSvContent, servicesEnContent
      ] = await Promise.all([
        securitySvResponse.text(),
        securityEnResponse.text(),
        contextSecurityResponse.text(),
        companyInfoSvResponse.text(),
        companyInfoEnResponse.text(),
        servicesSvResponse.text(),
        servicesEnResponse.text()
      ]);

      this.files = [
        // Swedish files
        {
          name: 'security',
          content: securitySvContent,
          keywords: ['säkerhet', 'regler', 'policy', 'riktlinjer', 'moderering', 'hat', 'spam', 'olämpligt'],
          language: 'sv'
        },
        {
          name: 'company-info',
          content: companyInfoSvContent,
          keywords: ['axie studio', 'företag', 'om oss', 'mission', 'vision', 'värderingar', 'team', 'kontakt', 'certifiering'],
          language: 'sv'
        },
        {
          name: 'services',
          content: servicesSvContent,
          keywords: ['tjänster', 'service', 'hemsida', 'website', 'app', 'bokning', 'booking', 'onboarding', 'pris', 'kostnad', 'utveckling'],
          language: 'sv'
        },
        // English files
        {
          name: 'security',
          content: securityEnContent,
          keywords: ['security', 'rules', 'policy', 'guidelines', 'moderation', 'hate', 'spam', 'inappropriate'],
          language: 'en'
        },
        // Context security (universal)
        {
          name: 'context-security',
          content: contextSecurityContent,
          keywords: ['context', 'redirect', 'off-topic', 'focus', 'business', 'axie studio', 'services'],
          language: 'sv' // Default, but applies to both languages
        },
        {
          name: 'company-info',
          content: companyInfoEnContent,
          keywords: ['axie studio', 'company', 'about us', 'mission', 'vision', 'values', 'team', 'contact', 'certification'],
          language: 'en'
        },
        {
          name: 'services',
          content: servicesEnContent,
          keywords: ['services', 'service', 'website', 'app', 'booking', 'onboarding', 'price', 'cost', 'development'],
          language: 'en'
        }
      ];

      this.isLoaded = true;
      console.log('Multilingual knowledge base loaded successfully');
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  detectLanguage(message: string): 'sv' | 'en' {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced Swedish indicators
    const swedishWords = [
      // Greetings & common words
      'hej', 'tack', 'tjena', 'hallå', 'morsning',
      // Grammar words
      'och', 'är', 'för', 'med', 'på', 'av', 'till', 'från', 'som', 'det', 'att', 'en', 'ett',
      // Question words
      'vad', 'hur', 'när', 'var', 'varför', 'vilken', 'vilket',
      // Modal verbs
      'kan', 'vill', 'ska', 'skulle', 'måste', 'bör',
      // Business terms
      'tjänst', 'företag', 'pris', 'kostnad', 'hemsida', 'bokning', 'webbplats',
      // Swedish specific
      'också', 'kanske', 'alltså', 'eller', 'bara', 'inte', 'mycket', 'lite',
      // Actions
      'boka', 'kontakta', 'mejla', 'ring', 'träffa', 'diskutera'
    ];
    
    // Enhanced English indicators  
    const englishWords = [
      // Greetings & common words
      'hello', 'hi', 'hey', 'thank', 'thanks', 'please',
      // Grammar words
      'and', 'the', 'for', 'with', 'from', 'to', 'of', 'in', 'on', 'at', 'by', 'is', 'are', 'was', 'were',
      // Question words
      'what', 'how', 'when', 'where', 'why', 'which', 'who',
      // Modal verbs
      'can', 'will', 'would', 'should', 'could', 'must', 'might',
      // Business terms
      'service', 'company', 'price', 'cost', 'website', 'booking', 'development',
      // English specific
      'also', 'maybe', 'just', 'only', 'very', 'much', 'little', 'about',
      // Actions
      'book', 'contact', 'email', 'call', 'meet', 'discuss', 'help'
    ];

    let swedishScore = 0;
    let englishScore = 0;

    swedishWords.forEach(word => {
      if (lowerMessage.includes(word)) swedishScore++;
    });

    englishWords.forEach(word => {
      if (lowerMessage.includes(word)) englishScore++;
    });

    console.log(`🌍 LANGUAGE DETECTION - Swedish: ${swedishScore}, English: ${englishScore}, Message: "${lowerMessage}"`);
    
    // Need clear majority for English, otherwise default to Swedish
    return englishScore > (swedishScore + 1) ? 'en' : 'sv';
  }

  needsSpecificInformation(message: string, language: 'sv' | 'en'): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Swedish keywords
    const swedishTriggers = [
      'axie studio', 'företag', 'om er', 'om oss', 'vem är ni', 'kontakt', 'adress', 'telefon',
      'tjänst', 'service', 'pris', 'kostnad', 'hemsida', 'website', 'app', 'utveckling',
      'bokning', 'booking', 'onboarding', 'konsultation',
      'hur fungerar', 'process', 'leveranstid', 'timeline', 'betalning',
      'teknologi', 'platform', 'cms', 'databas', 'hosting', 'domän'
    ];

    // English keywords
    const englishTriggers = [
      'axie studio', 'company', 'about you', 'about us', 'who are you', 'contact', 'address', 'phone',
      'service', 'services', 'price', 'cost', 'website', 'app', 'development',
      'booking', 'onboarding', 'consultation',
      'how does', 'process', 'delivery time', 'timeline', 'payment',
      'technology', 'platform', 'cms', 'database', 'hosting', 'domain'
    ];

    const triggers = language === 'sv' ? swedishTriggers : englishTriggers;
    return triggers.some(keyword => lowerMessage.includes(keyword));
  }

  getRelevantContext(message: string, language: 'sv' | 'en'): string {
    if (!this.isLoaded) {
      console.warn('Knowledge base not loaded yet');
      return '';
    }

    const lowerMessage = message.toLowerCase();
    let relevantContent = '';

    // Find relevant files based on keywords and language
    const languageFiles = this.files.filter(file => file.language === language);
    
    for (const file of languageFiles) {
      const hasRelevantKeywords = file.keywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      );

      if (hasRelevantKeywords) {
        relevantContent += `\n=== ${file.name.toUpperCase()} INFORMATION ===\n`;
        relevantContent += file.content;
        relevantContent += '\n';
      }
    }

    // If no specific keywords found but needs information, include company basics
    if (!relevantContent && this.needsSpecificInformation(message, language)) {
      const companyFile = languageFiles.find(f => f.name === 'company-info');
      const servicesFile = languageFiles.find(f => f.name === 'services');
      
      if (companyFile) {
        relevantContent += `\n=== COMPANY INFORMATION ===\n${companyFile.content}\n`;
      }
      if (servicesFile) {
        relevantContent += `\n=== SERVICES INFORMATION ===\n${servicesFile.content}\n`;
      }
    }

    return relevantContent.trim();
  }

  getContextSecurity(): string {
    if (!this.isLoaded) {
      console.warn('Knowledge base not loaded yet');
      return '';
    }

    const contextFile = this.files.find(f => f.name === 'context-security');
    return contextFile ? contextFile.content : '';
  }

  // Security check for inappropriate content
  checkSecurity(message: string, language: 'sv' | 'en'): { isViolation: boolean; reason?: string } {
    const lowerMessage = message.toLowerCase();
    
    const swedishViolations = [
      { keywords: ['hat', 'hatar', 'idiot', 'dum', 'korkad'], reason: 'Inappropriate language detected' },
      { keywords: ['spam', 'reklam', 'köp nu', 'gratis pengar'], reason: 'Spam content detected' },
      { keywords: ['personuppgifter', 'personnummer', 'lösenord'], reason: 'Personal information sharing' }
    ];

    const englishViolations = [
      { keywords: ['hate', 'stupid', 'idiot', 'dumb'], reason: 'Inappropriate language detected' },
      { keywords: ['spam', 'buy now', 'free money', 'advertisement'], reason: 'Spam content detected' },
      { keywords: ['personal data', 'social security', 'password'], reason: 'Personal information sharing' }
    ];

    const violations = language === 'sv' ? swedishViolations : englishViolations;

    for (const violation of violations) {
      if (violation.keywords.some(keyword => lowerMessage.includes(keyword))) {
        return { isViolation: true, reason: violation.reason };
      }
    }

    return { isViolation: false };
  }
}

// Create singleton instance
export const knowledgeBase = new KnowledgeBase();

// Initialize knowledge base
knowledgeBase.loadKnowledgeBase();