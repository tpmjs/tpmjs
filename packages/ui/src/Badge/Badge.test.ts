import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
	describe("Rendering", () => {
		it("renders a badge element", () => {
			render(createElement(Badge, { "data-testid": "badge" }, "Badge"));
			const badge = screen.getByTestId("badge");
			expect(badge).toBeInTheDocument();
			expect(badge.tagName).toBe("DIV");
		});

		it("renders children text", () => {
			render(createElement(Badge, null, "Active"));
			expect(screen.getByText("Active")).toBeInTheDocument();
		});
	});

	describe("Variants", () => {
		it("applies default variant classes", () => {
			render(
				createElement(
					Badge,
					{
						variant: "default",
						"data-testid": "badge",
					},
					"Default",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-primary");
			expect(badge.className).toContain("text-primary-foreground");
			expect(badge.className).toContain("border-primary");
		});

		it("applies secondary variant classes", () => {
			render(
				createElement(
					Badge,
					{
						variant: "secondary",
						"data-testid": "badge",
					},
					"Secondary",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-secondary");
			expect(badge.className).toContain("text-secondary-foreground");
		});

		it("applies outline variant classes", () => {
			render(
				createElement(
					Badge,
					{
						variant: "outline",
						"data-testid": "badge",
					},
					"Outline",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-transparent");
			expect(badge.className).toContain("text-foreground");
			expect(badge.className).toContain("border-border");
		});

		it("applies success variant classes", () => {
			render(
				createElement(
					Badge,
					{
						variant: "success",
						"data-testid": "badge",
					},
					"Success",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-success");
			expect(badge.className).toContain("text-success-foreground");
		});

		it("applies error variant classes", () => {
			render(
				createElement(
					Badge,
					{
						variant: "error",
						"data-testid": "badge",
					},
					"Error",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-error");
			expect(badge.className).toContain("text-error-foreground");
		});

		it("applies warning variant classes", () => {
			render(
				createElement(
					Badge,
					{
						variant: "warning",
						"data-testid": "badge",
					},
					"Warning",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-warning");
			expect(badge.className).toContain("text-warning-foreground");
		});

		it("applies info variant classes", () => {
			render(
				createElement(
					Badge,
					{
						variant: "info",
						"data-testid": "badge",
					},
					"Info",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-info");
			expect(badge.className).toContain("text-info-foreground");
		});
	});

	describe("Sizes", () => {
		it("applies small size classes", () => {
			render(
				createElement(
					Badge,
					{
						size: "sm",
						"data-testid": "badge",
					},
					"Small",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("px-2");
			expect(badge.className).toContain("py-0.5");
			expect(badge.className).toContain("text-xs");
		});

		it("applies medium size classes (default)", () => {
			render(
				createElement(
					Badge,
					{
						size: "md",
						"data-testid": "badge",
					},
					"Medium",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("px-2.5");
			expect(badge.className).toContain("py-1");
			expect(badge.className).toContain("text-sm");
		});

		it("applies large size classes", () => {
			render(
				createElement(
					Badge,
					{
						size: "lg",
						"data-testid": "badge",
					},
					"Large",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("px-3");
			expect(badge.className).toContain("py-1.5");
			expect(badge.className).toContain("text-base");
		});

		it("uses medium size by default", () => {
			render(
				createElement(
					Badge,
					{
						"data-testid": "badge",
					},
					"Default",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("text-sm");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(
				createElement(
					Badge,
					{
						id: "badge-id",
						"data-testid": "badge",
					},
					"Badge",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("id", "badge-id");
		});

		it("passes through title attribute", () => {
			render(
				createElement(
					Badge,
					{
						title: "Badge tooltip",
						"data-testid": "badge",
					},
					"Badge",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("title", "Badge tooltip");
		});

		it("passes through onClick handler", () => {
			let clicked = false;
			render(
				createElement(
					Badge,
					{
						onClick: () => {
							clicked = true;
						},
						"data-testid": "badge",
					},
					"Clickable",
				),
			);
			const badge = screen.getByTestId("badge");
			badge.click();
			expect(clicked).toBe(true);
		});

		it("passes through role attribute", () => {
			render(
				createElement(
					Badge,
					{
						role: "status",
						"data-testid": "badge",
					},
					"Status",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("role", "status");
		});
	});

	describe("ARIA Attributes", () => {
		it("passes through aria-label", () => {
			render(
				createElement(
					Badge,
					{
						"aria-label": "Status badge",
						"data-testid": "badge",
					},
					"Active",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("aria-label", "Status badge");
		});

		it("passes through aria-describedby", () => {
			render(
				createElement(
					Badge,
					{
						"aria-describedby": "description-id",
						"data-testid": "badge",
					},
					"Badge",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("aria-describedby", "description-id");
		});

		it("passes through aria-live for dynamic status", () => {
			render(
				createElement(
					Badge,
					{
						"aria-live": "polite",
						"data-testid": "badge",
					},
					"Updating",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("aria-live", "polite");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(
				createElement(
					Badge,
					{
						className: "custom-badge",
						"data-testid": "badge",
					},
					"Custom",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("custom-badge");
			expect(badge.className).toContain("rounded-full");
			expect(badge.className).toContain("bg-primary");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to badge element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				createElement(
					Badge,
					{
						ref: (el: HTMLDivElement | null) => {
							ref = el;
						},
					},
					"Badge",
				),
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
			expect(ref?.tagName).toBe("DIV");
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(
				createElement(
					Badge,
					{
						"data-testid": "badge",
					},
					"Badge",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("inline-flex");
			expect(badge.className).toContain("items-center");
			expect(badge.className).toContain("font-semibold");
			expect(badge.className).toContain("whitespace-nowrap");
			expect(badge.className).toContain("rounded-full");
		});

		it("includes transition classes", () => {
			render(
				createElement(
					Badge,
					{
						"data-testid": "badge",
					},
					"Badge",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("transition-base");
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with success variant and small size", () => {
			render(
				createElement(
					Badge,
					{
						variant: "success",
						size: "sm",
						"data-testid": "badge",
					},
					"Success",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-success");
			expect(badge.className).toContain("text-xs");
		});

		it("works correctly with error variant and large size", () => {
			render(
				createElement(
					Badge,
					{
						variant: "error",
						size: "lg",
						"data-testid": "badge",
					},
					"Error",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-error");
			expect(badge.className).toContain("text-base");
		});

		it("works correctly with outline variant and custom className", () => {
			render(
				createElement(
					Badge,
					{
						variant: "outline",
						className: "hover:bg-accent",
						"data-testid": "badge",
					},
					"Outlined",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-transparent");
			expect(badge.className).toContain("hover:bg-accent");
		});

		it("works correctly with warning variant and onClick", () => {
			let clicked = false;
			render(
				createElement(
					Badge,
					{
						variant: "warning",
						onClick: () => {
							clicked = true;
						},
						"data-testid": "badge",
					},
					"Warning",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-warning");
			badge.click();
			expect(clicked).toBe(true);
		});
	});

	describe("Content Types", () => {
		it("renders with text content", () => {
			render(createElement(Badge, null, "Text"));
			expect(screen.getByText("Text")).toBeInTheDocument();
		});

		it("renders with numeric content", () => {
			render(createElement(Badge, null, "42"));
			expect(screen.getByText("42")).toBeInTheDocument();
		});

		it("renders with multiple children", () => {
			render(
				createElement(
					Badge,
					null,
					"Count: ",
					createElement("strong", null, "5"),
				),
			);
			expect(screen.getByText("Count:")).toBeInTheDocument();
			expect(screen.getByText("5")).toBeInTheDocument();
		});
	});

	describe("Semantic Usage", () => {
		it("can be used as status indicator with role", () => {
			render(
				createElement(
					Badge,
					{
						variant: "success",
						role: "status",
						"aria-label": "Online status",
						"data-testid": "badge",
					},
					"Online",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("role", "status");
			expect(badge).toHaveAttribute("aria-label", "Online status");
			expect(badge.className).toContain("bg-success");
		});

		it("can be used as notification count", () => {
			render(
				createElement(
					Badge,
					{
						variant: "error",
						size: "sm",
						"aria-label": "3 unread messages",
						"data-testid": "badge",
					},
					"3",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("aria-label", "3 unread messages");
			expect(screen.getByText("3")).toBeInTheDocument();
		});

		it("can be used as tag/label", () => {
			render(
				createElement(
					Badge,
					{
						variant: "outline",
						"data-testid": "badge",
					},
					"TypeScript",
				),
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-transparent");
			expect(screen.getByText("TypeScript")).toBeInTheDocument();
		});
	});
});
