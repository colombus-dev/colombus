import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../app/components/ui/button';
import { PlayCircle, Plus } from 'lucide-react';

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  args: {
    children: 'Button',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'link', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithIcon: Story = {
  args: {
    children: 'Execute pattern',
    variant: 'outline',
  },
  render: args => (
    <Button {...args}>
      <PlayCircle className="h-4 w-4" />
      {args.children}
    </Button>
  ),
};

export const IconOnly: Story = {
  args: {
    variant: 'secondary',
    size: 'icon',
    'aria-label': 'Add item',
  },
  render: args => (
    <Button {...args}>
      <Plus className="h-4 w-4" />
    </Button>
  ),
};