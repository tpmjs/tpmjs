import { describe, expect, it } from 'vitest';
import {
  deleteRows,
  describeTable,
  executeQuery,
  explainQuery,
  getDatabaseInfo,
  getTableSize,
  getTableStats,
  getVersion,
  insertRows,
  listActiveQueries,
  listColumns,
  listConstraints,
  listEnums,
  listExtensions,
  listFunctions,
  listIndexes,
  listLocks,
  listSchemas,
  listTables,
  listViews,
  testConnection,
  updateRows,
} from './index.js';

function assertValidTool(tool: any, name: string): void {
  if (!tool) throw new Error(`Tool "${name}" is undefined`);
  if (typeof tool.execute !== 'function')
    throw new Error(`Tool "${name}" missing execute function`);
  if (!tool.description || typeof tool.description !== 'string')
    throw new Error(`Tool "${name}" missing or invalid description`);
  if (!tool.inputSchema && !tool.parameters)
    throw new Error(`Tool "${name}" missing inputSchema/parameters`);
}

describe('postgres tools', () => {
  // Schema introspection
  it('testConnection has valid tool structure', () => {
    assertValidTool(testConnection, 'testConnection');
  });

  it('getDatabaseInfo has valid tool structure', () => {
    assertValidTool(getDatabaseInfo, 'getDatabaseInfo');
  });

  it('listSchemas has valid tool structure', () => {
    assertValidTool(listSchemas, 'listSchemas');
  });

  it('listTables has valid tool structure', () => {
    assertValidTool(listTables, 'listTables');
  });

  it('describeTable has valid tool structure', () => {
    assertValidTool(describeTable, 'describeTable');
  });

  it('listColumns has valid tool structure', () => {
    assertValidTool(listColumns, 'listColumns');
  });

  it('listIndexes has valid tool structure', () => {
    assertValidTool(listIndexes, 'listIndexes');
  });

  it('listConstraints has valid tool structure', () => {
    assertValidTool(listConstraints, 'listConstraints');
  });

  it('listViews has valid tool structure', () => {
    assertValidTool(listViews, 'listViews');
  });

  it('listFunctions has valid tool structure', () => {
    assertValidTool(listFunctions, 'listFunctions');
  });

  it('listEnums has valid tool structure', () => {
    assertValidTool(listEnums, 'listEnums');
  });

  // Query execution
  it('executeQuery has valid tool structure', () => {
    assertValidTool(executeQuery, 'executeQuery');
  });

  it('explainQuery has valid tool structure', () => {
    assertValidTool(explainQuery, 'explainQuery');
  });

  // Data operations
  it('insertRows has valid tool structure', () => {
    assertValidTool(insertRows, 'insertRows');
  });

  it('updateRows has valid tool structure', () => {
    assertValidTool(updateRows, 'updateRows');
  });

  it('deleteRows has valid tool structure', () => {
    assertValidTool(deleteRows, 'deleteRows');
  });

  // Monitoring
  it('getTableStats has valid tool structure', () => {
    assertValidTool(getTableStats, 'getTableStats');
  });

  it('getTableSize has valid tool structure', () => {
    assertValidTool(getTableSize, 'getTableSize');
  });

  it('listActiveQueries has valid tool structure', () => {
    assertValidTool(listActiveQueries, 'listActiveQueries');
  });

  it('listLocks has valid tool structure', () => {
    assertValidTool(listLocks, 'listLocks');
  });

  it('listExtensions has valid tool structure', () => {
    assertValidTool(listExtensions, 'listExtensions');
  });

  it('getVersion has valid tool structure', () => {
    assertValidTool(getVersion, 'getVersion');
  });

  it('exports all 22 tools', async () => {
    const mod = await import('./index.js');
    const defaultExport = mod.default;
    expect(Object.keys(defaultExport)).toHaveLength(22);
  });
});
