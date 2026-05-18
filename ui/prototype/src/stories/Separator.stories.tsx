import type { Meta, StoryObj } from '@storybook/react';
import { Separator } from '../app/components/ui/separator';

const meta = {
  title: 'UI/Separator',
  component: Separator,
  tags: ['autodocs'],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[320px] space-y-3 rounded-xl border p-4">
      <div className="text-sm font-medium">Top section</div>
      <Separator />
      <div className="text-sm text-slate-600">Bottom section</div>
    </div>
  ),
};