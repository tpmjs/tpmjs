import pc from 'picocolors';

/**
 * Logger utilities with colored output
 */

export function success(message: string): void {
  console.log(pc.green(`✓ ${message}`));
}

export function error(message: string): void {
  console.error(pc.red(`✗ ${message}`));
}

export function warn(message: string): void {
  console.warn(pc.yellow(`⚠ ${message}`));
}

export function info(message: string): void {
  console.log(pc.blue(`ℹ ${message}`));
}

export function dim(message: string): void {
  console.log(pc.dim(message));
}

export function bold(message: string): string {
  return pc.bold(message);
}

export function cyan(message: string): string {
  return pc.cyan(message);
}

export function yellow(message: string): string {
  return pc.yellow(message);
}

export function green(message: string): string {
  return pc.green(message);
}
