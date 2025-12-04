# @tpmjs/create-basic-tools

## 1.0.6

### Patch Changes

- fix: correct template path resolution for npx execution

  Fixed template path resolution from `../../templates` to `../templates` to work correctly when the package is run via npx. After tsup compilation, the bundle is in `dist/` and only needs to go up one level to reach the package root where templates are located.

## 1.0.0

### Major Changes

- Initial release of @tpmjs/create-basic-tools - CLI generator for scaffolding production-ready TPMJS tool packages

  Features:

  - Interactive CLI with beautiful prompts using @clack/prompts
  - Generates packages with minimum 2 tools (ideally 2-3)
  - Zod 4 schemas - uses Zod directly (not jsonSchema wrapper)
  - One file per tool in src/tools/<toolName>.ts
  - TPMJS validated against official schemas from @tpmjs/types
  - Complete package generation ready to publish to npm
  - Works both standalone and in monorepo packages/ folders
