import { Command, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createOutput } from '../../lib/output.js';

export default class PublishPreview extends Command {
  static description = 'Preview how your tool will appear on tpmjs.com';

  static examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --path ./my-tool',
  ];

  static flags = {
    path: Flags.string({
      char: 'p',
      description: 'Path to package directory',
      default: '.',
    }),
    json: Flags.boolean({
      description: 'Output in JSON format',
      default: false,
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Show verbose output',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PublishPreview);
    const output = createOutput(flags);

    const packagePath = path.resolve(flags.path, 'package.json');

    if (!fs.existsSync(packagePath)) {
      output.error(`No package.json found at ${packagePath}`);
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    const tpmjs = packageJson.tpmjs;

    if (!tpmjs) {
      output.error('No tpmjs field found in package.json');
      output.text('Run `tpm tool validate` for detailed validation');
      return;
    }

    // Build preview data
    const preview = {
      name: tpmjs.name || packageJson.name,
      description: tpmjs.description || packageJson.description,
      category: tpmjs.category,
      tier: this.determineTier(tpmjs),
      slug: this.generateSlug(tpmjs.name || packageJson.name),
      version: packageJson.version,
      author: this.extractAuthor(packageJson),
      repository: this.extractRepo(packageJson),
      tools: tpmjs.tools || [],
      tags: tpmjs.tags || [],
      documentation: tpmjs.documentation,
      examples: tpmjs.examples,
    };

    if (flags.json) {
      output.json(preview);
      return;
    }

    // Display preview
    output.heading('Tool Preview');
    output.divider();

    output.text(`Name: ${preview.name}`);
    output.text(`Slug: ${preview.slug}`);
    output.text(`Version: ${preview.version}`);
    output.text(`Category: ${preview.category}`);
    output.text(`Tier: ${preview.tier}`);
    output.text('');
    output.text(`Description:`);
    output.text(`  ${preview.description || '(none)'}`);

    if (preview.author) {
      output.text('');
      output.text(`Author: ${preview.author}`);
    }

    if (preview.repository) {
      output.text(`Repository: ${preview.repository}`);
    }

    if (preview.tools.length > 0) {
      output.text('');
      output.text(`Tools (${preview.tools.length}):`);
      for (const tool of preview.tools) {
        if (typeof tool === 'string') {
          output.listItem(tool);
        } else {
          output.listItem(`${tool.name}: ${tool.description || ''}`);
        }
      }
    }

    if (preview.tags.length > 0) {
      output.text('');
      output.text(`Tags: ${preview.tags.join(', ')}`);
    }

    if (preview.documentation) {
      output.text('');
      output.text(`Documentation: ${preview.documentation}`);
    }

    if (preview.examples && preview.examples.length > 0) {
      output.text('');
      output.text(`Examples: ${preview.examples.length} example(s) provided`);
    }

    output.divider();
    output.text('');
    output.info('This is how your tool will appear on tpmjs.com');
    output.text('Run `tpm tool validate` to check for issues before publishing');
  }

  private determineTier(tpmjs: Record<string, unknown>): string {
    // Rich tier requires: tools array with schemas, examples, documentation
    const hasTools = Array.isArray(tpmjs.tools) && tpmjs.tools.length > 0;
    const hasExamples = Array.isArray(tpmjs.examples) && tpmjs.examples.length > 0;
    const hasDocumentation = Boolean(tpmjs.documentation);

    if (hasTools && hasExamples && hasDocumentation) {
      return 'rich';
    }
    return 'minimal';
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/@/g, '')
      .replace(/\//g, '-')
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private extractAuthor(packageJson: Record<string, unknown>): string | undefined {
    const author = packageJson.author;
    if (typeof author === 'string') {
      return author;
    }
    if (author && typeof author === 'object') {
      const authorObj = author as Record<string, string>;
      return authorObj.name || authorObj.email;
    }
    return undefined;
  }

  private extractRepo(packageJson: Record<string, unknown>): string | undefined {
    const repo = packageJson.repository;
    if (typeof repo === 'string') {
      return repo;
    }
    if (repo && typeof repo === 'object') {
      return (repo as Record<string, string>).url;
    }
    return undefined;
  }
}
