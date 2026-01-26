// Comprehensive validation utilities

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export const validateField = (value: any, rules: ValidationRule): string | null => {
  // Required validation
  if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
    return rules.message || 'This field is required';
  }

  // Skip other validations if field is empty and not required
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    // Min length validation
    if (rules.minLength && value.length < rules.minLength) {
      return rules.message || `Must be at least ${rules.minLength} characters`;
    }

    // Max length validation
    if (rules.maxLength && value.length > rules.maxLength) {
      return rules.message || `Must be no more than ${rules.maxLength} characters`;
    }

    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return rules.message || 'Invalid format';
    }
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value);
  }

  return null;
};

export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationResult => {
  const errors: Record<string, string> = {};

  Object.keys(rules).forEach(field => {
    const error = validateField(data[field], rules[field]);
    if (error) {
      errors[field] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Common validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  rNumber: /^R\d{8}$/,
  githubUrl: /^https?:\/\/(www\.)?github\.com\/[a-zA-Z0-9]([a-zA-Z0-9-]){0,38}[a-zA-Z0-9]?$/,
  linkedinUrl: /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
  twitterUrl: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  url: /^https?:\/\/.+/,
};

// Common validation rules
export const VALIDATION_RULES = {
  required: { required: true },
  email: { 
    pattern: VALIDATION_PATTERNS.email, 
    message: 'Please enter a valid email address' 
  },
  rNumber: { 
    pattern: VALIDATION_PATTERNS.rNumber, 
    message: 'R Number must be in format R12345678' 
  },
  githubUrl: { 
    pattern: VALIDATION_PATTERNS.githubUrl, 
    message: 'Please enter a valid GitHub URL' 
  },
  linkedinUrl: { 
    pattern: VALIDATION_PATTERNS.linkedinUrl, 
    message: 'Please enter a valid LinkedIn URL' 
  },
  twitterUrl: { 
    pattern: VALIDATION_PATTERNS.twitterUrl, 
    message: 'Please enter a valid X/Twitter URL' 
  },
  name: { 
    minLength: 1, 
    maxLength: 50, 
    message: 'Name must be between 1 and 50 characters' 
  },
  major: { 
    minLength: 1, 
    maxLength: 100, 
    message: 'Major must be between 1 and 100 characters' 
  },
  aspiredPosition: { 
    minLength: 1, 
    maxLength: 100, 
    message: 'Aspired position must be between 1 and 100 characters' 
  },
};

// File validation utilities
export const validateFile = (file: File, options: {
  maxSize?: number;
  allowedTypes?: string[];
  allowedExtensions?: string[];
}): string | null => {
  const { maxSize, allowedTypes, allowedExtensions } = options;

  // Size validation
  if (maxSize && file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return `File size must be less than ${maxSizeMB}MB`;
  }

  // Type validation
  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
  }

  // Extension validation
  if (allowedExtensions) {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`;
    }
  }

  return null;
};

// Real-time validation hook
export const useRealTimeValidation = (
  value: any,
  rules: ValidationRule,
  debounceMs: number = 300
) => {
  const [error, setError] = React.useState<string | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  React.useEffect(() => {
    setIsValidating(true);
    const timer = setTimeout(() => {
      const validationError = validateField(value, rules);
      setError(validationError);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, rules, debounceMs]);

  return { error, isValidating };
};