import type { Hook } from '@oclif/core';

const hook: Hook<'init'> = async function () {
  // Initialization hook - runs before any command
  // Can be used for:
  // - Checking for updates
  // - Loading config
  // - Setting up analytics (if opted in)
  // - etc.
};

export default hook;
