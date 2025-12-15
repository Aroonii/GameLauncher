import { Game } from '../types';

// JSON Schema validation and input sanitization utilities

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedData?: any;
}

// Game schema definition
const GAME_SCHEMA = {
  type: 'object',
  required: ['id', 'title', 'image', 'url'],
  properties: {
    id: { type: 'string', minLength: 1, maxLength: 100 },
    title: { type: 'string', minLength: 1, maxLength: 200 },
    image: { type: 'string', minLength: 1, maxLength: 500 },
    url: { type: 'string', minLength: 1, maxLength: 500 },
    preferredOrientation: { 
      type: 'string', 
      enum: ['portrait', 'landscape'],
      optional: true 
    },
    category: { type: 'string', maxLength: 50, optional: true },
    description: { type: 'string', maxLength: 1000, optional: true },
    enabled: { type: 'boolean', optional: true },
    disabledReason: { type: 'string', maxLength: 500, optional: true },
  },
};

// Games catalog schema (array of games)
const CATALOG_SCHEMA = {
  type: 'array',
  minItems: 0,
  maxItems: 1000,
  items: GAME_SCHEMA,
};

class SchemaValidator {
  // XSS prevention patterns
  private readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^>]*>/gi,
    /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
  ];

  // URL validation patterns
  private readonly ALLOWED_URL_PROTOCOLS = ['https:', 'http:'];
  private readonly DANGEROUS_URL_PATTERNS = [
    /javascript:/gi,
    /vbscript:/gi,
    /data:/gi,
    /file:/gi,
    /ftp:/gi,
  ];

  /**
   * Validate and sanitize a single game object
   */
  validateGame(gameData: any): ValidationResult {
    try {
      const errors: string[] = [];
      
      if (!gameData || typeof gameData !== 'object') {
        return {
          isValid: false,
          errors: ['Game must be an object'],
        };
      }

      // Validate required fields
      const requiredFields = GAME_SCHEMA.required;
      for (const field of requiredFields) {
        if (!gameData[field]) {
          errors.push(`Missing required field: ${field}`);
        } else if (typeof gameData[field] !== 'string') {
          errors.push(`Field ${field} must be a string`);
        }
      }

      if (errors.length > 0) {
        return { isValid: false, errors };
      }

      // Sanitize and validate each field
      const sanitizedGame: Partial<Game> = {};

      // Validate and sanitize ID
      sanitizedGame.id = this.sanitizeString(gameData.id, 100);
      if (!sanitizedGame.id) {
        errors.push('Invalid or unsafe ID');
      }

      // Validate and sanitize title
      sanitizedGame.title = this.sanitizeString(gameData.title, 200);
      if (!sanitizedGame.title) {
        errors.push('Invalid or unsafe title');
      }

      // Validate and sanitize image URL
      const imageUrlValidation = this.validateAndSanitizeUrl(gameData.image);
      if (!imageUrlValidation.isValid) {
        errors.push(`Invalid image URL: ${imageUrlValidation.errors.join(', ')}`);
      } else {
        sanitizedGame.image = imageUrlValidation.sanitizedUrl!;
      }

      // Validate and sanitize game URL
      const gameUrlValidation = this.validateAndSanitizeUrl(gameData.url);
      if (!gameUrlValidation.isValid) {
        errors.push(`Invalid game URL: ${gameUrlValidation.errors.join(', ')}`);
      } else {
        sanitizedGame.url = gameUrlValidation.sanitizedUrl!;
      }

      // Validate optional fields
      if (gameData.preferredOrientation) {
        if (['portrait', 'landscape'].includes(gameData.preferredOrientation)) {
          sanitizedGame.preferredOrientation = gameData.preferredOrientation;
        } else {
          errors.push('Invalid preferredOrientation, must be "portrait" or "landscape"');
        }
      }

      if (gameData.category) {
        sanitizedGame.category = this.sanitizeString(gameData.category, 50);
        if (!sanitizedGame.category) {
          errors.push('Invalid or unsafe category');
        }
      }

      if (gameData.description) {
        sanitizedGame.description = this.sanitizeString(gameData.description, 1000);
        if (!sanitizedGame.description) {
          errors.push('Invalid or unsafe description');
        }
      }

      // Preserve enabled flag (defaults to true if not specified)
      if (typeof gameData.enabled === 'boolean') {
        (sanitizedGame as any).enabled = gameData.enabled;
      }

      // Preserve disabled reason if game is disabled
      if (gameData.disabledReason) {
        (sanitizedGame as any).disabledReason = this.sanitizeString(gameData.disabledReason, 500);
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedData: sanitizedGame as Game,
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * Validate and sanitize a games catalog
   */
  validateCatalog(catalogData: any): ValidationResult {
    try {
      if (!Array.isArray(catalogData)) {
        return {
          isValid: false,
          errors: ['Catalog must be an array'],
        };
      }

      if (catalogData.length > CATALOG_SCHEMA.maxItems!) {
        return {
          isValid: false,
          errors: [`Catalog too large: ${catalogData.length} items (max: ${CATALOG_SCHEMA.maxItems})`],
        };
      }

      const sanitizedGames: Game[] = [];
      const allErrors: string[] = [];

      for (let i = 0; i < catalogData.length; i++) {
        const gameValidation = this.validateGame(catalogData[i]);
        
        if (gameValidation.isValid && gameValidation.sanitizedData) {
          sanitizedGames.push(gameValidation.sanitizedData);
        } else {
          allErrors.push(`Game ${i}: ${gameValidation.errors.join(', ')}`);
        }
      }

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        sanitizedData: sanitizedGames,
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`Catalog validation error: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * Sanitize a string input
   */
  private sanitizeString(input: string, maxLength: number): string | undefined {
    try {
      if (typeof input !== 'string') {
        return undefined;
      }

      // Check for XSS patterns
      for (const pattern of this.XSS_PATTERNS) {
        if (pattern.test(input)) {
          console.warn('XSS pattern detected in string input:', input.substring(0, 50));
          return undefined;
        }
      }

      // Basic sanitization
      let sanitized = input
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
        .substring(0, maxLength);

      // Ensure it's not empty after sanitization
      if (sanitized.length === 0) {
        return undefined;
      }

      return sanitized;
    } catch (error) {
      console.error('Error sanitizing string:', error);
      return undefined;
    }
  }

  /**
   * Validate and sanitize a URL
   */
  private validateAndSanitizeUrl(url: string): { isValid: boolean; errors: string[]; sanitizedUrl?: string } {
    try {
      if (typeof url !== 'string' || url.trim().length === 0) {
        return {
          isValid: false,
          errors: ['URL must be a non-empty string'],
        };
      }

      const trimmedUrl = url.trim();
      
      // Check for dangerous patterns
      for (const pattern of this.DANGEROUS_URL_PATTERNS) {
        if (pattern.test(trimmedUrl)) {
          return {
            isValid: false,
            errors: ['URL contains dangerous protocol or pattern'],
          };
        }
      }

      // Parse URL
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(trimmedUrl);
      } catch (parseError) {
        return {
          isValid: false,
          errors: ['Invalid URL format'],
        };
      }

      // Validate protocol
      if (!this.ALLOWED_URL_PROTOCOLS.includes(parsedUrl.protocol)) {
        return {
          isValid: false,
          errors: [`Unsupported protocol: ${parsedUrl.protocol}. Allowed: ${this.ALLOWED_URL_PROTOCOLS.join(', ')}`],
        };
      }

      // Validate hostname
      if (!parsedUrl.hostname || parsedUrl.hostname.length === 0) {
        return {
          isValid: false,
          errors: ['URL must have a valid hostname'],
        };
      }

      // Additional security checks
      if (parsedUrl.hostname === 'localhost' || parsedUrl.hostname.startsWith('127.')) {
        return {
          isValid: false,
          errors: ['Localhost URLs are not allowed'],
        };
      }

      if (parsedUrl.hostname.includes('..') || parsedUrl.pathname.includes('..')) {
        return {
          isValid: false,
          errors: ['URLs with path traversal patterns are not allowed'],
        };
      }

      return {
        isValid: true,
        errors: [],
        sanitizedUrl: parsedUrl.toString(),
      };

    } catch (error) {
      return {
        isValid: false,
        errors: [`URL validation error: ${error instanceof Error ? error.message : String(error)}`],
      };
    }
  }

  /**
   * Validate content type for remote resources
   */
  validateContentType(contentType: string | null, expectedTypes: string[]): boolean {
    if (!contentType) {
      return false;
    }

    const normalizedContentType = contentType.toLowerCase().split(';')[0].trim();
    return expectedTypes.some(type => normalizedContentType.includes(type.toLowerCase()));
  }

  /**
   * Sanitize HTML content (basic implementation)
   */
  sanitizeHtml(html: string): string {
    if (typeof html !== 'string') {
      return '';
    }

    // Remove all script tags and their content
    let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous tags
    const dangerousTags = ['iframe', 'object', 'embed', 'form', 'link', 'meta'];
    for (const tag of dangerousTags) {
      const regex = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    }

    // Remove event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\son\w+\s*=\s*[^"'\s>]+/gi, '');

    return sanitized;
  }

  /**
   * Generate content security hash for verification
   */
  generateContentHash(content: string): string {
    // Simple hash for content verification
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const schemaValidator = new SchemaValidator();