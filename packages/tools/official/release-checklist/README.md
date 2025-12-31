# Release Checklist Tool

Generates comprehensive release checklists from component information with readiness tracking and blocker detection.

## Installation

```bash
npm install @tpmjs/tools-release-checklist
```

## Usage

```typescript
import { releaseChecklistTool } from '@tpmjs/tools-release-checklist';

const result = await releaseChecklistTool.execute({
  components: [
    {
      name: 'UserService',
      hasTests: true,
      hasDocs: true,
      version: '2.1.0'
    },
    {
      name: 'AuthModule',
      hasTests: false,
      hasDocs: true,
      version: '1.5.0'
    },
    {
      name: 'PaymentAPI',
      hasTests: true,
      hasDocs: false,
      version: 'invalid'
    }
  ]
});

console.log(result.checklist);
// # Release Checklist
//
// ## Testing
//
// ### UserService
// - [x] 🔴 Unit tests passing
// - [ ] 🟡 Integration tests passing
// ...

console.log(result.blockers);
// [
//   'AuthModule: Missing tests (critical)',
//   'PaymentAPI: Missing documentation (high priority)',
//   'PaymentAPI: Version invalid follows semver (critical)'
// ]

console.log(result.summary);
// {
//   totalComponents: 3,
//   componentsReady: 1,
//   componentsBlocked: 1,
//   readinessPercentage: 33,
//   criticalItems: 24,
//   incompleteItems: 28
// }
```

## Features

- **Markdown Checklist**: Generates formatted markdown checklist with checkboxes and priority indicators
- **Readiness Tracking**: Calculates percentage of components ready for release
- **Blocker Detection**: Identifies critical issues preventing release
- **Priority Levels**: Categorizes items by critical, high, medium, and low priority
- **Category Organization**: Groups checklist items by testing, documentation, versioning, quality, and deployment
- **Semver Validation**: Validates version numbers follow semantic versioning

## Input

```typescript
{
  components: Array<{
    name: string;       // Component name
    hasTests: boolean;  // Whether component has tests
    hasDocs: boolean;   // Whether component has documentation
    version: string;    // Semantic version (e.g., "1.0.0")
  }>
}
```

## Output

```typescript
{
  checklist: string;          // Markdown-formatted checklist
  items: Array<{
    component: string;        // Component name or "Release"
    item: string;             // Checklist item description
    status: 'complete' | 'incomplete' | 'blocked';
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'testing' | 'documentation' | 'versioning' | 'quality' | 'deployment';
  }>;
  readyCount: number;         // Number of components ready for release
  blockers: string[];         // List of release blockers
  summary: {
    totalComponents: number;
    componentsReady: number;
    componentsBlocked: number;
    readinessPercentage: number;
    criticalItems: number;
    incompleteItems: number;
  };
}
```

## Checklist Categories

The tool generates items across five categories:

### 1. Testing
- Unit tests passing
- Integration tests passing
- Code coverage meets threshold

### 2. Documentation
- Documentation complete
- API documentation reviewed
- Changelog updated
- Release notes prepared

### 3. Version Management
- Semantic version validation
- Version conflict detection

### 4. Quality Assurance
- Critical bugs resolved
- Security audit completed
- Performance benchmarks passing

### 5. Deployment
- Deployment runbook reviewed
- Rollback plan documented
- Stakeholders notified

## Priority Levels

- **🔴 Critical**: Must be completed before release
- **🟡 High**: Should be completed before release
- **🔵 Medium**: Nice to have
- **⚪ Low**: Optional

## Readiness Criteria

A component is considered "ready" when:
- ✅ Has tests (`hasTests: true`)
- ✅ Has documentation (`hasDocs: true`)
- ✅ Version follows semver format (e.g., `1.2.3`)

## Examples

### All Components Ready

```typescript
const result = await releaseChecklistTool.execute({
  components: [
    { name: 'CoreAPI', hasTests: true, hasDocs: true, version: '3.0.0' },
    { name: 'UIKit', hasTests: true, hasDocs: true, version: '3.0.0' }
  ]
});

// result.summary.readinessPercentage === 100
// result.readyCount === 2
```

### Components with Blockers

```typescript
const result = await releaseChecklistTool.execute({
  components: [
    { name: 'BetaFeature', hasTests: false, hasDocs: false, version: 'v1' }
  ]
});

// result.blockers includes:
// - "BetaFeature: Missing tests (critical)"
// - "BetaFeature: Missing documentation (high priority)"
// - "BetaFeature: Version v1 follows semver (critical)"
```

### Large Release

```typescript
const components = [
  { name: 'Module1', hasTests: true, hasDocs: true, version: '2.0.0' },
  { name: 'Module2', hasTests: true, hasDocs: true, version: '2.0.0' },
  // ... 10 more modules
];

const result = await releaseChecklistTool.execute({ components });

// Generates comprehensive checklist with:
// - 100+ checklist items
// - Organized by category and component
// - Clear blocker identification
```

## Use Cases

- **Pre-Release Planning**: Assess release readiness before starting
- **Release Progress Tracking**: Monitor completion of release tasks
- **Quality Gate Enforcement**: Ensure all critical items are complete
- **Team Coordination**: Share checklist with stakeholders
- **Post-Mortem Analysis**: Review what was missed in previous releases

## License

MIT
