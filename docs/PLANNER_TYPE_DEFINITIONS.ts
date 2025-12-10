/**
 * ============================================================================
 * PLANNER TYPE DEFINITIONS
 * ============================================================================
 *
 * Complete TypeScript types for the hierarchical cascading tool planner system.
 * Based on research into:
 * - Dynamic tool orchestration
 * - Y×X plan generation (Y alternatives, X steps each)
 * - Skill/context inference from tool plans
 * - Pathway learning algorithms
 * - Fragility management
 *
 * ============================================================================
 */

// ============================================================================
// CORE PRIMITIVES
// ============================================================================

/**
 * A tool from the registry
 *
 *   ┌─────────────────────────────────────┐
 *   │ TOOL                                │
 *   │ ─────                               │
 *   │ packageName: "tpmjs-web-scraper"    │
 *   │ exportName: "scrapeUrl"             │
 *   │ description: "Fetches webpage..."   │
 *   │ parameters: [...]                   │
 *   │ returns: { type: "string" }         │
 *   │ category: "web-scraping"            │
 *   │ qualityScore: 0.87                  │
 *   │ healthStatus: "HEALTHY"             │
 *   └─────────────────────────────────────┘
 */
export interface Tool {
  id: string;
  packageName: string;
  exportName: string;
  description: string;
  parameters: ToolParameter[];
  returns: ToolReturn;
  category: ToolCategory;
  qualityScore: number;
  healthStatus: ToolHealthStatus;
  aiAgent?: ToolAIAgent;
  tier: 'minimal' | 'rich';
}

export interface ToolParameter {
  name: string;
  type: ParameterType;
  required: boolean;
  description: string;
  default?: unknown;
  enum?: string[];
}

export type ParameterType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'string[]'
  | 'number[]';

export interface ToolReturn {
  type: string;
  description: string;
  schema?: JSONSchema;
}

export interface ToolAIAgent {
  useCase: string;
  limitations?: string;
  examples?: string[];
}

export type ToolCategory =
  | 'web-scraping'
  | 'data-analysis'
  | 'file-generation'
  | 'image-processing'
  | 'text-processing'
  | 'communication'
  | 'ai-ml'
  | 'database'
  | 'api-integration'
  | 'general';

export type ToolHealthStatus = 'HEALTHY' | 'BROKEN' | 'UNKNOWN';

export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  [key: string]: unknown;
}

// ============================================================================
// QUERY ANALYSIS
// ============================================================================

/**
 * Result of analyzing a user query
 *
 *   Query: "Scrape competitor prices from example.com and make a report"
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │ QUERY ANALYSIS                                      │
 *   │ ──────────────                                      │
 *   │ intent: "price-comparison-report"                   │
 *   │ entities: [{ type: "url", value: "example.com" }]   │
 *   │ capabilities: ["fetch-webpage", "extract-prices",   │
 *   │                "analyze-data", "generate-report"]   │
 *   │ outputFormat: "pdf"                                 │
 *   │ complexity: 7                                       │
 *   └─────────────────────────────────────────────────────┘
 */
export interface QueryAnalysis {
  intent: string;
  entities: QueryEntity[];
  requiredCapabilities: string[];
  outputFormat?: OutputFormat;
  constraints: QueryConstraints;
  ambiguities: string[];
  complexity: number; // 1-10
}

export interface QueryEntity {
  type: EntityType;
  value: string;
  confidence: number;
}

export type EntityType = 'url' | 'file_path' | 'email' | 'date' | 'number' | 'name' | 'keyword';

export type OutputFormat = 'json' | 'csv' | 'pdf' | 'xlsx' | 'markdown' | 'html' | 'image' | 'text';

export interface QueryConstraints {
  format?: string;
  style?: string;
  maxTime?: number;
  maxCost?: number;
  quality?: 'draft' | 'standard' | 'high';
}

// ============================================================================
// EXECUTION PLANS
// ============================================================================

