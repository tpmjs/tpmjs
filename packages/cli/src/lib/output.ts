import Table from 'cli-table3';
import ora, { type Ora } from 'ora';
import pc from 'picocolors';

export interface OutputOptions {
  json?: boolean;
  verbose?: boolean;
  noColor?: boolean;
}

export class OutputFormatter {
  private options: OutputOptions;

  constructor(options: OutputOptions = {}) {
    this.options = options;
  }

  // Output as JSON
  json(data: unknown): void {
    console.log(JSON.stringify(data, null, 2));
  }

  // Output a table
  table<T extends Record<string, unknown>>(
    data: T[],
    columns: { key: keyof T; header: string; width?: number }[]
  ): void {
    if (this.options.json) {
      this.json(data);
      return;
    }

    const table = new Table({
      head: columns.map((col) => pc.bold(col.header)),
      colWidths: columns.map((col) => col.width ?? null),
      style: {
        head: [],
        border: [],
      },
    });

    for (const row of data) {
      table.push(columns.map((col) => String(row[col.key] ?? '')));
    }

    console.log(table.toString());
  }

  // Success message
  success(message: string): void {
    if (this.options.json) return;
    console.log(pc.green('✓'), message);
  }

  // Error message
  error(message: string, details?: string): void {
    if (this.options.json) {
      this.json({ error: message, details });
      return;
    }
    console.error(pc.red('✗'), message);
    if (details && this.options.verbose) {
      console.error(pc.dim(details));
    }
  }

  // Warning message
  warning(message: string): void {
    if (this.options.json) return;
    console.log(pc.yellow('⚠'), message);
  }

  // Info message
  info(message: string): void {
    if (this.options.json) return;
    console.log(pc.blue('ℹ'), message);
  }

  // Debug message (only in verbose mode)
  debug(message: string): void {
    if (this.options.json) return;
    if (this.options.verbose) {
      console.log(pc.dim(`[debug] ${message}`));
    }
  }

  // Plain text output
  text(message: string): void {
    if (this.options.json) return;
    console.log(message);
  }

  // Heading
  heading(text: string): void {
    if (this.options.json) return;
    console.log();
    console.log(pc.bold(pc.underline(text)));
    console.log();
  }

  // Subheading
  subheading(text: string): void {
    if (this.options.json) return;
    console.log(pc.bold(text));
  }

  // Key-value pair
  keyValue(key: string, value: string | number | boolean | undefined): void {
    if (this.options.json) return;
    console.log(`${pc.dim(key + ':')} ${value ?? pc.dim('(not set)')}`);
  }

  // List item
  listItem(text: string, indent = 0): void {
    if (this.options.json) return;
    const prefix = '  '.repeat(indent) + '•';
    console.log(`${prefix} ${text}`);
  }

  // Spinner
  spinner(message: string): Ora {
    return ora({
      text: message,
      isSilent: this.options.json,
    }).start();
  }

  // Blank line
  newLine(): void {
    if (this.options.json) return;
    console.log();
  }

  // Horizontal rule
  hr(): void {
    if (this.options.json) return;
    console.log(pc.dim('─'.repeat(50)));
  }

  // Alias for hr
  divider(): void {
    this.hr();
  }

  // Code block
  code(text: string, language?: string): void {
    if (this.options.json) {
      this.json({ code: text, language });
      return;
    }
    console.log(pc.dim('```' + (language ?? '')));
    console.log(text);
    console.log(pc.dim('```'));
  }

  // Highlight text
  highlight(text: string): string {
    return pc.cyan(text);
  }

  // Dim text
  dim(text: string): string {
    return pc.dim(text);
  }

  // Bold text
  bold(text: string): string {
    return pc.bold(text);
  }

  // Link (just returns text in terminal)
  link(text: string, url: string): string {
    // OSC 8 hyperlink support for modern terminals
    return `\x1b]8;;${url}\x07${pc.underline(pc.blue(text))}\x1b]8;;\x07`;
  }

  // Color helpers
  green(text: string): string {
    return pc.green(text);
  }

  red(text: string): string {
    return pc.red(text);
  }

  yellow(text: string): string {
    return pc.yellow(text);
  }

  blue(text: string): string {
    return pc.blue(text);
  }

  cyan(text: string): string {
    return pc.cyan(text);
  }
}

// Convenience function to create formatter from command flags
export function createOutput(flags: { json?: boolean; verbose?: boolean }): OutputFormatter {
  return new OutputFormatter({
    json: flags.json,
    verbose: flags.verbose,
  });
}
