import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../app/components/ui/tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[360px]">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="rounded-lg border p-4 text-sm text-slate-600">High level summary.</TabsContent>
        <TabsContent value="details" className="rounded-lg border p-4 text-sm text-slate-600">Detailed information.</TabsContent>
        <TabsContent value="history" className="rounded-lg border p-4 text-sm text-slate-600">Change log and events.</TabsContent>
      </Tabs>
    </div>
  ),
};