/**
 * A complete execution plan (one of Y alternatives)
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ EXECUTION PLAN                                              │
 *   │ ──────────────                                              │
 *   │                                                             │
 *   │ metadata:                                                   │
 *   │   query: "Scrape competitor prices..."                     │
 *   │   complexity: 7                                             │
 *   │   estimatedDuration: 45000ms                               │
 *   │   estimatedCost: $0.45                                     │
 *   │   confidence: 0.87                                          │
 *   │                                                             │
 *   │ classification:                                             │
 *   │   approach: "thorough"                                      │
 *   │   riskLevel: "low"                                          │
 *   │                                                             │
 *   │ steps: [step1, step2, step3, ...]                          │
 *   │ skills: [seo, scraping, analysis]                          │
 *   │                                                             │
 *   └─────────────────────────────────────────────────────────────┘
 */
export interface ExecutionPlan {
  id: string;
  version: '1.0';
  metadata: PlanMetadata;
  classification: PlanClassification;
  steps: PlanStep[];
  skills: Skill[];
  expectedOutput: ExpectedOutput;
}

export interface PlanMetadata {
  generatedAt: string;
  query: string;
  complexity: number;
  estimatedDuration: number; // milliseconds
  estimatedCost: number; // USD
  confidence: number; // 0-1
}

export interface PlanClassification {
  approach: 'thorough' | 'quick' | 'balanced';
  riskLevel: 'low' | 'medium' | 'high';
  parallelizable: boolean;
}

export interface ExpectedOutput {
  type: string;
  schema?: JSONSchema;
  description: string;
}

// ============================================================================
// PLAN STEPS
// ============================================================================

/**
 * A single step in an execution plan
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ PLAN STEP                                                   │
 *   │ ─────────                                                   │
 *   │                                                             │
 *   │ id: "step_3"                                                │
 *   │ order: 3                                                    │
 *   │ tool: { packageName: "tpmjs-price-extractor", ... }        │
 *   │ purpose: "Extract and normalize price values"              │
 *   │                                                             │
 *   │ input:                                                      │
 *   │   fromStep: { stepId: "step_2", path: "$.elements" }       │
 *   │   static: { currency: "USD" }                              │
 *   │                                                             │
 *   │ output:                                                     │
 *   │   type: "array"                                             │
 *   │   storeAs: "prices"                                        │
 *   │                                                             │
 *   │ execution:                                                  │
 *   │   timeout: 5000                                             │
 *   │   retries: 2                                                │
 *   │   fallbackTools: ["alt-price-extractor"]                   │
 *   │                                                             │
 *   │ dependsOn: ["step_2"]                                       │
 *   │ parallelGroup: "extraction"                                 │
 *   │                                                             │
 *   └─────────────────────────────────────────────────────────────┘
 */
export interface PlanStep {
  id: string;
  order: number;
  tool: ToolReference;
  purpose: string;
  input: StepInput;
  output: StepOutput;
  execution: StepExecution;
  dependsOn: string[];
  parallelGroup?: string;
}

export interface ToolReference {
  packageName: string;
  exportName: string;
  version?: string;
}

export interface StepInput {
  static?: Record<string, unknown>;
  fromStep?: StepReference | StepReference[];
  fromQuery?: QueryReference;
  computed?: ComputedInput;
}

export interface StepReference {
  stepId: string;
  path: string; // JSONPath
  as?: string; // alias
}

export interface QueryReference {
  entityType: EntityType;
  index?: number;
}

export interface ComputedInput {
  expression: string;
  dependencies: string[];
}

export interface StepOutput {
  type: string;
  storeAs: string;
  validate?: ValidationRule[];
}

export interface ValidationRule {
  rule: 'minLength' | 'maxLength' | 'regex' | 'type' | 'required';
  value: unknown;
  message?: string;
}

export interface StepExecution {
  timeout: number;
  retries: number;
  canSkipOnError: boolean;
  fallbackTools?: string[];
}

// ============================================================================
// SKILLS (CONTEXTUAL KNOWLEDGE)
// ============================================================================

/**
 * A skill is domain knowledge inferred from tools in a plan
 *
 *   Tools in Plan              Inferred Skill
 *   ─────────────              ──────────────
 *   ┌─────────────┐            ┌─────────────────────────────────┐
 *   │web-scraper  │──┐         │ SKILL: web-scraping             │
 *   │html-parser  │──┼────────►│                                 │
 *   │url-validator│──┘         │ context:                        │
 *   └─────────────┘            │   • Rate limiting rules         │
 *                              │   • Robots.txt guidelines       │
 *                              │   • CSS selector best practices │
 *                              └─────────────────────────────────┘
 */
