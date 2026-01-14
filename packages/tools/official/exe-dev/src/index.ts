/**
 * exe.dev VM Management Tools for TPMJS
 * Manage virtual machines on exe.dev via SSH commands.
 *
 * Authentication: Set EXE_DEV_SSH_KEY env var with your base64-encoded SSH private key.
 * To encode your key: cat ~/.ssh/id_ed25519 | base64
 *
 * Alternatively, if running locally with SSH already configured, the tools will
 * fall back to your default SSH config.
 */

import { exec as nodeExec } from 'node:child_process';
import { chmodSync, existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { jsonSchema, tool } from 'ai';

const execAsync = promisify(nodeExec);

// Temp key file path (unique per process to avoid conflicts)
const KEY_FILE_PATH = join(tmpdir(), `exe-dev-key-${process.pid}`);

// ============================================================================
// Types
// ============================================================================

export interface ExeVM {
  name: string;
  image?: string;
  status?: string;
  createdAt?: string;
  url?: string;
}

export interface ExeVMList {
  vms: ExeVM[];
  count: number;
}

export interface ExeShareInfo {
  vm: string;
  isPublic: boolean;
  port?: number;
  users: string[];
  links: ExeShareLink[];
}

export interface ExeShareLink {
  token: string;
  url: string;
  createdAt?: string;
}

export interface ExeUserInfo {
  email: string;
  sshKeys: string[];
}

export interface ExeCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Input types
interface CreateInput {
  name?: string;
  image?: string;
  env?: Record<string, string>;
  prompt?: string;
  command?: string;
}

interface VmNameInput {
  name: string;
}

interface ExecInput {
  vm: string;
  command: string;
}

interface VmInput {
  vm: string;
}

interface SharePortInput {
  vm: string;
  port: number;
}

interface ShareUserInput {
  vm: string;
  email: string;
  message?: string;
}

interface ShareRemoveUserInput {
  vm: string;
  email: string;
}

interface ShareRemoveLinkInput {
  vm: string;
  token: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Setup SSH key from environment variable if available.
 * Returns the SSH command options to use the key, or empty string for default SSH config.
 */
function setupSshKey(): string {
  const base64Key = process.env.EXE_DEV_SSH_KEY;

  if (!base64Key) {
    // No env var set, fall back to default SSH config
    return '';
  }

  try {
    // Decode base64 key
    const keyContent = Buffer.from(base64Key, 'base64').toString('utf-8');

    // Write to temp file with secure permissions
    writeFileSync(KEY_FILE_PATH, keyContent, { mode: 0o600 });

    // Double-check permissions (some systems may ignore mode in writeFileSync)
    chmodSync(KEY_FILE_PATH, 0o600);

    // Return SSH options to use this key
    return `-i ${KEY_FILE_PATH} -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null`;
  } catch (error) {
    throw new Error(
      `Failed to setup SSH key from EXE_DEV_SSH_KEY: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Cleanup the temporary SSH key file if it exists.
 */
function cleanupSshKey(): void {
  try {
    if (existsSync(KEY_FILE_PATH)) {
      unlinkSync(KEY_FILE_PATH);
    }
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Build the SSH command with appropriate options.
 */
function buildSshCommand(args: string): string {
  const sshOptions = setupSshKey();
  // Quote the entire args to prevent local shell interpretation
  const escapedArgs = args.replace(/'/g, "'\\''");
  if (sshOptions) {
    return `ssh ${sshOptions} exe.dev '${escapedArgs}'`;
  }
  return `ssh exe.dev '${escapedArgs}'`;
}

async function runExeCommand(args: string): Promise<string> {
  try {
    const command = buildSshCommand(args);
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000, // 60 second timeout
    });
    if (stderr && !stdout) {
      throw new Error(stderr);
    }
    return stdout.trim();
  } catch (error) {
    if (error instanceof Error) {
      const message = error.message || 'Command failed';
      throw new Error(`exe.dev command failed: ${message}`);
    }
    throw error;
  } finally {
    cleanupSshKey();
  }
}

async function runExeCommandWithExit(
  args: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const command = buildSshCommand(args);
    const { stdout, stderr } = await execAsync(command, {
      timeout: 60000,
    });
    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  } catch (error: unknown) {
    const execError = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: execError.stdout?.trim() || '',
      stderr:
        execError.stderr?.trim() || (error instanceof Error ? error.message : 'Unknown error'),
      exitCode: execError.code || 1,
    };
  } finally {
    cleanupSshKey();
  }
}

function parseJsonOutput<T>(output: string): T {
  try {
    return JSON.parse(output) as T;
  } catch {
    throw new Error(`Failed to parse exe.dev output as JSON: ${output}`);
  }
}

// ============================================================================
// Tools
// ============================================================================

/**
 * List all exe.dev VMs
 */
export const list = tool({
  description:
    'List all exe.dev virtual machines for the authenticated user. Returns VM names, images, status, and URLs. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  }),
  async execute(_input: Record<string, never>): Promise<ExeVMList> {
    const output = await runExeCommand('ls --json');
    const vms = parseJsonOutput<ExeVM[]>(output);
    return {
      vms,
      count: vms.length,
    };
  },
});

/**
 * Create a new exe.dev VM
 */
export const create = tool({
  description:
    'Create a new exe.dev virtual machine. Supports custom images, environment variables, and Shelley prompts. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<CreateInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'VM name (auto-generated if not provided)',
      },
      image: {
        type: 'string',
        description: 'Container image (default: exeuntu)',
      },
      env: {
        type: 'object',
        description: 'Environment variables as key-value pairs',
        additionalProperties: { type: 'string' },
      },
      prompt: {
        type: 'string',
        description: 'Initial prompt to send to Shelley after creation',
      },
      command: {
        type: 'string',
        description: 'Container command mode: auto, none, or custom command',
      },
    },
    required: [],
    additionalProperties: false,
  }),
  async execute(input: CreateInput): Promise<ExeVM> {
    const args: string[] = ['new', '--json'];

    if (input.name) {
      args.push(`--name=${input.name}`);
    }
    if (input.image) {
      args.push(`--image=${input.image}`);
    }
    if (input.command) {
      args.push(`--command=${input.command}`);
    }
    if (input.prompt) {
      args.push(`--prompt="${input.prompt.replace(/"/g, '\\"')}"`);
    }
    if (input.env) {
      for (const [key, value] of Object.entries(input.env)) {
        args.push(`--env ${key}=${value}`);
      }
    }

    const output = await runExeCommand(args.join(' '));
    return parseJsonOutput<ExeVM>(output);
  },
});

