# Governance

This document describes how decisions get made in **TPMJS**. It's intentionally lightweight — the project is small and moving fast — and it will grow more formal as the contributor base grows.

## Roles

- **Maintainer** — holds commit and release authority, reviews and merges PRs, triages issues, and owns the roadmap. Current maintainer: [@thomasdavis](https://github.com/thomasdavis).
- **Contributor** — anyone who opens an issue or PR. You don't need to ask permission to contribute; see [CONTRIBUTING.md](./CONTRIBUTING.md).

## How decisions are made

- **Everyday changes** (bug fixes, docs, new tools, non-breaking features): open a PR. A maintainer reviews it against the quality gates (see [CONTRIBUTING.md](./CONTRIBUTING.md)) and merges when it's green and sound.
- **Significant changes** (new public API surface, breaking changes, architectural shifts, protocol behavior): open an issue first to discuss the design before writing code. This avoids wasted effort and keeps the direction coherent. Larger decisions are recorded in the issue and, where they shape architecture, in [`docs/`](./docs).
- **Roadmap & priorities**: tracked publicly via the [roadmap](./ROADMAP.md), GitHub [milestones](https://github.com/tpmjs/tpmjs/milestones), and issues. Anyone can propose an item.

## Releases

Package versions and publishing are maintainer-owned and gated (see [CONTRIBUTING.md](./CONTRIBUTING.md#releasing) and the release workflow). Release intent is tracked in git via Changesets so it's reviewable.

## Becoming a maintainer

Sustained, high-quality contribution — good PRs, helpful triage, thoughtful review — is the path. If you're consistently helping move the project forward, the maintainer will invite you. There's no fixed quota; it's about trust and track record.

## Code of Conduct

All participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md). Concerns: **hello@tpmjs.com**.

## Changing this document

Governance changes are proposed via PR and decided by the maintainer, taking community input into account. As the project grows we expect to move toward a multi-maintainer model with a documented voting process.
