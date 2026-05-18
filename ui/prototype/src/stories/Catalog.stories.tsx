import type { Meta, StoryObj } from '@storybook/react';
import { ArrowRight, BadgeCheck, Blocks, LayoutDashboard, Palette, PanelTop } from 'lucide-react';
import { Badge } from '../app/components/ui/badge';
import { Button } from '../app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../app/components/ui/card';
import { Separator } from '../app/components/ui/separator';

const storyGroups = [
  {
    title: 'UI',
    icon: Palette,
    description: 'Briques atomiques réutilisables: Button, Badge, Input, Tabs, Select, etc.',
    items: ['Button', 'Badge', 'Input', 'Label', 'Checkbox', 'Switch', 'Tabs', 'Select', 'Tooltip'],
  },
  {
    title: 'Layout',
    icon: PanelTop,
    description: 'Conteneurs et navigation structurelle pour construire des écrans complets.',
    items: ['Sidebar', 'Card', 'Separator', 'Drawer', 'Sheet', 'Dialog'],
  },
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Composants métiers pour explorer les notebooks et les modèles.',
    items: ['NodeGraph', 'NodeGraphExplorer', 'NotebookScoresPanel'],
  },
  {
    title: 'Editor',
    icon: Blocks,
    description: 'Bloc de création et édition pour préparer des patterns réutilisables.',
    items: ['CreatePatternPanel'],
  },
];

const integrationSteps = [
  'Importer les composants depuis src/app/components ou src/app/components/ui.',
  'Isoler les composants métiers derrière des props claires et stables.',
  'Créer une story par variante importante plutôt qu’une page unique trop dense.',
  'Réutiliser Storybook pour valider les états visuels avant l’intégration dans un autre projet.',
];

const meta = {
  title: '00-Catalog/Overview',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Badge variant="secondary" className="mb-3 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.14em]">
                Component catalog
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Storybook pour réutiliser tes composants dans d’autres projets.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Cette vue sert de point d’entrée: elle regroupe les composants par famille et montre quelle partie est
                prête à être importée, testée et réutilisée.
              </p>
            </div>

            <Button className="shrink-0">
              Explorer les stories
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {storyGroups.map(group => {
              const Icon = group.icon;

              return (
                <Card key={group.title} className="gap-0 border-slate-200 bg-white shadow-none">
                  <CardHeader className="pb-3">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-base text-slate-950">{group.title}</CardTitle>
                    <CardDescription className="text-sm leading-6 text-slate-500">
                      {group.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {group.items.map(item => (
                      <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {item}
                      </span>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <Card className="gap-0 border-slate-200 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.06)]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-950">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                Comment l’utiliser dans un autre projet
              </CardTitle>
              <CardDescription>Une checklist courte pour garder les composants indépendants du prototype actuel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {integrationSteps.map((step, index) => (
                <div key={step} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{step}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="gap-0 border-slate-200 bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
            <CardHeader>
              <CardTitle className="text-base text-white">Structure recommandée</CardTitle>
              <CardDescription className="text-slate-300">
                Utilise ce Storybook comme bibliothèque source et comme référence visuelle.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="font-semibold text-white">UI</div>
                <div>Composants atomiques, sans logique métier.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="font-semibold text-white">Layout</div>
                <div>Structures réutilisables pour composer des écrans.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
                <div className="font-semibold text-white">Dashboard / Editor</div>
                <div>Composants métier que tu peux intégrer dans un autre produit.</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  ),
};