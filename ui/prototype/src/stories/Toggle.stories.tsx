import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toggle } from '../app/components/ui/toggle';

const meta = {
  title: 'UI/Toggle',
  component: Toggle,
  tags: ['autodocs'],
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [pressed, setPressed] = useState(true);

    return (
      <Toggle pressed={pressed} onPressedChange={setPressed} variant="outline">
        Fixed nodes
      </Toggle>
    );
  },
};