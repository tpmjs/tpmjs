import { cn } from "@tpmjs/utils/cn";
import { createElement, forwardRef, useState } from "react";
import { Icon } from "../Icon/Icon";
import type { CodeBlockProps } from "./types";
import {
	codeBlockCodeVariants,
	codeBlockContainerVariants,
	codeBlockCopyButtonVariants,
} from "./variants";

/**
 * CodeBlock component
 *
 * Displays formatted code with optional copy functionality.
 * Includes syntax-highlighted display and copy-to-clipboard button.
 * Built with .ts-only React using createElement.
 *
 * @example
 * ```typescript
 * import { CodeBlock } from '@tpmjs/ui/CodeBlock/CodeBlock';
 * import { createElement } from 'react';
 *
 * function MyComponent() {
 *   return createElement(CodeBlock, {
 *     code: 'npm install @tpmjs/registry',
 *     language: 'bash',
 *     size: 'md',
 *     showCopy: true,
 *   });
 * }
 * ```
 */
export const CodeBlock = forwardRef<HTMLDivElement, CodeBlockProps>(
	(
		{
			className,
			code,
			language = "text",
			size = "md",
			showCopy = true,
			...props
		},
		ref,
	) => {
		const [copied, setCopied] = useState(false);

		const handleCopy = async () => {
			try {
				await navigator.clipboard.writeText(code);
				setCopied(true);
				setTimeout(() => setCopied(false), 2000);
			} catch (err) {
				// Silently fail if clipboard API is not available
				console.error("Failed to copy code:", err);
			}
		};

		return createElement(
			"div",
			{
				className: cn(codeBlockContainerVariants(), className),
				ref,
				...props,
			},
			[
				createElement(
					"code",
					{
						key: "code",
						className: codeBlockCodeVariants({
							size,
						}),
						"data-language": language,
					},
					code,
				),
				showCopy &&
					createElement(
						"button",
						{
							key: "copy-button",
							type: "button",
							className: codeBlockCopyButtonVariants(),
							onClick: handleCopy,
							"aria-label": copied ? "Copied!" : "Copy code",
							"data-testid": "copy-button",
						},
						createElement(Icon, {
							icon: copied ? "check" : "copy",
							size: "sm",
						}),
					),
			].filter(Boolean),
		);
	},
);

CodeBlock.displayName = "CodeBlock";
