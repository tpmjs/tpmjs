import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
	describe("Rendering", () => {
		it("renders a header element", () => {
			render(createElement(Header, { "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header).toBeInTheDocument();
			expect(header.tagName).toBe("HEADER");
		});

		it("renders without title or actions", () => {
			render(createElement(Header, { "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header).toBeInTheDocument();
			expect(screen.queryByTestId("header-title")).not.toBeInTheDocument();
			expect(screen.queryByTestId("header-actions")).not.toBeInTheDocument();
		});
	});

	describe("Title", () => {
		it("renders title when provided", () => {
			render(createElement(Header, { title: "TPMJS Registry" }));
			expect(screen.getByText("TPMJS Registry")).toBeInTheDocument();
		});

		it("renders title in title container", () => {
			render(
				createElement(Header, { title: "My App", "data-testid": "header" }),
			);
			const titleContainer = screen.getByTestId("header-title");
			expect(titleContainer).toBeInTheDocument();
			expect(titleContainer.textContent).toBe("My App");
		});

		it("title container has correct base classes", () => {
			render(createElement(Header, { title: "App" }));
			const titleContainer = screen.getByTestId("header-title");
			expect(titleContainer.className).toContain("flex");
			expect(titleContainer.className).toContain("items-center");
			expect(titleContainer.className).toContain("font-semibold");
			expect(titleContainer.className).toContain("text-zinc-100");
		});

		it("renders ReactNode as title", () => {
			render(
				createElement(Header, {
					title: createElement(
						"div",
						{ "data-testid": "custom-title" },
						"Custom",
					),
				}),
			);
			expect(screen.getByTestId("custom-title")).toBeInTheDocument();
		});
	});

	describe("Actions", () => {
		it("renders actions when provided", () => {
			render(
				createElement(Header, {
					actions: createElement(
						"button",
						{ "data-testid": "action-btn" },
						"Sign In",
					),
				}),
			);
			expect(screen.getByTestId("action-btn")).toBeInTheDocument();
		});

		it("renders actions in actions container", () => {
			render(
				createElement(Header, {
					actions: "Actions content",
					"data-testid": "header",
				}),
			);
			const actionsContainer = screen.getByTestId("header-actions");
			expect(actionsContainer).toBeInTheDocument();
			expect(actionsContainer.textContent).toBe("Actions content");
		});

		it("actions container has correct base classes", () => {
			render(createElement(Header, { actions: "Actions" }));
			const actionsContainer = screen.getByTestId("header-actions");
			expect(actionsContainer.className).toContain("flex");
			expect(actionsContainer.className).toContain("items-center");
		});

		it("renders ReactNode as actions", () => {
			render(
				createElement(Header, {
					actions: createElement(
						"div",
						{ "data-testid": "custom-actions" },
						"Custom Actions",
					),
				}),
			);
			expect(screen.getByTestId("custom-actions")).toBeInTheDocument();
		});
	});

	describe("Children", () => {
		it("renders children when provided", () => {
			render(createElement(Header, { children: "Header content" }));
			expect(screen.getByText("Header content")).toBeInTheDocument();
		});

		it("renders children in children container", () => {
			render(
				createElement(Header, {
					children: "Center content",
					"data-testid": "header",
				}),
			);
			const childrenContainer = screen.getByTestId("header-children");
			expect(childrenContainer).toBeInTheDocument();
			expect(childrenContainer.textContent).toBe("Center content");
		});

		it("children container has centering classes", () => {
			render(createElement(Header, { children: "Content" }));
			const childrenContainer = screen.getByTestId("header-children");
			expect(childrenContainer.className).toContain("flex-1");
			expect(childrenContainer.className).toContain("flex");
			expect(childrenContainer.className).toContain("items-center");
			expect(childrenContainer.className).toContain("justify-center");
		});

		it("renders ReactNode as children", () => {
			render(
				createElement(Header, {
					children: createElement(
						"nav",
						{ "data-testid": "custom-nav" },
						"Navigation",
					),
				}),
			);
			expect(screen.getByTestId("custom-nav")).toBeInTheDocument();
		});
	});

	describe("Combined Content", () => {
		it("renders title and actions together", () => {
			render(
				createElement(Header, {
					title: "Title",
					actions: "Actions",
				}),
			);
			expect(screen.getByText("Title")).toBeInTheDocument();
			expect(screen.getByText("Actions")).toBeInTheDocument();
		});

		it("renders title, children, and actions together", () => {
			render(
				createElement(Header, {
					title: "Title",
					children: "Center",
					actions: "Actions",
				}),
			);
			expect(screen.getByText("Title")).toBeInTheDocument();
			expect(screen.getByText("Center")).toBeInTheDocument();
			expect(screen.getByText("Actions")).toBeInTheDocument();
		});

		it("maintains correct layout with all content", () => {
			render(
				createElement(Header, {
					title: "Left",
					children: "Center",
					actions: "Right",
					"data-testid": "header",
				}),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("justify-between");
		});
	});

	describe("Size Variants", () => {
		it("applies small size to header", () => {
			render(createElement(Header, { size: "sm", "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header.className).toContain("h-12");
			expect(header.className).toContain("px-4");
		});

		it("applies medium size to header", () => {
			render(createElement(Header, { size: "md", "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header.className).toContain("h-16");
			expect(header.className).toContain("px-6");
		});

		it("applies large size to header", () => {
			render(createElement(Header, { size: "lg", "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header.className).toContain("h-20");
			expect(header.className).toContain("px-8");
		});

		it("uses md size by default", () => {
			render(createElement(Header, { "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header.className).toContain("h-16");
			expect(header.className).toContain("px-6");
		});

		it("applies size to title", () => {
			render(createElement(Header, { title: "Title", size: "lg" }));
			const titleContainer = screen.getByTestId("header-title");
			expect(titleContainer.className).toContain("text-xl");
			expect(titleContainer.className).toContain("gap-4");
		});

		it("applies size to actions", () => {
			render(createElement(Header, { actions: "Actions", size: "sm" }));
			const actionsContainer = screen.getByTestId("header-actions");
			expect(actionsContainer.className).toContain("gap-2");
		});
	});

	describe("Sticky Positioning", () => {
		it("applies sticky classes when sticky is true", () => {
			render(createElement(Header, { sticky: true, "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header.className).toContain("sticky");
			expect(header.className).toContain("top-0");
			expect(header.className).toContain("z-50");
		});

		it("does not apply sticky classes when sticky is false", () => {
			render(createElement(Header, { sticky: false, "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header.className).not.toContain("sticky");
			expect(header.className).not.toContain("top-0");
			expect(header.className).not.toContain("z-50");
		});

		it("is not sticky by default", () => {
			render(createElement(Header, { "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header.className).not.toContain("sticky");
		});
	});

	describe("HTML Attributes", () => {
		it("passes through id attribute", () => {
			render(
				createElement(Header, {
					id: "header-id",
					"data-testid": "header",
				}),
			);
			const header = screen.getByTestId("header");
			expect(header).toHaveAttribute("id", "header-id");
		});

		it("passes through data attributes", () => {
			render(
				createElement(Header, {
					"data-custom": "test",
					"data-testid": "header",
				}),
			);
			const header = screen.getByTestId("header");
			expect(header).toHaveAttribute("data-custom", "test");
		});

		it("passes through aria attributes", () => {
			render(
				createElement(Header, {
					"aria-label": "Main header",
					"data-testid": "header",
				}),
			);
			const header = screen.getByTestId("header");
			expect(header).toHaveAttribute("aria-label", "Main header");
		});
	});

	describe("Custom className", () => {
		it("merges custom className with variant classes", () => {
			render(
				createElement(Header, {
					className: "custom-class",
					"data-testid": "header",
				}),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("custom-class");
			expect(header.className).toContain("flex");
			expect(header.className).toContain("bg-black");
		});
	});

	describe("Ref Forwarding", () => {
		it("forwards ref to header element", () => {
			let ref: HTMLElement | null = null;
			render(
				createElement(Header, {
					ref: (el: HTMLElement | null) => {
						ref = el;
					},
				}),
			);
			expect(ref).toBeInstanceOf(HTMLElement);
			expect(ref?.tagName).toBe("HEADER");
		});
	});

	describe("Base Classes", () => {
		it("always includes base classes", () => {
			render(createElement(Header, { "data-testid": "header" }));
			const header = screen.getByTestId("header");
			expect(header.className).toContain("flex");
			expect(header.className).toContain("items-center");
			expect(header.className).toContain("justify-between");
			expect(header.className).toContain("w-full");
			expect(header.className).toContain("bg-black");
			expect(header.className).toContain("border-b");
			expect(header.className).toContain("border-zinc-800");
		});
	});

	describe("Compound Scenarios", () => {
		it("works correctly with large size and sticky", () => {
			render(
				createElement(Header, {
					title: "App",
					actions: "Sign In",
					size: "lg",
					sticky: true,
					"data-testid": "header",
				}),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("h-20");
			expect(header.className).toContain("px-8");
			expect(header.className).toContain("sticky");
			expect(header.className).toContain("top-0");
			expect(header.className).toContain("z-50");
		});

		it("works correctly with all content and custom className", () => {
			render(
				createElement(Header, {
					title: "Title",
					children: "Center",
					actions: "Actions",
					className: "my-header",
					size: "sm",
					"data-testid": "header",
				}),
			);
			const header = screen.getByTestId("header");
			expect(header.className).toContain("my-header");
			expect(header.className).toContain("h-12");
			expect(screen.getByText("Title")).toBeInTheDocument();
			expect(screen.getByText("Center")).toBeInTheDocument();
			expect(screen.getByText("Actions")).toBeInTheDocument();
		});

		it("works with complex ReactNode content", () => {
			render(
				createElement(Header, {
					title: createElement("div", { className: "logo" }, [
						createElement("img", { key: "img", src: "logo.png", alt: "Logo" }),
						createElement("span", { key: "text" }, "TPMJS"),
					]),
					actions: createElement("div", { className: "nav" }, [
						createElement("button", { key: "btn1" }, "Docs"),
						createElement("button", { key: "btn2" }, "GitHub"),
					]),
				}),
			);
			expect(screen.getByText("TPMJS")).toBeInTheDocument();
			expect(screen.getByText("Docs")).toBeInTheDocument();
			expect(screen.getByText("GitHub")).toBeInTheDocument();
		});
	});
});
