/**
 * Agent node executor - one-shot text generation using an agent configuration
 */
import { prisma } from '@tpmjs/db';
import { generateText } from 'ai';
import { resolveTemplate } from '../data-mapping';

// Lazy model resolution to avoid importing all SDKs at once
async function getModel(provider: string, modelId: string) {
  switch (provider) {
    case 'OPENAI': {
      const { openai } = await import('@ai-sdk/openai');
      return openai(modelId);
    }
    case 'ANTHROPIC': {
      const { anthropic } = await import('@ai-sdk/anthropic');
      return anthropic(modelId);
    }
    case 'GOOGLE': {
      const { google } = await import('@ai-sdk/google');
      return google(modelId);
    }
    case 'GROQ': {
      const { groq } = await import('@ai-sdk/groq');
      return groq(modelId);
    }
    case 'MISTRAL': {
      const { mistral } = await import('@ai-sdk/mistral');
      return mistral(modelId);
    }
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function executeAgent(
  config: Record<string, unknown>,
  input: unknown,
  agentId: string
): Promise<unknown> {
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: {
      provider: true,
      modelId: true,
      systemPrompt: true,
      temperature: true,
    },
  });

  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }

  // Resolve prompt template
  let prompt = (config.prompt as string) || '';
  if (prompt.includes('{{')) {
    const resolved = resolveTemplate(prompt, new Map(), input);
    prompt = typeof resolved === 'string' ? resolved : JSON.stringify(resolved);
  }

  // If no prompt configured, use the input as the prompt
  if (!prompt && input) {
    prompt = typeof input === 'string' ? input : JSON.stringify(input);
  }

  const model = await getModel(agent.provider, agent.modelId);

  const result = await generateText({
    model,
    system: agent.systemPrompt || undefined,
    prompt,
    temperature: agent.temperature ?? 0.7,
    maxOutputTokens: 4096,
  });

  return {
    text: result.text,
    usage: result.usage,
  };
}
