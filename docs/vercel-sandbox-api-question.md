# Vercel Sandbox SDK API Research Request

## Context

We're building a TPMJS executor template that runs npm packages in isolated Vercel Sandbox VMs. The executor needs to:

1. Create a sandbox VM
2. Install an npm package (`npm install @tpmjs/hello@latest`)
3. Write a Node.js script file to the sandbox
4. Execute the script and capture stdout/stderr
5. Parse the output and return results
6. Clean up the sandbox

## Current Problem

Our code assumes the `@vercel/sandbox` SDK has this API:

```typescript
import { Sandbox } from '@vercel/sandbox';

const sandbox = await Sandbox.create({
  runtime: 'node22',
  timeout: 2 * 60 * 1000,
});

// We assumed this signature:
await sandbox.runCommand({
  cmd: 'npm',
  args: ['install', '--no-save', packageSpec],
  cwd: '/vercel/sandbox',
  stdout: someWritableStream,
  stderr: someWritableStream,
});

await sandbox.writeFiles([
  { path: '/vercel/sandbox/execute.cjs', content: Buffer.from(script) },
]);

await sandbox.stop();
```

But TypeScript is telling us the actual signature is:

```
Overload 1 of 3: (command: string, args?: string[], opts?: { signal?: AbortSignal }) => Promise<CommandFinished>
```

## Questions to Research

### 1. What is the exact `@vercel/sandbox` SDK API?

We need the **current, accurate API** for version `^1.1.5` of `@vercel/sandbox`:

- `Sandbox.create()` - What options does it accept?
- How do you run commands? What's the method signature?
- How do you capture stdout/stderr from commands?
- How do you write files to the sandbox?
- How do you read files from the sandbox?
- How do you stop/destroy the sandbox?

### 2. What is the correct way to run commands and capture output?

Our use case:
```typescript
// Install npm package
await sandbox.???('npm install @tpmjs/hello@latest');

// Run a script and capture output
const result = await sandbox.???('node execute.cjs');
console.log(result.stdout); // Need this
console.log(result.stderr); // Need this
```

### 3. What is the correct way to write files?

We need to write a JavaScript file to the sandbox filesystem:
```typescript
const script = `
  const pkg = require('@tpmjs/hello');
  const result = await pkg.helloWorld.execute({ name: 'World' });
  console.log(JSON.stringify({ result }));
`;

await sandbox.???('/path/to/script.js', script);
```

### 4. What is the default working directory?

- Where does the sandbox start?
- Where should we install npm packages?
- What directories are writable?

### 5. Complete working example

Please provide a complete, working example that:
1. Creates a sandbox
2. Installs an npm package
3. Writes a script file
4. Runs the script
5. Captures and returns stdout
6. Cleans up

## Reference Links

- npm package: https://www.npmjs.com/package/@vercel/sandbox
- Vercel Sandbox docs: https://vercel.com/docs/vercel-sandbox
- Vercel Sandbox SDK reference: https://vercel.com/docs/vercel-sandbox/reference/classes/sandbox

## Expected Output

A corrected version of this code that actually compiles and works:

```typescript
import { Sandbox } from '@vercel/sandbox';

export async function executeTool(packageName: string, toolName: string, params: object) {
  const sandbox = await Sandbox.create({ runtime: 'node22' });

  try {
    // Install package
    await sandbox./* correct method */('npm install ' + packageName);

    // Write script
    const script = `
      const pkg = require('${packageName}');
      const result = await pkg['${toolName}'].execute(${JSON.stringify(params)});
      console.log(JSON.stringify({ __result__: result }));
    `;
    await sandbox./* correct method */('/script.cjs', script);

    // Execute and capture output
    const result = await sandbox./* correct method */('node /script.cjs');

    // Parse output
    const output = JSON.parse(result.stdout);
    return output.__result__;
  } finally {
    await sandbox.stop();
  }
}
```

## Our Environment

- `@vercel/sandbox`: ^1.1.5
- Next.js: ^15.0.0
- TypeScript: ^5.6.0
- Deploying to Vercel
