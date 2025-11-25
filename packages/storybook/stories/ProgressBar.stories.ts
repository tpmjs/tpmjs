import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "@tpmjs/ui/ProgressBar/ProgressBar";
import { createElement } from "react";

const meta = {
	title: "Components/ProgressBar",
	component: ProgressBar,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "w-80" },
			createElement(ProgressBar, { value: 50 }),
		),
};

export const AllVariants: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "flex flex-col gap-4 w-80" },
			createElement(ProgressBar, { variant: "primary", value: 75 }),
			createElement(ProgressBar, { variant: "success", value: 85 }),
			createElement(ProgressBar, { variant: "warning", value: 60 }),
			createElement(ProgressBar, { variant: "danger", value: 30 }),
		),
};

export const AllSizes: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "flex flex-col gap-4 w-80" },
			createElement(ProgressBar, { size: "sm", value: 65 }),
			createElement(ProgressBar, { size: "md", value: 65 }),
			createElement(ProgressBar, { size: "lg", value: 65 }),
		),
};

export const WithLabel: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "w-80" },
			createElement(ProgressBar, { value: 75, showLabel: true }),
		),
};

export const ZeroPercent: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "w-80" },
			createElement(ProgressBar, { value: 0, showLabel: true }),
		),
};

export const HundredPercent: Story = {
	render: () =>
		createElement(
			"div",
			{ className: "w-80" },
			createElement(ProgressBar, { value: 100, showLabel: true }),
		),
};
