import type { Meta, StoryObj } from "@storybook/react-vite"
import { BrowserRouter } from "react-router"
import Home from "@/components/home"

const meta = {
  title: "Pages/Home",
  component: Home,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof Home>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
