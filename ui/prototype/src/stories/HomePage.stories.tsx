import type { Meta, StoryObj } from '@storybook/react';
import { ChevronRight, Search } from 'lucide-react';
import { useState } from 'react';
import colombus from '../imports/colombus.png';

type Project = {
  id: string;
  name: string;
  branch: string;
  description: string;
};

const projects: Project[] = [
  {
    id: 'reusable-workspace',
    name: 'Reusable workspace',
    branch: 'main',
    description: 'Prototype dashboard',
  },
  {
    id: 'notebook-audit',
    name: 'Notebook audit',
    branch: 'audit',
    description: 'Quality and score review',
  },
  {
    id: 'model-explorer',
    name: 'Model explorer',
    branch: 'explorer',
    description: 'Steps and relationships',
  },
  {
    id: 'ml-review',
    name: 'ML review',
    branch: 'review',
    description: 'Notebook quality pass',
  },
  {
    id: 'feature-lab',
    name: 'Feature lab',
    branch: 'lab',
    description: 'Feature engineering experiments',
  },
  {
    id: 'release-check',
    name: 'Release check',
    branch: 'release',
    description: 'Pre-release validation workspace',
  },
];

const meta = {
  title: 'Layout/HomePage',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-5 py-8 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">{children}</div>
    </div>
  );
}

function HeroBlock() {
  return (
    <section className="flex min-h-[220px] items-center justify-center px-6 py-8">
      <button
        type="button"
        className="block max-w-full cursor-pointer rounded-[1.5rem] transition-all duration-150 hover:scale-[1.02] hover:shadow-[0_22px_44px_rgba(15,23,42,0.18)] focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        aria-label="Go to home"
        title="Go to home"
      >
        <img
          src={colombus}
          alt="Workspace logo"
          className="max-h-[180px] w-auto max-w-full rounded-[1.5rem] object-contain shadow-[0_18px_36px_rgba(15,23,42,0.14)] sm:max-h-[220px]"
        />
      </button>
    </section>
  );
}

function ProjectsGrid({ currentProjectId = 'reusable-workspace' }: { currentProjectId?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredProjects = projects.filter(project => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return [project.name, project.branch, project.description].join(' ').toLowerCase().includes(query);
  });

  return (
    <section>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Your projects</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Start from an existing workspace or create a new one from the form below.
          </p>
        </div>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 shadow-sm"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredProjects.map(project => (
          <button
            key={project.id}
            type="button"
            className="group w-full cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-slate-950">{project.name}</p>
                <p className="mt-1 text-sm text-slate-500">{project.branch}</p>
              </div>
              {project.id === currentProjectId ? (
                <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                  Active
                </span>
              ) : null}
            </div>
            <p className="text-sm leading-6 text-slate-600">{project.description}</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium text-slate-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span>Ouvrir le projet</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 px-6 py-16 text-center">
          <Search className="mb-4 h-8 w-8 text-slate-300" />
          <p className="text-sm font-medium text-slate-900">No projects found</p>
          <p className="mt-1 text-sm text-slate-500">We couldn't find anything matching "{searchQuery}".</p>
        </div>
      ) : null}
    </section>
  );
}

function CreateProjectPanel() {
  const [newProjectName, setNewProjectName] = useState('');

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Create project</p>
      <p className="mt-2 text-sm text-slate-600">Enter a project name, then create it directly from here.</p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Project name</span>
          <input
            type="text"
            value={newProjectName}
            onChange={event => setNewProjectName(event.target.value)}
            placeholder="Type a project name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:bg-white"
          />
        </label>

        <button
          type="button"
          onClick={() => setNewProjectName('')}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          Create project
        </button>
      </div>
    </section>
  );
}

function HomeOverview() {
  return (
    <PageShell>
      <HeroBlock />
      <ProjectsGrid />
      <CreateProjectPanel />
    </PageShell>
  );
}

export const Hero: Story = {
  render: () => (
    <PageShell>
      <HeroBlock />
    </PageShell>
  ),
};

export const ProjectsGridOnly: Story = {
  render: () => (
    <PageShell>
      <ProjectsGrid currentProjectId="model-explorer" />
    </PageShell>
  ),
};

export const CreateProjectOnly: Story = {
  render: () => (
    <PageShell>
      <CreateProjectPanel />
    </PageShell>
  ),
};

export const Overview: Story = {
  render: () => <HomeOverview />,
};
