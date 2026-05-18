import type { Meta, StoryObj } from '@storybook/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../app/components/ui/select';

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[280px]">
      <Select defaultValue="step" open>
        <SelectTrigger>
          <SelectValue placeholder="Choose a level" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="workflow">Workflow</SelectItem>
          <SelectItem value="step">Step</SelectItem>
          <SelectItem value="metainstruction">Metainstruction</SelectItem>
          <SelectItem value="code">Code</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
};