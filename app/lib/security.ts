'use client';

// Sistema de seguridad y validación de datos

// Tipos para validación
interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: Record<string, any>;
}

// Clase para validación y sanitización
export class SecurityValidator {
  private static instance: SecurityValidator;
  private xssPatterns: RegExp[];
  private sqlInjectionPatterns: RegExp[];
  private allowedTags: string[];

  private constructor() {
    // Patrones para detectar XSS
    this.xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
    ];

    // Patrones para detectar inyección SQL
    this.sqlInjectionPatterns = [
      /('|(\-\-)|(;)|(\||\|)|(\*|\*))/gi,
      /(union|select|insert|delete|update|drop|create|alter|exec|execute)/gi,
      /script|javascript|vbscript|onload|onerror|onclick/gi,
    ];

    // Tags HTML permitidos para sanitización
    this.allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'];
  }

  public static getInstance(): SecurityValidator {
    if (!SecurityValidator.instance) {
      SecurityValidator.instance = new SecurityValidator();
    }
    return SecurityValidator.instance;
  }

  // Sanitizar entrada de texto
  public sanitizeText(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remover patrones XSS
    this.xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Escapar caracteres HTML peligrosos
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return sanitized.trim();
  }

  // Sanitizar HTML permitiendo solo tags seguros
  public sanitizeHTML(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    let sanitized = input;

    // Remover scripts y contenido peligroso
    this.xssPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Permitir solo tags seguros
    const allowedTagsPattern = new RegExp(
      `<(?!\/?(?:${this.allowedTags.join('|')})\b)[^>]+>`,
      'gi'
    );
    sanitized = sanitized.replace(allowedTagsPattern, '');

    return sanitized;
  }

  // Validar entrada contra inyección SQL
  public validateSQLInjection(input: string): boolean {
    if (typeof input !== 'string') {
      return true; // No es string, no hay riesgo SQL
    }

    return !this.sqlInjectionPatterns.some(pattern => pattern.test(input));
  }

  // Validar email
  public validateEmail(email: string): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailPattern.test(email);
  }

  // Validar URL
  public validateURL(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  }

  // Validar datos según esquema
  public validateData(data: Record<string, any>, schema: ValidationSchema): ValidationResult {
    const errors: Record<string, string[]> = {};
    const sanitizedData: Record<string, any> = {};

    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors: string[] = [];

      // Verificar campo requerido
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${field} es requerido`);
        continue;
      }

      // Si el campo no es requerido y está vacío, continuar
      if (!rule.required && (value === undefined || value === null || value === '')) {
        sanitizedData[field] = value;
        continue;
      }

      let sanitizedValue = value;

      // Sanitizar si es string
      if (typeof value === 'string') {
        sanitizedValue = this.sanitizeText(value);

        // Validar longitud mínima
        if (rule.minLength && sanitizedValue.length < rule.minLength) {
          fieldErrors.push(`${field} debe tener al menos ${rule.minLength} caracteres`);
        }

        // Validar longitud máxima
        if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
          fieldErrors.push(`${field} no puede tener más de ${rule.maxLength} caracteres`);
        }

        // Validar patrón
        if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
          fieldErrors.push(`${field} tiene un formato inválido`);
        }

        // Validar contra inyección SQL
        if (!this.validateSQLInjection(sanitizedValue)) {
          fieldErrors.push(`${field} contiene caracteres no permitidos`);
        }
      }

      // Validación personalizada
      if (rule.custom) {
        const customResult = rule.custom(sanitizedValue);
        if (typeof customResult === 'string') {
          fieldErrors.push(customResult);
        } else if (!customResult) {
          fieldErrors.push(`${field} no cumple con los criterios de validación`);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      } else {
        sanitizedData[field] = sanitizedValue;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData,
    };
  }

  // Generar token CSRF
  public generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Validar token CSRF
  public validateCSRFToken(token: string, expectedToken: string): boolean {
    if (!token || !expectedToken) {
      return false;
    }
    return token === expectedToken;
  }

  // Escapar caracteres para uso en regex
  public escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Validar entrada de archivo
  public validateFile(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { isValid: boolean; error?: string } {
    const {
      maxSize = 10 * 1024 * 1024, // 10MB por defecto
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    } = options;

    // Validar tamaño
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `El archivo es demasiado grande. Máximo ${maxSize / 1024 / 1024}MB`,
      };
    }

    // Validar tipo MIME
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`,
      };
    }

    // Validar extensión
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return {
        isValid: false,
        error: `Extensión de archivo no permitida. Extensiones permitidas: ${allowedExtensions.join(', ')}`,
      };
    }

    return { isValid: true };
  }
}

// Instancia global del validador
const securityValidator = SecurityValidator.getInstance();

// Funciones de utilidad exportadas
export const sanitizeText = (input: string) => securityValidator.sanitizeText(input);
export const sanitizeHTML = (input: string) => securityValidator.sanitizeHTML(input);
export const validateEmail = (email: string) => securityValidator.validateEmail(email);
export const validateURL = (url: string) => securityValidator.validateURL(url);
export const validateData = (data: Record<string, any>, schema: ValidationSchema) => 
  securityValidator.validateData(data, schema);
export const generateCSRFToken = () => securityValidator.generateCSRFToken();
export const validateCSRFToken = (token: string, expected: string) => 
  securityValidator.validateCSRFToken(token, expected);
export const validateFile = (file: File, options?: any) => 
  securityValidator.validateFile(file, options);

// Hook para usar validación en componentes React
export function useSecurityValidator() {
  return {
    sanitizeText,
    sanitizeHTML,
    validateEmail,
    validateURL,
    validateData,
    generateCSRFToken,
    validateCSRFToken,
    validateFile,
  };
}

// Middleware de seguridad para formularios
export function createSecureForm<T extends Record<string, any>>(
  schema: ValidationSchema,
  onSubmit: (data: T) => void | Promise<void>
) {
  return async (formData: T) => {
    const validation = validateData(formData, schema);
    
    if (!validation.isValid) {
      throw new Error(`Errores de validación: ${JSON.stringify(validation.errors)}`);
    }

    await onSubmit(validation.sanitizedData as T);
  };
}

// Configuración de Content Security Policy
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'connect-src': ["'self'", 'https://api.pandascore.co', 'https://vercel.live'],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': [],
};

// Generar string CSP
export function generateCSPString(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

export default SecurityValidator;
export type { ValidationRule, ValidationSchema, ValidationResult };