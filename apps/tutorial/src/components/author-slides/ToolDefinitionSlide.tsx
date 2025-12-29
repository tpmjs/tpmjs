'use client';

import { motion } from 'framer-motion';

const toolDef = [
  { id: 'open', line: '{' },
  { id: 'name', line: '  "name": "formatMarkdownTable",' },
  { id: 'desc', line: '  "description": "Format CSV data as markdown table",' },
  { id: 'params-open', line: '  "parameters": [{' },
  { id: 'param-name', line: '    "name": "csvData",' },
  { id: 'param-type', line: '    "type": "string",' },
  { id: 'param-req', line: '    "required": true,' },
  { id: 'param-desc', line: '    "description": "CSV data to format"' },
  { id: 'params-close', line: '  }],' },
  { id: 'returns', line: '  "returns": { "type": "string" }' },
  { id: 'close', line: '}' },
];

export function ToolDefinitionSlide(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center h-full px-8 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-transparent to-emerald-900/10 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl w-full"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Tool Definition</h2>
        <p className="text-xl text-white/50 mb-10">
          Each tool needs a name, description, and parameter schema
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Tool JSON */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-left"
          >
            <div className="text-xs text-cyan-400/60 font-mono mb-2">tpmjs.tools[0]</div>
            <div className="bg-[#1e1e2e] p-4 rounded-xl font-mono text-xs">
              {toolDef.map((item) => (
                <div
                  key={item.id}
                  className={
                    item.line.includes('"name"')
                      ? 'text-emerald-400'
                      : item.line.includes('"description"')
                        ? 'text-cyan-400'
                        : item.line.includes('"parameters"') || item.line.includes('"returns"')
                          ? 'text-purple-400'
                          : item.line.includes('"type"') || item.line.includes('"required"')
                            ? 'text-yellow-400'
                            : 'text-white/60'
                  }
                >
                  {item.line}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Field explanations */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="text-left space-y-3"
          >
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs font-mono text-emerald-400 mb-1">name</div>
              <div className="text-xs text-white/50">
                Function export name. Must match your code.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs font-mono text-cyan-400 mb-1">description</div>
              <div className="text-xs text-white/50">
                How agents understand what your tool does.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs font-mono text-purple-400 mb-1">parameters</div>
              <div className="text-xs text-white/50">
                Input schema. Each param needs name, type, required.
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <div className="text-xs font-mono text-purple-400 mb-1">returns</div>
              <div className="text-xs text-white/50">
                Output type. Helps agents understand responses.
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-white/40 text-sm"
        >
          Schemas are converted to Zod for AI SDK compatibility.
        </motion.div>
      </motion.div>
    </div>
  );
}
