'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const tutorials = [
  {
    id: 'overview',
    title: 'General Overview',
    subtitle: 'Start Here',
    description: 'What is TPMJS? Learn about the registry, ecosystem, and architecture.',
    href: '/overview',
    gradient: 'from-emerald-500 to-teal-600',
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
          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
        />
      </svg>
    ),
    features: ['What is TPMJS', 'Ecosystem', 'Architecture'],
  },
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
  {
    id: 'first-tool',
    title: 'Build Your First Tool',
    subtitle: 'Step-by-Step',
    description: 'Create an AI SDK tool from scratch and publish it to the registry in 10 minutes.',
    href: '/first-tool',
    gradient: 'from-orange-500 to-amber-600',
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
          d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
        />
      </svg>
    ),
    features: ['npm init', 'Zod schema', 'npm publish'],
  },
  {
    id: 'agent-example',
    title: 'Real-World Agent',
    subtitle: 'Working Example',
    description: 'Build a complete agent that discovers and uses tools dynamically.',
    href: '/agent-example',
    gradient: 'from-rose-500 to-pink-600',
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
          d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z"
        />
      </svg>
    ),
    features: ['generateText', 'maxSteps', 'Meta-tools'],
  },
  {
    id: 'playground',
    title: 'Interactive Playground',
    subtitle: 'Try Before Install',
    description: 'Test any tool directly in your browser without installation.',
    href: '/playground',
    gradient: 'from-sky-500 to-blue-600',
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
          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
        />
      </svg>
    ),
    features: ['Live execution', 'Schema forms', 'JSON output'],
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
      <div className="relative z-10 max-w-6xl w-full">
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
        <div className="grid md:grid-cols-3 gap-6">
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
