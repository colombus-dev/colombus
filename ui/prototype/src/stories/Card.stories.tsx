import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../app/components/ui/button';
import { Badge } from '../app/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../app/components/ui/card';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[360px]">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Feature pipeline</CardTitle>
          <Badge variant="secondary">Stable</Badge>
        </div>
        <CardDescription>Reusable container for summaries, stats, and actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-600">
          Build cards with flexible header, content, and footer sections.
        </p>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-slate-500">Updated 2h ago</span>
        <Button size="sm">Open</Button>
      </CardFooter>
    </Card>
  ),
};