export interface Skill {
  domain: ToolCategory;
  context: string;
  tools: Tool[];
  priority: number; // For ordering in context
}

export interface SkillContext {
  domain: ToolCategory;
  content: string;
  tokenEstimate: number;
}

// ============================================================================
// EXECUTION CONTEXT
// ============================================================================

/**
 * Runtime state during plan execution
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ EXECUTION CONTEXT                                           │
 *   │ ─────────────────                                           │
 *   │                                                             │
 *   │ query: "Scrape competitor prices..."                       │
 *   │                                                             │
 *   │ variables:                                                  │
 *   │   step_1 ──► { html: "<html>..." }                         │
 *   │   step_2 ──► { elements: [...] }                           │
 *   │   step_3 ──► { prices: [19.99, 24.99] }                    │
 *   │                                                             │
 *   │ completed: { step_1, step_2, step_3 }                      │
 *   │ currentStep: "step_4"                                       │
 *   │                                                             │
 *   │ errors: []                                                  │
 *   │ retryCount: { step_2: 1 }                                  │
 *   │                                                             │
 *   │ timing:                                                     │
 *   │   startTime: 1702234567890                                 │
 *   │   stepTimings: { step_1: 823, step_2: 234, step_3: 567 }   │
 *   │                                                             │
 *   │ tokens:                                                     │
 *   │   input: 4521                                               │
 *   │   output: 1234                                              │
 *   │                                                             │
 *   └─────────────────────────────────────────────────────────────┘
 */
export interface ExecutionContext {
  query: string;
  entities: QueryEntity[];
  variables: Map<string, unknown>;
  completed: Set<string>;
  currentStep: string | null;
  errors: ExecutionError[];
  retryCount: Map<string, number>;
  timing: ExecutionTiming;
  tokens: TokenUsage;
}

export interface ExecutionError {
  stepId: string;
  tool: string;
  error: string;
  timestamp: number;
  recoverable: boolean;
}

export interface ExecutionTiming {
  startTime: number;
  stepTimings: Map<string, number>;
}

export interface TokenUsage {
  input: number;
  output: number;
  perStep: Map<string, { input: number; output: number }>;
}

// ============================================================================
// EXECUTION EVENTS (FOR STREAMING)
// ============================================================================

/**
 * Events emitted during plan execution
 *
 *   Time ────────────────────────────────────────────────────────►
 *
 *   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐
 *   │plan_start│►│step_start│►│step_done │►│step_start│►│plan_end│
 *   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘
 */
export type ExecutionEvent =
  | PlanStartEvent
  | StepStartEvent
  | ContextLoadedEvent
  | StepProgressEvent
  | StepCompleteEvent
  | StepErrorEvent
  | StepSkippedEvent
  | PlanCompleteEvent
  | PlanErrorEvent;

export interface PlanStartEvent {
  type: 'plan_start';
  planId: string;
  totalSteps: number;
  skills: string[];
}

export interface StepStartEvent {
  type: 'step_start';
  stepId: string;
  tool: string;
  purpose: string;
}

export interface ContextLoadedEvent {
  type: 'context_loaded';
  stepId: string;
  tokens: number;
  skills: string[];
}

export interface StepProgressEvent {
  type: 'step_progress';
  stepId: string;
  progress: number; // 0-100
  message?: string;
}

export interface StepCompleteEvent {
  type: 'step_complete';
  stepId: string;
  duration: number;
  resultPreview: string;
}

export interface StepErrorEvent {
  type: 'step_error';
  stepId: string;
  error: string;
  willRetry: boolean;
  fallbackTool?: string;
}

export interface StepSkippedEvent {
  type: 'step_skipped';
  stepId: string;
  reason: string;
}

export interface PlanCompleteEvent {
  type: 'plan_complete';
  success: boolean;
  totalDuration: number;
  totalTokens: number;
  output: unknown;
}

export interface PlanErrorEvent {
  type: 'plan_error';
  error: string;
  failedStep: string;
  completedSteps: string[];
}

// ============================================================================
// PATHWAY LEARNING
// ============================================================================

