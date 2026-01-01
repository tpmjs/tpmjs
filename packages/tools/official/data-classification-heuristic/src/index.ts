/**
 * Data Classification Heuristic Tool for TPMJS
 * Analyzes text to classify data sensitivity using pattern-based heuristics.
 * Detects PII, financial data, health data, and other sensitive information.
 *
 * Domain rule: pii-detection - Detects personally identifiable information (SSN, email, phone, DOB, addresses)
 * Domain rule: hipaa-data-detection - Detects HIPAA-protected health data (MRN, diagnoses, prescriptions)
 * Domain rule: financial-data-detection - Detects financial data (credit cards, bank accounts, routing numbers, salaries)
 * Domain rule: credential-detection - Detects authentication credentials (API keys, passwords, tokens)
 * Domain rule: sensitivity-scoring - Scores data sensitivity from public to restricted based on detected patterns
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
 * Field classification result
 */
export interface FieldClassification {
  fieldName: string;
  classification: ClassificationLevel;
  signals: DetectionSignal[];
  confidence: number;
}

/**
 * Output interface for data classification
 */
export interface DataClassification {
  fields: FieldClassification[];
  overallClassification: ClassificationLevel;
  summary: {
    totalFields: number;
    piiFields: number;
    sensitiveFields: number;
    highestSeverity: string;
    categories: string[];
  };
}

type DataClassificationInput = {
  rows: Array<Record<string, unknown>>;
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

  if (!text || typeof text !== 'string') {
    return signals;
  }

  for (const [key, pattern] of Object.entries(PATTERNS)) {
    try {
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
    } catch (error) {
      // Skip pattern if it fails
      console.warn(`Pattern detection failed for ${key}:`, error);
    }
  }

  return signals;
}

/**
 * Detects sensitive data patterns in field name
 */
function detectFromFieldName(fieldName: string): DetectionSignal[] {
  const signals: DetectionSignal[] = [];
  const lowerName = fieldName.toLowerCase();

  // Check field name patterns
  const namePatterns: Record<
    string,
    { type: string; severity: DetectionSignal['severity']; description: string }
  > = {
    email: { type: 'Email', severity: 'medium', description: 'Email field name detected' },
    phone: { type: 'Phone', severity: 'medium', description: 'Phone field name detected' },
    ssn: { type: 'SSN', severity: 'critical', description: 'SSN field name detected' },
    password: {
      type: 'Password',
      severity: 'critical',
      description: 'Password field name detected',
    },
    credit: {
      type: 'Credit Card',
      severity: 'critical',
      description: 'Credit card field name detected',
    },
    address: { type: 'Address', severity: 'medium', description: 'Address field name detected' },
    dob: {
      type: 'Date of Birth',
      severity: 'high',
      description: 'Date of birth field name detected',
    },
    birth_date: {
      type: 'Date of Birth',
      severity: 'high',
      description: 'Date of birth field name detected',
    },
    salary: { type: 'Salary', severity: 'high', description: 'Salary field name detected' },
  };

  for (const [key, patternInfo] of Object.entries(namePatterns)) {
    if (lowerName.includes(key)) {
      signals.push({
        type: patternInfo.type,
        pattern: `field-name-${key}`,
        severity: patternInfo.severity,
        description: patternInfo.description,
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
 * Analyzes rows of data to classify field sensitivity based on pattern detection
 */
export const dataClassificationHeuristic = tool({
  description:
    'Classifies data field sensitivity using heuristics to detect PII (personal identifiable information), financial data, health data, and other sensitive patterns. Analyzes sample data rows and field names to determine classification levels.',
  inputSchema: jsonSchema<DataClassificationInput>({
    type: 'object',
    properties: {
      rows: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
        },
        description: 'Sample data rows to analyze for sensitive fields',
        minItems: 1,
      },
    },
    required: ['rows'],
    additionalProperties: false,
  }),
  async execute({ rows }): Promise<DataClassification> {
    // Validate input
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error('Rows array is required and must not be empty');
    }

    try {
      // Extract field names from first row
      const firstRow = rows[0];
      if (!firstRow || typeof firstRow !== 'object') {
        throw new Error('Each row must be an object');
      }

      const fieldNames = Object.keys(firstRow);
      const fieldClassifications: FieldClassification[] = [];

      // Analyze each field
      for (const fieldName of fieldNames) {
        const allSignals: DetectionSignal[] = [];

        // Check field name
        const nameSignals = detectFromFieldName(fieldName);
        allSignals.push(...nameSignals);

        // Check values in this field across all rows
        for (const row of rows) {
          const value = row[fieldName];
          if (value != null) {
            const valueStr = String(value);
            const valueSignals = detectPatterns(valueStr);
            allSignals.push(...valueSignals);
          }
        }

        // Remove duplicates based on type
        const uniqueSignals = Array.from(new Map(allSignals.map((s) => [s.type, s])).values());

        // Calculate classification for this field
        const { level, confidence } = calculateClassification(uniqueSignals);

        fieldClassifications.push({
          fieldName,
          classification: level,
          signals: uniqueSignals,
          confidence,
        });
      }

      // Determine overall classification (highest from all fields)
      let overallClassification: ClassificationLevel = 'public';
      const classificationOrder: Record<ClassificationLevel, number> = {
        public: 0,
        internal: 1,
        confidential: 2,
        restricted: 3,
      };

      for (const field of fieldClassifications) {
        if (
          classificationOrder[field.classification] > classificationOrder[overallClassification]
        ) {
          overallClassification = field.classification;
        }
      }

      // Collect all unique signals
      const allSignals = fieldClassifications.flatMap((f) => f.signals);
      const uniqueSignals = Array.from(new Map(allSignals.map((s) => [s.type, s])).values());

      // Build summary
      const piiFields = fieldClassifications.filter(
        (f) => f.classification === 'restricted' || f.classification === 'confidential'
      ).length;

      const sensitiveFields = fieldClassifications.filter(
        (f) => f.classification !== 'public'
      ).length;

      return {
        fields: fieldClassifications,
        overallClassification,
        summary: {
          totalFields: fieldClassifications.length,
          piiFields,
          sensitiveFields,
          highestSeverity: getHighestSeverity(uniqueSignals),
          categories: extractCategories(uniqueSignals),
        },
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Data classification failed: ${error.message}`);
      }
      throw new Error('Data classification failed with unknown error');
    }
  },
});

export default dataClassificationHeuristic;
