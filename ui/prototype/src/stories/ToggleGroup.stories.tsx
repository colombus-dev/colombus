import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from '../app/components/ui/toggle-group';

const meta = {
  title: 'UI/ToggleGroup',
  component: ToggleGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState<string[]>(['all']);

    return (
      <ToggleGroup type="multiple" value={value} onValueChange={setValue} variant="outline">
        <ToggleGroupItem value="all">All</ToggleGroupItem>
        <ToggleGroupItem value="fixed">Fixed</ToggleGroupItem>
        <ToggleGroupItem value="variable">Variable</ToggleGroupItem>
      </ToggleGroup>
    );
  },
};