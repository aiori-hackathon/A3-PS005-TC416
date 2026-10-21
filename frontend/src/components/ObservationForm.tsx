import React, { useState } from "react";
import { PlusCircle, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../api";

interface ObservationFormProps {
  onObservationAdded: () => void;
}

export const ObservationForm: React.FC<ObservationFormProps> = ({ onObservationAdded }) => {
  const [prefix, setPrefix] = useState("");
  const [asn, setAsn] = useState("");
  const [collector, setCollector] = useState("analyst-console");
  const [scenario, setScenario] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!prefix.trim() || !asn.trim()) {
      setFeedback({ type: "error", text: "Prefix and Origin ASN are required." });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.submitObservation({
        prefix: prefix.trim(),
        origin_asn: asn.trim(),
        collector: collector.trim() || "analyst-console",
        scenario: scenario.trim() || undefined,
      });

      let msg = `Observation accepted! Normalized to ${res.prefix} from ${res.origin_asn}.`;
      if (res.alerts_count > 0) {
        msg += ` 🚨 Generated ${res.alerts_count} anomaly alert(s)!`;
      } else {
        msg += ` ✓ Seeded or updated baseline (0 alerts).`;
      }

      setFeedback({ type: "success", text: msg });
      setPrefix("");
      setAsn("");
      setScenario("");
      onObservationAdded();
    } catch (err: any) {
      setFeedback({ type: "error", text: `Submission rejected: ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto" }}>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <PlusCircle size={20} color="var(--cyan-primary)" />
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Inject Live Route Observation</h2>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
          Submit a custom BGP route announcement to test the normalization parser, baseline comparison,
          and subprefix containment engine.
        </p>

        {feedback && (
          <div
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: feedback.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
              border: `1px solid ${feedback.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(244, 63, 94, 0.4)"}`,
              color: feedback.type === "success" ? "#6ee7b7" : "#fda4af",
            }}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                NETWORK CIDR PREFIX *
              </label>
              <input
                type="text"
                className="form-input mono-text"
                placeholder="e.g. 192.0.2.0/24 or 2001:db8::/32"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                required
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                IPv4 or IPv6 with CIDR subnet mask
              </span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                ORIGIN ASN *
              </label>
              <input
                type="text"
                className="form-input mono-text"
                placeholder="e.g. 13335 or AS13335"
                value={asn}
                onChange={(e) => setAsn(e.target.value)}
                required
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>
                32-bit AS number (1 to 4294967295)
              </span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                COLLECTOR / PROVENANCE
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="analyst-console"
                value={collector}
                onChange={(e) => setCollector(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                SCENARIO TAG (OPTIONAL)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. ad-hoc-eval or migration-test"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "0.5rem", padding: "0.75rem" }}
            disabled={submitting}
          >
            <Send size={16} />
            {submitting ? "Processing Detection Engine..." : "Ingest & Evaluate Observation"}
          </button>
        </form>
      </div>
    </div>
  );
};
