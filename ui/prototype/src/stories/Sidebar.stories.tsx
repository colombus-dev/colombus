import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Sidebar, type SavedPattern } from '../app/components/Sidebar';

const samplePatterns: SavedPattern[] = [
  { id: '1', name: 'step = "load_data"', code: '# Load and clean data' },
  { id: '2', name: 'step = "explore"', code: '# EDA summary' },
  { id: '3', name: 'step = "train_model"', code: '# Training pipeline' },
];

const meta = {
  title: 'Layout/Sidebar',
  component: Sidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [activeView, setActiveView] = useState<'home' | 'explorer'>('explorer');

    return (
      <div className="w-[320px]">
        <Sidebar
          projectName="Reusable workspace"
          activeView={activeView}
          onNavigate={setActiveView}
          isMenuOpen={true}
          onProfileImport={(file) => console.log('Import:', file.name)}
        />
      </div>
    );
  },
};

export const WithSavedPatterns: Story = {
  render: () => {
    const [patterns, setPatterns] = useState<SavedPattern[]>(samplePatterns);

    return (
      <div className="w-[320px]">
        <Sidebar
          projectName="Reusable workspace"
          activeView="explorer"
          isMenuOpen={true}
          savedPatterns={patterns}
          onEditPattern={(pattern) => console.log('Edit:', pattern.name)}
          onDeletePattern={(id) => setPatterns(prev => prev.filter(p => p.id !== id))}
          onProfileImport={(file) => console.log('Import:', file.name)}
        />
      </div>
    );
  },
};

export const Collapsed: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="w-[320px]">
        <Sidebar
          projectName="Reusable workspace"
          activeView="explorer"
          isMenuOpen={isOpen}
          onToggleMenu={() => setIsOpen(prev => !prev)}
          savedPatterns={samplePatterns}
          onEditPattern={(pattern) => console.log('Edit:', pattern.name)}
          onDeletePattern={(id) => console.log('Delete:', id)}
          onProfileImport={(file) => console.log('Import:', file.name)}
        />
      </div>
    );
  },
};

export const EmptyPatterns: Story = {
  render: () => (
    <div className="w-[320px]">
      <Sidebar
        projectName="Reusable workspace"
        activeView="explorer"
        isMenuOpen={true}
        savedPatterns={[]}
        onProfileImport={(file) => console.log('Import:', file.name)}
      />
    </div>
  ),
};