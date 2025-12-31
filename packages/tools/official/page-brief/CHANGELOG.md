# @tpmjs/tools-page-brief

## 0.2.0

### Minor Changes

- aaf3cdd: Add 5 new research tools for AI-powered content analysis

  New tools using AI SDK v6 beta (tool() + jsonSchema() pattern):

  - **@tpmjs/tools-page-brief**: Fetch URL and extract summary with key points and claims needing citations
  - **@tpmjs/tools-compare-pages**: Compare two URLs for agreements, conflicts, and unique points
  - **@tpmjs/tools-source-credibility**: Calculate heuristic credibility score based on domain signals
  - **@tpmjs/tools-claim-checklist**: Extract checkable factual claims from text
  - **@tpmjs/tools-timeline-from-text**: Extract dated events and return normalized timeline

  All tools are stub implementations ready for full logic implementation.

  Also moved @tpmjs/createblogpost to packages/tools/official/ directory and set up blocks.yml for Blocks framework validation.