/**
 * Delete an exe.dev VM
 */
export const deleteVm = tool({
  description:
    'Delete an exe.dev virtual machine. This permanently removes the VM and its data. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<VmNameInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the VM to delete',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: VmNameInput): Promise<{ deleted: boolean; name: string }> {
    await runExeCommand(`rm ${input.name} --json`);
    return { deleted: true, name: input.name };
  },
});

/**
 * Restart an exe.dev VM
 */
export const restart = tool({
  description:
    'Restart an exe.dev virtual machine. Useful for applying changes or recovering from issues. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<VmNameInput>({
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Name of the VM to restart',
      },
    },
    required: ['name'],
    additionalProperties: false,
  }),
  async execute(input: VmNameInput): Promise<{ restarted: boolean; name: string }> {
    await runExeCommand(`restart ${input.name} --json`);
    return { restarted: true, name: input.name };
  },
});

/**
 * Execute a command on an exe.dev VM
 */
export const exec = tool({
  description:
    'Execute a command on an exe.dev VM via SSH. Returns stdout, stderr, and exit code. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<ExecInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM to execute on',
      },
      command: {
        type: 'string',
        description: 'Command to execute on the VM',
      },
    },
    required: ['vm', 'command'],
    additionalProperties: false,
  }),
  async execute(input: ExecInput): Promise<ExeCommandResult> {
    // The command is passed directly - buildSshCommand handles the quoting
    const result = await runExeCommandWithExit(`ssh ${input.vm} -- ${input.command}`);
    return result;
  },
});

/**
 * Show share configuration for a VM
 */
export const shareShow = tool({
  description:
    'Show the sharing configuration for an exe.dev VM including public status, port, users, and share links. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<VmInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM',
      },
    },
    required: ['vm'],
    additionalProperties: false,
  }),
  async execute(input: VmInput): Promise<ExeShareInfo> {
    const output = await runExeCommand(`share show ${input.vm} --json`);
    return parseJsonOutput<ExeShareInfo>(output);
  },
});

/**
 * Make a VM public
 */
export const shareSetPublic = tool({
  description:
    "Make an exe.dev VM's HTTP proxy publicly accessible without authentication. Requires SSH access to exe.dev.",
  inputSchema: jsonSchema<VmInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM to make public',
      },
    },
    required: ['vm'],
    additionalProperties: false,
  }),
  async execute(input: VmInput): Promise<{ success: boolean; vm: string }> {
    await runExeCommand(`share set-public ${input.vm}`);
    return { success: true, vm: input.vm };
  },
});

/**
 * Make a VM private
 */
export const shareSetPrivate = tool({
  description:
    "Make an exe.dev VM's HTTP proxy private, requiring authentication to access. Requires SSH access to exe.dev.",
  inputSchema: jsonSchema<VmInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM to make private',
      },
    },
    required: ['vm'],
    additionalProperties: false,
  }),
  async execute(input: VmInput): Promise<{ success: boolean; vm: string }> {
    await runExeCommand(`share set-private ${input.vm}`);
    return { success: true, vm: input.vm };
  },
});

