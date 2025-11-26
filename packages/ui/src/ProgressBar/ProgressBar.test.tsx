import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "./ProgressBar";

describe("ProgressBar", () => {
	describe("Rendering", () => {
		it("renders a progress bar element", () => {
			render(<ProgressBar value={50} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toBeInTheDocument();
			expect(progress.tagName).toBe("DIV");
		});

		it("has progressbar role", () => {
			render(<ProgressBar value={50} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("role", "progressbar");
		});

		it("sets correct aria attributes", () => {
			render(<ProgressBar value={75} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("aria-valuenow", "75");
			expect(progress).toHaveAttribute("aria-valuemin", "0");
			expect(progress).toHaveAttribute("aria-valuemax", "100");
		});

		it("renders fill element with correct width", () => {
			render(<ProgressBar value={60} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			const fill = progress.querySelector("div");
			expect(fill).toHaveStyle({ width: "60%" });
		});
	});

	describe("Value Handling", () => {
		it("clamps value above 100 to 100", () => {
			render(<ProgressBar value={150} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("aria-valuenow", "100");
			const fill = progress.querySelector("div");
			expect(fill).toHaveStyle({ width: "100%" });
		});

		it("clamps value below 0 to 0", () => {
			render(<ProgressBar value={-10} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("aria-valuenow", "0");
			const fill = progress.querySelector("div");
			expect(fill).toHaveStyle({ width: "0%" });
		});

		it("handles 0 value", () => {
			render(<ProgressBar value={0} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("aria-valuenow", "0");
			const fill = progress.querySelector("div");
			expect(fill).toHaveStyle({ width: "0%" });
		});

		it("handles 100 value", () => {
			render(<ProgressBar value={100} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("aria-valuenow", "100");
			const fill = progress.querySelector("div");
			expect(fill).toHaveStyle({ width: "100%" });
		});

		it("handles decimal values", () => {
			render(<ProgressBar value={33.7} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("aria-valuenow", "33.7");
			const fill = progress.querySelector("div");
			expect(fill).toHaveStyle({ width: "33.7%" });
		});
	});

	describe("Size Variants", () => {
		it("applies small size", () => {
			render(<ProgressBar value={50} size="sm" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress.className).toContain("h-1");
		});

		it("applies medium size", () => {
			render(<ProgressBar value={50} size="md" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress.className).toContain("h-2");
		});

		it("applies large size", () => {
			render(<ProgressBar value={50} size="lg" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress.className).toContain("h-3");
		});

		it("uses md size by default", () => {
			render(<ProgressBar value={50} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress.className).toContain("h-2");
		});
	});

	describe("Color Variants", () => {
		it("applies primary variant", () => {
			render(<ProgressBar value={50} variant="primary" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			const fill = progress.querySelector("div");
			expect(fill?.className).toContain("bg-primary");
		});

		it("applies success variant", () => {
			render(<ProgressBar value={50} variant="success" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			const fill = progress.querySelector("div");
			expect(fill?.className).toContain("bg-success");
		});

		it("applies warning variant", () => {
			render(<ProgressBar value={50} variant="warning" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			const fill = progress.querySelector("div");
			expect(fill?.className).toContain("bg-warning");
		});

		it("applies danger variant", () => {
			render(<ProgressBar value={50} variant="danger" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			const fill = progress.querySelector("div");
			expect(fill?.className).toContain("bg-error");
		});

		it("uses primary variant by default", () => {
			render(<ProgressBar value={50} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			const fill = progress.querySelector("div");
			expect(fill?.className).toContain("bg-primary");
		});
	});

	describe("Label Display", () => {
		it("does not show label by default", () => {
			const { container } = render(<ProgressBar value={50} />);
			expect(container.textContent).toBe("");
		});

		it("shows label when showLabel is true", () => {
			render(<ProgressBar value={50} showLabel />);
			expect(screen.getByText("50%")).toBeInTheDocument();
		});

		it("rounds label to nearest integer", () => {
			render(<ProgressBar value={33.7} showLabel />);
			expect(screen.getByText("34%")).toBeInTheDocument();
		});

		it("shows 0% label for 0 value", () => {
			render(<ProgressBar value={0} showLabel />);
			expect(screen.getByText("0%")).toBeInTheDocument();
		});

		it("shows 100% label for 100 value", () => {
			render(<ProgressBar value={100} showLabel />);
			expect(screen.getByText("100%")).toBeInTheDocument();
		});

		it("label has correct styling classes", () => {
			render(<ProgressBar value={50} showLabel />);
			const label = screen.getByText("50%");
			expect(label.className).toContain("text-sm");
			expect(label.className).toContain("text-foreground-secondary");
			expect(label.className).toContain("tabular-nums");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(<ProgressBar value={50} id="progress-id" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("id", "progress-id");
		});

		it("passes through data attributes", () => {
			render(<ProgressBar value={50} data-custom="test" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress).toHaveAttribute("data-custom", "test");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(<ProgressBar value={50} className="custom-class" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress.className).toContain("custom-class");
			expect(progress.className).toContain("bg-surface");
			expect(progress.className).toContain("rounded");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to progress bar element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				<ProgressBar
					value={50}
					ref={(el) => {
						ref = el;
					}}
				/>,
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
			expect(ref).toHaveAttribute("role", "progressbar");
		});
	});

	describe("Base Classes", () => {
		it("always includes track base classes", () => {
			render(<ProgressBar value={50} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress.className).toContain("relative");
			expect(progress.className).toContain("overflow-hidden");
			expect(progress.className).toContain("bg-surface");
			expect(progress.className).toContain("rounded");
		});

		it("fill includes base classes", () => {
			render(<ProgressBar value={50} data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			const fill = progress.querySelector("div");
			expect(fill?.className).toContain("h-full");
			expect(fill?.className).toContain("transition-all");
			expect(fill?.className).toContain("rounded");
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with large size and success variant", () => {
			render(<ProgressBar value={80} size="lg" variant="success" data-testid="progress" />);
			const progress = screen.getByTestId("progress");
			expect(progress.className).toContain("h-3");
			const fill = progress.querySelector("div");
			expect(fill?.className).toContain("bg-success");
			expect(fill).toHaveStyle({ width: "80%" });
		});

		it("works correctly with label, custom className, and warning variant", () => {
			render(
				<ProgressBar
					value={45}
					variant="warning"
					showLabel
					className="my-custom-class"
					data-testid="progress"
				/>,
			);
			const wrapper = screen.getByTestId("progress");
			// Custom className is applied to the track, which is the first child
			const track = wrapper.querySelector('[role="progressbar"]');
			expect(track?.className).toContain("my-custom-class");
			const fill = track?.querySelector("div");
			expect(fill?.className).toContain("bg-warning");
			expect(screen.getByText("45%")).toBeInTheDocument();
		});
	});
});
