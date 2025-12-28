'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const codeLines = [
  { text: "import { tool } from '@tpmjs/sdk';", delay: 0.5 },
  { text: '', delay: 0.8 },
  { text: '// Get any tool from the registry', delay: 1.0 },
  { text: "const webSearch = await tool('web-search');", delay: 1.3 },
  { text: '', delay: 1.6 },
  { text: '// Use it with your AI agent', delay: 1.8 },
  { text: 'const result = await webSearch.execute({', delay: 2.1 },
  { text: "  query: 'latest AI news'", delay: 2.4 },
  { text: '});', delay: 2.7 },
];

function TypewriterLine({ text, delay }: { text: string; delay: number }) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayText('');
      return;
    }

    const timeout = setTimeout(() => {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= text.length) {
          setDisplayText(text.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 30);

      return () => clearInterval(interval);
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  // Syntax highlighting
  const highlightedText = displayText
    .replace(/(import|from|const|await)/g, '<span class="text-purple-400">$1</span>')
    .replace(/('.*?')/g, '<span class="text-emerald-400">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-white/30">$1</span>')
    .replace(/(\{|\}|\(|\))/g, '<span class="text-yellow-300">$1</span>');

  return (
    <div
      className="font-mono text-sm md:text-base text-white/80 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: highlightedText || '&nbsp;' }}
    />
  );
}

export function IntegrationSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 via-transparent to-pink-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="text-6xl mb-8"
        >
          🔌
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Simple Integration</h2>
        <p className="text-xl text-white/40 mb-12">Three lines of code. That&apos;s it.</p>

        {/* Code block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative max-w-2xl mx-auto"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 px-4 py-3 bg-[#1e1e2e] rounded-t-xl border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-4 text-xs text-white/30 font-mono">agent.ts</span>
          </div>

          {/* Code content */}
          <div className="bg-[#1e1e2e] p-6 rounded-b-xl text-left overflow-x-auto">
            {codeLines.map((line, index) => (
              <TypewriterLine key={index} text={line.text} delay={line.delay} />
            ))}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              className="inline-block w-2 h-5 bg-cyan-400 ml-0.5"
            />
          </div>
        </motion.div>

        {/* Framework badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {['Vercel AI SDK', 'LangChain', 'Claude', 'OpenAI'].map((framework) => (
            <span
              key={framework}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm"
            >
              Works with {framework}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
