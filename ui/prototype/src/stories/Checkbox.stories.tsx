import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from '../app/components/ui/checkbox';
import { Label } from '../app/components/ui/label';

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [checked, setChecked] = useState(true);

    return (
      <div className="flex items-center gap-2">
        <Checkbox checked={checked} onCheckedChange={value => setChecked(value === true)} id="storybook-checkbox" />
        <Label htmlFor="storybook-checkbox">Enable option</Label>
      </div>
    );
  },
};