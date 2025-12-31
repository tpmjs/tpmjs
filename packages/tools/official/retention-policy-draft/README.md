# Retention Policy Draft Tool

Generates data retention policy documents from data types, retention periods, and justifications for GDPR, CCPA, and other privacy compliance regulations.

## Installation

```bash
npm install @tpmjs/tools-retention-policy-draft
```

## Usage

```typescript
import { retentionPolicyDraft } from '@tpmjs/tools-retention-policy-draft';

const result = await retentionPolicyDraft.execute({
  organizationName: 'Acme Corporation',
  effectiveDate: '2025-01-01',
  dataTypes: [
    {
      type: 'User Account Data',
      retentionDays: 2555, // ~7 years
      justification: 'Required by financial regulations and tax law',
      category: 'Personal Data',
    },
    {
      type: 'Application Logs',
      retentionDays: 90,
      justification: 'Operational troubleshooting and security monitoring',
      category: 'Operational',
    },
    {
      type: 'Payment Records',
      retentionDays: 2555,
      justification: 'Required by tax law and payment card industry standards',
      category: 'Financial',
    },
    {
      type: 'Marketing Analytics',
      retentionDays: 730, // 2 years
      justification: 'Business intelligence and trend analysis',
      category: 'Analytics',
    },
    {
      type: 'Customer Support Tickets',
      retentionDays: 1825, // 5 years
      justification: 'Customer service quality and dispute resolution',
      category: 'Operational',
    },
  ],
});

console.log(result.policy); // Full markdown policy document
console.log(result.summary);
// {
//   totalDataTypes: 5,
//   averageRetentionDays: 1551,
//   longestRetention: { type: 'User Account Data', days: 2555 },
//   shortestRetention: { type: 'Application Logs', days: 90 },
//   categoryCounts: {
//     'Personal Data': 1,
//     'Operational': 2,
//     'Financial': 1,
//     'Analytics': 1
//   }
// }
```

## Input Schema

```typescript
{
  dataTypes: Array<{
    type: string;           // Data type name
    retentionDays: number;  // Retention period (must be non-negative integer)
    justification: string;  // Business/legal justification
    category?: string;      // Optional category (auto-categorized if omitted)
  }>;
  organizationName?: string;  // Default: "Your Organization"
  effectiveDate?: string;     // ISO 8601 date, Default: current date
}
```

## Output Schema

```typescript
interface RetentionPolicyDraft {
  policy: string;  // Full markdown policy document
  dataTypes: DataTypeRetention[];  // Input data with categories
  summary: {
    totalDataTypes: number;
    averageRetentionDays: number;
    longestRetention: { type: string; days: number };
    shortestRetention: { type: string; days: number };
    categoryCounts: Record<string, number>;
  };
  metadata: {
    organizationName: string;
    effectiveDate: string;
    generatedAt: string;
    version: string;
  };
}
```

## Auto-Categorization

If no category is provided, data types are automatically categorized based on keywords:

- **Operational** - logs, audit, monitoring
- **Personal Data** - user, customer, employee
- **Financial** - payment, transaction, billing
- **Legal** - contract, legal, compliance
- **Archive** - backup, archive
- **General** - default category

## Common Retention Periods

### Legal Requirements
- **Tax Records** - 2555 days (7 years) - IRS requirement
- **Employment Records** - 1095 days (3 years) - EEOC requirement
- **GDPR Personal Data** - As needed, minimized
- **HIPAA Health Records** - 2190 days (6 years minimum)

### Industry Standards
- **PCI DSS Card Data** - 90-365 days (minimize retention)
- **SOX Financial Records** - 2555 days (7 years)
- **ISO 27001 Security Logs** - 90-365 days

### Operational Needs
- **Application Logs** - 30-90 days
- **Backup Systems** - 30-365 days
- **Analytics Data** - 365-730 days (1-2 years)

## Generated Policy Sections

The tool generates a complete policy document with:

1. **Purpose** - Policy objectives and rationale
2. **Scope** - What data is covered
3. **Retention Periods** - Detailed retention requirements by category
4. **Responsibilities** - Roles and duties (Data Owners, IT, Compliance)
5. **Data Disposal** - Secure deletion procedures
6. **Legal Holds** - Exception process for litigation
7. **Exceptions** - How to request policy exceptions
8. **Policy Review** - Review schedule and triggers
9. **Related Policies** - Cross-references
10. **Contact Information** - DPO contact details

## Use Cases

- **GDPR Compliance** - Document lawful retention periods
- **CCPA Compliance** - Demonstrate data minimization
- **SOC 2 Audits** - Provide retention policy documentation
- **ISO 27001** - Information lifecycle management
- **Privacy Impact Assessments** - Define data lifecycle
- **Data Protection Officer Reports** - Annual policy review
- **New Product Launch** - Establish retention requirements

## Validation

The tool validates:
- `dataTypes` is a non-empty array
- Each data type has valid `type`, `retentionDays`, and `justification`
- `retentionDays` is a non-negative integer
- `category` is a non-empty string if provided
- `effectiveDate` is a valid ISO 8601 date string if provided

## Example: SaaS Application

```typescript
const saasPolicy = await retentionPolicyDraft.execute({
  organizationName: 'CloudSync Inc.',
  effectiveDate: '2025-01-01',
  dataTypes: [
    {
      type: 'Active User Accounts',
      retentionDays: 0, // Retained while active
      justification: 'Active business relationship',
      category: 'Personal Data',
    },
    {
      type: 'Deleted User Accounts',
      retentionDays: 30,
      justification: 'Grace period for account recovery',
      category: 'Personal Data',
    },
    {
      type: 'Access Logs',
      retentionDays: 90,
      justification: 'Security incident investigation',
      category: 'Operational',
    },
    {
      type: 'Billing History',
      retentionDays: 2555,
      justification: 'Tax compliance (7 years)',
      category: 'Financial',
    },
    {
      type: 'Product Analytics',
      retentionDays: 730,
      justification: 'Product development insights',
      category: 'Analytics',
    },
  ],
});
```

## Best Practices

1. **Minimize Retention** - Keep data only as long as necessary
2. **Document Justification** - Clearly explain why each period is required
3. **Regular Reviews** - Update policy when regulations or business needs change
4. **Legal Review** - Have policy reviewed by legal counsel
5. **Automated Enforcement** - Implement technical controls for automatic deletion
6. **Audit Trail** - Log all data disposal activities
7. **Training** - Educate staff on retention requirements

## Limitations

- Generated policy is a template requiring legal review
- Does not enforce retention periods (documentation only)
- Does not handle complex retention rules (e.g., "retain until X event")
- Auto-categorization is keyword-based and may need manual adjustment
- Does not account for jurisdiction-specific requirements
- Should be customized for your specific regulatory environment

## Disclaimer

This tool generates draft policies for informational purposes only. The generated document should be reviewed and approved by qualified legal counsel before implementation. Retention periods must comply with applicable laws in your jurisdiction.

## License

MIT
