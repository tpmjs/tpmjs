import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";

// Mock clipboard API
const mockClipboard = {
	writeText: vi.fn(),
};

Object.defineProperty(navigator, "clipboard", {
	value: mockClipboard,
	writable: true,
	configurable: true,
});

describe("CodeBlock", () => {
	beforeEach(() => {
		mockClipboard.writeText.mockClear();
	});

	describe("Rendering", () => {
		it("renders a code block element", () => {
			render(<CodeBlock code='console.log("hello")' data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			expect(codeblock).toBeInTheDocument();
			expect(codeblock.tagName).toBe("DIV");
		});

		it("renders code content", () => {
			render(<CodeBlock code="npm install package" />);
			expect(screen.getByText("npm install package")).toBeInTheDocument();
		});

		it("renders code in a code element", () => {
			render(<CodeBlock code="test code" data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code).toBeInTheDocument();
			expect(code?.textContent).toBe("test code");
		});

		it("preserves whitespace in code", () => {
			const multilineCode = "line 1\n  line 2\n    line 3";
			render(<CodeBlock code={multilineCode} data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code?.textContent).toBe(multilineCode);
		});
	});

	describe("Language", () => {
		it("sets data-language attribute", () => {
			render(
				<CodeBlock
					code="const x = 5"
					language="javascript"
					data-testid="codeblock"
				/>,
			);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code).toHaveAttribute("data-language", "javascript");
		});

		it("defaults to text language", () => {
			render(<CodeBlock code="plain text" data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code).toHaveAttribute("data-language", "text");
		});

		it("supports different languages", () => {
			const { rerender } = render(
				<CodeBlock code="code" language="python" data-testid="codeblock" />,
			);
			let codeblock = screen.getByTestId("codeblock");
			let code = codeblock.querySelector("code");
			expect(code).toHaveAttribute("data-language", "python");

			rerender(
				<CodeBlock code="code" language="bash" data-testid="codeblock" />,
			);
			codeblock = screen.getByTestId("codeblock");
			code = codeblock.querySelector("code");
			expect(code).toHaveAttribute("data-language", "bash");
		});
	});

	describe("Size Variants", () => {
		it("applies small size", () => {
			render(<CodeBlock code="code" size="sm" data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code?.className).toContain("text-xs");
			expect(code?.className).toContain("p-3");
		});

		it("applies medium size", () => {
			render(<CodeBlock code="code" size="md" data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code?.className).toContain("text-sm");
			expect(code?.className).toContain("p-4");
		});

		it("applies large size", () => {
			render(<CodeBlock code="code" size="lg" data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code?.className).toContain("text-base");
			expect(code?.className).toContain("p-6");
		});

		it("uses md size by default", () => {
			render(<CodeBlock code="code" data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code?.className).toContain("text-sm");
			expect(code?.className).toContain("p-4");
		});
	});

	describe("Copy Button", () => {
		it("shows copy button by default", () => {
			render(<CodeBlock code="code" />);
			expect(screen.getByTestId("copy-button")).toBeInTheDocument();
		});

		it("hides copy button when showCopy is false", () => {
			render(<CodeBlock code="code" showCopy={false} />);
			expect(screen.queryByTestId("copy-button")).not.toBeInTheDocument();
		});

		it("copy button has correct aria-label", () => {
			render(<CodeBlock code="code" />);
			const button = screen.getByTestId("copy-button");
			expect(button).toHaveAttribute("aria-label", "Copy code");
		});

		it("copy button is a button element", () => {
			render(<CodeBlock code="code" />);
			const button = screen.getByTestId("copy-button");
			expect(button.tagName).toBe("BUTTON");
			expect(button).toHaveAttribute("type", "button");
		});
	});

	describe("Copy Functionality", () => {
		it("copies code to clipboard when button clicked", async () => {
			render(<CodeBlock code="test code" />);
			const button = screen.getByTestId("copy-button");
			button.click();

			await waitFor(() => {
				expect(mockClipboard.writeText).toHaveBeenCalledWith("test code");
			});
		});

		it("shows check icon after successful copy", async () => {
			render(<CodeBlock code="test code" data-testid="codeblock" />);
			const button = screen.getByTestId("copy-button");
			button.click();

			await waitFor(() => {
				const icon = button.querySelector("svg");
				// Check icon has a different path than copy icon
				const path = icon?.querySelector("path");
				expect(path).toHaveAttribute(
					"d",
					"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
				);
			});
		});

		it('changes aria-label to "Copied!" after copy', async () => {
			render(<CodeBlock code="test code" />);
			const button = screen.getByTestId("copy-button");
			button.click();

			await waitFor(() => {
				expect(button).toHaveAttribute("aria-label", "Copied!");
			});
		});

		it("reverts to copy icon after 2 seconds", async () => {
			vi.useFakeTimers();

			try {
				render(<CodeBlock code="test code" data-testid="codeblock" />);
				const button = screen.getByTestId("copy-button");
				button.click();

				// Wait for copy to complete
				await vi.waitFor(() => {
					expect(mockClipboard.writeText).toHaveBeenCalled();
				});

				// Verify check icon appears
				await vi.waitFor(() => {
					const icon = button.querySelector("svg");
					const path = icon?.querySelector("path");
					expect(path).toHaveAttribute(
						"d",
						"M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z",
					);
				});

				// Fast forward 2 seconds
				vi.advanceTimersByTime(2000);

				// Verify copy icon is back
				await vi.waitFor(() => {
					const icon = button.querySelector("svg");
					const path = icon?.querySelector("path");
					expect(path).toHaveAttribute(
						"d",
						"M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z",
					);
				});
			} finally {
				vi.useRealTimers();
			}
		});

		it("handles clipboard API errors gracefully", async () => {
			const consoleErrorSpy = vi
				.spyOn(console, "error")
				.mockImplementation(() => {});
			mockClipboard.writeText.mockRejectedValueOnce(
				new Error("Clipboard not available"),
			);

			try {
				render(<CodeBlock code="test code" />);
				const button = screen.getByTestId("copy-button");
				button.click();

				await waitFor(
					() => {
						expect(consoleErrorSpy).toHaveBeenCalled();
					},
					{ timeout: 1000 },
				);
			} finally {
				consoleErrorSpy.mockRestore();
			}
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(
				<CodeBlock code="code" id="codeblock-id" data-testid="codeblock" />,
			);
			const codeblock = screen.getByTestId("codeblock");
			expect(codeblock).toHaveAttribute("id", "codeblock-id");
		});

		it("passes through data attributes", () => {
			render(
				<CodeBlock code="code" data-custom="test" data-testid="codeblock" />,
			);
			const codeblock = screen.getByTestId("codeblock");
			expect(codeblock).toHaveAttribute("data-custom", "test");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(
				<CodeBlock
					code="code"
					className="custom-class"
					data-testid="codeblock"
				/>,
			);
			const codeblock = screen.getByTestId("codeblock");
			expect(codeblock.className).toContain("custom-class");
			expect(codeblock.className).toContain("bg-background");
			expect(codeblock.className).toContain("border");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to container element", () => {
			let ref: HTMLDivElement | null = null;
			render(
				<CodeBlock
					code="code"
					ref={(el: HTMLDivElement | null) => {
						ref = el;
					}}
				/>,
			);
			expect(ref).toBeInstanceOf(HTMLDivElement);
			expect(ref?.querySelector("code")).toBeInTheDocument();
		});
	});

	describe("Base Classes", () => {
		it("container includes base classes", () => {
			render(<CodeBlock code="code" data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			expect(codeblock.className).toContain("relative");
			expect(codeblock.className).toContain("bg-background");
			expect(codeblock.className).toContain("border");
			expect(codeblock.className).toContain("overflow-hidden");
		});

		it("code element includes base classes", () => {
			render(<CodeBlock code="code" data-testid="codeblock" />);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code?.className).toContain("block");
			expect(code?.className).toContain("font-mono");
			expect(code?.className).toContain("text-foreground-secondary");
			expect(code?.className).toContain("overflow-x-auto");
			expect(code?.className).toContain("whitespace-pre");
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with large size and custom language", () => {
			render(
				<CodeBlock
					code='def hello():\n    print("world")'
					language="python"
					size="lg"
					data-testid="codeblock"
				/>,
			);
			const codeblock = screen.getByTestId("codeblock");
			const code = codeblock.querySelector("code");
			expect(code?.className).toContain("text-base");
			expect(code?.className).toContain("p-6");
			expect(code).toHaveAttribute("data-language", "python");
		});

		it("works correctly with no copy button and custom className", () => {
			render(
				<CodeBlock
					code="test"
					showCopy={false}
					className="my-custom-class"
					data-testid="codeblock"
				/>,
			);
			const codeblock = screen.getByTestId("codeblock");
			expect(codeblock.className).toContain("my-custom-class");
			expect(screen.queryByTestId("copy-button")).not.toBeInTheDocument();
		});
	});
});
