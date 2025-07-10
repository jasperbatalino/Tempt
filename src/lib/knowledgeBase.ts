// Knowledge Base System for Axie Studio AI Assistant

interface KnowledgeFile {
  name: string;
  content: string;
  keywords: string[];
}

class KnowledgeBase {
  private files: KnowledgeFile[] = [];
  private isLoaded = false;

  async loadKnowledgeBase(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load all knowledge files
      const [securityResponse, companyInfoResponse, servicesResponse] = await Promise.all([
        fetch('/src/data/security.txt'),
        fetch('/src/data/company-info.txt'),
        fetch('/src/data/company-services.txt')
      ]);

      const [securityContent, companyInfoContent, servicesContent] = await Promise.all([
        securityResponse.text(),
        companyInfoResponse.text(),
        servicesResponse.text()
      ]);

      this.files = [
        {
          name: 'security',
          content: securityContent,
          keywords: ['säkerhet', 'regler', 'policy', 'guidelines', 'moderation', 'hate', 'spam', 'inappropriate']
        },
        {
          name: 'company-info',
          content: companyInfoContent,
          keywords: ['axie studio', 'företag', 'om oss', 'mission', 'vision', 'värderingar', 'team', 'kontakt', 'certifiering']
        },
        {
          name: 'services',
          content: servicesContent,
          keywords: ['tjänster', 'service', 'hemsida', 'website', 'app', 'bokning', 'booking', 'onboarding', 'pris', 'kostnad', 'utveckling']
        }
      ];

      this.isLoaded = true;
      console.log('Knowledge base loaded successfully');
    } catch (error) {
      console.error('Error loading knowledge base:', error);
    }
  }

  needsSpecificInformation(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Check if message contains keywords that require specific information
    const triggerKeywords = [
      // Company info triggers
      'axie studio', 'företag', 'om er', 'om oss', 'vem är ni', 'kontakt', 'adress', 'telefon',
      
      // Service triggers  
      'tjänst', 'service', 'pris', 'kostnad', 'hemsida', 'website', 'app', 'utveckling',
      'bokning', 'booking', 'onboarding', 'konsultation',
      
      // Process triggers
      'hur fungerar', 'process', 'leveranstid', 'timeline', 'betalning',
      
      // Technical triggers
      'teknologi', 'platform', 'cms', 'databas', 'hosting', 'domän'
    ];

    return triggerKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  getRelevantContext(message: string): string {
    if (!this.isLoaded) {
      console.warn('Knowledge base not loaded yet');
      return '';
    }

    const lowerMessage = message.toLowerCase();
    let relevantContent = '';

    // Find relevant files based on keywords
    for (const file of this.files) {
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
      const companyFile = this.files.find(f => f.name === 'company-info');
      const servicesFile = this.files.find(f => f.name === 'services');
      
      if (companyFile) {
        relevantContent += `\n=== COMPANY INFORMATION ===\n${companyFile.content}\n`;
      }
      if (servicesFile) {
        relevantContent += `\n=== SERVICES INFORMATION ===\n${servicesFile.content}\n`;
      }
    }

    return relevantContent.trim();
  }

  // Security check for inappropriate content
  checkSecurity(message: string): { isViolation: boolean; reason?: string } {
    const lowerMessage = message.toLowerCase();
    
    const violations = [
      { keywords: ['hate', 'hatar', 'idiot', 'dum', 'korkad'], reason: 'Inappropriate language detected' },
      { keywords: ['spam', 'reklam', 'köp nu', 'gratis pengar'], reason: 'Spam content detected' },
      { keywords: ['personuppgifter', 'personnummer', 'lösenord'], reason: 'Personal information sharing' }
    ];

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