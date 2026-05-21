import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Data
  nodes: [],
  edges: [],
  setGraphData: (nodes, edges) => set({ nodes, edges }),

  // Selection
  selectedNode: null,
  setSelectedNode: (node) => {
    if (node) get().addToBreadcrumb(node.id);
    set({ selectedNode: node, sidePanelOpen: !!node, activeRaag: null });
  },

  // Active raag cluster (zoom-to-raag mode)
  activeRaag: null,
  setActiveRaag: (slug) => set({ activeRaag: slug }),

  // Breadcrumb (last 5 visited node IDs)
  breadcrumb: [],
  addToBreadcrumb: (id) => set(s => ({
    breadcrumb: [...s.breadcrumb.filter(x => x !== id), id].slice(-5),
  })),

  // UI panels
  sidePanelOpen: false,
  setSidePanelOpen: (v) => set({ sidePanelOpen: v }),
  virtueTrackerOpen: false,
  setVirtueTrackerOpen: (v) => set({ virtueTrackerOpen: v }),
  settingsOpen: false,
  setSettingsOpen: (v) => set({ settingsOpen: v }),

  // Text mode (for graph canvas labels)
  textMode: (typeof localStorage !== 'undefined' ? localStorage.getItem('textMode') : null) ?? 'gurmukhi',
  setTextMode: (m) => { localStorage.setItem('textMode', m); set({ textMode: m }); },

  // Favourites
  favourites: new Set(
    typeof localStorage !== 'undefined'
      ? JSON.parse(localStorage.getItem('favourites') || '[]')
      : []
  ),
  toggleFavourite: (id) => set(s => {
    const next = new Set(s.favourites);
    if (next.has(id)) next.delete(id); else next.add(id);
    localStorage.setItem('favourites', JSON.stringify([...next]));
    return { favourites: next };
  }),

  // Search
  searchResults: [],
  setSearchResults: (r) => set({ searchResults: r }),

  // AI state
  aiLoading: false,
  aiResponse: '',
  aiVirtues: [],
  setAiLoading: (v) => set({ aiLoading: v }),
  appendAiResponse: (chunk) => set(s => ({ aiResponse: s.aiResponse + chunk })),
  setAiVirtues: (v) => set({ aiVirtues: v }),
  clearAiState: () => set({ aiResponse: '', aiVirtues: [], aiLoading: false }),

  // Physics toggle
  physicsEnabled: true,
  setPhysicsEnabled: (v) => set({ physicsEnabled: v }),
}));
