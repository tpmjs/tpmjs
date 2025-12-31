# @tpmjs/tools-timeline-from-text

## 0.3.0

### Minor Changes

- Initial release of 100+ official TPMJS tools covering research, data transformation, statistics, security, engineering, ops, and agent utilities.

## 0.2.1

### Patch Changes

- Fully implement research tools with production-ready functionality:

  - page-brief: Uses @mozilla/readability + jsdom for content extraction
  - compare-pages: Uses natural TF-IDF for text similarity analysis
  - source-credibility: Uses tldts + cheerio for credibility signal analysis
  - claim-checklist: Uses sbd for sentence parsing with pattern-based detection
  - timeline-from-text: Uses chrono-node for date parsing

  All tools include comprehensive error handling, input validation, and Node.js 18+ fetch requirement verification.

## 0.2.1

### Patch Changes

- Fully implement timeline-from-text tool with production-ready functionality:
  - Uses chrono-node for comprehensive date parsing (specific, partial, relative, range dates)
  - Uses sbd for sentence context extraction
  - Calculates confidence scores based on date specificity
  - Sorts events chronologically
  - Identifies gaps between events (>30 days)
  - Returns date range, event count, and metadata
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