/**
 * Record of a pathway execution for learning
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ PATHWAY RECORD                                              │
 *   │ ──────────────                                              │
 *   │                                                             │
 *   │ queryPattern: "scrape.*price.*report"                      │
 *   │ steps: ["scraper", "parser", "analyzer", "reporter"]       │
 *   │                                                             │
 *   │ stats:                                                      │
 *   │   successes: 847                                            │
 *   │   failures: 45                                              │
 *   │   avgDuration: 34500ms                                     │
 *   │                                                             │
 *   │ lastUsed: 2024-01-15T10:30:00Z                             │
 *   │ firstUsed: 2024-01-01T08:00:00Z                            │
 *   │                                                             │
 *   └─────────────────────────────────────────────────────────────┘
 */
export interface PathwayRecord {
  id: string;
  queryPattern: string;
  steps: string[]; // Tool IDs in order
  stats: PathwayStats;
  lastUsed: Date;
  firstUsed: Date;
  metadata: PathwayMetadata;
}

export interface PathwayStats {
  successes: number;
  failures: number;
  totalRuns: number;
  avgDuration: number;
  avgTokens: number;
  avgCost: number;
}

export interface PathwayMetadata {
  createdBy: 'user' | 'auto';
  tags: string[];
  notes?: string;
}

/**
 * K-factor represents convergence toward determinism
 *
 *   K = 0.00 ──► No pattern, explore freely
 *   K = 0.50 ──► Weak pattern, prefer but explore
 *   K = 0.85 ──► Strong pattern, mostly deterministic
 *   K = 0.99 ──► Near-locked, rare deviation
 */
export interface KFactorResult {
  value: number; // 0-1
  confidence: number;
  dominantPath: string[] | null;
  totalObservations: number;
}

// ============================================================================
// LEARNING ALGORITHMS
// ============================================================================

/**
 * Configuration for pathway selection algorithms
 */
export interface LearningConfig {
  algorithm: LearningAlgorithm;
  params: AlgorithmParams;
}

export type LearningAlgorithm =
  | 'epsilon_greedy'
  | 'ucb'
  | 'thompson_sampling'
  | 'contextual_bandit'
  | 'q_learning'
  | 'mcts';

export type AlgorithmParams =
  | EpsilonGreedyParams
  | UCBParams
  | ThompsonParams
  | ContextualBanditParams
  | QLearningParams
  | MCTSParams;

export interface EpsilonGreedyParams {
  type: 'epsilon_greedy';
  epsilon: number; // Exploration rate (0-1)
  decayRate: number; // How fast epsilon decays
  minEpsilon: number; // Floor for epsilon
}

export interface UCBParams {
  type: 'ucb';
  explorationConstant: number; // C in UCB formula
}

export interface ThompsonParams {
  type: 'thompson_sampling';
  priorAlpha: number; // Beta distribution prior
  priorBeta: number;
}

export interface ContextualBanditParams {
  type: 'contextual_bandit';
  features: ContextFeature[];
  learningRate: number;
}

export type ContextFeature =
  | 'user_type'
  | 'query_complexity'
  | 'time_of_day'
  | 'previous_success_rate';

export interface QLearningParams {
  type: 'q_learning';
  learningRate: number; // Alpha
  discountFactor: number; // Gamma
  explorationRate: number; // Epsilon
}

export interface MCTSParams {
  type: 'mcts';
  simulations: number;
  explorationConstant: number;
  maxDepth: number;
}

// ============================================================================
// FRAGILITY MANAGEMENT
// ============================================================================

/**
 * Fragility budget for a plan
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ FRAGILITY BUDGET                                            │
 *   │ ────────────────                                            │
 *   │                                                             │
 *   │ Target success rate: 90%                                    │
 *   │                                                             │
 *   │ If each step has P(success) = 0.98:                        │
 *   │   Max steps = floor(log(0.90) / log(0.98)) = 5             │
 *   │                                                             │
 *   │ If each step has P(success) = 0.95:                        │
 *   │   Max steps = floor(log(0.90) / log(0.95)) = 2             │
 *   │                                                             │
 *   └─────────────────────────────────────────────────────────────┘
 */
export interface FragilityBudget {
  targetSuccessRate: number; // e.g., 0.90 for 90%
  avgStepSuccessRate: number; // e.g., 0.98
  maxSteps: number; // Calculated limit
  currentSteps: number;
  withinBudget: boolean;
}

