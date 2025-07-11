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
        securitySvResponse,
        contextSecurityResponse,
        companyInfoSvResponse,
        servicesSvResponse
      ] = await Promise.all([
        fetch('/src/data/security-sv.txt'),
        fetch('/src/data/context-security.txt'),
        fetch('/src/data/company-info-sv.txt'),
        fetch('/src/data/company-services-sv.txt')
      ]);

      const [
        securitySvContent,
        contextSecurityContent,
        companyInfoSvContent,
        servicesSvContent
      ] = await Promise.all([
        securitySvResponse.text(),
        contextSecurityResponse.text(),
        companyInfoSvResponse.text(),
        servicesSvResponse.text()
      ]);

      this.files = [
        // Swedish files only
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
        // Context security (universal)
        {
          name: 'context-security',
          content: contextSecurityContent,
          keywords: ['context', 'redirect', 'off-topic', 'focus', 'business', 'axie studio', 'services'],
          language: 'sv' // Default, but applies to both languages
        }
      ];

      this.isLoaded = true;
      console.log('Swedish knowledge base loaded successfully');
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  // Always return Swedish since we only support Swedish now
  detectLanguage(message: string): 'sv' {
    return 'sv';
  }

  needsSpecificInformation(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Swedish keywords only
    const swedishTriggers = [
      'axie studio', 'företag', 'om er', 'om oss', 'vem är ni', 'kontakt', 'adress', 'telefon',
      'tjänst', 'service', 'pris', 'kostnad', 'hemsida', 'website', 'app', 'utveckling',
      'bokning', 'booking', 'onboarding', 'konsultation',
      'hur fungerar', 'process', 'leveranstid', 'timeline', 'betalning',
      'teknologi', 'platform', 'cms', 'databas', 'hosting', 'domän'
    ];

    return swedishTriggers.some(keyword => lowerMessage.includes(keyword));
  }

  getRelevantContext(message: string): string {
    if (!this.isLoaded) {
      console.warn('Knowledge base not loaded yet');
      return '';
    }

    const lowerMessage = message.toLowerCase();
    let relevantContent = '';

    // Find relevant files based on keywords (Swedish only)
    const languageFiles = this.files.filter(file => file.language === 'sv');
    
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
    if (!relevantContent && this.needsSpecificInformation(message)) {
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
  checkSecurity(message: string): { isViolation: boolean; reason?: string } {
    const lowerMessage = message.toLowerCase();
    
    const swedishViolations = [
      { keywords: ['hat', 'hatar', 'idiot', 'dum', 'korkad'], reason: 'Inappropriate language detected' },
      { keywords: ['spam', 'reklam', 'köp nu', 'gratis pengar'], reason: 'Spam content detected' },
      { keywords: ['personuppgifter', 'personnummer', 'lösenord'], reason: 'Personal information sharing' }
    ];

    const violations = swedishViolations;

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