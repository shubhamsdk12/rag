# 🩺 IntelliFix AI — US Healthcare EDI Parser & AI Validator (Hybrid Model)

An enterprise-ready compliance, audit, and repair platform for HIPAA X12 transaction sets. It pairs high-speed deterministic parsing (state-machine based) and exact mathematical validation with semantic GraphRAG intelligence to explain and correct healthcare claims, remittances, and enrollment files.

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Neo4j](https://img.shields.io/badge/Neo4j-008CC1?style=for-the-badge&logo=neo4j&logoColor=white)](https://neo4j.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-FC60A8?style=for-the-badge)](https://www.trychroma.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 📖 Table of Contents
1. [Core Features](#-core-features)
2. [Platform Architecture](#-platform-architecture)
3. [Deep-Dive: Ingestion & State-Machine Parser](#-deep-dive-ingestion--state-machine-parser)
4. [Deep-Dive: Deterministic SNIP Validator](#-deep-dive-deterministic-snip-validator)
5. [Deep-Dive: Semantic GraphRAG Compliance](#-deep-dive-semantic-graphrag-compliance)
6. [Deep-Dive: Triage & Automated Repair](#-deep-dive-triage--automated-repair)
7. [Differentiating Features](#-differentiating-features)
8. [Folder & File Layout](#-folder--file-layout)
9. [Getting Started (Local Setup)](#-getting-started-local-setup)
10. [Configuration & Environment Variables](#-configuration--environment-variables)
11. [Verification & Testing](#-verification--testing)

---

## 🚀 Core Features

* **High-Speed Parsing**: Pure regex-free python state-machine parsers stream-read and organize flat X12 EDI files.
* **Deterministic SNIP Levels 1–3**: Validation engine executes exact syntax integrity, implementation rules, and financial balancing checks.
* **CMS NPPES Cache-Enabled Lookup**: Validates Provider National Provider Identifiers (NPI) using both a local Luhn algorithm check and a cached CMS endpoint lookup.
* **GraphRAG Explainer**: Connects rules structured inside a Neo4j Graph Database and regulatory texts inside a Chroma Vector Store to generate natural language explanations of compliance errors.
* **HIPAA Safe Harbor PHI Masking**: Redacts all patient names, SSNs, DOBs, member IDs, and billing/home addresses before forwarding data to external LLMs.
* **Human-in-the-Loop Triage Dashboard**: Divides errors into `Safe Fixes` (auto-corrected inline), `Risky Fixes` (queued for compliance review), and `No Fix` (unresolvable data gaps).
* **Continuous Feedback Loop**: Captures manual approval/rejection edits in a feedback SQLite DB to train automated correction agents.

---

## 📐 Platform Architecture

The system operates as a hybrid architecture: data undergoes deterministic validation first, and any violations are queried against the semantic knowledge store (GraphRAG) to provide regulatory context and suggest adjustments:

```mermaid
flowchart TB
    %% Ingestion
    A[Raw EDI Upload professional, inst, remitt, enroll] --> B[State-Machine Parser]
    B --> C[Structure JSON Trees & Extract Delimiters]
    
    %% Deterministic Validation
    C --> D[SNIP 1-3 Rule Validator]
    D --> E{Compliance Check}
    E -->|Success| F[Mark Document as Healthy]
    E -->|Failures| G[Triage Error Engine]
    
    %% Triage Split
    G --> H{Error Triage Category}
    H -->|Safe Fix| I[SafeFixer: Apply Correction]
    H -->|Risky Fix| J[Human Triage Queue]
    H -->|No Fix| K[Flag as Incomplete Claim]
    
    %% GraphRAG Context Loop
    J -->|Query Request| L[GraphRAG Context Retriever]
    L --> M[(Neo4j Graph Store: Regulation Relationships)]
    L --> N[(ChromaDB Vector DB: HIPAA PDF chunks)]
    M & N --> O[MMR Diverse Selector]
    O --> P[LLM Synthesis & Explanation]
    P -->|Synthesized Fix & Citation| J
    
    %% Approval Action
    J -->|Officer Approve| I
    J -->|Officer Reject| K
    
    %% Completion
    I --> Q[Generate Certified Final Transmission EDI/JSON]
    Q --> R[(Feedback Database: Log Decisions)]
```

---

## 🔍 Deep-Dive: Ingestion & State-Machine Parser

Unlike generic text parsers, our parser operates in **O(N) single-pass** using a pure python state-machine:

1. **Header Identification**: Scans the fixed-width positions of the `ISA` segment (typically the first 106 characters) to extract:
   - Element Separator (e.g., `*`)
   - Sub-element Separator (e.g., `:`)
   - Segment Terminator (e.g., `~`)
2. **Auto-Detection**: Extracts `GS01` (Functional Group Code) and `ST01` (Transaction Set ID) to map the file:
   - professional claims → `837` + `HC` (837P)
   - Institutional Claims → `837` + `HI` (837I)
   - Remittances → `835`
   - Enrollment rosters → `834`
3. **Loop Boundary Traversal**: Moves step-by-step through segments matching triggers defined in loop-specific configuration files (`837p_loops.json`, `835_loops.json`, etc.). It avoids DOM backtracking by evaluating segment codes + element qualifiers on-the-fly to construct hierarchical JSON trees.

---

## 🛡️ Deep-Dive: Deterministic SNIP Validator

Validations are structured into distinct regulatory tiers:
* **SNIP Level 1 (Structure)**: Validates physical envelopes. Matches control numbers in `ISA` with `IEA`, `GS` with `GE`, and `ST` with `SE`. Throws structure violations if counts mismatch.
* **SNIP Level 2 (Implementation Manual Guidelines)**: Validates constraints from HIPAA manuals. Checks that required segments exist (e.g., `CLM` in Professional claims), checks string lengths, data types, and validates date formats against `CCYYMMDD`.
* **SNIP Level 3 (Mathematical Balancing)**: Validates financials. Sums up service line charges (`SV102` / `SV203`) and compares them against the claimed total (`CLM02`). Applies a precision tolerance of **`$0.01`**.
* **NPI Validator**: Validates NPIs locally using a Luhn-10 mathematical mod check. If correct, queries the online CMS NPPES API to confirm the provider organization/taxonomy status and caches results to optimize response times.

---

## 🧠 Deep-Dive: Semantic GraphRAG Compliance

When deterministic checks flag errors, semantic components generate explanations:
1. **PHI Masking**: Validations are passed through a parser that replaces names (e.g., `NM1*IL*1*SMITH*JOHN`) with `[PATIENT]`, SSNs with `[SSN]`, DOBs with `[DOB]`, and Member IDs with `[MEMBER_ID]`.
2. **Neo4j Graph Store**: Stores a relational map connecting regulations, CPT/diagnosis codes, and payer guidelines.
3. **ChromaDB Vector Store**: Contains embedded paragraphs of reference documents (HIPAA 5010 manuals, WEDI manuals, and CARC/RARC code listings).
4. **MMR (Maximal Marginal Relevance) Selector**: Performs vector similarity search with $\lambda = 0.5$ and $k=5$ to fetch diverse context fragments, resolving redundant rules.
5. **Synthesis**: Sends masked claims + retrieved context to the LLM (Groq / OpenAI) to return a natural-language report citing exact regulation numbers.

---

## 🛠️ Deep-Dive: Triage & Automated Repair

Errors are triaged into specific categories:
1. **Safe Fixes (Auto-Repair)**: Simple, low-risk syntax repairs (e.g., transforming a `MMDDCCYY` date into `CCYYMMDD`, or balancing matching delimiters). These are handled instantly by `SafeFixer` and applied to the output.
2. **Risky Fixes (Human-in-the-Loop)**: High-risk business logic mismatches (e.g., adjusting billed service line totals, changing taxonomy numbers, or fixing NPI codes). These are placed in the **Triage Queue** for manual approval by compliance officers.
3. **No Fix**: Severe deficiencies (e.g., missing critical member loops or diagnosis records) where data must be re-requested from the provider.

Reviewer approval logs are committed to `intellifix_feedback.db` to dynamically teach the correction pipeline, reducing manual overrides for future claims.

---

## 💎 Differentiating Features

* **835 Claims-to-Payment Reconciliation**: Uploads Professional/Institutional `837` claim files alongside matching `835` Remittances. Matches transactions on `CLM01`/`CLP01` keys, displays differences between Billed vs Paid amounts, and extracts Claim Adjustment Segments (CAS) to show CARC/RARC denials.
* **834 Enrollment Delta Engine**: Processes sequential rosters (e.g., Month A vs Month B), tracking added, changed, and terminated members. It provides a visual field diff showing precisely what changed (e.g., address, benefit coverage).
* **Graph Explorer**: Renders an interactive D3.js force-directed node graph visualization of the active query's GraphRAG network.

---

## 📂 Folder & File Layout

```
Coep-inspiron/
├── docker-compose.yml       # Neo4j and PostgreSQL service containers
├── backend/                 # FastAPI backend application
│   ├── app/                 # Phase 1: Core compliance agent pipeline
│   │   ├── agents/          # Domain-specific validation and repair agents
│   │   ├── db/              # Async PostgreSQL engine and SQLAlchemy models
│   │   ├── ir/              # Intermediate Representation data models
│   │   ├── knowledge/       # Graph store driver (Neo4j) and DB seeding scripts
│   │   └── routes/          # Core ingestion & triage routes
│   ├── parser/              # O(n) state-machine EDI parser
│   ├── validator/           # SNIP 1-3 validator and local Luhn NPI check
│   ├── repair/              # Triage engine and SafeFixer
│   ├── routes/              # Blueprint routes (Parse, Validate, Analytics, Docs, Knowledge, Reconcile, Delta)
│   ├── database/            # SQLite connection and migration scripts
│   ├── main.py              # Application entry point
│   └── requirements.txt     # Python requirements manifest
└── frontend/                # React + Vite + TypeScript application
    ├── src/
    │   ├── api/             # Frontend client and routing interfaces
    │   ├── components/      # UI components (EDI Tree, Graph Explorer, Delta View)
    │   ├── context/         # React Context for global AppState
    │   ├── pages/           # Platform views (Dashboard, Triage, Analytics)
    │   └── types/           # Consolidated type definitions
```

---

## 🛠️ Getting Started (Local Setup)

### Step 1: Start Database Containers
Start PostgreSQL and Neo4j via Docker Compose:
```bash
docker-compose up -d
```

### Step 2: Set Up Backend
1. Enter the backend directory and create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # Activate:
   # On macOS/Linux: source venv/bin/activate
   # On Windows: venv\Scripts\activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   *Note: On startup, the backend automatically initializes SQLite/PostgreSQL schemas and seeds the Neo4j graph.*

### Step 3: Set Up Frontend
1. Open a new terminal, navigate to the frontend directory, and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173` in your browser.

---

## ⚙️ Configuration & Environment Variables

Create a `.env` configuration file in the `backend/` directory:
```env
LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/intellifix
CORS_ORIGINS=http://localhost:5173
FEEDBACK_DB_PATH=./intellifix_feedback.db
CHROMA_PERSIST_DIR=./chroma_db
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

---

## 🧪 Verification & Testing
Run the backend test suite using `pytest` to verify parser compliance and validation checks:
```bash
cd backend
pytest tests/ -v
```
To run specific tests:
* Parser: `pytest tests/test_parser.py -v`
* Validator: `pytest tests/test_validator.py -v`
* Repair Flow: `pytest tests/test_repair.py -v`