export interface FragilityAnalysis {
  plan: ExecutionPlan;
  budget: FragilityBudget;
  sequentialFragility: number; // P(all sequential steps succeed)
  parallelBenefit: number; // Improvement from parallel execution
  fallbackBenefit: number; // Improvement from fallbacks
  effectiveSuccessRate: number; // Final calculated rate
  recommendations: FragilityRecommendation[];
}

export interface FragilityRecommendation {
  type: 'reduce_steps' | 'add_fallbacks' | 'parallelize' | 'add_checkpoints';
  description: string;
  impact: number; // Estimated improvement
}

// ============================================================================
// PLAN GENERATION OPTIONS
// ============================================================================

/**
 * Options for generating plans
 */
export interface PlanGenerationOptions {
  numPlans: number; // Y in Y×X
  maxStepsPerPlan: number; // Max X
  strategies: PlanStrategy[];
  fragilityBudget?: FragilityBudget;
  preferredCategories?: ToolCategory[];
  excludeTools?: string[];
}

export interface PlanStrategy {
  name: string;
  maxSteps: number;
  preferQuality: boolean;
  preferSpeed: boolean;
  allowParallel: boolean;
  requireFallbacks: boolean;
}

// ============================================================================
// CASCADING CONTEXT
// ============================================================================

/**
 * Context assembled for a single step (minimal footprint)
 *
 *   Traditional: Load ALL tools + ALL docs = ~45,000 tokens
 *
 *   Cascading:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ STEP CONTEXT (~1,500 tokens)                               │
 *   │ ────────────                                               │
 *   │                                                            │
 *   │ ┌──────────────────────────────────────────────────────┐  │
 *   │ │ CURRENT TOOL                           (~400 tokens) │  │
 *   │ │ web-scraper: description, parameters, examples       │  │
 *   │ └──────────────────────────────────────────────────────┘  │
 *   │                                                            │
 *   │ ┌──────────────────────────────────────────────────────┐  │
 *   │ │ DOMAIN CONTEXT                         (~600 tokens) │  │
 *   │ │ Web scraping best practices, rate limits, selectors  │  │
 *   │ └──────────────────────────────────────────────────────┘  │
 *   │                                                            │
 *   │ ┌──────────────────────────────────────────────────────┐  │
 *   │ │ UPCOMING TOOLS                         (~200 tokens) │  │
 *   │ │ Next: html-parser, price-extractor                   │  │
 *   │ └──────────────────────────────────────────────────────┘  │
 *   │                                                            │
 *   │ ┌──────────────────────────────────────────────────────┐  │
 *   │ │ PRIOR RESULTS                          (~300 tokens) │  │
 *   │ │ Summarized output from dependencies                  │  │
 *   │ └──────────────────────────────────────────────────────┘  │
 *   │                                                            │
 *   └────────────────────────────────────────────────────────────┘
 */
export interface CascadingContext {
  currentTool: ToolContext;
  domainContext: SkillContext | null;
  upcomingTools: ToolPreview[];
  priorResults: PriorResult[];
  totalTokens: number;
}

export interface ToolContext {
  tool: Tool;
  formattedDescription: string;
  formattedParameters: string;
  examples: string[];
  tokenEstimate: number;
}

export interface ToolPreview {
  exportName: string;
  purpose: string;
  tokenEstimate: number;
}

export interface PriorResult {
  stepId: string;
  summary: string;
  tokenEstimate: number;
}

// ============================================================================
// PRELOADING / PROBABILITY
// ============================================================================

/**
 * Probability calculation for preloading next tools
 *
 *   Current: step_2 (html-parser)
 *
 *   ┌────────────────────────────────────────┐
 *   │ NEXT TOOL PROBABILITIES                │
 *   │                                        │
 *   │ price-extractor    P = 0.92  ──► LOAD  │
 *   │ text-cleaner       P = 0.78  ──► LOAD  │
 *   │ image-extractor    P = 0.34            │
 *   │ link-extractor     P = 0.21            │
 *   │                                        │
 *   │ Threshold: 0.70                        │
 *   └────────────────────────────────────────┘
 */
export interface ToolProbability {
  tool: Tool;
  probability: number;
  reason: ProbabilityReason;
}

export type ProbabilityReason =
  | 'plan_next' // Next in plan
  | 'plan_soon' // Coming up in plan
  | 'learned_pattern' // Historical data
  | 'output_type_match' // Output type matches input
  | 'same_domain'; // Same category

