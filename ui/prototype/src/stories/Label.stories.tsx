import type { Meta, StoryObj } from '@storybook/react';
import { Input } from '../app/components/ui/input';
import { Label } from '../app/components/ui/label';

const meta = {
  title: 'UI/Label',
  component: Label,
  tags: ['autodocs'],
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="grid w-[280px] gap-2">
      <Label htmlFor="storybook-label">Item name</Label>
      <Input id="storybook-label" placeholder="load_data.ipynb" />
    </div>
  ),
};