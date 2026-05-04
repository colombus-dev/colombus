import type { Meta, StoryObj } from '@storybook/react';
import { AspectRatio } from '../app/components/ui/aspect-ratio';

const meta = {
  title: 'UI/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[320px] overflow-hidden rounded-xl border">
      <AspectRatio ratio={16 / 9}>
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-600 text-white text-sm font-semibold">
          Preview area
        </div>
      </AspectRatio>
    </div>
  ),
};