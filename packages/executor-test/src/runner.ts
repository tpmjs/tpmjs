import pc from 'picocolors';
import { runCoreTests } from './tests/core.js';
import { runStandardTests } from './tests/standard.js';
import type { ComplianceResult, TestSuite } from './types.js';

const VERSION = '0.2.0';
const PROTOCOL_VERSION = '1.1';

function printUsage(): void {
  console.log(`
${pc.bold('TPMJS Executor Compliance Test')} v${VERSION}

${pc.dim('Usage:')}
  npx @tpmjs/executor-test <executor-url> [options]

${pc.dim('Options:')}
  --api-key <key>    API key for authentication (Bearer token)
  --json             Output results as JSON
  --verbose          Show detailed test output
  --help             Show this help message

${pc.dim('Examples:')}
  npx @tpmjs/executor-test https://my-executor.example.com
  npx @tpmjs/executor-test https://my-executor.example.com --api-key sk-xxx
  npx @tpmjs/executor-test https://my-executor.example.com --json
`);
}

function printBanner(target: string): void {
  console.log();
  console.log(pc.bold(`TPMJS Executor Compliance Test v${VERSION}`));
  console.log(pc.dim(`Protocol Version: ${PROTOCOL_VERSION}`));
  console.log(pc.dim(`Target: ${target}`));
  console.log();
}

function printSuite(suite: TestSuite): void {
  const levelLabel =
    suite.level === 'core'
      ? pc.blue('Core')
      : suite.level === 'standard'
        ? pc.yellow('Standard')
        : pc.magenta('Extended');

  console.log(`${levelLabel} ${pc.bold(suite.name)}:`);

  for (const result of suite.results) {
    const icon = result.passed ? pc.green('\u2713') : pc.red('\u2717');
    const name = result.passed ? result.name : pc.red(result.name);
    const duration = pc.dim(`(${result.durationMs}ms)`);

    console.log(`  ${icon} ${name} ${duration}`);

    if (!result.passed && result.message) {
      console.log(`    ${pc.dim(result.message)}`);
    }
  }
  console.log();
}

function printSummary(result: ComplianceResult): void {
  const { summary } = result;

  console.log(pc.bold('Summary:'));
  console.log(
    `  Tests: ${pc.green(`${summary.passed} passed`)}, ${summary.failed > 0 ? pc.red(`${summary.failed} failed`) : `${summary.failed} failed`}, ${summary.totalTests} total`
  );
  console.log();

  const coreStatus = summary.coreCompliant ? pc.green('PASS') : pc.red('FAIL');
  const standardStatus = summary.standardCompliant
    ? pc.green('PASS')
    : summary.coreCompliant
      ? pc.yellow('PARTIAL')
      : pc.red('FAIL');

  console.log(`  Core Compliance:     ${coreStatus}`);
  console.log(`  Standard Compliance: ${standardStatus}`);
  console.log();
}

interface Options {
  apiKey?: string;
  json: boolean;
  verbose: boolean;
}

function parseArgs(args: string[]): { url: string | null; options: Options } {
  const options: Options = {
    json: false,
    verbose: false,
  };

  let url: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
      continue;
    }

    if (arg === '--api-key') {
      i++;
      options.apiKey = args[i] ?? undefined;
      continue;
    }

    if (!arg?.startsWith('-') && !url) {
      url = arg ?? null;
    }
  }

  return { url, options };
}

export async function run(args: string[]): Promise<void> {
  const { url, options } = parseArgs(args);

  if (!url) {
    printUsage();
    process.exit(1);
  }

  // Normalize URL
  const target = url.replace(/\/$/, '');

  if (!options.json) {
    printBanner(target);
  }

  const suites: TestSuite[] = [];

  // Run Core tests
  if (!options.json) {
    console.log(pc.dim('Running Core compliance tests...'));
    console.log();
  }

  const coreSuite = await runCoreTests(target, options.apiKey);
  suites.push(coreSuite);

  if (!options.json) {
    printSuite(coreSuite);
  }

  // Run Standard tests
  if (!options.json) {
    console.log(pc.dim('Running Standard compliance tests...'));
    console.log();
  }

  const standardSuite = await runStandardTests(target, options.apiKey);
  suites.push(standardSuite);

  if (!options.json) {
    printSuite(standardSuite);
  }

  // Calculate summary
  const totalTests = suites.reduce((sum, s) => sum + s.results.length, 0);
  const passed = suites.reduce((sum, s) => sum + s.results.filter((r) => r.passed).length, 0);
  const failed = totalTests - passed;

  const coreCompliant = coreSuite.results.every((r) => r.passed);
  const standardCompliant = coreCompliant && standardSuite.results.every((r) => r.passed);

  const result: ComplianceResult = {
    target,
    protocolVersion: PROTOCOL_VERSION,
    timestamp: new Date().toISOString(),
    suites,
    summary: {
      totalTests,
      passed,
      failed,
      coreCompliant,
      standardCompliant,
    },
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printSummary(result);
  }

  // Exit with error code if not compliant
  process.exit(coreCompliant ? 0 : 1);
}
