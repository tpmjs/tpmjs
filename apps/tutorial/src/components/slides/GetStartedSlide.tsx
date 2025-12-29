'use client';

import { motion } from 'framer-motion';

const links = [
  {
    label: 'Browse Tools',
    href: 'https://tpmjs.com/tool-search',
    description: 'Search by name, category, quality',
    icon: '🔍',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    label: 'Publish a Tool',
    href: 'https://tpmjs.com/docs/publishing',
    description: 'Add tpmjs-tool keyword to npm',
    icon: '📦',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    label: 'The Playground',
    href: 'https://tpmjs.com/playground',
    description: 'Run tools in browser sandbox',
    icon: '🎮',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

export function GetStartedSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      {/* Celebratory background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[800px] h-[800px] rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 blur-[150px]"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'linear',
          }}
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

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
          className="text-7xl mb-8"
        >
          🚀
        </motion.div>

        <h2 className="text-5xl md:text-7xl font-bold text-white mb-4">Get Started</h2>
        <p className="text-xl md:text-2xl text-white/40 mb-16">
          Indexed automatically. Updated every 2 minutes.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          {links.map((link, index) => (
            <motion.a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.15 }}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
              className={`
                group relative w-full md:w-auto
                px-8 py-6 rounded-2xl
                bg-gradient-to-br ${link.gradient}
                text-white font-semibold text-lg
                shadow-lg shadow-black/20
                transition-shadow hover:shadow-xl hover:shadow-black/30
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-3xl">{link.icon}</span>
                <div className="text-left">
                  <div className="font-bold">{link.label}</div>
                  <div className="text-sm text-white/70">{link.description}</div>
                </div>
              </div>

              {/* Hover arrow */}
              <motion.div
                className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                initial={{ x: -10 }}
                whileHover={{ x: 0 }}
              >
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </motion.div>
            </motion.a>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-white/30 text-sm"
        >
          The missing layer between npm and AI agents.
        </motion.div>
      </motion.div>
    </div>
  );
}
