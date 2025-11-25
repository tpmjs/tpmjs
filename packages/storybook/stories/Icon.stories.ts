import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "@tpmjs/ui/Icon/Icon";
import { createElement } from "react";

const meta = {
	title: "Components/Icon",
	component: Icon,
	tags: ["autodocs"],
	parameters: {
		layout: "centered",
	},
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllIcons: Story = {
	render: () =>
		createElement(
			"div",
			{
				className: "grid grid-cols-4 gap-8 p-8",
			},
			...(
				[
					"copy",
					"externalLink",
					"github",
					"check",
					"x",
					"chevronDown",
					"sun",
					"moon",
				] as const
			).map((iconName) =>
				createElement(
					"div",
					{
						key: iconName,
						className: "flex flex-col items-center gap-2",
					},
					createElement(Icon, { icon: iconName, size: "lg" }),
					createElement(
						"span",
						{ className: "text-sm text-foreground-secondary" },
						iconName,
					),
				),
			),
		),
};

export const AllSizes: Story = {
	render: () =>
		createElement(
			"div",
			{
				className: "flex items-center gap-6",
			},
			...(["sm", "md", "lg"] as const).map((size) =>
				createElement(
					"div",
					{
						key: size,
						className: "flex flex-col items-center gap-2",
					},
					createElement(Icon, { icon: "github", size }),
					createElement(
						"span",
						{ className: "text-sm text-foreground-secondary" },
						size,
					),
				),
			),
		),
};

export const WithColors: Story = {
	render: () =>
		createElement(
			"div",
			{
				className: "flex items-center gap-6",
			},
			createElement(Icon, {
				icon: "check",
				size: "lg",
				className: "text-success",
			}),
			createElement(Icon, { icon: "x", size: "lg", className: "text-error" }),
			createElement(Icon, {
				icon: "github",
				size: "lg",
				className: "text-info",
			}),
			createElement(Icon, {
				icon: "sun",
				size: "lg",
				className: "text-warning",
			}),
		),
};
