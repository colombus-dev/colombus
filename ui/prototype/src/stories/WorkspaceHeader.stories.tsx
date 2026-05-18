import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { WorkspaceHeader } from '../app/V2/WorkspaceHeader';
import { PROJECTS } from '../app/V2/data';
import { Project } from '../app/V2/types';

const meta = {
  title: 'Layout/WorkspaceHeader',
  component: WorkspaceHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof WorkspaceHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

function HeaderPreview({ variant }: { variant: 'home' | 'explorer' }) {
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [projectQuery, setProjectQuery] = useState('');
  
  const filteredProjects = PROJECTS.filter(project => {
    const query = projectQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [project.name, project.branch, project.description].join(' ').toLowerCase().includes(query);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <WorkspaceHeader
        variant={variant}
        currentProjectName={PROJECTS[0].name}
        currentProjectInList={PROJECTS[0]}
        filteredProjects={filteredProjects}
        projectQuery={projectQuery}
        isProjectMenuOpen={isProjectMenuOpen}
        onToggleProjectMenu={() => setIsProjectMenuOpen(previous => !previous)}
        onProjectQueryChange={setProjectQuery}
        onNavigate={() => undefined}
        onOpenProject={() => undefined}
      />
    </div>
  );
}

export const ExplorerClosed: Story = {
  render: () => <HeaderPreview variant="explorer" />,
};

export const ExplorerMenuOpen: Story = {
  render: () => {
    const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(true);
    const [projectQuery, setProjectQuery] = useState('');
    
    return (
      <div className="min-h-screen bg-slate-50">
        <WorkspaceHeader
          variant="explorer"
          currentProjectName={PROJECTS[0].name}
          currentProjectInList={PROJECTS[0]}
          filteredProjects={PROJECTS}
          projectQuery={projectQuery}
          isProjectMenuOpen={isProjectMenuOpen}
          onToggleProjectMenu={() => setIsProjectMenuOpen(previous => !previous)}
          onProjectQueryChange={setProjectQuery}
          onNavigate={() => undefined}
          onOpenProject={() => undefined}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Header Explorer avec le menu de changement de projet ouvert.',
      },
    },
  },
};

export const HomeVariant: Story = {
  render: () => <HeaderPreview variant="home" />,
};
