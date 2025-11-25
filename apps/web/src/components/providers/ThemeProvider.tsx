"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ComponentProps, createElement } from "react";

export function ThemeProvider({
	children,
	...props
}: ComponentProps<typeof NextThemesProvider>) {
	return createElement(NextThemesProvider, props, children);
}
