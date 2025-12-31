# @tpmjs/tools-url-risk-heuristic

Analyze URLs for security risks using heuristics.

## Features

- **IP Address Detection**: Flags URLs using IP addresses instead of domain names
- **Suspicious TLD Detection**: Identifies commonly abused top-level domains
- **URL Shortener Detection**: Detects known URL shortening services
- **Unicode/Homograph Detection**: Catches lookalike characters and non-ASCII tricks
- **Excessive Subdomain Detection**: Flags unusual numbers of subdomains
- **Suspicious Pattern Detection**: Identifies phishing keywords and patterns
- **Protocol Validation**: Checks for insecure protocols
- **Path Traversal Detection**: Catches potential path traversal attempts

## Installation

```bash
npm install @tpmjs/tools-url-risk-heuristic
```

## Usage

```typescript
import { urlRiskHeuristic } from '@tpmjs/tools-url-risk-heuristic';

const result = await urlRiskHeuristic.execute({
  url: 'http://192.168.1.1/login?verify=true'
});

console.log(result);
// {
//   url: 'http://192.168.1.1/login?verify=true',
//   riskScore: 0.75,
//   risks: [
//     {
//       type: 'ip-address',
//       severity: 'high',
//       description: 'URL uses an IP address instead of a domain name'
//     },
//     {
//       type: 'insecure-protocol',
//       severity: 'medium',
//       description: 'URL uses insecure protocol: http:'
//     },
//     {
//       type: 'suspicious-keywords',
//       severity: 'medium',
//       description: 'URL contains suspicious keywords: login, verify'
//     }
//   ],
//   recommendations: [
//     'Legitimate websites typically use domain names, not IP addresses',
//     'Use HTTPS for secure communication',
//     'Suspicious keywords often indicate phishing attempts',
//     'DO NOT click this link or enter sensitive information',
//     'Verify the URL with the sender through a different channel'
//   ],
//   isHighRisk: true,
//   metadata: {
//     hostname: '192.168.1.1',
//     protocol: 'http:',
//     pathLength: 6,
//     hasPort: false
//   }
// }
```

## Risk Score

The risk score ranges from 0 to 1:

- **0.0 - 0.3**: Low risk
- **0.3 - 0.6**: Medium risk
- **0.6 - 1.0**: High risk (isHighRisk = true)

## Severity Levels

Individual risks are categorized by severity:

- **low**: Minor concerns
- **medium**: Moderate concerns
- **high**: Serious concerns
- **critical**: Immediate red flags

## License

MIT
