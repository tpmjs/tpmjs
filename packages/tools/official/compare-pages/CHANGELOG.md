# @tpmjs/tools-compare-pages

## 0.2.1

### Patch Changes

- Fully implement compare-pages tool with production-ready functionality:
  - Uses natural library for TF-IDF text similarity analysis
  - Fetches and parses content from both URLs
  - Identifies agreements (high similarity sentences)
  - Detects conflicts using negation pattern analysis
  - Finds unique points from each source
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
