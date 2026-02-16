/**
 * Ambient Deno type declarations for sandbox-shell tools.
 * Only declares the APIs actually used — avoids pulling in @types/deno
 * which conflicts with Node.js types in the monorepo.
 */

declare namespace Deno {
  interface CommandOptions {
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    stdout?: 'piped' | 'inherit' | 'null';
    stderr?: 'piped' | 'inherit' | 'null';
    stdin?: 'piped' | 'inherit' | 'null';
  }

  interface CommandOutput {
    readonly code: number;
    readonly stdout: Uint8Array;
    readonly stderr: Uint8Array;
  }

  interface ChildProcess {
    readonly status: Promise<{ success: boolean; code: number }>;
    readonly stdout: ReadableStream<Uint8Array>;
    readonly stderr: ReadableStream<Uint8Array>;
    kill(signal?: string): void;
  }

  class Command {
    constructor(command: string, options?: CommandOptions);
    output(): Promise<CommandOutput>;
    spawn(): ChildProcess;
  }

  function readTextFile(path: string | URL): Promise<string>;

  interface WriteFileOptions {
    create?: boolean;
  }

  function writeTextFile(
    path: string | URL,
    data: string,
    options?: WriteFileOptions
  ): Promise<void>;

  interface DirEntry {
    name: string;
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
  }

  function readDir(path: string | URL): AsyncIterable<DirEntry>;

  interface FileInfo {
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
    size: number;
    mtime: Date | null;
    atime: Date | null;
    birthtime: Date | null;
  }

  function stat(path: string | URL): Promise<FileInfo>;

  function realPath(path: string | URL): Promise<string>;

  interface MkdirOptions {
    recursive?: boolean;
  }

  function mkdir(path: string | URL, options?: MkdirOptions): Promise<void>;
}
