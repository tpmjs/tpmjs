'use client';

import { motion } from 'framer-motion';

const roleStyles: Record<string, string> = {
  user: 'bg-white/10 text-white/60',
  agent: 'bg-cyan-500/20 text-cyan-400',
  registry: 'bg-emerald-500/20 text-emerald-400',
  sandbox: 'bg-yellow-500/20 text-yellow-400',
};

const colorStyles: Record<string, string> = {
  white: 'text-white/70',
  cyan: 'text-cyan-400',
  purple: 'text-purple-400',
  emerald: 'text-emerald-400',
  yellow: 'text-yellow-400',
};

const conversation = [
  {
    id: 'user-ask',
    role: 'user',
    content: '"Format this CSV as a markdown table"',
    color: 'white',
  },
  {
    id: 'agent-search',
    role: 'agent',
    content: 'searchTpmjsToolsTool({ query: "markdown table" })',
    color: 'cyan',
  },
  {
    id: 'registry-found',
    role: 'registry',
    content: '→ Found: @tpmjs/markdown::formatTable',
    color: 'emerald',
  },
  {
    id: 'agent-execute',
    role: 'agent',
    content: 'registryExecuteTool({ toolId: "...", params: {...} })',
    color: 'purple',
  },
  {
    id: 'sandbox-result',
    role: 'sandbox',
    content: '→ Executed in 120ms',
    color: 'yellow',
  },
  {
    id: 'agent-respond',
    role: 'agent',
    content: '"Here\'s your formatted table: ..."',
    color: 'white',
  },
];

export function ToolDetailSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-transparent to-cyan-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-3xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Full Agent Flow</h2>
        <p className="text-xl text-white/50 mb-10">
          User asks. Agent searches. Tool executes. Done.
        </p>

        <div className="space-y-3 text-left">
          {conversation.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === 'user' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15 }}
              className={`flex items-start gap-3 ${msg.role === 'user' ? '' : 'pl-4'}`}
            >
              <span
                className={`text-xs font-mono px-2 py-1 rounded ${roleStyles[msg.role] ?? roleStyles.user}`}
              >
                {msg.role}
              </span>
              <span className={`font-mono text-sm ${colorStyles[msg.color] ?? colorStyles.white}`}>
                {msg.content}
              </span>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-10 p-4 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="text-sm text-white/60">
            The agent never imported <span className="text-cyan-400 font-mono">formatTable</span>.
            It discovered and executed it at runtime.
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
