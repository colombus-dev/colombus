import type { Meta, StoryObj } from '@storybook/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../app/components/ui/table';

const meta = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-[520px] rounded-xl border p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Notebook</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            ['load_data.ipynb', 'Preparation', '94%'],
            ['prepare_features.ipynb', 'Transformation', '82%'],
            ['train_model.ipynb', 'Training', '76%'],
          ].map(([name, type, score]) => (
            <TableRow key={name}>
              <TableCell className="font-medium">{name}</TableCell>
              <TableCell>{type}</TableCell>
              <TableCell className="text-right">{score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  ),
};