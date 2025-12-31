# Guardrail Policy Draft

Drafts guardrail policies for agent workflows with rules, severity levels, and enforcement actions. Useful for establishing safety boundaries, compliance requirements, and operational constraints.

## Installation

```bash
npm install @tpmjs/tools-guardrail-policy-draft
```

## Usage

```typescript
import { guardrailPolicyDraftTool } from '@tpmjs/tools-guardrail-policy-draft';
import { generateText } from 'ai';

const result = await generateText({
  model: yourModel,
  tools: {
    draftPolicy: guardrailPolicyDraftTool,
  },
  prompt: 'Create a safety policy for the agent...',
});
```

## Direct Usage

```typescript
import { guardrailPolicyDraftTool } from '@tpmjs/tools-guardrail-policy-draft';

const result = await guardrailPolicyDraftTool.execute({
  policies: [
    {
      rule: 'Do not access production database without approval',
      severity: 'critical',
      action: 'block',
    },
    {
      rule: 'Verify user permissions before executing privileged operations',
      severity: 'high',
      action: 'review',
    },
    {
      rule: 'Log all external API calls for audit trail',
      severity: 'medium',
      action: 'log',
    },
  ],
});

console.log(result.policy);
// Markdown-formatted policy document

console.log(result.summary);
// "3 total rules | 2 critical/high priority | 1 blocking rule(s)"

console.log(result.stats);
// {
//   totalRules: 3,
//   bySeverity: { critical: 1, high: 1, medium: 1, low: 0, info: 0 },
//   byAction: { block: 1, review: 1, log: 1, ... }
// }
```

## Input Schema

```typescript
{
  policies: Array<{
    rule: string;       // The policy rule or constraint
    severity: Severity; // 'critical' | 'high' | 'medium' | 'low' | 'info'
    action: Action;     // 'block' | 'warn' | 'log' | 'review' | 'escalate' | 'retry' | 'fallback' | 'notify'
  }>;
}
```

### Severity Levels

- **critical** 🔴 - Immediate risk to security, data, or compliance
- **high** 🟠 - Significant risk that should prevent execution
- **medium** 🟡 - Moderate risk requiring attention
- **low** 🔵 - Minor risk or best practice
- **info** ⚪ - Informational guideline

### Actions

- **block** - Prevent execution and terminate workflow
- **warn** - Display warning but allow execution to continue
- **log** - Record violation in logs for audit
- **review** - Flag for human review before proceeding
- **escalate** - Escalate to supervisor or admin
- **retry** - Retry the operation with corrections
- **fallback** - Use fallback behavior or default action
- **notify** - Send notification to stakeholders

## Output Schema

```typescript
{
  policy: string;                // Markdown-formatted policy document
  rules: PolicyRule[];           // Validated and normalized rules
  summary: string;               // Human-readable summary
  stats: {                       // Policy statistics
    totalRules: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
    byAction: Record<Action, number>;
  };
  createdAt: string;             // ISO timestamp
}
```

## Example Output

The tool generates a markdown policy document like this:

```markdown
# Agent Guardrail Policy

This policy defines the guardrails and safety boundaries for agent workflow execution.

---

## 🔴 CRITICAL Severity

### Rule 1: Do not access production database without approval

- **Severity:** critical
- **Action:** block
- **Enforcement:** Prevent execution and terminate workflow

## 🟠 HIGH Severity

### Rule 1: Verify user permissions before executing privileged operations

- **Severity:** high
- **Action:** review
- **Enforcement:** Flag for human review before proceeding

## 🟡 MEDIUM Severity

### Rule 1: Log all external API calls for audit trail

- **Severity:** medium
- **Action:** log
- **Enforcement:** Record violation in logs for audit

---

## Enforcement Guidelines

1. **Critical & High** - Must be enforced before any execution
2. **Medium** - Should be checked during execution
3. **Low & Info** - May be checked post-execution for auditing
```

## Use Cases

### 1. Security Policies

```typescript
const securityPolicy = await guardrailPolicyDraftTool.execute({
  policies: [
    {
      rule: 'Never store credentials in plain text',
      severity: 'critical',
      action: 'block',
    },
    {
      rule: 'Encrypt all sensitive data at rest',
      severity: 'critical',
      action: 'block',
    },
    {
      rule: 'Use HTTPS for all external communications',
      severity: 'high',
      action: 'warn',
    },
  ],
});
```

### 2. Compliance Requirements

```typescript
const compliancePolicy = await guardrailPolicyDraftTool.execute({
  policies: [
    {
      rule: 'Obtain user consent before processing personal data',
      severity: 'critical',
      action: 'review',
    },
    {
      rule: 'Log all data access for GDPR audit trail',
      severity: 'high',
      action: 'log',
    },
    {
      rule: 'Delete user data within 30 days of request',
      severity: 'high',
      action: 'escalate',
    },
  ],
});
```

### 3. Operational Constraints

```typescript
const operationalPolicy = await guardrailPolicyDraftTool.execute({
  policies: [
    {
      rule: 'Rate limit API calls to 100 requests per minute',
      severity: 'medium',
      action: 'retry',
    },
    {
      rule: 'Timeout long-running operations after 5 minutes',
      severity: 'medium',
      action: 'fallback',
    },
    {
      rule: 'Notify admins of unusual activity patterns',
      severity: 'low',
      action: 'notify',
    },
  ],
});
```

### 4. Testing & QA

```typescript
const testingPolicy = await guardrailPolicyDraftTool.execute({
  policies: [
    {
      rule: 'Never execute destructive operations in test environment',
      severity: 'critical',
      action: 'block',
    },
    {
      rule: 'Verify test data is properly isolated from production',
      severity: 'high',
      action: 'review',
    },
    {
      rule: 'Log all test execution results',
      severity: 'info',
      action: 'log',
    },
  ],
});
```

## Advanced Usage

### Combining Multiple Policies

```typescript
const policies = [
  ...securityRules,
  ...complianceRules,
  ...operationalRules,
];

const masterPolicy = await guardrailPolicyDraftTool.execute({ policies });

// Check policy balance
if (masterPolicy.stats.bySeverity.critical > 10) {
  console.warn('Policy may be too restrictive');
}

if (masterPolicy.stats.byAction.block > 5) {
  console.warn('Too many blocking rules may prevent workflow execution');
}
```

### Generating Reports

```typescript
const policy = await guardrailPolicyDraftTool.execute({ policies });

// Save to file
await fs.writeFile('GUARDRAILS.md', policy.policy);

// Generate statistics report
console.log(`Policy Statistics:
  Total Rules: ${policy.stats.totalRules}
  Critical: ${policy.stats.bySeverity.critical}
  High: ${policy.stats.bySeverity.high}
  Blocking Rules: ${policy.stats.byAction.block}
  Created: ${policy.createdAt}
`);
```

## Best Practices

1. **Start with critical rules** - Focus on security and compliance first
2. **Use blocking sparingly** - Too many blocking rules can prevent workflow execution
3. **Balance severity levels** - Not everything should be critical
4. **Choose appropriate actions** - Match actions to the severity and context
5. **Document clearly** - Write rules that are specific and actionable
6. **Review regularly** - Policies should evolve with your system

## Policy Enforcement

This tool generates policy documentation. To enforce these policies in your agent workflow:

1. Parse the generated rules
2. Implement enforcement logic for each action type
3. Integrate with your agent execution framework
4. Monitor violations and adjust policies as needed

## License

MIT
