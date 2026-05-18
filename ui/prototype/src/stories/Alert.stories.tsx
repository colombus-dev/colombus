import type { Meta, StoryObj } from '@storybook/react';
import { Alert, AlertDescription, AlertTitle } from '../app/components/ui/alert';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert className="w-[420px]">
      <AlertTitle>Processing complete</AlertTitle>
      <AlertDescription>The selected pattern has been executed successfully.</AlertDescription>
    </Alert>
  ),
};