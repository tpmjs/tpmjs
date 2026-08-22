# @tpmjs/tools-ham

## 0.1.1

### Patch Changes

- Return HAM's structured replies once (`{ tool, data }`) instead of duplicating the JSON as `text`; plain-text replies stay `{ tool, text }`.

## 0.1.0

### Minor Changes

- Initial release: all 38 `ham_*` tools of a HAM instance as Vercel AI SDK tools, generated from HAM's catalog; `HAM_API_KEY` / `HAM_API_URL` from env.
