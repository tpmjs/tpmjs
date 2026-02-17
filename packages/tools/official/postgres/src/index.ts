/**
 * @tpmjs/tools-postgres — PostgreSQL Tools for AI Agents
 *
 * Schema introspection, query execution, data operations,
 * and database monitoring via direct pg connection.
 *
 * @requires DATABASE_URL environment variable
 */

import { jsonSchema, tool } from 'ai';
import pg from 'pg';

const { Pool } = pg;

// ─── Client Infrastructure ──────────────────────────────────────────────────

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is required. Provide a PostgreSQL connection string.'
      );
    }
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

async function query(sql: string, params?: unknown[], timeoutMs = 30000): Promise<pg.QueryResult> {
  const client = await getPool().connect();
  try {
    await client.query(`SET statement_timeout = ${timeoutMs}`);
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

function sanitizeIdentifier(name: string): string {
  return `"${name.replace(/"/g, '""')}"`;
}

// ─── Schema Introspection ────────────────────────────────────────────────────

export const testConnection = tool({
  description:
    'Test connectivity to the PostgreSQL database. Returns server version, current database, user, and connection latency.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    const start = Date.now();
    const result = await query(
      `SELECT version(), current_database(), current_user, inet_server_addr() as server_addr, inet_server_port() as server_port`
    );
    const latencyMs = Date.now() - start;
    const row = result.rows[0];
    return {
      connected: true,
      version: row.version,
      database: row.current_database,
      user: row.current_user,
      serverAddr: row.server_addr,
      serverPort: row.server_port,
      latencyMs,
    };
  },
});

export const getDatabaseInfo = tool({
  description:
    'Get database metadata: size, encoding, collation, active connections, and tablespace.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    const result = await query(`
      SELECT
        d.datname as name,
        pg_size_pretty(pg_database_size(d.datname)) as size,
        pg_database_size(d.datname) as size_bytes,
        pg_encoding_to_char(d.encoding) as encoding,
        d.datcollate as collation,
        d.datctype as ctype,
        d.datconnlimit as connection_limit,
        (SELECT count(*) FROM pg_stat_activity WHERE datname = d.datname) as active_connections,
        t.spcname as tablespace
      FROM pg_database d
      JOIN pg_tablespace t ON d.dattablespace = t.oid
      WHERE d.datname = current_database()
    `);
    return result.rows[0];
  },
});

export interface ListSchemasInput {
  includeSystem?: boolean;
}

export const listSchemas = tool({
  description:
    'List database schemas. Filters pg_* and information_schema by default. Set includeSystem=true to show all.',
  inputSchema: jsonSchema<ListSchemasInput>({
    type: 'object',
    properties: {
      includeSystem: {
        type: 'boolean',
        description: 'Include system schemas (pg_*, information_schema). Default false.',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: ListSchemasInput) {
    const where = input.includeSystem
      ? ''
      : `WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'`;
    const result = await query(`
      SELECT schema_name, schema_owner
      FROM information_schema.schemata
      ${where}
      ORDER BY schema_name
    `);
    return { schemas: result.rows };
  },
});

export interface ListTablesInput {
  schema?: string;
}

export const listTables = tool({
  description:
    'List tables in a schema with row count estimates, total size, and description. Defaults to public schema.',
  inputSchema: jsonSchema<ListTablesInput>({
    type: 'object',
    properties: {
      schema: {
        type: 'string',
        description: 'Schema name. Default "public".',
      },
    },
    additionalProperties: false,
  }),
  async execute(input: ListTablesInput) {
    const schema = input.schema || 'public';
    const result = await query(
      `
      SELECT
        t.tablename as name,
        pg_size_pretty(pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))) as total_size,
        pg_total_relation_size(quote_ident(t.schemaname) || '.' || quote_ident(t.tablename)) as total_size_bytes,
        s.n_live_tup as estimated_rows,
        obj_description((quote_ident(t.schemaname) || '.' || quote_ident(t.tablename))::regclass) as description
      FROM pg_tables t
      LEFT JOIN pg_stat_user_tables s ON t.schemaname = s.schemaname AND t.tablename = s.relname
      WHERE t.schemaname = $1
      ORDER BY t.tablename
      `,
      [schema]
    );
    return { schema, tables: result.rows };
  },
});

