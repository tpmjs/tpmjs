# @tpmjs/emoji-magic

AI SDK tools for emoji conversion and mood detection. Make your text more expressive! ✨

## Tools

### textToEmoji
Convert text into emoji representations - perfect for making messages more expressive!

```typescript
import { textToEmoji } from '@tpmjs/emoji-magic';

const result = await textToEmoji.execute({
  text: "I love my cat and dog",
  style: 'creative'
});
// Result: "I ❤️ my 🐱 and 🐶"
```

### emojiMood
Detect the mood/sentiment and suggest appropriate emojis for the text.

```typescript
import { emojiMood } from '@tpmjs/emoji-magic';

const result = await emojiMood.execute({
  text: "This is amazing! I'm so excited!",
  count: 3
});
// Returns: { mood: 'excited', suggestions: ['🎉', '🎊', '🥳'] }
```

## Installation

```bash
npm install @tpmjs/emoji-magic
```

## License

MIT
