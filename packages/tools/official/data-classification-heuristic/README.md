# Data Classification Heuristic Tool

Classifies data sensitivity using pattern-based heuristics to detect PII, financial data, health data, and other sensitive information.

## Installation

```bash
npm install @tpmjs/tools-data-classification-heuristic
```

## Usage

```typescript
import { dataClassificationHeuristic } from '@tpmjs/tools-data-classification-heuristic';

const result = await dataClassificationHeuristic.execute({
  text: "Contact John Doe at john.doe@example.com or call 555-123-4567. SSN: 123-45-6789"
});

console.log(result);
// {
//   classification: 'restricted',
//   signals: [
//     { type: 'Email', severity: 'medium', description: 'Email address detected', matches: 1 },
//     { type: 'Phone', severity: 'medium', description: 'Phone number detected', matches: 1 },
//     { type: 'SSN', severity: 'critical', description: 'Social Security Number detected', matches: 1 }
//   ],
//   confidence: 0.8,
//   summary: {
//     totalSignals: 3,
//     highestSeverity: 'critical',
//     categories: ['PII']
//   }
// }
```

## Classification Levels

- **public** - No sensitive data detected, safe for public distribution
- **internal** - Low-medium sensitivity data, internal use only
- **confidential** - High sensitivity data, restricted distribution
- **restricted** - Critical data (SSN, credentials, financial), highly restricted

## Detected Patterns

### PII (Personal Identifiable Information)
- Social Security Numbers (SSN)
- Email addresses
- Phone numbers
- Dates of birth
- Physical addresses

### Financial Data
- Credit card numbers
- Bank account numbers
- Routing numbers
- Salary information

### Health Data (HIPAA)
- Medical record numbers
- Diagnoses
- Prescriptions

### Government IDs
- Passport numbers
- Driver license numbers

### Authentication
- API keys
- Passwords
- Access tokens

### Technical
- IP addresses

## Output Schema

```typescript
interface DataClassification {
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  signals: Array<{
    type: string;
    pattern: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    matches?: number;
  }>;
  confidence: number; // 0-1 scale
  summary: {
    totalSignals: number;
    highestSeverity: string;
    categories: string[];
  };
}
```

## Use Cases

- **Data Loss Prevention (DLP)** - Scan documents before sharing
- **Compliance Auditing** - Identify sensitive data in databases
- **Email Filtering** - Classify email content sensitivity
- **Document Review** - Automatically classify documents for access control
- **Privacy Impact Assessment** - Detect PII in data processing activities

## Limitations

- Heuristic-based detection (pattern matching only)
- May produce false positives (e.g., random number sequences)
- Does not understand context or semantic meaning
- Should be used as a first-pass filter, not definitive classification
- Cannot detect all types of sensitive data (e.g., trade secrets require domain knowledge)

## License

MIT
