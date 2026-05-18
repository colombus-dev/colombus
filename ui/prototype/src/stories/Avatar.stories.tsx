import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback } from '../app/components/ui/avatar';

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback className="bg-slate-900 text-white">AE</AvatarFallback>
    </Avatar>
  ),
};