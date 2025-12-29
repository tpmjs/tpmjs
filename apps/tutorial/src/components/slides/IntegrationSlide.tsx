'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const codeLines = [
  { text: '// Quality score: 0.00 - 1.00', delay: 0.5 },
  { text: "const tier = tier === 'rich' ? 0.6 : 0.4;", delay: 0.8 },
  { text: 'const downloads = Math.min(0.2, log10(d));', delay: 1.1 },
  { text: 'const stars = Math.min(0.1, log10(s));', delay: 1.4 },
  { text: '', delay: 1.7 },
  { text: '// Rich = has params, returns, env', delay: 2.0 },
  { text: 'const score = tier + downloads + stars;', delay: 2.3 },
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

  // Simple text display without syntax highlighting to avoid dangerouslySetInnerHTML
  const isComment = displayText.startsWith('//');

  return (
    <div
      className={`font-mono text-sm md:text-base leading-relaxed ${isComment ? 'text-white/30' : 'text-white/80'}`}
    >
      {displayText || '\u00A0'}
    </div>
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
          📊
        </motion.div>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-4">Quality Scoring</h2>
        <p className="text-xl text-white/40 mb-12">Deliberately simple. Not trying to be clever.</p>

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
            {codeLines.map((line) => (
              <TypewriterLine key={line.text || line.delay} text={line.text} delay={line.delay} />
            ))}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              className="inline-block w-2 h-5 bg-cyan-400 ml-0.5"
            />
          </div>
        </motion.div>

        {/* Score factors */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {['Tier: 40-60%', 'Downloads: 0-20%', 'Stars: 0-10%', 'Richness: 0-10%'].map((factor) => (
            <span
              key={factor}
              className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400/70 text-sm font-mono"
            >
              {factor}
            </span>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
