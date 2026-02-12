/**
 * Block metadata for HLLM tools
 * This file provides metadata for the blocks validator
 */
import {
  // Messages
  addMessage,
  clearMessages,
  createApiKey,
  createPrompt,
  createSession,
  deleteApiKey,
  deleteEnvVar,
  deleteFile,
  deletePrompt,
  deleteSession,
  describeTool,
  executeTool,
  // Topology
  executeTopology,
  // Export/Import
  exportData,
  // Prompt Generation
  generatePrompt,
  // Metrics
  getAgentMetrics,
  // Logs
  getExecutionLogs,
  getFile,
  getPrompt,
  getSession,
  getStats,
  // User
  getUserProfile,
  getUserStats,
  // Public
  healthCheck,
  importData,
  improvePrompt,
  incrementPromptUsage,
  // API Keys
  listApiKeys,
  // Env Vars
  listEnvVars,
  // Models
  listModels,
  // Prompts
  listPrompts,
  // Sessions
  listSessions,
  // Tools
  listTools,
  setEnvVar,
  // TTS
  textToSpeech,
  updatePrompt,
  updateSession,
  updateUserProfile,
  // Files
  uploadFile,
} from './src/index.js';

export const block = {
  name: 'hllm',
  description:
    'HLLM API client tools for AI agents. Manage topologies, sessions, prompts, files, and more.',
  tools: {
    // Topology
    executeTopology,
    // Sessions
    listSessions,
    createSession,
    getSession,
    updateSession,
    deleteSession,
    // Messages
    addMessage,
    clearMessages,
    // Prompts
    listPrompts,
    createPrompt,
    getPrompt,
    updatePrompt,
    deletePrompt,
    incrementPromptUsage,
    // User
    getUserProfile,
    updateUserProfile,
    getUserStats,
    // Env Vars
    listEnvVars,
    setEnvVar,
    deleteEnvVar,
    // Files
    uploadFile,
    getFile,
    deleteFile,
    // Models
    listModels,
    // Logs
    getExecutionLogs,
    // Metrics
    getAgentMetrics,
    // Tools
    listTools,
    describeTool,
    executeTool,
    // Prompt Generation
    generatePrompt,
    improvePrompt,
    // Export/Import
    exportData,
    importData,
    // Public
    healthCheck,
    getStats,
    // API Keys
    listApiKeys,
    createApiKey,
    deleteApiKey,
    // TTS
    textToSpeech,
  },
};

export default block;
