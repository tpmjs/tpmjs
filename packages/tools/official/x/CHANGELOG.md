# @tpmjs/tools-x

## 0.1.1

### Patch Changes

- Remove module-level caches: the tpmjs executor shares one module instance across callers, so cached data could leak between users of a public collection.

## 0.1.0

### Minor Changes

- Initial release.
