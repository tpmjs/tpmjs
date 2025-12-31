# @tpmjs/tools-faq-from-text

Extract Q&A pairs from text that looks like FAQ format. Detects question patterns and pairs them with their answers.

## Installation

```bash
npm install @tpmjs/tools-faq-from-text ai
```

## Usage

```typescript
import { faqFromTextTool } from '@tpmjs/tools-faq-from-text';

const result = await faqFromTextTool.execute({
  text: `
    Q: What is TPMJS?
    A: TPMJS is a package manager for AI tools.

    Q: How do I install it?
    A: Run npm install @tpmjs/core

    Question: Is it free?
    Answer: Yes, it's open source and free to use.
  `,
});

console.log(result);
// {
//   faqs: [
//     { question: "What is TPMJS?", answer: "TPMJS is a package manager for AI tools." },
//     { question: "How do I install it?", answer: "Run npm install @tpmjs/core" },
//     { question: "Is it free?", answer: "Yes, it's open source and free to use." }
//   ],
//   count: 3
// }
```

## Features

- Detects multiple question formats:
  - Questions ending with `?`
  - `Q:` or `Question:` prefixes
  - Numbered questions (`1.`, `1)`, etc.)
  - Common question words (What, Why, How, etc.)
- Automatically pairs questions with their answers
- Cleans up common prefixes (`Q:`, `A:`, numbers)
- Filters out invalid pairs

## Parameters

- `text` (string, required) - Text containing FAQ-style content with questions and answers

## Returns

```typescript
{
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  count: number;
}
```

## Example Input Formats

The tool recognizes various FAQ formats:

```
Q: What is this?
A: This is an answer.

Question: Another question?
Answer: Another answer.

1. Numbered question?
   The answer follows.

What about bare questions?
They work too!
```

## License

MIT
