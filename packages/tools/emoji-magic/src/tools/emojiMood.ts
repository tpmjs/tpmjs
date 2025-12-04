import { tool } from 'ai';
import { z } from 'zod';

const EmojiMoodSchema = z.object({
  text: z
    .string()
    .min(1, 'Text cannot be empty')
    .describe('The text to analyze for mood/sentiment'),
  count: z.number().int().positive().default(3).describe('Number of emoji suggestions to return'),
});

export const emojiMood = tool({
  description: 'Detect the mood/sentiment and suggest appropriate emojis for the text',
  inputSchema: EmojiMoodSchema,
  async execute(input: z.infer<typeof EmojiMoodSchema>) {
    const { text, count } = input;

    // Simple sentiment analysis based on keywords
    const positiveWords = [
      'happy',
      'joy',
      'great',
      'awesome',
      'excellent',
      'love',
      'wonderful',
      'amazing',
      'fantastic',
      'good',
      'nice',
      'best',
      'yay',
      'win',
      'success',
    ];
    const negativeWords = [
      'sad',
      'bad',
      'awful',
      'terrible',
      'hate',
      'worst',
      'angry',
      'mad',
      'upset',
      'disappointed',
      'fail',
      'lose',
      'pain',
    ];
    const excitedWords = [
      'excited',
      'wow',
      'omg',
      'amazing',
      'incredible',
      'party',
      'celebrate',
      'yay',
    ];
    const calmWords = ['calm', 'peace', 'relax', 'chill', 'zen', 'meditate', 'sleep', 'rest'];

    const lowerText = text.toLowerCase();

    let mood = 'neutral';
    let emojis: string[] = [];

    // Check for positive sentiment
    if (positiveWords.some((word) => lowerText.includes(word))) {
      mood = 'positive';
      emojis = ['😊', '😄', '🎉', '❤️', '👍', '🌟', '✨', '😁', '🥳', '💖'];
    }
    // Check for negative sentiment
    else if (negativeWords.some((word) => lowerText.includes(word))) {
      mood = 'negative';
      emojis = ['😢', '😞', '😔', '💔', '😭', '😟', '🙁', '😕', '😣', '😖'];
    }
    // Check for excited sentiment
    else if (excitedWords.some((word) => lowerText.includes(word))) {
      mood = 'excited';
      emojis = ['🎉', '🎊', '🥳', '😆', '🤩', '⚡', '🔥', '💥', '🌟', '✨'];
    }
    // Check for calm sentiment
    else if (calmWords.some((word) => lowerText.includes(word))) {
      mood = 'calm';
      emojis = ['😌', '😊', '🧘', '🌙', '☁️', '💙', '🕊️', '🌸', '🍃', '💤'];
    }
    // Default neutral
    else {
      mood = 'neutral';
      emojis = ['🙂', '😐', '😶', '🤔', '💭', '📝', '💬', '👌', '✌️', '🤷'];
    }

    // Return requested number of suggestions
    const suggestions = emojis.slice(0, count);

    return {
      success: true,
      mood,
      suggestions,
      text_length: text.length,
      analysis: `Detected ${mood} mood with ${suggestions.length} emoji suggestions`,
    };
  },
});
