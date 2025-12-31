# @tpmjs/tools-source-credibility

## 0.2.1

### Patch Changes

- Fully implement source-credibility tool with production-ready functionality:
  - Uses tldts for domain parsing and reputation analysis
  - Uses cheerio for HTML parsing and signal extraction
  - Analyzes 6 credibility signals: HTTPS, domain reputation, author, date, citations, contact info
  - Calculates weighted overall credibility score (0-1)
  - Returns confidence level, warnings, and recommendations
  - Proper input validation and error handling

## 0.2.0

### Minor Changes

- aaf3cdd: Add 5 new research tools for AI-powered content analysis

  New tools using AI SDK v6 (tool() + jsonSchema() pattern):

  - **@tpmjs/tools-page-brief**: Fetch URL and extract summary with key points and claims needing citations
  - **@tpmjs/tools-compare-pages**: Compare two URLs for agreements, conflicts, and unique points
  - **@tpmjs/tools-source-credibility**: Calculate heuristic credibility score based on domain signals
  - **@tpmjs/tools-claim-checklist**: Extract checkable factual claims from text
  - **@tpmjs/tools-timeline-from-text**: Extract dated events and return normalized timeline

  Also moved @tpmjs/createblogpost to packages/tools/official/ directory and set up blocks.yml for Blocks framework validation.
