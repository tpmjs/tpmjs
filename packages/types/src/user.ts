import { z } from 'zod';

// ============================================================================
// Reserved Usernames (defined first since UsernameSchema references it)
// ============================================================================

export const RESERVED_USERNAMES = [
  // System routes
  'admin',
  'api',
  'auth',
  'dashboard',
  'help',
  'support',
  'system',
  'www',
  'settings',
  'login',
  'logout',
  'register',
  'signup',
  'signin',
  // Content routes
  'agents',
  'collections',
  'tools',
  'tool',
  'playground',
  'explore',
  'search',
  // Reserved for future
  'about',
  'blog',
  'docs',
  'pricing',
  'terms',
  'privacy',
  'contact',
  'status',
  // Brand/official
  'tpmjs',
  'tpm',
  'official',
] as const;

// ============================================================================
// Username Validation
// ============================================================================

/**
 * Username requirements:
 * - 3-30 characters
 * - Lowercase alphanumeric and hyphens only
 * - Must start and end with alphanumeric (unless 1-2 chars)
 * - No consecutive hyphens
 */
export const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9]|(?:-(?!-))){1,28}[a-z0-9]$|^[a-z0-9]{1,2}$/;

export const UsernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be 30 characters or less')
  .regex(USERNAME_REGEX, 'Username must be lowercase, alphanumeric, with single hyphens only')
  .refine(
    (val) => !(RESERVED_USERNAMES as readonly string[]).includes(val),
    'This username is reserved'
  );

// ============================================================================
// User Schemas
// ============================================================================

export const UpdateUserProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  username: UsernameSchema.optional(),
  image: z.string().url('Invalid image URL').nullable().optional(),
});

export const CheckUsernameSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be 30 characters or less')
    .transform((val) => val.toLowerCase()),
});

// ============================================================================
// Response Types
// ============================================================================

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  username: z.string().nullable(),
  email: z.string().email(),
  image: z.string().nullable(),
  createdAt: z.date(),
});

export const PublicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  image: z.string().nullable(),
});

export const UsernameAvailabilitySchema = z.object({
  username: z.string(),
  available: z.boolean(),
  reason: z.string().optional(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
export type CheckUsernameInput = z.infer<typeof CheckUsernameSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type PublicUser = z.infer<typeof PublicUserSchema>;
export type UsernameAvailability = z.infer<typeof UsernameAvailabilitySchema>;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert a display name to a URL-friendly username suggestion.
 */
export function suggestUsername(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove consecutive hyphens
    .replace(/^-+|-+$/g, '') // Trim hyphens
    .slice(0, 30);
}

/**
 * Check if a username is valid (without checking availability).
 */
export function isValidUsername(username: string): boolean {
  return UsernameSchema.safeParse(username).success;
}
