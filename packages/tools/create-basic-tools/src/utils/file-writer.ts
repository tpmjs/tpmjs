import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures a directory exists, creating it if necessary
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Writes a file with the given content
 */
export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Copies a template file to the destination
 */
export async function copyTemplate(
  templateName: string,
  destPath: string,
  replacements?: Record<string, string>
): Promise<void> {
  // After tsup compilation, __dirname points to dist/
  // Templates are at package root, so we only need to go up one level
  const templatePath = path.join(__dirname, '../templates', templateName);
  let content = await fs.readFile(templatePath, 'utf-8');

  // Apply replacements if provided
  if (replacements) {
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replaceAll(`{{${key}}}`, value);
    }
  }

  await writeFile(destPath, content);
}

/**
 * Checks if a path exists
 */
export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Gets the absolute path, resolving relative paths
 */
export function getAbsolutePath(inputPath: string): string {
  return path.resolve(process.cwd(), inputPath);
}
