import type { Meta, StoryObj } from '@storybook/react';
import { Progress } from '../app/components/ui/progress';

const meta = {
  title: 'UI/Progress',
  component: Progress,
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 68,
  },
};