export interface PreloadDecision {
  toLoad: Tool[];
  threshold: number;
  reasoning: Map<string, ProbabilityReason>;
}

// ============================================================================
// USER INTERFACE TYPES
// ============================================================================

/**
 * Plan summary for UI display
 */
export interface PlanSummary {
  id: string;
  name: string;
  approach: 'thorough' | 'quick' | 'balanced';
  stepCount: number;
  estimatedDuration: string; // "~2 min"
  estimatedCost: string; // "$0.45"
  confidence: number;
  skills: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Execution progress for UI display
 */
export interface ExecutionProgress {
  status: 'idle' | 'planning' | 'running' | 'complete' | 'error';
  currentStep: number;
  totalSteps: number;
  completedSteps: StepProgress[];
  currentStepProgress?: {
    stepId: string;
    tool: string;
    progress: number;
    message?: string;
  };
  contextTokens: number;
  elapsedTime: number;
}

export interface StepProgress {
  stepId: string;
  tool: string;
  status: 'complete' | 'skipped' | 'error';
  duration: number;
  resultPreview?: string;
  error?: string;
}

// ============================================================================
// API TYPES
// ============================================================================

/**
 * Request/Response types for API routes
 */
export interface GeneratePlansRequest {
  query: string;
  numPlans?: number;
  options?: Partial<PlanGenerationOptions>;
}

export interface GeneratePlansResponse {
  success: boolean;
  data: {
    plans: PlanSummary[];
    kFactor: KFactorResult;
    learnedPathAvailable: boolean;
  };
  error?: string;
}

export interface ExecutePlanRequest {
  planId: string;
  query: string;
  options?: {
    useFallbacks?: boolean;
    maxRetries?: number;
  };
}

// Response is SSE stream of ExecutionEvent

export interface GetToolsRequest {
  capability: string;
  category?: ToolCategory;
  limit?: number;
  healthyOnly?: boolean;
}

export interface GetToolsResponse {
  success: boolean;
  data: {
    tools: Tool[];
    total: number;
  };
  error?: string;
}

// ============================================================================
// DATABASE MODELS (for Prisma schema reference)
// ============================================================================

/**
 * Database models for persistence
 *
 * Add to packages/db/prisma/schema.prisma:
 *
 * model PathwayRecord {
 *   id           String   @id @default(cuid())
 *   queryPattern String
 *   steps        String[] // Tool IDs
 *   successes    Int      @default(0)
 *   failures     Int      @default(0)
 *   avgDuration  Float    @default(0)
 *   avgTokens    Float    @default(0)
 *   avgCost      Float    @default(0)
 *   lastUsed     DateTime @default(now())
 *   firstUsed    DateTime @default(now())
 *   createdBy    String   @default("auto")
 *   tags         String[]
 *   notes        String?
 *
 *   @@index([queryPattern])
 *   @@index([lastUsed])
 * }
 *
 * model PlanExecution {
 *   id          String   @id @default(cuid())
 *   planId      String
 *   query       String
 *   steps       Json     // PlanStep[]
 *   status      String   // 'running' | 'complete' | 'error'
 *   output      Json?
 *   totalTokens Int      @default(0)
 *   totalCost   Float    @default(0)
 *   duration    Int      @default(0)
 *   createdAt   DateTime @default(now())
 *   completedAt DateTime?
 *
 *   @@index([planId])
 *   @@index([createdAt])
 * }
 */
export interface PathwayRecordDB {
  id: string;
  queryPattern: string;
  steps: string[];
  successes: number;
  failures: number;
  avgDuration: number;
  avgTokens: number;
  avgCost: number;
  lastUsed: Date;
  firstUsed: Date;
  createdBy: string;
  tags: string[];
  notes: string | null;
}

export interface PlanExecutionDB {
  id: string;
  planId: string;
  query: string;
  steps: PlanStep[];
  status: 'running' | 'complete' | 'error';
  output: unknown | null;
  totalTokens: number;
  totalCost: number;
  duration: number;
  createdAt: Date;
  completedAt: Date | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncGenerator<T> = {
  next(): Promise<{ value: T; done: boolean }>;
  [Symbol.asyncIterator](): AsyncGenerator<T>;
};

export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
