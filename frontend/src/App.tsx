import React, { useEffect, useState } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { OverviewView } from "./views/OverviewView";
import { AlertsView } from "./views/AlertsView";
import { RoutesView } from "./views/RoutesView";
import { ScenariosView } from "./views/ScenariosView";
import { EvidenceVaultView } from "./views/EvidenceVaultView";
import { RPKIInspectorView } from "./views/RPKIInspectorView";
import { InjectRouteView } from "./views/InjectRouteView";
import { SettingsView } from "./views/SettingsView";
import { EvidenceModal } from "./components/EvidenceModal";
import { RPKIModal } from "./components/RPKIModal";
import { useHoraqStore } from "./stores/useHoraqStore";
import { EvidenceItem } from "./types";
import { api } from "./api";
import { Check, AlertCircle, Info } from "lucide-react";

export const App: React.FC = () => {
  const {
    activeTab,
    fetchAllData,
    isAutoRefresh,
    notification,
    selectedAlert,
    setSelectedAlert,
    selectedEvidence,
    setSelectedEvidence,
    rpkiTarget,
    setRpkiTarget,
    evidence,
  } = useHoraqStore();

  const [modalEvidence, setModalEvidence] = useState<EvidenceItem | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Live polling every 5s if active
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchAllData();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  // Load evidence record when alert is clicked
  useEffect(() => {
    if (selectedEvidence) {
      setModalEvidence(selectedEvidence);
      return;
    }
    if (selectedAlert) {
      // Find in existing evidence list or fetch detail
      const found = evidence.find(
        (e) => e.alert_id === selectedAlert.id || e.id === selectedAlert.evidence_id
      );
      if (found) {
        setModalEvidence(found);
      } else {
        api.getAlertDetail(selectedAlert.id).then((detail) => {
          if (detail.evidence) setModalEvidence(detail.evidence);
        }).catch(() => {});
      }
    } else {
      setModalEvidence(null);
    }
  }, [selectedAlert, selectedEvidence, evidence]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-bg-app text-text-main font-sans transition-colors">
      {/* Top Header Bar */}
      <Header />

      {/* Main App Body: Sidebar + Active Canvas */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-bg-app p-8 transition-colors">
          {activeTab === "overview" && <OverviewView />}
          {activeTab === "alerts" && <AlertsView />}
          {activeTab === "routes" && <RoutesView />}
          {activeTab === "scenarios" && <ScenariosView />}
          {activeTab === "evidence" && <EvidenceVaultView />}
          {activeTab === "rpki" && <RPKIInspectorView />}
          {activeTab === "inject" && <InjectRouteView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Global Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div
            className={`px-4 py-2.5 rounded-lg border text-xs font-semibold flex items-center gap-2 shadow-lg backdrop-blur-md ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : notification.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-sky-500/10 border-sky-500/20 text-brand-blue"
            }`}
          >
            {notification.type === "success" ? (
              <Check className="w-4 h-4 shrink-0" />
            ) : notification.type === "error" ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <Info className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Cryptographic Evidence Inspection Modal */}
      {(selectedAlert || selectedEvidence) && (
        <EvidenceModal
          alert={selectedAlert}
          evidence={modalEvidence}
          onClose={() => {
            setSelectedAlert(null);
            setSelectedEvidence(null);
            setModalEvidence(null);
          }}
          onSigned={() => fetchAllData()}
        />
      )}

      {/* RPKI Quick Modal */}
      {rpkiTarget && (
        <RPKIModal
          prefix={rpkiTarget.prefix}
          asn={rpkiTarget.asn}
          onClose={() => setRpkiTarget(null)}
        />
      )}
    </div>
  );
};
export default App;
