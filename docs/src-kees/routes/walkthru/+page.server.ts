import slides from './slides.json';

export async function load() {
  return {
    slides,
    flowNodes: [
      { id: 'dashboard', label: 'Dashboard', route: '/', description: 'Centrale hub & Kanban bord', jobs: ['Overzicht taken', 'Drag & drop', 'Items toevoegen'], color: '#3b82f6', position: { x: 100, y: 100 } },
      { id: 'processes', label: 'Processen', route: '/processes', description: 'Workflow sjablonen', jobs: ['Definiëren', 'Stappen bouwen', 'Taken maken'], color: '#8b5cf6', position: { x: 300, y: 100 } },
      { id: 'cases', label: 'Cases', route: '/cases', description: 'Processen uitvoeren', jobs: ['Starten', 'Voortgang volgen', 'Taken voltooien'], color: '#22c55e', position: { x: 500, y: 100 } },
      { id: 'work', label: 'Werk', route: '/work', description: 'Werkitems & backlog', jobs: ['Items maken', 'Backlog beheren', 'Werk plannen'], color: '#f97316', position: { x: 300, y: 250 } },
      { id: 'mijn-werk', label: 'Mijn Werk', route: '/mijn-werk', description: 'Persoonlijke planning heatmap', jobs: ['Weken plannen', 'Deadlines stellen', 'Werk balanceren'], color: '#14b8a6', position: { x: 500, y: 250 } },
      { id: 'projects', label: 'Projecten', route: '/projects', description: 'Project containers', jobs: ['Werk organiseren', 'Leden toevoegen', 'Archiveren'], color: '#6366f1', position: { x: 700, y: 100 } },
      { id: 'messages', label: 'Berichten', route: '/messages', description: 'Team communicatie', jobs: ['Berichten sturen', '@noemen', 'Bestanden delen'], color: '#ec4899', position: { x: 100, y: 250 } },
      { id: 'reports', label: 'Rapporten', route: '/rapporten', description: 'Analytics & inzichten', jobs: ['Statistieken', 'Trends', 'Analyse'], color: '#eab308', position: { x: 700, y: 250 } },
      { id: 'admin', label: 'Admin', route: '/admin', description: 'Systeembeheer', jobs: ['Gebruikers', 'Rollen', 'Logs'], color: '#ef4444', position: { x: 100, y: 400 } },
      { id: 'files', label: 'Bestanden', route: '/files', description: 'Bestandsbeheer', jobs: ['Uploaden', 'Mappen', 'Delen'], color: '#71717a', position: { x: 700, y: 400 } }
    ],
    flowEdges: [
      { id: 'e1', source: 'processes', target: 'cases', label: 'Creëert', animated: true },
      { id: 'e2', source: 'cases', target: 'work', label: 'Genereert taken', animated: true },
      { id: 'e3', source: 'work', target: 'mijn-werk', label: 'Planning', animated: true },
      { id: 'e4', source: 'mijn-werk', target: 'dashboard', label: 'Dagelijks werk', animated: true },
      { id: 'e5', source: 'dashboard', target: 'reports', label: 'Analyse', animated: true },
      { id: 'e6', source: 'projects', target: 'cases', label: 'Koppelt', animated: false },
      { id: 'e7', source: 'messages', target: 'cases', label: 'Communiceert', animated: false },
      { id: 'e8', source: 'files', target: 'cases', label: 'Bijlagen', animated: false },
      { id: 'e9', source: 'admin', target: 'processes', label: 'Beheert', animated: false }
    ]
  };
}