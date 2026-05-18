import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Switch } from '../app/components/ui/switch';
import { Label } from '../app/components/ui/label';

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(true);

    return (
      <div className="flex items-center gap-3">
        <Switch checked={enabled} onCheckedChange={setEnabled} id="storybook-switch" />
        <Label htmlFor="storybook-switch">Use weighted nodes</Label>
      </div>
    );
  },
};