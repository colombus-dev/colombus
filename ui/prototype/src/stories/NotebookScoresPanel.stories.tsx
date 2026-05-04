import type { Meta, StoryObj } from '@storybook/react';
import { NotebookScoresPanel } from '../app/components/NotebookScoresPanel';
import { sampleFocusRange, sampleNotebooks, samplePatternName } from './storybookData';

const meta = {
  title: 'Dashboard/NotebookScoresPanel',
  component: NotebookScoresPanel,
  tags: ['autodocs'],
} satisfies Meta<typeof NotebookScoresPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    notebooks: sampleNotebooks,
    patternName: samplePatternName,
    focusRange: sampleFocusRange,
  },
};