# @tpmjs/tools-pandoc

Pandoc document conversion tools for AI agents. Convert between Markdown, HTML, LaTeX, DOCX, PDF, and dozens more formats.

## Requirements

The `pandoc` binary must be available in the system PATH. The TPMJS executor Docker image includes it.

## Tools

- **convert** — Convert content between document formats
- **listInputFormats** — List all supported input formats
- **listOutputFormats** — List all supported output formats

## Usage

```typescript
import { convert, listInputFormats, listOutputFormats } from '@tpmjs/tools-pandoc';
```
