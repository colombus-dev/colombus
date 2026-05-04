import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Label } from '../app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '../app/components/ui/radio-group';

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState('fixed');

    return (
      <RadioGroup value={value} onValueChange={setValue} className="w-[240px]">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all" id="all-nodes" />
          <Label htmlFor="all-nodes">Show all nodes</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="fixed" id="fixed-nodes" />
          <Label htmlFor="fixed-nodes">Show fixed nodes</Label>
        </div>
      </RadioGroup>
    );
  },
};