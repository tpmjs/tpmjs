/**
 * Data Classification Heuristic Tool for TPMJS
 * Analyzes text to classify data sensitivity using pattern-based heuristics.
 * Detects PII, financial data, health data, and other sensitive information.
 */

import { jsonSchema, tool } from 'ai';

/**
 * Classification levels from least to most sensitive
 */
export type ClassificationLevel = 'public' | 'internal' | 'confidential' | 'restricted';

/**
 * Individual signal detected in the text
 */
export interface DetectionSignal {
  type: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  matches?: number;
}

/**
 * Output interface for data classification
 */
export interface DataClassification {
  classification: ClassificationLevel;
  signals: DetectionSignal[];
  confidence: number;
  summary: {
    totalSignals: number;
    highestSeverity: string;
    categories: string[];
  };
}

type DataClassificationInput = {
  text: string;
};

/**
 * Pattern definitions for different types of sensitive data
 */
const PATTERNS = {
  // Personal Identifiable Information (PII)
  ssn: {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    severity: 'critical' as const,
    type: 'SSN',
    description: 'Social Security Number detected',
  },
  email: {
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    severity: 'medium' as const,
    type: 'Email',
    description: 'Email address detected',
  },
  phone: {
    regex: /\b(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    severity: 'medium' as const,
    type: 'Phone',
    description: 'Phone number detected',
  },

  // Financial Data
  creditCard: {
    regex: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    severity: 'critical' as const,
    type: 'Credit Card',
    description: 'Credit card number pattern detected',
  },
  bankAccount: {
    regex: /\b(?:account|acct)[\s#:]*\d{8,17}\b/gi,
    severity: 'critical' as const,
    type: 'Bank Account',
    description: 'Bank account number detected',
  },
  routingNumber: {
    regex: /\b(?:routing|aba|rtn)[\s#:]*\d{9}\b/gi,
    severity: 'critical' as const,
    type: 'Routing Number',
    description: 'Bank routing number detected',
  },
  salary: {
    regex: /\$[\d,]+(?:\.\d{2})?(?:\s*(?:per|\/)\s*(?:year|month|hour|annum))?/gi,
    severity: 'high' as const,
    type: 'Salary',
    description: 'Salary or compensation information detected',
  },

  // Health Data (HIPAA)
  mrn: {
    regex: /\b(?:mrn|medical record)[\s#:]*\d{6,10}\b/gi,
    severity: 'critical' as const,
    type: 'Medical Record Number',
    description: 'Medical record number detected',
  },
  diagnosis: {
    regex: /\b(?:diagnosis|diagnosed with|condition|disorder|disease):\s*[A-Z]/gi,
    severity: 'high' as const,
    type: 'Medical Diagnosis',
    description: 'Medical diagnosis information detected',
  },
  prescription: {
    regex: /\b(?:prescription|prescribed|medication|rx)[\s:]+\w+/gi,
    severity: 'high' as const,
    type: 'Prescription',
    description: 'Prescription or medication information detected',
  },

  // Government IDs
  passport: {
    regex: /\b(?:passport)[\s#:]*[A-Z0-9]{6,9}\b/gi,
    severity: 'critical' as const,
    type: 'Passport',
    description: 'Passport number detected',
  },
  driverLicense: {
    regex: /\b(?:license|dl)[\s#:]*[A-Z0-9]{7,15}\b/gi,
    severity: 'high' as const,
    type: 'Driver License',
    description: 'Driver license number detected',
  },

  // Authentication Credentials
  apiKey: {
    regex: /\b(?:api[_-]?key|apikey|access[_-]?token)[\s:=]*['"]?[A-Za-z0-9_\-]{20,}['"]?/gi,
    severity: 'critical' as const,
    type: 'API Key',
    description: 'API key or access token detected',
  },
  password: {
    regex: /\b(?:password|passwd|pwd)[\s:=]+[^\s]+/gi,
    severity: 'critical' as const,
    type: 'Password',
    description: 'Password detected',
  },

  // Network/IP Information
  ipAddress: {
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    severity: 'low' as const,
    type: 'IP Address',
    description: 'IP address detected',
  },

  // Personal Data
  dateOfBirth: {
    regex:
      /\b(?:dob|date of birth|birth date)[\s:]*(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/gi,
    severity: 'high' as const,
    type: 'Date of Birth',
    description: 'Date of birth detected',
  },
  address: {
    regex:
      /\b\d+\s+[A-Z][a-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi,
    severity: 'medium' as const,
    type: 'Address',
    description: 'Physical address detected',
  },
};

/**
 * Detects sensitive data patterns in text
 */
function detectPatterns(text: string): DetectionSignal[] {
  const signals: DetectionSignal[] = [];

  for (const [key, pattern] of Object.entries(PATTERNS)) {
    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      signals.push({
        type: pattern.type,
        pattern: key,
        severity: pattern.severity,
        description: pattern.description,
        matches: matches.length,
      });
    }
  }

  return signals;
}

/**
 * Calculates classification level based on detected signals
 */
function calculateClassification(signals: DetectionSignal[]): {
  level: ClassificationLevel;
  confidence: number;
} {
  if (signals.length === 0) {
    return { level: 'public', confidence: 0.95 };
  }

  // Count signals by severity
  const criticalCount = signals.filter((s) => s.severity === 'critical').length;
  const highCount = signals.filter((s) => s.severity === 'high').length;
  const mediumCount = signals.filter((s) => s.severity === 'medium').length;
  const lowCount = signals.filter((s) => s.severity === 'low').length;

  // Classification logic
  if (criticalCount > 0) {
    // Any critical signals = restricted
    const confidence = Math.min(0.95, 0.7 + criticalCount * 0.1);
    return { level: 'restricted', confidence };
  }

  if (highCount >= 2 || (highCount >= 1 && mediumCount >= 1)) {
    // Multiple high severity or high + medium = confidential
    const confidence = Math.min(0.9, 0.65 + (highCount + mediumCount) * 0.05);
    return { level: 'confidential', confidence };
  }

  if (highCount >= 1 || mediumCount >= 2) {
    // Single high or multiple medium = internal
    const confidence = Math.min(0.85, 0.6 + (highCount * 0.1 + mediumCount * 0.05));
    return { level: 'internal', confidence };
  }

  if (mediumCount >= 1 || lowCount >= 3) {
    // Low sensitivity data = internal
    const confidence = Math.min(0.75, 0.5 + (mediumCount * 0.1 + lowCount * 0.02));
    return { level: 'internal', confidence };
  }

  // Only low signals or very few = public
  return { level: 'public', confidence: 0.7 };
}

/**
 * Gets the highest severity level from signals
 */
function getHighestSeverity(signals: DetectionSignal[]): string {
  if (signals.length === 0) return 'none';

  const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
  const maxSeverity = signals.reduce(
    (max, signal) => {
      return severityOrder[signal.severity] > severityOrder[max] ? signal.severity : max;
    },
    'low' as DetectionSignal['severity']
  );

  return maxSeverity;
}

/**
 * Extracts unique categories from signals
 */
function extractCategories(signals: DetectionSignal[]): string[] {
  const categoryMap: Record<string, string> = {
    SSN: 'PII',
    Email: 'PII',
    Phone: 'PII',
    'Date of Birth': 'PII',
    Address: 'PII',
    'Credit Card': 'Financial',
    'Bank Account': 'Financial',
    'Routing Number': 'Financial',
    Salary: 'Financial',
    'Medical Record Number': 'Health',
    'Medical Diagnosis': 'Health',
    Prescription: 'Health',
    Passport: 'Government ID',
    'Driver License': 'Government ID',
    'API Key': 'Credentials',
    Password: 'Credentials',
    'IP Address': 'Technical',
  };

  const categories = new Set<string>();
  for (const signal of signals) {
    const category = categoryMap[signal.type] || 'Other';
    categories.add(category);
  }

  return Array.from(categories).sort();
}

/**
 * Data Classification Heuristic Tool
 * Analyzes text to classify data sensitivity based on pattern detection
 */
export const dataClassificationHeuristic = tool({
  description:
    'Classifies data sensitivity using heuristics to detect PII (personal identifiable information), financial data, health data, and other sensitive patterns. Returns classification level (public/internal/confidential/restricted), detected signals, and confidence score.',
  inputSchema: jsonSchema<DataClassificationInput>({
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'The text content to analyze for sensitive data patterns',
      },
    },
    required: ['text'],
    additionalProperties: false,
  }),
  async execute({ text }): Promise<DataClassification> {
    // Validate input
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Detect patterns
    const signals = detectPatterns(text);

    // Calculate classification
    const { level, confidence } = calculateClassification(signals);

    // Build summary
    const summary = {
      totalSignals: signals.length,
      highestSeverity: getHighestSeverity(signals),
      categories: extractCategories(signals),
    };

    return {
      classification: level,
      signals,
      confidence,
      summary,
    };
  },
});

export default dataClassificationHeuristic;
