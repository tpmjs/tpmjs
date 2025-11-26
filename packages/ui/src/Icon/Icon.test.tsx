import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";

describe("Icon", () => {
	describe("Rendering", () => {
		it("renders an SVG element", () => {
			render(<Icon icon="check" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toBeInTheDocument();
			expect(icon.tagName).toBe("svg");
		});

		it("renders with correct viewBox", () => {
			render(<Icon icon="check" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveAttribute("viewBox", "0 0 24 24");
		});

		it("renders with currentColor fill", () => {
			render(<Icon icon="check" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveAttribute("fill", "currentColor");
		});

		it("includes path element", () => {
			render(<Icon icon="check" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			const path = icon.querySelector("path");
			expect(path).toBeInTheDocument();
		});

		it("is aria-hidden by default", () => {
			render(<Icon icon="check" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveAttribute("aria-hidden", "true");
		});
	});

	describe("Size Variants", () => {
		it("applies small size", () => {
			render(<Icon icon="check" size="sm" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("w-4");
			expect(icon.className).toContain("h-4");
		});

		it("applies medium size", () => {
			render(<Icon icon="check" size="md" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("w-5");
			expect(icon.className).toContain("h-5");
		});

		it("applies large size", () => {
			render(<Icon icon="check" size="lg" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("w-6");
			expect(icon.className).toContain("h-6");
		});

		it("uses md size by default", () => {
			render(<Icon icon="check" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("w-5");
			expect(icon.className).toContain("h-5");
		});
	});

	describe("Icon Variants", () => {
		it("renders copy icon", () => {
			render(<Icon icon="copy" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			const path = icon.querySelector("path");
			expect(path).toHaveAttribute(
				"d",
				"M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
			);
		});

		it("renders externalLink icon", () => {
			render(<Icon icon="externalLink" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			const path = icon.querySelector("path");
			expect(path).toHaveAttribute(
				"d",
				"M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z",
			);
		});

		it("renders github icon", () => {
			render(<Icon icon="github" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			const path = icon.querySelector("path");
			expect(path?.getAttribute("d")).toContain("M12 2C6.477 2 2 6.477 2 12");
		});

		it("renders check icon", () => {
			render(<Icon icon="check" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			const path = icon.querySelector("path");
			expect(path).toHaveAttribute(
				"d",
				"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
			);
		});

		it("renders x icon", () => {
			render(<Icon icon="x" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			const path = icon.querySelector("path");
			expect(path).toHaveAttribute(
				"d",
				"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z",
			);
		});

		it("renders chevronDown icon", () => {
			render(<Icon icon="chevronDown" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			const path = icon.querySelector("path");
			expect(path).toHaveAttribute("d", "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z");
		});
	});

	describe("SVG Attributes", () => {
		it("passes through className", () => {
			render(<Icon icon="check" className="custom-class" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("custom-class");
		});

		it("merges custom className with variant classes", () => {
			render(<Icon icon="check" className="text-red-500" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("text-red-500");
			expect(icon.className).toContain("inline-block");
			expect(icon.className).toContain("fill-current");
		});

		it("allows custom aria-hidden", () => {
			render(<Icon icon="check" aria-hidden={false} data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveAttribute("aria-hidden", "false");
		});

		it("passes through aria-label", () => {
			render(<Icon icon="check" aria-label="Success" aria-hidden={false} data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveAttribute("aria-label", "Success");
		});

		it("passes through id attribute", () => {
			render(<Icon icon="check" id="icon-id" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon).toHaveAttribute("id", "icon-id");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to SVG element", () => {
			let ref: SVGSVGElement | null = null;
			render(
				<Icon
					icon="check"
					ref={(el: SVGSVGElement | null) => {
						ref = el;
					}}
				/>,
			);
			expect(ref).toBeInstanceOf(SVGSVGElement);
			expect(ref?.tagName).toBe("svg");
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(<Icon icon="check" data-testid="icon" />);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("inline-block");
			expect(icon.className).toContain("fill-current");
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with custom size and className", () => {
			render(
				<Icon
					icon="github"
					size="lg"
					className="text-zinc-400 hover:text-zinc-100"
					data-testid="icon"
				/>,
			);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("w-6");
			expect(icon.className).toContain("h-6");
			expect(icon.className).toContain("text-zinc-400");
			expect(icon.className).toContain("hover:text-zinc-100");
		});

		it("works correctly with aria attributes and custom size", () => {
			render(
				<Icon
					icon="externalLink"
					size="sm"
					aria-label="Opens in new tab"
					aria-hidden={false}
					data-testid="icon"
				/>,
			);
			const icon = screen.getByTestId("icon");
			expect(icon.className).toContain("w-4");
			expect(icon.className).toContain("h-4");
			expect(icon).toHaveAttribute("aria-label", "Opens in new tab");
			expect(icon).toHaveAttribute("aria-hidden", "false");
		});
	});
});
