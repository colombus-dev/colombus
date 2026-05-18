import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../app/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../app/components/ui/tooltip';

const meta = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <TooltipProvider delayDuration={0}>
      <Tooltip open>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>Reusable helper text</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};