export interface DescribeTableInput {
  table: string;
  schema?: string;
}

export const describeTable = tool({
  description:
    'Get full table structure: columns, primary key, foreign keys, indexes, constraints, and check constraints.',
  inputSchema: jsonSchema<DescribeTableInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    required: ['table'],
    additionalProperties: false,
  }),
  async execute(input: DescribeTableInput) {
    const schema = input.schema || 'public';
    const [columns, pk, fks, indexes, constraints] = await Promise.all([
      query(
        `SELECT column_name, data_type, udt_name, is_nullable, column_default,
                character_maximum_length, numeric_precision, numeric_scale,
                col_description((quote_ident($1) || '.' || quote_ident($2))::regclass, ordinal_position) as description
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [schema, input.table]
      ),
      query(
        `SELECT kcu.column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'
         ORDER BY kcu.ordinal_position`,
        [schema, input.table]
      ),
      query(
        `SELECT
           tc.constraint_name,
           kcu.column_name,
           ccu.table_schema AS foreign_table_schema,
           ccu.table_name AS foreign_table_name,
           ccu.column_name AS foreign_column_name
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
         WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'FOREIGN KEY'`,
        [schema, input.table]
      ),
      query(
        `SELECT indexname, indexdef
         FROM pg_indexes
         WHERE schemaname = $1 AND tablename = $2
         ORDER BY indexname`,
        [schema, input.table]
      ),
      query(
        `SELECT tc.constraint_name, tc.constraint_type, cc.check_clause
         FROM information_schema.table_constraints tc
         LEFT JOIN information_schema.check_constraints cc
           ON tc.constraint_name = cc.constraint_name AND tc.constraint_schema = cc.constraint_schema
         WHERE tc.table_schema = $1 AND tc.table_name = $2
         ORDER BY tc.constraint_type, tc.constraint_name`,
        [schema, input.table]
      ),
    ]);

    return {
      schema,
      table: input.table,
      columns: columns.rows,
      primaryKey: pk.rows.map((r) => r.column_name),
      foreignKeys: fks.rows,
      indexes: indexes.rows,
      constraints: constraints.rows,
    };
  },
});

export interface ListColumnsInput {
  table: string;
  schema?: string;
}

export const listColumns = tool({
  description: 'List columns for a table with types, nullability, defaults, and descriptions.',
  inputSchema: jsonSchema<ListColumnsInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    required: ['table'],
    additionalProperties: false,
  }),
  async execute(input: ListColumnsInput) {
    const schema = input.schema || 'public';
    const result = await query(
      `SELECT column_name, data_type, udt_name, is_nullable, column_default,
              character_maximum_length, numeric_precision, numeric_scale,
              col_description((quote_ident($1) || '.' || quote_ident($2))::regclass, ordinal_position) as description
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, input.table]
    );
    return { schema, table: input.table, columns: result.rows };
  },
});

export interface ListIndexesInput {
  table: string;
  schema?: string;
}

export const listIndexes = tool({
  description: 'List indexes for a table: name, definition, size, and usage statistics.',
  inputSchema: jsonSchema<ListIndexesInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    required: ['table'],
    additionalProperties: false,
  }),
  async execute(input: ListIndexesInput) {
    const schema = input.schema || 'public';
    const result = await query(
      `SELECT
         i.indexname as name,
         i.indexdef as definition,
         pg_size_pretty(pg_relation_size(quote_ident(i.schemaname) || '.' || quote_ident(i.indexname))) as size,
         s.idx_scan as scans,
         s.idx_tup_read as tuples_read,
         s.idx_tup_fetch as tuples_fetched
       FROM pg_indexes i
       LEFT JOIN pg_stat_user_indexes s
         ON i.schemaname = s.schemaname AND i.indexname = s.indexrelname
       WHERE i.schemaname = $1 AND i.tablename = $2
       ORDER BY i.indexname`,
      [schema, input.table]
    );
    return { schema, table: input.table, indexes: result.rows };
  },
});

