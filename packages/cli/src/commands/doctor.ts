import { Command, Flags } from '@oclif/core';
import * as fs from 'node:fs';
import * as os from 'node:os';
import { getApiKey, getApiUrl, getConfigDir, hasCredentials, getConfig } from '../lib/config.js';
import { TpmClient } from '../lib/api-client.js';
import { createOutput } from '../lib/output.js';

interface DiagnosticCheck {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

export default class Doctor extends Command {
  static description = 'Run diagnostic checks for TPMJS CLI';

  static examples = ['<%= config.bin %> <%= command.id %>'];

  static flags = {
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
    const { flags } = await this.parse(Doctor);
    const output = createOutput(flags);

    const checks: DiagnosticCheck[] = [];

    output.heading('TPMJS CLI Diagnostics');

    // 1. Check Node.js version
    const nodeVersion = process.version;
    const nodeVersionNum = parseInt(nodeVersion.slice(1).split('.')[0] ?? '0', 10);
    checks.push({
      name: 'Node.js Version',
      status: nodeVersionNum >= 18 ? 'ok' : 'error',
      message: nodeVersion,
      details: nodeVersionNum < 18 ? 'Node.js 18+ is required' : undefined,
    });

    // 2. Check config directory
    const configDir = getConfigDir();
    const configExists = fs.existsSync(configDir);
    checks.push({
      name: 'Config Directory',
      status: configExists ? 'ok' : 'warning',
      message: configDir,
      details: configExists ? undefined : 'Config directory will be created on first use',
    });

    // 3. Check authentication
    const hasAuth = hasCredentials() || !!process.env.TPMJS_API_KEY;
    const authSource = process.env.TPMJS_API_KEY ? 'environment' : hasCredentials() ? 'config file' : 'none';
    checks.push({
      name: 'Authentication',
      status: hasAuth ? 'ok' : 'warning',
      message: hasAuth ? `Configured via ${authSource}` : 'Not configured',
      details: hasAuth ? undefined : 'Run `tpm auth login` to authenticate',
    });

    // 4. Check API connectivity
    const apiUrl = getApiUrl();
    try {
      const client = new TpmClient();
      const healthResponse = await client.health();
      checks.push({
        name: 'API Connectivity',
        status: 'ok',
        message: `Connected to ${apiUrl}`,
        details: `Server status: ${healthResponse.status}`,
      });
    } catch (error) {
      checks.push({
        name: 'API Connectivity',
        status: 'error',
        message: `Cannot connect to ${apiUrl}`,
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // 5. Check API authentication (if credentials exist)
    if (hasAuth) {
      const apiKey = getApiKey();
      if (apiKey) {
        try {
          const client = new TpmClient({ apiKey });
          const whoamiResponse = await client.whoami();
          if (whoamiResponse.success && whoamiResponse.data) {
            checks.push({
              name: 'API Authentication',
              status: 'ok',
              message: `Authenticated as ${whoamiResponse.data.email}`,
            });
          } else {
            checks.push({
              name: 'API Authentication',
              status: 'error',
              message: 'API key is invalid',
              details: 'Run `tpm auth login` to re-authenticate',
            });
          }
        } catch (error) {
          checks.push({
            name: 'API Authentication',
            status: 'error',
            message: 'Failed to verify API key',
            details: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    // 6. Check config file
    const config = getConfig();
    checks.push({
      name: 'Configuration',
      status: 'ok',
      message: 'Loaded',
      details: flags.verbose ? JSON.stringify(config, null, 2) : undefined,
    });

    // 7. Check disk space (warning if less than 100MB)
    try {
      const homeDir = os.homedir();
      const stats = fs.statfsSync(homeDir);
      const freeSpaceBytes = stats.bavail * stats.bsize;
      const freeSpaceMB = Math.floor(freeSpaceBytes / (1024 * 1024));
      checks.push({
        name: 'Disk Space',
        status: freeSpaceMB > 100 ? 'ok' : 'warning',
        message: `${freeSpaceMB} MB available`,
        details: freeSpaceMB <= 100 ? 'Low disk space may cause issues' : undefined,
      });
    } catch {
      // Ignore disk space check errors on unsupported platforms
    }

    // Output results
    if (flags.json) {
      const summary = {
        ok: checks.filter((c) => c.status === 'ok').length,
        warnings: checks.filter((c) => c.status === 'warning').length,
        errors: checks.filter((c) => c.status === 'error').length,
      };
      output.json({ checks, summary });
      return;
    }

    for (const check of checks) {
      const icon = check.status === 'ok' ? '✓' : check.status === 'warning' ? '⚠' : '✗';

      output.text(`${icon} ${output.bold(check.name)}: ${check.message}`);
      if (check.details && (flags.verbose || check.status !== 'ok')) {
        output.text(`  ${output.dim(check.details)}`);
      }
    }

    output.newLine();

    const errorCount = checks.filter((c) => c.status === 'error').length;
    const warningCount = checks.filter((c) => c.status === 'warning').length;

    if (errorCount > 0) {
      output.error(`${errorCount} error(s) found`);
    } else if (warningCount > 0) {
      output.warning(`${warningCount} warning(s) found`);
    } else {
      output.success('All checks passed');
    }
  }
}
