// TPMJS SDK example.
//
// Loads a real tool straight from the TPMJS registry with `fromRegistry`, composes it into a Vercel
// AI SDK tool set with `createToolSet`, and hands the result to `generateText`. The model decides
// when to call the tool; the tool itself runs in TPMJS's hosted sandbox (not in this process).
//
//   pnpm install          # or: npm install
//   OPENAI_API_KEY=sk-... pnpm start
//
// Requires your own model provider key — this example calls an LLM.

import { openai } from '@ai-sdk/openai';
import { createToolSet } from '@tpmjs/compose';
import { fromRegistry } from '@tpmjs/compose/adapters/registry';
import { generateText, stepCountIs } from 'ai';

// Resolve a registry tool by its `package::export` id and adapt it to an AI SDK tool.
const base64Encode = await fromRegistry('@tpmjs/official-base64-encode::base64EncodeTool');

// Compose it (add your own tools here too, fully typed) into a plain tool record.
const tools = createToolSet().use('base64Encode', base64Encode).build();

const result = await generateText({
  model: openai('gpt-5.4'), // any AI SDK model works — swap the provider as you like
  tools,
  // Allow multiple steps so the model can call the tool, read its result, then answer.
  stopWhen: stepCountIs(5),
  prompt: 'Use the base64Encode tool to encode the text "Hello, TPMJS!" and tell me the result.',
});

console.log(result.text);