export interface ListConstraintsInput {
  table: string;
  schema?: string;
}

export const listConstraints = tool({
  description:
    'List all constraints for a table: primary keys, foreign keys, unique, check, and exclusion constraints.',
  inputSchema: jsonSchema<ListConstraintsInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    required: ['table'],
    additionalProperties: false,
  }),
  async execute(input: ListConstraintsInput) {
    const schema = input.schema || 'public';
    const result = await query(
      `SELECT
         tc.constraint_name,
         tc.constraint_type,
         kcu.column_name,
         cc.check_clause,
         ccu.table_name AS foreign_table_name,
         ccu.column_name AS foreign_column_name
       FROM information_schema.table_constraints tc
       LEFT JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       LEFT JOIN information_schema.check_constraints cc
         ON tc.constraint_name = cc.constraint_name AND tc.constraint_schema = cc.constraint_schema
       LEFT JOIN information_schema.constraint_column_usage ccu
         ON tc.constraint_name = ccu.constraint_name AND tc.constraint_schema = ccu.constraint_schema
         AND tc.constraint_type = 'FOREIGN KEY'
       WHERE tc.table_schema = $1 AND tc.table_name = $2
       ORDER BY tc.constraint_type, tc.constraint_name`,
      [schema, input.table]
    );
    return { schema, table: input.table, constraints: result.rows };
  },
});

export interface ListViewsInput {
  schema?: string;
}

