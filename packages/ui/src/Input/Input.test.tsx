import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

describe("Input", () => {
	describe("Rendering", () => {
		it("renders an input element", () => {
			render(<Input data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toBeInTheDocument();
			expect(input.tagName).toBe("INPUT");
		});

		it('renders with default type="text"', () => {
			render(<Input data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "text");
		});
	});

	describe("States", () => {
		it("applies default state classes", () => {
			render(<Input state="default" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("border-border");
			expect(input.className).toContain("text-foreground");
		});

		it("applies error state classes", () => {
			render(<Input state="error" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("border-error");
		});

		it("applies success state classes", () => {
			render(<Input state="success" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("border-success");
		});

		it("sets aria-invalid on error state", () => {
			render(<Input state="error" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("aria-invalid", "true");
		});

		it("does not set aria-invalid on default state", () => {
			render(<Input state="default" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).not.toHaveAttribute("aria-invalid");
		});

		it("does not set aria-invalid on success state", () => {
			render(<Input state="success" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).not.toHaveAttribute("aria-invalid");
		});
	});

	describe("Sizes", () => {
		it("applies small size classes", () => {
			render(<Input size="sm" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("h-9");
			expect(input.className).toContain("px-3");
			expect(input.className).toContain("text-sm");
		});

		it("applies medium size classes (default)", () => {
			render(<Input size="md" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("h-10");
			expect(input.className).toContain("px-3");
			expect(input.className).toContain("text-base");
		});

		it("applies large size classes", () => {
			render(<Input size="lg" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("h-11");
			expect(input.className).toContain("px-4");
			expect(input.className).toContain("text-lg");
		});
	});

	describe("Full Width", () => {
		it("is full width by default", () => {
			render(<Input data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("w-full");
		});

		it("applies full width when explicitly true", () => {
			render(<Input fullWidth data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("w-full");
		});

		it("does not apply full width when false", () => {
			render(<Input fullWidth={false} data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("w-auto");
		});
	});

	describe("Input Types", () => {
		it('renders with type="email"', () => {
			render(<Input type="email" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "email");
		});

		it('renders with type="password"', () => {
			render(<Input type="password" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "password");
		});

		it('renders with type="number"', () => {
			render(<Input type="number" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "number");
		});

		it('renders with type="tel"', () => {
			render(<Input type="tel" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "tel");
		});

		it('renders with type="url"', () => {
			render(<Input type="url" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "url");
		});

		it('renders with type="search"', () => {
			render(<Input type="search" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "search");
		});

		it('renders with type="date"', () => {
			render(<Input type="date" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "date");
		});

		it('renders with type="time"', () => {
			render(<Input type="time" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "time");
		});

		it('renders with type="file"', () => {
			render(<Input type="file" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("type", "file");
		});
	});

	describe("Disabled State", () => {
		it("is not disabled by default", () => {
			render(<Input data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).not.toBeDisabled();
		});

		it("disables input when disabled prop is true", () => {
			render(<Input disabled data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toBeDisabled();
		});

		it("applies disabled opacity class", () => {
			render(<Input disabled data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("disabled:opacity-50");
			expect(input.className).toContain("disabled:cursor-not-allowed");
		});
	});

	describe("Placeholder", () => {
		it("renders with placeholder text", () => {
			render(<Input placeholder="Enter your email" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("placeholder", "Enter your email");
		});

		it("applies placeholder styling classes", () => {
			render(<Input placeholder="Placeholder text" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("placeholder:text-foreground-tertiary");
		});
	});

	describe("Value and onChange", () => {
		it("renders with initial value", () => {
			render(<Input value="test value" onChange={() => {}} data-testid="input" />);
			const input = screen.getByTestId("input") as HTMLInputElement;
			expect(input.value).toBe("test value");
		});

		it("calls onChange when input value changes", () => {
			const handleChange = vi.fn();
			render(<Input onChange={handleChange} data-testid="input" />);
			const input = screen.getByTestId("input");
			fireEvent.change(input, { target: { value: "new value" } });
			expect(handleChange).toHaveBeenCalledTimes(1);
		});

		it("updates value correctly when typing", () => {
			render(<Input defaultValue="" data-testid="input" />);
			const input = screen.getByTestId("input") as HTMLInputElement;
			fireEvent.change(input, { target: { value: "typed text" } });
			expect(input.value).toBe("typed text");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(<Input id="test-input" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("id", "test-input");
		});

		it("passes through name attribute", () => {
			render(<Input name="email" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("name", "email");
		});

		it("passes through required attribute", () => {
			render(<Input required data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("required");
		});

		it("passes through maxLength attribute", () => {
			render(<Input maxLength={100} data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("maxLength", "100");
		});

		it("passes through pattern attribute", () => {
			render(<Input pattern="[0-9]*" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("pattern", "[0-9]*");
		});

		it("passes through min and max for number input", () => {
			render(<Input type="number" min={0} max={100} data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("min", "0");
			expect(input).toHaveAttribute("max", "100");
		});

		it("passes through step for number input", () => {
			render(<Input type="number" step={0.01} data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("step", "0.01");
		});

		it("passes through autoComplete attribute", () => {
			render(<Input autoComplete="email" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("autoComplete", "email");
		});

		it("passes through autoFocus attribute", () => {
			render(<Input autoFocus data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveFocus();
		});
	});

	describe("ARIA Attributes", () => {
		it("passes through aria-label", () => {
			render(<Input aria-label="Email address" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("aria-label", "Email address");
		});

		it("passes through aria-describedby", () => {
			render(<Input aria-describedby="helper-text" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("aria-describedby", "helper-text");
		});

		it("passes through aria-labelledby", () => {
			render(<Input aria-labelledby="label-id" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toHaveAttribute("aria-labelledby", "label-id");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(<Input className="custom-input" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("custom-input");
			expect(input.className).toContain("rounded-md");
			expect(input.className).toContain("border");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to input element", () => {
			let ref: HTMLInputElement | null = null;
			render(
				<Input
					ref={(el) => {
						ref = el;
					}}
				/>,
			);
			expect(ref).toBeInstanceOf(HTMLInputElement);
			expect(ref?.tagName).toBe("INPUT");
		});

		it("can focus input through ref", () => {
			let ref: HTMLInputElement | null = null;
			render(
				<Input
					ref={(el) => {
						ref = el;
					}}
					data-testid="input"
				/>,
			);
			ref?.focus();
			expect(screen.getByTestId("input")).toHaveFocus();
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(<Input data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("flex");
			expect(input.className).toContain("w-full");
			expect(input.className).toContain("font-sans");
			expect(input.className).toContain("rounded-md");
			expect(input.className).toContain("border");
			expect(input.className).toContain("bg-background");
		});

		it("includes transition classes", () => {
			render(<Input data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("transition-base");
		});

		it("includes focus ring classes", () => {
			render(<Input data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("focus-ring");
		});
	});

	describe("Event Handlers", () => {
		it("calls onFocus when input is focused", () => {
			const handleFocus = vi.fn();
			render(<Input onFocus={handleFocus} data-testid="input" />);
			const input = screen.getByTestId("input");
			fireEvent.focus(input);
			expect(handleFocus).toHaveBeenCalledTimes(1);
		});

		it("calls onBlur when input loses focus", () => {
			const handleBlur = vi.fn();
			render(<Input onBlur={handleBlur} data-testid="input" />);
			const input = screen.getByTestId("input");
			fireEvent.focus(input);
			fireEvent.blur(input);
			expect(handleBlur).toHaveBeenCalledTimes(1);
		});

		it("calls onKeyDown when key is pressed", () => {
			const handleKeyDown = vi.fn();
			render(<Input onKeyDown={handleKeyDown} data-testid="input" />);
			const input = screen.getByTestId("input");
			fireEvent.keyDown(input, { key: "Enter" });
			expect(handleKeyDown).toHaveBeenCalledTimes(1);
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with error state and small size", () => {
			render(<Input state="error" size="sm" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("border-error");
			expect(input.className).toContain("h-9");
			expect(input).toHaveAttribute("aria-invalid", "true");
		});

		it("works correctly with success state and large size", () => {
			render(<Input state="success" size="lg" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input.className).toContain("border-success");
			expect(input.className).toContain("h-11");
		});

		it("works correctly with disabled state and error state", () => {
			render(<Input disabled state="error" data-testid="input" />);
			const input = screen.getByTestId("input");
			expect(input).toBeDisabled();
			expect(input.className).toContain("border-error");
			expect(input).toHaveAttribute("aria-invalid", "true");
		});
	});
});