/**
 * Set proxy port for a VM
 */
export const sharePort = tool({
  description:
    "Configure the HTTP proxy port for an exe.dev VM. Traffic to the VM's URL will be forwarded to this port. Requires SSH access to exe.dev.",
  inputSchema: jsonSchema<SharePortInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM',
      },
      port: {
        type: 'number',
        description: 'Port number to proxy to (e.g., 8080)',
      },
    },
    required: ['vm', 'port'],
    additionalProperties: false,
  }),
  async execute(input: SharePortInput): Promise<{ success: boolean; vm: string; port: number }> {
    await runExeCommand(`share port ${input.vm} ${input.port}`);
    return { success: true, vm: input.vm, port: input.port };
  },
});

/**
 * Add a user to a VM
 */
export const shareAddUser = tool({
  description:
    'Grant a user access to an exe.dev VM by email. Sends an invitation with optional custom message. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<ShareUserInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM',
      },
      email: {
        type: 'string',
        description: 'Email address of user to invite',
      },
      message: {
        type: 'string',
        description: 'Custom invitation message',
      },
    },
    required: ['vm', 'email'],
    additionalProperties: false,
  }),
  async execute(input: ShareUserInput): Promise<{ success: boolean; vm: string; email: string }> {
    let cmd = `share add ${input.vm} ${input.email}`;
    if (input.message) {
      cmd += ` --message="${input.message.replace(/"/g, '\\"')}"`;
    }
    await runExeCommand(cmd);
    return { success: true, vm: input.vm, email: input.email };
  },
});

/**
 * Remove a user from a VM
 */
export const shareRemoveUser = tool({
  description: "Revoke a user's access to an exe.dev VM by email. Requires SSH access to exe.dev.",
  inputSchema: jsonSchema<ShareRemoveUserInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM',
      },
      email: {
        type: 'string',
        description: 'Email address of user to remove',
      },
    },
    required: ['vm', 'email'],
    additionalProperties: false,
  }),
  async execute(
    input: ShareRemoveUserInput
  ): Promise<{ success: boolean; vm: string; email: string }> {
    await runExeCommand(`share remove ${input.vm} ${input.email}`);
    return { success: true, vm: input.vm, email: input.email };
  },
});

/**
 * Create a share link for a VM
 */
export const shareAddLink = tool({
  description:
    'Generate a shareable link for an exe.dev VM that can be shared with anyone. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<VmInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM',
      },
    },
    required: ['vm'],
    additionalProperties: false,
  }),
  async execute(input: VmInput): Promise<ExeShareLink> {
    const output = await runExeCommand(`share add-link ${input.vm} --json`);
    return parseJsonOutput<ExeShareLink>(output);
  },
});

/**
 * Remove a share link from a VM
 */
export const shareRemoveLink = tool({
  description: 'Revoke a shareable link for an exe.dev VM. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<ShareRemoveLinkInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM',
      },
      token: {
        type: 'string',
        description: 'Token of the share link to remove',
      },
    },
    required: ['vm', 'token'],
    additionalProperties: false,
  }),
  async execute(
    input: ShareRemoveLinkInput
  ): Promise<{ success: boolean; vm: string; token: string }> {
    await runExeCommand(`share remove-link ${input.vm} ${input.token}`);
    return { success: true, vm: input.vm, token: input.token };
  },
});

/**
 * Get current user info
 */
export const whoami = tool({
  description:
    "Get the current exe.dev user's account information including email and SSH keys. Requires SSH access to exe.dev.",
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  }),
  async execute(_input: Record<string, never>): Promise<ExeUserInfo> {
    const output = await runExeCommand('whoami --json');
    return parseJsonOutput<ExeUserInfo>(output);
  },
});

/**
 * Install Shelley on a VM
 */
export const shelleyInstall = tool({
  description:
    'Install or upgrade the Shelley agent on an exe.dev VM to the latest version. Requires SSH access to exe.dev.',
  inputSchema: jsonSchema<VmInput>({
    type: 'object',
    properties: {
      vm: {
        type: 'string',
        description: 'Name of the VM to install Shelley on',
      },
    },
    required: ['vm'],
    additionalProperties: false,
  }),
  async execute(input: VmInput): Promise<{ success: boolean; vm: string }> {
    await runExeCommand(`shelley install ${input.vm}`);
    return { success: true, vm: input.vm };
  },
});

// ============================================================================
// Default Export
// ============================================================================

export default {
  list,
  create,
  deleteVm,
  restart,
  exec,
  shareShow,
  shareSetPublic,
  shareSetPrivate,
  sharePort,
  shareAddUser,
  shareRemoveUser,
  shareAddLink,
  shareRemoveLink,
  whoami,
  shelleyInstall,
};