export const listViews = tool({
  description: 'List views and materialized views with their definitions.',
  inputSchema: jsonSchema<ListViewsInput>({
    type: 'object',
    properties: {
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListViewsInput) {
    const schema = input.schema || 'public';
    const [views, matViews] = await Promise.all([
      query(
        `SELECT table_name as name, view_definition as definition, 'view' as type
         FROM information_schema.views
         WHERE table_schema = $1
         ORDER BY table_name`,
        [schema]
      ),
      query(
        `SELECT matviewname as name, definition, 'materialized_view' as type
         FROM pg_matviews
         WHERE schemaname = $1
         ORDER BY matviewname`,
        [schema]
      ),
    ]);
    return { schema, views: [...views.rows, ...matViews.rows] };
  },
});

export interface ListFunctionsInput {
  schema?: string;
}

export const listFunctions = tool({
  description: 'List user-defined functions with signatures, return types, and language.',
  inputSchema: jsonSchema<ListFunctionsInput>({
    type: 'object',
    properties: {
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListFunctionsInput) {
    const schema = input.schema || 'public';
    const result = await query(
      `SELECT
         p.proname as name,
         pg_get_function_arguments(p.oid) as arguments,
         pg_get_function_result(p.oid) as return_type,
         l.lanname as language,
         p.provolatile as volatility,
         obj_description(p.oid) as description
       FROM pg_proc p
       JOIN pg_namespace n ON p.pronamespace = n.oid
       JOIN pg_language l ON p.prolang = l.oid
       WHERE n.nspname = $1
         AND p.prokind = 'f'
       ORDER BY p.proname`,
      [schema]
    );
    return { schema, functions: result.rows };
  },
});

export interface ListEnumsInput {
  schema?: string;
}

export const listEnums = tool({
  description: 'List custom enum types with their values.',
  inputSchema: jsonSchema<ListEnumsInput>({
    type: 'object',
    properties: {
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    additionalProperties: false,
  }),
  async execute(input: ListEnumsInput) {
    const schema = input.schema || 'public';
    const result = await query(
      `SELECT
         t.typname as name,
         array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
       FROM pg_type t
       JOIN pg_enum e ON t.oid = e.enumtypid
       JOIN pg_namespace n ON t.typnamespace = n.oid
       WHERE n.nspname = $1
       GROUP BY t.typname
       ORDER BY t.typname`,
      [schema]
    );
    return { schema, enums: result.rows };
  },
});

// ─── Query Execution ─────────────────────────────────────────────────────────

export interface ExecuteQueryInput {
  sql: string;
  params?: unknown[];
  limit?: number;
}

export const executeQuery = tool({
  description:
    'Execute a SQL query with parameterized values. Returns up to `limit` rows (default 100). 30s timeout. Use $1, $2 etc. for parameters.',
  inputSchema: jsonSchema<ExecuteQueryInput>({
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL query. Use $1, $2, etc. for parameters.' },
      params: {
        type: 'array',
        items: {},
        description: 'Parameter values for $1, $2, etc.',
      },
      limit: {
        type: 'number',
        description: 'Max rows to return. Default 100.',
      },
    },
    required: ['sql'],
    additionalProperties: false,
  }),
  async execute(input: ExecuteQueryInput) {
    const limit = input.limit ?? 100;
    const sql = input.sql.trim();

    // For SELECT queries, wrap with LIMIT if not already present
    const isSelect = /^\s*(SELECT|WITH)\b/i.test(sql);
    const hasLimit = /\bLIMIT\b/i.test(sql);
    const finalSql = isSelect && !hasLimit ? `${sql} LIMIT ${limit + 1}` : sql;

    const result = await query(finalSql, input.params);

    const truncated = isSelect && !hasLimit && result.rows.length > limit;
    const rows = truncated ? result.rows.slice(0, limit) : result.rows;

    return {
      rows,
      rowCount: result.rowCount,
      truncated,
      fields: result.fields.map((f) => ({ name: f.name, dataTypeID: f.dataTypeID })),
    };
  },
});

export interface ExplainQueryInput {
  sql: string;
  params?: unknown[];
}

export const explainQuery = tool({
  description:
    'Run EXPLAIN ANALYZE on a query. Returns execution plan with costs, actual times, and buffer usage. WARNING: This executes the query — use with caution on write queries.',
  inputSchema: jsonSchema<ExplainQueryInput>({
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'SQL query to explain.' },
      params: {
        type: 'array',
        items: {},
        description: 'Parameter values for $1, $2, etc.',
      },
    },
    required: ['sql'],
    additionalProperties: false,
  }),
  async execute(input: ExplainQueryInput) {
    const result = await query(
      `EXPLAIN (ANALYZE, COSTS, BUFFERS, FORMAT JSON) ${input.sql}`,
      input.params
    );
    return { plan: result.rows[0]['QUERY PLAN'] };
  },
});

// ─── Data Operations ─────────────────────────────────────────────────────────

export interface InsertRowsInput {
  table: string;
  schema?: string;
  columns: string[];
  rows: unknown[][];
}

export const insertRows = tool({
  description:
    'Insert rows into a table. Provide column names and an array of value arrays. Returns inserted rows.',
  inputSchema: jsonSchema<InsertRowsInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
      columns: {
        type: 'array',
        items: { type: 'string' },
        description: 'Column names.',
      },
      rows: {
        type: 'array',
        items: { type: 'array', items: {} },
        description: 'Array of value arrays. Each inner array is one row.',
      },
    },
    required: ['table', 'columns', 'rows'],
    additionalProperties: false,
  }),
  async execute(input: InsertRowsInput) {
    const schema = input.schema || 'public';
    const tableName = `${sanitizeIdentifier(schema)}.${sanitizeIdentifier(input.table)}`;
    const cols = input.columns.map(sanitizeIdentifier).join(', ');

    const valueSets: string[] = [];
    const allParams: unknown[] = [];
    let paramIndex = 1;

    for (const row of input.rows) {
      const placeholders = row.map(() => `$${paramIndex++}`);
      valueSets.push(`(${placeholders.join(', ')})`);
      allParams.push(...row);
    }

    const sql = `INSERT INTO ${tableName} (${cols}) VALUES ${valueSets.join(', ')} RETURNING *`;
    const result = await query(sql, allParams);
    return { insertedRows: result.rows, count: result.rowCount };
  },
});

