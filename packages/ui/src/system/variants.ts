/**
 * Custom variant system for TPMJS UI components
 * Lightweight, type-safe alternative to class-variance-authority (CVA)
 *
 * @example
 * ```typescript
 * const buttonVariants = createVariants({
 *   base: 'inline-flex items-center',
 *   variants: {
 *     variant: {
 *       default: 'bg-primary text-primary-foreground',
 *       outline: 'border border-border',
 *     },
 *     size: {
 *       sm: 'h-9 px-3',
 *       md: 'h-10 px-4',
 *     },
 *   },
 *   compoundVariants: [
 *     {
 *       conditions: { variant: 'outline', size: 'sm' },
 *       className: 'border-2',
 *     },
 *   ],
 *   defaultVariants: {
 *     variant: 'default',
 *     size: 'md',
 *   },
 * });
 *
 * // Usage
 * buttonVariants({ variant: 'outline', size: 'sm' });
 * // Returns: "inline-flex items-center border border-border h-9 px-3 border-2"
 * ```
 */

/**
 * Configuration for a variant system
 */
export type VariantConfig<T extends Record<string, Record<string, string>>> = {
	/** Base classes applied to all variants */
	base: string;

	/** Variant definitions - each key is a variant axis with possible values */
	variants: T;

	/** Compound variants - apply classes when multiple conditions are met */
	compoundVariants?: Array<{
		conditions: Partial<{ [K in keyof T]: keyof T[K] }>;
		className: string;
	}>;

	/** Default variant values */
	defaultVariants?: Partial<{ [K in keyof T]: keyof T[K] }>;
};

/**
 * Props type for consuming variant functions
 */
export type VariantProps<T extends Record<string, Record<string, string>>> = Partial<{
	[K in keyof T]: keyof T[K];
}>;

/**
 * Creates a type-safe variant composition function
 *
 * @param config - Variant configuration with base, variants, compound variants, and defaults
 * @returns Function that accepts variant props and returns composed className string
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
	config: VariantConfig<T>,
) {
	return function getVariantClasses(props?: VariantProps<T>): string {
		const classes: string[] = [config.base];

		// Merge props with defaults
		const mergedProps = {
			...config.defaultVariants,
			...props,
		} as VariantProps<T>;

		// Apply variant classes
		for (const [key, value] of Object.entries(mergedProps)) {
			const valueStr = value as string;
			if (value !== undefined && value !== null && config.variants[key]?.[valueStr]) {
				classes.push(config.variants[key][valueStr]);
			}
		}

		// Apply compound variants
		if (config.compoundVariants) {
			for (const { conditions, className } of config.compoundVariants) {
				const matches = Object.entries(conditions).every(
					([key, value]) => mergedProps[key as keyof typeof mergedProps] === value,
				);
				if (matches) {
					classes.push(className);
				}
			}
		}

		// Filter out any empty strings and join
		return classes.filter(Boolean).join(" ");
	};
}
