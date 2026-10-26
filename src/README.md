# HORA-Q Source Code Implementation

The complete working source code for HORA-Q is organized into production packages in the repository root:

- **[Backend Service](../backend/)**: FastAPI service, SQLite WAL persistence, BGP detection engine, RFC 8785 canonical JSON serializer, and NIST FIPS 204 ML-DSA-65 post-quantum signing engine.
- **[Frontend Dashboard](../frontend/)**: React 18 + TypeScript + Vite operations center with daylight and dark mode themes, tabular ledgers, and responsive triage workflows.
- **[Independent Verifier](../verify_evidence.py)**: Standalone command-line verification tool for external auditing of SHA-256 digests and ML-DSA-65 signatures outside the browser.
- **[Comprehensive Documentation](../HORAQ_Documentation/)**: 43 engineering specifications, data models, algorithm specifications, and acceptance test plans.
- **[Audit Verification & Screenshots](../audit/)**: 10 full desktop 16:9 audit screenshots (1920×1080) and verifiable signed evidence sample JSON.

Please refer to the root [README.md](../README.md) for full setup, scenario runners, test commands, and quickstart instructions.
