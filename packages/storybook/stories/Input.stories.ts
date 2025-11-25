import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@tpmjs/ui/Input/Input";
import { Label } from "@tpmjs/ui/Label/Label";
import { createElement } from "react";

const meta = {
	title: "Components/Input",
	component: Input,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => createElement(Input, { placeholder: "Enter text..." }),
};

export const WithLabel: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "flex flex-col gap-2 w-80" },
			createElement(Label, { htmlFor: "email" }, "Email address"),
			createElement(Input, {
				id: "email",
				type: "email",
				placeholder: "name@example.com",
			}),
		),
};

export const AllStates: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "flex flex-col gap-4 w-80" },
			createElement(
				"div",
				{ className: "flex flex-col gap-2" },
				createElement(Label, {}, "Normal"),
				createElement(Input, { placeholder: "Normal state" }),
			),
			createElement(
				"div",
				{ className: "flex flex-col gap-2" },
				createElement(Label, {}, "Success"),
				createElement(Input, {
					placeholder: "Success state",
					state: "success",
				}),
			),
			createElement(
				"div",
				{ className: "flex flex-col gap-2" },
				createElement(Label, {}, "Error"),
				createElement(Input, { placeholder: "Error state", state: "error" }),
			),
			createElement(
				"div",
				{ className: "flex flex-col gap-2" },
				createElement(Label, {}, "Disabled"),
				createElement(Input, { placeholder: "Disabled state", disabled: true }),
			),
		),
};

export const AllSizes: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "flex flex-col gap-4 w-80" },
			createElement(Input, { size: "sm", placeholder: "Small size" }),
			createElement(Input, { size: "md", placeholder: "Medium size" }),
			createElement(Input, { size: "lg", placeholder: "Large size" }),
		),
};

export const PasswordInput: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "flex flex-col gap-2 w-80" },
			createElement(Label, { htmlFor: "password" }, "Password"),
			createElement(Input, {
				id: "password",
				type: "password",
				placeholder: "Enter password",
			}),
		),
};
