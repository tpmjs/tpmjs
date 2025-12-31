# @tpmjs/tools-json-path-query

Query JSON using JSONPath expressions.

## Installation

```bash
npm install @tpmjs/tools-json-path-query
```

## Usage

```typescript
import { jsonPathQueryTool } from '@tpmjs/tools-json-path-query';

const data = {
  users: [
    { name: 'Alice', age: 25, active: true },
    { name: 'Bob', age: 17, active: false },
    { name: 'Carol', age: 30, active: true }
  ]
};

// Find all active users
const result = await jsonPathQueryTool.execute({
  json: data,
  path: '$.users[?(@.active)].name'
});

console.log(result.results);
// => ["Alice", "Carol"]

console.log(result.count);
// => 2

console.log(result.paths);
// => ["$['users'][0]['name']", "$['users'][2]['name']"]
```

## JSONPath Examples

```typescript
// Get all user names
path: '$.users[*].name'

// Find users older than 18
path: '$.users[?(@.age > 18)]'

// Recursive descent - find all 'price' fields
path: '$..price'

// Array slicing - first 3 items
path: '$.items[0:3]'

// Multiple conditions
path: '$.users[?(@.age > 18 && @.active)]'
```

## Features

- **Powerful queries**: Full JSONPath syntax support
- **Filtering**: Filter arrays with expressions like `?(@.age > 18)`
- **Recursive descent**: Find nested values with `..`
- **Path tracking**: Returns the JSONPath to each result
- **Array operations**: Slicing, filtering, and wildcard selection

## License

MIT
