import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./Badge";

describe("Badge", () => {
	describe("Rendering", () => {
		it("renders a badge element", () => {
			render(<Badge data-testid="badge">Badge</Badge>);
			const badge = screen.getByTestId("badge");
			expect(badge).toBeInTheDocument();
			expect(badge.tagName).toBe("DIV");
		});

		it("renders children text", () => {
			render(<Badge>Active</Badge>);
			expect(screen.getByText("Active")).toBeInTheDocument();
		});
	});

	describe("Variants", () => {
		it("applies default variant classes", () => {
			render(
				<Badge variant="default" data-testid="badge">
					Default
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-primary");
			expect(badge.className).toContain("text-primary-foreground");
			expect(badge.className).toContain("border-primary");
		});

		it("applies secondary variant classes", () => {
			render(
				<Badge variant="secondary" data-testid="badge">
					Secondary
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-secondary");
			expect(badge.className).toContain("text-secondary-foreground");
		});

		it("applies outline variant classes", () => {
			render(
				<Badge variant="outline" data-testid="badge">
					Outline
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-transparent");
			expect(badge.className).toContain("text-foreground");
			expect(badge.className).toContain("border-border");
		});

		it("applies success variant classes", () => {
			render(
				<Badge variant="success" data-testid="badge">
					Success
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-success");
			expect(badge.className).toContain("text-success-foreground");
		});

		it("applies error variant classes", () => {
			render(
				<Badge variant="error" data-testid="badge">
					Error
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-error");
			expect(badge.className).toContain("text-error-foreground");
		});

		it("applies warning variant classes", () => {
			render(
				<Badge variant="warning" data-testid="badge">
					Warning
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-warning");
			expect(badge.className).toContain("text-warning-foreground");
		});

		it("applies info variant classes", () => {
			render(
				<Badge variant="info" data-testid="badge">
					Info
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-info");
			expect(badge.className).toContain("text-info-foreground");
		});
	});

	describe("Sizes", () => {
		it("applies small size classes", () => {
			render(
				<Badge size="sm" data-testid="badge">
					Small
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("px-2");
			expect(badge.className).toContain("py-0.5");
			expect(badge.className).toContain("text-xs");
		});

		it("applies medium size classes (default)", () => {
			render(
				<Badge size="md" data-testid="badge">
					Medium
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("px-2.5");
			expect(badge.className).toContain("py-1");
			expect(badge.className).toContain("text-sm");
		});

		it("applies large size classes", () => {
			render(
				<Badge size="lg" data-testid="badge">
					Large
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("px-3");
			expect(badge.className).toContain("py-1.5");
			expect(badge.className).toContain("text-base");
		});

		it("uses medium size by default", () => {
			render(<Badge data-testid="badge">Default</Badge>);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("text-sm");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(
				<Badge id="badge-id" data-testid="badge">
					Badge
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("id", "badge-id");
		});

		it("passes through title attribute", () => {
			render(
				<Badge title="Badge tooltip" data-testid="badge">
					Badge
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("title", "Badge tooltip");
		});

		it("passes through onClick handler", () => {
			let clicked = false;
			render(
				<Badge
					onClick={() => {
						clicked = true;
					}}
					data-testid="badge"
				>
					Clickable
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			badge.click();
			expect(clicked).toBe(true);
		});

		it("passes through role attribute", () => {
			render(
				<Badge role="status" data-testid="badge">
					Status
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("role", "status");
		});
	});

	describe("ARIA Attributes", () => {
		it("passes through aria-label", () => {
			render(
				<Badge aria-label="Status badge" data-testid="badge">
					Active
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("aria-label", "Status badge");
		});

		it("passes through aria-describedby", () => {
			render(
				<Badge aria-describedby="description-id" data-testid="badge">
					Badge
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("aria-describedby", "description-id");
		});

		it("passes through aria-live for dynamic status", () => {
			render(
				<Badge aria-live="polite" data-testid="badge">
					Updating
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("aria-live", "polite");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(
				<Badge className="custom-badge" data-testid="badge">
					Custom
				</Badge>,
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
				<Badge
					ref={(el) => {
						ref = el;
					}}
				>
					Badge
				</Badge>,
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
			expect(ref?.tagName).toBe("DIV");
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(<Badge data-testid="badge">Badge</Badge>);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("inline-flex");
			expect(badge.className).toContain("items-center");
			expect(badge.className).toContain("font-semibold");
			expect(badge.className).toContain("whitespace-nowrap");
			expect(badge.className).toContain("rounded-full");
		});

		it("includes transition classes", () => {
			render(<Badge data-testid="badge">Badge</Badge>);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("transition-base");
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with success variant and small size", () => {
			render(
				<Badge variant="success" size="sm" data-testid="badge">
					Success
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-success");
			expect(badge.className).toContain("text-xs");
		});

		it("works correctly with error variant and large size", () => {
			render(
				<Badge variant="error" size="lg" data-testid="badge">
					Error
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-error");
			expect(badge.className).toContain("text-base");
		});

		it("works correctly with outline variant and custom className", () => {
			render(
				<Badge variant="outline" className="hover:bg-accent" data-testid="badge">
					Outlined
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-transparent");
			expect(badge.className).toContain("hover:bg-accent");
		});

		it("works correctly with warning variant and onClick", () => {
			let clicked = false;
			render(
				<Badge
					variant="warning"
					onClick={() => {
						clicked = true;
					}}
					data-testid="badge"
				>
					Warning
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-warning");
			badge.click();
			expect(clicked).toBe(true);
		});
	});

	describe("Content Types", () => {
		it("renders with text content", () => {
			render(<Badge>Text</Badge>);
			expect(screen.getByText("Text")).toBeInTheDocument();
		});

		it("renders with numeric content", () => {
			render(<Badge>42</Badge>);
			expect(screen.getByText("42")).toBeInTheDocument();
		});

		it("renders with multiple children", () => {
			render(
				<Badge>
					Count: <strong>5</strong>
				</Badge>,
			);
			expect(screen.getByText("Count:")).toBeInTheDocument();
			expect(screen.getByText("5")).toBeInTheDocument();
		});
	});

	describe("Semantic Usage", () => {
		it("can be used as status indicator with role", () => {
			render(
				<Badge variant="success" role="status" aria-label="Online status" data-testid="badge">
					Online
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("role", "status");
			expect(badge).toHaveAttribute("aria-label", "Online status");
			expect(badge.className).toContain("bg-success");
		});

		it("can be used as notification count", () => {
			render(
				<Badge variant="error" size="sm" aria-label="3 unread messages" data-testid="badge">
					3
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge).toHaveAttribute("aria-label", "3 unread messages");
			expect(screen.getByText("3")).toBeInTheDocument();
		});

		it("can be used as tag/label", () => {
			render(
				<Badge variant="outline" data-testid="badge">
					TypeScript
				</Badge>,
			);
			const badge = screen.getByTestId("badge");
			expect(badge.className).toContain("bg-transparent");
			expect(screen.getByText("TypeScript")).toBeInTheDocument();
		});
	});
});
