import { create } from "zustand";
import { AlertItem, CryptoStatus, EvidenceItem, OverviewStats, RouteBaseline } from "../types";
import { api } from "../api";

export type NavTab =
  | "overview"
  | "alerts"
  | "routes"
  | "scenarios"
  | "evidence"
  | "rpki"
  | "inject"
  | "settings";

interface HoraqState {
  activeTab: NavTab;
  theme: "dark" | "light" | "system";
  overview: OverviewStats | null;
  alerts: AlertItem[];
  routes: RouteBaseline[];
  evidence: EvidenceItem[];
  cryptoStatus: CryptoStatus | null;
  isLoading: boolean;
  isAutoRefresh: boolean;
  searchQuery: string;
  selectedAlert: AlertItem | null;
  selectedEvidence: EvidenceItem | null;
  rpkiTarget: { prefix: string; asn: string } | null;
  notification: { message: string; type: "success" | "error" | "info" } | null;

  setTheme: (theme: "dark" | "light" | "system") => void;
  setActiveTab: (tab: NavTab) => void;
  setSearchQuery: (query: string) => void;
  toggleAutoRefresh: () => void;
  setSelectedAlert: (alert: AlertItem | null) => void;
  setSelectedEvidence: (evidence: EvidenceItem | null) => void;
  setRpkiTarget: (target: { prefix: string; asn: string } | null) => void;
  showNotification: (message: string, type?: "success" | "error" | "info") => void;

  fetchAllData: () => Promise<void>;
  updateAlertStatus: (alertId: string, status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED") => Promise<void>;
  dismissAllAlerts: () => Promise<void>;
  runScenarioAction: (name: string) => Promise<any>;
  resetDatabaseAction: () => Promise<void>;
  seedDemoDataAction: () => Promise<void>;
}

const getInitialTheme = (): "dark" | "light" | "system" => {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("horaq_theme") as "dark" | "light" | "system" | null;
  return saved || "dark";
};

const applyTheme = (theme: "dark" | "light" | "system") => {
  if (typeof window === "undefined") return;
  const isDark =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : theme === "dark";

  document.documentElement.classList.toggle("dark", isDark);
  try {
    localStorage.setItem("horaq_theme", theme);
  } catch {}
};

if (typeof window !== "undefined") {
  applyTheme(getInitialTheme());
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    const currentTheme = useHoraqStore.getState().theme;
    if (currentTheme === "system") {
      document.documentElement.classList.toggle("dark", e.matches);
    }
  });
}

export const useHoraqStore = create<HoraqState>((set, get) => ({
  activeTab: "overview",
  theme: getInitialTheme(),
  overview: null,
  alerts: [],
  routes: [],
  evidence: [],
  cryptoStatus: null,
  isLoading: false,
  isAutoRefresh: true,
  searchQuery: "",
  selectedAlert: null,
  selectedEvidence: null,
  rpkiTarget: null,
  notification: null,

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSearchQuery: (searchQuery) => set({ searchQuery }),

  toggleAutoRefresh: () => set((state) => ({ isAutoRefresh: !state.isAutoRefresh })),

  setSelectedAlert: (alert) => set({ selectedAlert: alert }),

  setSelectedEvidence: (evidence) => set({ selectedEvidence: evidence }),

  setRpkiTarget: (rpkiTarget) => set({ rpkiTarget }),

  showNotification: (message, type = "info") => {
    set({ notification: { message, type } });
    setTimeout(() => {
      set((state) => (state.notification?.message === message ? { notification: null } : {}));
    }, 4500);
  },

  fetchAllData: async () => {
    try {
      set({ isLoading: true });
      const [overview, alertsRes, routesRes, evidenceRes, crypto] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getAlerts(200, 0).catch(() => ({ items: [], total: 0 })),
        api.getRoutes(200, 0).catch(() => ({ items: [], total: 0 })),
        api.getEvidenceList(200, 0).catch(() => ({ items: [], total: 0 })),
        api.getCryptoStatus().catch(() => null),
      ]);

      set({
        overview: overview || null,
        alerts: alertsRes.items || [],
        routes: routesRes.items || [],
        evidence: evidenceRes.items || [],
        cryptoStatus: crypto || null,
        isLoading: false,
      });
    } catch (err: any) {
      set({ isLoading: false });
    }
  },

  updateAlertStatus: async (alertId, status) => {
    try {
      await api.updateAlertStatus(alertId, status);
      set((state) => ({
        alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, status } : a)),
      }));
      get().showNotification(`Alert ${alertId.slice(0, 8)} updated to ${status}`, "success");
      get().fetchAllData();
    } catch (err: any) {
      get().showNotification(err.message || "Failed to update alert", "error");
    }
  },

  dismissAllAlerts: async () => {
    const active = get().alerts.filter((a) => a.status === "ACTIVE");
    await Promise.all(
      active.map((a) => api.updateAlertStatus(a.id, "RESOLVED").catch(() => {}))
    );
    get().showNotification(`All ${active.length} active alerts resolved`, "success");
    get().fetchAllData();
  },

  runScenarioAction: async (name: string) => {
    try {
      const res = await api.runScenario(name);
      get().showNotification(
        `Executed '${res.scenario || name}': ${res.alerts_generated} alert(s) generated`,
        "success"
      );
      await get().fetchAllData();
      return res;
    } catch (err: any) {
      get().showNotification(`Scenario execution failed: ${err.message}`, "error");
      throw err;
    }
  },

  resetDatabaseAction: async () => {
    try {
      await api.runScenario("reset");
      get().showNotification("Database reset to clean empty state", "info");
      await get().fetchAllData();
    } catch (err: any) {
      get().showNotification(err.message || "Failed to reset database", "error");
    }
  },

  seedDemoDataAction: async () => {
    try {
      await api.runScenario("seed-demo");
      get().showNotification("Demo data seeded: 4 root baselines + 3 anomaly incidents", "success");
      await get().fetchAllData();
    } catch (err: any) {
      get().showNotification(err.message || "Failed to seed demo data", "error");
    }
  },
}));
