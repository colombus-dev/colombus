import type { Meta, StoryObj } from '@storybook/react';
import { NodeGraph } from '../app/components/NodeGraph';
import { sampleFocusRange, samplePatternName, sampleVisibleNotebooks } from './storybookData';

const meta = {
  title: 'Dashboard/NodeGraph',
  component: NodeGraph,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof NodeGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    selectedNodeId: null,
    onNodeSelect: () => undefined,
    visibleNotebookIds: sampleVisibleNotebooks.map(item => item.id),
    visibleNotebooks: sampleVisibleNotebooks,
    heatmapPatternName: samplePatternName,
    heatmapFocusRange: sampleFocusRange,
  },
};