import type { Meta, StoryObj } from '@storybook/react';
import { Slider } from '../app/components/ui/slider';

const meta = {
  title: 'UI/Slider',
  component: Slider,
  tags: ['autodocs'],
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[280px]">
      <Slider defaultValue={[42]} max={100} step={1} />
    </div>
  ),
};