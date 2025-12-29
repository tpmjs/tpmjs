'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const tutorials = [
  {
    id: 'agents',
    title: 'For Agent Developers',
    subtitle: 'Search & Execute',
    description: 'Give your agent access to 200+ tools at runtime. No imports. No bundling.',
    href: '/agents',
    gradient: 'from-cyan-500 to-blue-600',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
        />
      </svg>
    ),
    features: ['searchTpmjsToolsTool', 'registryExecuteTool', 'Sandbox execution'],
  },
  {
    id: 'authors',
    title: 'For Package Authors',
    subtitle: 'Publish Your Tools',
    description:
      'Get your AI SDK tools discovered by agents worldwide. npm publish is all it takes.',
    href: '/authors',
    gradient: 'from-purple-500 to-pink-600',
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
        />
      </svg>
    ),
    features: ['tpmjs keyword', 'Schema extraction', 'Quality scoring'],
  },
];

export default function TutorialHome(): React.ReactElement {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center px-6 py-12">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0a0a0f] via-[#0d1117] to-[#0a0a0f]" />
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6">
            <span className="text-cyan-400 font-mono text-sm">tpmjs.com</span>
            <span className="text-white/30">/</span>
            <span className="text-white/60 font-mono text-sm">tutorials</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">Learn TPMJS</h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            The tool registry for the Vercel AI SDK. Choose your path.
          </p>
        </motion.div>

        {/* Tutorial Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {tutorials.map((tutorial, index) => (
            <motion.div
              key={tutorial.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Link href={tutorial.href} className="block group">
                <div className="relative p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/[0.07] overflow-hidden">
                  {/* Gradient glow on hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${tutorial.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                  />

                  {/* Icon */}
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${tutorial.gradient} text-white mb-6`}
                  >
                    {tutorial.icon}
                  </div>

                  {/* Content */}
                  <div className="relative">
                    <div className="text-xs font-mono text-white/40 mb-2">{tutorial.subtitle}</div>
                    <h2 className="text-2xl font-bold text-white mb-3">{tutorial.title}</h2>
                    <p className="text-white/50 mb-6">{tutorial.description}</p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tutorial.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-1 rounded text-xs font-mono bg-white/5 text-white/60"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div
                      className={`inline-flex items-center gap-2 text-sm font-medium bg-gradient-to-r ${tutorial.gradient} bg-clip-text text-transparent group-hover:gap-3 transition-all`}
                    >
                      Start Tutorial
                      <svg
                        className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <a
            href="https://tpmjs.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/30 hover:text-white/50 text-sm transition-colors"
          >
            Back to tpmjs.com
          </a>
        </motion.div>
      </div>
    </main>
  );
}
