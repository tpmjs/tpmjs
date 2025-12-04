import { tool } from 'ai';
import { z } from 'zod';

const TextToEmojiSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').describe('The text to convert to emoji'),
  style: z
    .enum(['literal', 'creative', 'random'])
    .default('creative')
    .describe(
      'How to convert: literal (direct replacements), creative (interpretive), random (surprise me!)'
    ),
});

export const textToEmoji = tool({
  description:
    'Convert text into emoji representations - perfect for making messages more expressive!',
  inputSchema: TextToEmojiSchema,
  async execute(input: z.infer<typeof TextToEmojiSchema>) {
    const { text, style } = input;

    // Simple word-to-emoji mappings
    const emojiMap: Record<string, string> = {
      // Emotions
      happy: '😊',
      sad: '😢',
      angry: '😠',
      love: '❤️',
      heart: '💖',
      excited: '🎉',
      crying: '😭',
      laughing: '😂',
      cool: '😎',
      // Animals
      cat: '🐱',
      dog: '🐶',
      bird: '🐦',
      fish: '🐠',
      monkey: '🐵',
      lion: '🦁',
      tiger: '🐯',
      bear: '🐻',
      panda: '🐼',
      // Objects
      car: '🚗',
      house: '🏠',
      tree: '🌳',
      flower: '🌸',
      sun: '☀️',
      moon: '🌙',
      star: '⭐',
      fire: '🔥',
      water: '💧',
      food: '🍔',
      // Actions
      run: '🏃',
      dance: '💃',
      sleep: '😴',
      think: '🤔',
      write: '✍️',
      read: '📖',
      music: '🎵',
      party: '🎊',
      work: '💼',
    };

    const words = text.toLowerCase().split(/\s+/);
    const converted = words
      .map((word) => {
        // Remove punctuation for matching
        const cleanWord = word.replace(/[^\w]/g, '');

        if (style === 'random') {
          // 50% chance to replace with random emoji
          if (Math.random() > 0.5) {
            const emojis = Object.values(emojiMap);
            return emojis[Math.floor(Math.random() * emojis.length)];
          }
        }

        return emojiMap[cleanWord] || word;
      })
      .join(' ');

    return {
      success: true,
      original: text,
      converted,
      style,
      emoji_count: (converted.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length,
    };
  },
});
