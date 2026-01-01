import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqlite: Database.Database | null = null;

/**
 * Get or create the database connection
 */
export function getDatabase(dbPath = './data/tool-ideas.db') {
  if (db) return db;

  // Ensure directory exists
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  db = drizzle(sqlite, { schema });

  // Initialize tables if they don't exist
  initializeTables(sqlite);

  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}

/**
 * Initialize database tables
 */
function initializeTables(sqlite: Database.Database) {
  sqlite.exec(`
    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      tpmjs_category TEXT NOT NULL,
      description TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_categories_tpmjs ON categories(tpmjs_category);

    -- Verbs
    CREATE TABLE IF NOT EXISTS verbs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      past_tense TEXT,
      gerund TEXT,
      verb_type TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_verbs_type ON verbs(verb_type);

    -- Objects
    CREATE TABLE IF NOT EXISTS objects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      plural TEXT,
      domain TEXT NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_objects_domain ON objects(domain);

    -- Contexts
    CREATE TABLE IF NOT EXISTS contexts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      context_type TEXT NOT NULL,
      description TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_contexts_type ON contexts(context_type);

    -- Qualifiers
    CREATE TABLE IF NOT EXISTS qualifiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      qualifier_type TEXT NOT NULL,
      description TEXT
    );

    -- Verb-Object Compatibility
    CREATE TABLE IF NOT EXISTS verb_object_compatibility (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      verb_id INTEGER NOT NULL REFERENCES verbs(id),
      object_id INTEGER NOT NULL REFERENCES objects(id),
      score REAL NOT NULL DEFAULT 1.0,
      reasoning TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_verb_object_unique ON verb_object_compatibility(verb_id, object_id);

    -- Category-Verb Affinity
    CREATE TABLE IF NOT EXISTS category_verb_affinity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      verb_id INTEGER NOT NULL REFERENCES verbs(id),
      score REAL NOT NULL DEFAULT 1.0
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_category_verb_unique ON category_verb_affinity(category_id, verb_id);

    -- Tool Skeletons
    CREATE TABLE IF NOT EXISTS tool_skeletons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL UNIQUE,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      verb_id INTEGER NOT NULL REFERENCES verbs(id),
      object_id INTEGER NOT NULL REFERENCES objects(id),
      context_id INTEGER REFERENCES contexts(id),
      qualifier_ids TEXT,
      raw_name TEXT NOT NULL,
      compatibility_score REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_skeletons_status ON tool_skeletons(status);
    CREATE INDEX IF NOT EXISTS idx_skeletons_score ON tool_skeletons(compatibility_score);
    CREATE INDEX IF NOT EXISTS idx_skeletons_category ON tool_skeletons(category_id);

    -- Tool Ideas (enriched)
    CREATE TABLE IF NOT EXISTS tool_ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skeleton_id INTEGER NOT NULL UNIQUE REFERENCES tool_skeletons(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      parameters_json TEXT NOT NULL,
      returns_json TEXT NOT NULL,
      ai_agent_json TEXT,
      tags_json TEXT,
      examples_json TEXT,
      is_nonsensical INTEGER NOT NULL DEFAULT 0,
      nonsense_reason TEXT,
      quality_score REAL,
      model_used TEXT NOT NULL,
      prompt_tokens INTEGER,
      completion_tokens INTEGER,
      processing_time_ms INTEGER,
      enriched_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_ideas_quality ON tool_ideas(quality_score);
    CREATE INDEX IF NOT EXISTS idx_ideas_nonsensical ON tool_ideas(is_nonsensical);

    -- Processing Batches
    CREATE TABLE IF NOT EXISTS processing_batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_number INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      skeleton_start_id INTEGER NOT NULL,
      skeleton_end_id INTEGER NOT NULL,
      total_count INTEGER NOT NULL,
      processed_count INTEGER NOT NULL DEFAULT 0,
      success_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0,
      nonsensical_count INTEGER NOT NULL DEFAULT 0,
      started_at TEXT,
      completed_at TEXT,
      error_message TEXT,
      cost_usd REAL
    );
    CREATE INDEX IF NOT EXISTS idx_batches_status ON processing_batches(status);

    -- Processing Errors
    CREATE TABLE IF NOT EXISTS processing_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skeleton_id INTEGER NOT NULL REFERENCES tool_skeletons(id),
      batch_id INTEGER REFERENCES processing_batches(id),
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_errors_skeleton ON processing_errors(skeleton_id);
  `);
}

export type Database = ReturnType<typeof getDatabase>;
export { schema };