export interface UpdateRowsInput {
  table: string;
  schema?: string;
  set: Record<string, unknown>;
  where: string;
  whereParams?: unknown[];
}

export const updateRows = tool({
  description:
    'Update rows in a table. WHERE clause is required for safety. Returns count of affected rows.',
  inputSchema: jsonSchema<UpdateRowsInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
      set: {
        type: 'object',
        description: 'Column-value pairs to set.',
        additionalProperties: true,
      },
      where: {
        type: 'string',
        description: 'WHERE clause (without the WHERE keyword). Use $1, $2 etc. for whereParams.',
      },
      whereParams: {
        type: 'array',
        items: {},
        description: 'Parameter values for the WHERE clause.',
      },
    },
    required: ['table', 'set', 'where'],
    additionalProperties: false,
  }),
  async execute(input: UpdateRowsInput) {
    const schema = input.schema || 'public';
    const tableName = `${sanitizeIdentifier(schema)}.${sanitizeIdentifier(input.table)}`;

    const entries = Object.entries(input.set);
    const setParams: unknown[] = [];
    const setClauses = entries.map((entry, i) => {
      setParams.push(entry[1]);
      return `${sanitizeIdentifier(entry[0])} = $${i + 1}`;
    });

    // Offset the WHERE params
    const offset = entries.length;
    const whereClause = input.where.replace(/\$(\d+)/g, (_, n) => `$${Number(n) + offset}`);
    const allParams = [...setParams, ...(input.whereParams || [])];

    const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereClause}`;
    const result = await query(sql, allParams);
    return { affectedRows: result.rowCount };
  },
});

export interface DeleteRowsInput {
  table: string;
  schema?: string;
  where: string;
  whereParams?: unknown[];
}

export const deleteRows = tool({
  description:
    'Delete rows from a table. WHERE clause is required for safety. Returns count of affected rows.',
  inputSchema: jsonSchema<DeleteRowsInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
      where: {
        type: 'string',
        description: 'WHERE clause (without the WHERE keyword). Use $1, $2 etc. for whereParams.',
      },
      whereParams: {
        type: 'array',
        items: {},
        description: 'Parameter values for the WHERE clause.',
      },
    },
    required: ['table', 'where'],
    additionalProperties: false,
  }),
  async execute(input: DeleteRowsInput) {
    const schema = input.schema || 'public';
    const tableName = `${sanitizeIdentifier(schema)}.${sanitizeIdentifier(input.table)}`;

    const sql = `DELETE FROM ${tableName} WHERE ${input.where}`;
    const result = await query(sql, input.whereParams);
    return { affectedRows: result.rowCount };
  },
});

// ─── Monitoring ──────────────────────────────────────────────────────────────

export interface GetTableStatsInput {
  table: string;
  schema?: string;
}

export const getTableStats = tool({
  description:
    'Get table statistics: live/dead tuples, sequential/index scans, last vacuum and analyze timestamps.',
  inputSchema: jsonSchema<GetTableStatsInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    required: ['table'],
    additionalProperties: false,
  }),
  async execute(input: GetTableStatsInput) {
    const schema = input.schema || 'public';
    const result = await query(
      `SELECT
         relname as table_name,
         n_live_tup as live_tuples,
         n_dead_tup as dead_tuples,
         n_tup_ins as inserts,
         n_tup_upd as updates,
         n_tup_del as deletes,
         seq_scan as sequential_scans,
         seq_tup_read as sequential_tuples_read,
         idx_scan as index_scans,
         idx_tup_fetch as index_tuples_fetched,
         last_vacuum,
         last_autovacuum,
         last_analyze,
         last_autoanalyze,
         vacuum_count,
         autovacuum_count,
         analyze_count,
         autoanalyze_count
       FROM pg_stat_user_tables
       WHERE schemaname = $1 AND relname = $2`,
      [schema, input.table]
    );
    return result.rows[0] || { error: 'Table not found' };
  },
});

export interface GetTableSizeInput {
  table: string;
  schema?: string;
}

export const getTableSize = tool({
  description: 'Get size breakdown for a table: table data, indexes, toast, and total.',
  inputSchema: jsonSchema<GetTableSizeInput>({
    type: 'object',
    properties: {
      table: { type: 'string', description: 'Table name.' },
      schema: { type: 'string', description: 'Schema name. Default "public".' },
    },
    required: ['table'],
    additionalProperties: false,
  }),
  async execute(input: GetTableSizeInput) {
    const schema = input.schema || 'public';
    const qualifiedName = `${sanitizeIdentifier(schema)}.${sanitizeIdentifier(input.table)}`;
    const result = await query(
      `SELECT
         pg_size_pretty(pg_relation_size('${qualifiedName}')) as table_size,
         pg_relation_size('${qualifiedName}') as table_size_bytes,
         pg_size_pretty(pg_indexes_size('${qualifiedName}')) as indexes_size,
         pg_indexes_size('${qualifiedName}') as indexes_size_bytes,
         pg_size_pretty(pg_total_relation_size('${qualifiedName}') - pg_relation_size('${qualifiedName}') - pg_indexes_size('${qualifiedName}')) as toast_size,
         pg_size_pretty(pg_total_relation_size('${qualifiedName}')) as total_size,
         pg_total_relation_size('${qualifiedName}') as total_size_bytes`
    );
    return { schema, table: input.table, ...result.rows[0] };
  },
});

export const listActiveQueries = tool({
  description:
    'List currently running queries: PID, duration, state, query text, and waiting status.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    const result = await query(`
      SELECT
        pid,
        usename as user,
        datname as database,
        state,
        query,
        backend_start,
        query_start,
        now() - query_start as duration,
        wait_event_type,
        wait_event
      FROM pg_stat_activity
      WHERE state != 'idle'
        AND pid != pg_backend_pid()
      ORDER BY query_start ASC
    `);
    return { queries: result.rows };
  },
});

export const listLocks = tool({
  description:
    'List current locks with relation names, lock modes, granted status, and blocking info.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    const result = await query(`
      SELECT
        l.pid,
        l.locktype,
        COALESCE(c.relname, l.relation::text) as relation,
        l.mode,
        l.granted,
        l.waitstart,
        a.usename as user,
        a.query,
        a.state
      FROM pg_locks l
      LEFT JOIN pg_class c ON l.relation = c.oid
      LEFT JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.pid != pg_backend_pid()
      ORDER BY l.pid
    `);
    return { locks: result.rows };
  },
});

export const listExtensions = tool({
  description: 'List installed and available PostgreSQL extensions.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    const [installed, available] = await Promise.all([
      query(`
        SELECT extname as name, extversion as version, n.nspname as schema
        FROM pg_extension e
        JOIN pg_namespace n ON e.extnamespace = n.oid
        ORDER BY extname
      `),
      query(`
        SELECT name, default_version, comment
        FROM pg_available_extensions
        WHERE installed_version IS NULL
        ORDER BY name
      `),
    ]);
    return { installed: installed.rows, available: available.rows };
  },
});

export const getVersion = tool({
  description: 'Get PostgreSQL server version details.',
  inputSchema: jsonSchema<Record<string, never>>({
    type: 'object',
    properties: {},
    additionalProperties: false,
  }),
  async execute() {
    const result = await query(
      `SELECT version(), current_setting('server_version_num') as version_num`
    );
    return result.rows[0];
  },
});

// ─── Default Export ──────────────────────────────────────────────────────────

export default {
  // Schema introspection
  testConnection,
  getDatabaseInfo,
  listSchemas,
  listTables,
  describeTable,
  listColumns,
  listIndexes,
  listConstraints,
  listViews,
  listFunctions,
  listEnums,
  // Query execution
  executeQuery,
  explainQuery,
  // Data operations
  insertRows,
  updateRows,
  deleteRows,
  // Monitoring
  getTableStats,
  getTableSize,
  listActiveQueries,
  listLocks,
  listExtensions,
  getVersion,
};
