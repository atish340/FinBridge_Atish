# FinBridge — AI-Powered Financial Document Management

A multi-tenant SaaS platform that lets companies upload financial documents (invoices, salary registers, bank statements, ledgers) and uses **Claude AI** to automatically extract structured data. Accountants review, edit, and approve submissions. Firm admins and platform admins manage the full hierarchy.

Built for a hackathon in under 48 hours using **Claude Code** (AI-assisted development).

---

## Features

### Multi-Role System
| Role | What They Can Do |
|------|-----------------|
| **Platform Admin** | Manage all firms, companies, users; view global audit log |
| **Firm Admin** | Create companies, accountants, company users under their firm |
| **Accountant** | Review all transactions, edit extracted fields, approve/reject, upload reports |
| **Company Admin** | Upload documents, view & edit own transactions, download reports |
| **Company User** | Upload documents, view own transactions |

### Core Features
- **AI Extraction** — Claude Sonnet 4.6 reads uploaded PDFs/images and extracts vendor, invoice number, date, amounts, line items, GST automatically
- **Bulk Upload** — Upload multiple documents at once; each is processed independently
- **Document Edit & Delete** — Company users can edit or delete their uploads before accountant review
- **Approve / Reject Flow** — Accountant reviews extracted data, edits fields, approves or rejects with reason
- **Payment Head Mapping** — Map transactions to chart-of-accounts heads and sub-heads
- **Reports** — Accountants upload MIS/audit reports; companies can download them
- **Audit Log** — Every action (upload, review, approve, reject, edit) is logged with user, company, and timestamp
- **KPI Dashboards** — Role-specific animated KPI cards (totals, pending, approved value)
- **Charts** — Monthly trend and status breakdown charts (Recharts)
- **Export** — Export transaction data to CSV / Excel / PDF
- **PWA / Mobile App** — Installable Progressive Web App; mobile-optimised views for company upload and accountant queue
- **Welcome Emails** — Nodemailer sends login credentials on user creation

---

## Tech Stack

### Backend
| Tool | Purpose |
|------|---------|
| **Node.js** | Runtime |
| **Express.js** | REST API server |
| **MongoDB** | Database (local or Atlas) |
| **Mongoose** | ODM / schema modelling |
| **Multer** | File upload handling |
| **bcryptjs** | Password hashing |
| **Nodemailer** | Welcome emails |
| **pdf-parse** | PDF text extraction |
| **dotenv** | Environment variable management |
| **@anthropic-ai/sdk** | Claude AI integration |

### Frontend
| Tool | Purpose |
|------|---------|
| **React 18** | UI framework |
| **Vite** | Build tool & dev server |
| **Recharts** | Charts and data visualisation |
| **vite-plugin-pwa** | PWA / service worker generation |
| **CSS-in-JS (inline styles)** | Component-scoped styling |

### AI & Development Tools
| Tool | Purpose |
|------|---------|
| **Claude Sonnet 4.6** | Document AI extraction (vision + PDF document blocks) |
| **Claude Code** | AI-assisted development — code generation, debugging, refactoring throughout the entire project |

---

## Folder & File Structure

```
FinBridge_Atish/
│
├── backend/
│   ├── server.js              ← Single-file Express API (all routes, models, seed)
│   ├── seed.js                ← Standalone seed script (legacy)
│   ├── package.json
│   ├── .env                   ← Your local secrets (never commit)
│   ├── .env.example           ← Template — copy to .env
│   └── uploads/               ← Uploaded files stored here (auto-created)
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js         ← Vite config + API proxy to :3001
│   ├── package.json
│   └── src/
│       ├── main.jsx           ← React entry point
│       ├── App.jsx            ← Root component, role-based routing
│       ├── index.css          ← Global styles & CSS variables
│       ├── utils/
│       │   └── exportUtils.js ← CSV / Excel / PDF export helpers
│       └── components/
│           ├── LoginPage.jsx              ← Animated login screen
│           ├── PlatformAdminDashboard.jsx ← Super admin (firms, companies, users, audit)
│           ├── FirmAdminDashboard.jsx     ← Firm admin (companies, accountants, users)
│           ├── AccountantDashboard.jsx    ← Accountant (review queue, KPIs, audit, reports)
│           ├── CompanyDashboard.jsx       ← Company admin/user (upload, transactions, reports)
│           ├── MobileUpload.jsx           ← Mobile-optimised company view (PWA)
│           ├── MobileAccountant.jsx       ← Mobile-optimised accountant view (PWA)
│           ├── AdminDashboard.jsx         ← Legacy admin view
│           ├── InvoiceUpload.jsx          ← Upload component
│           ├── InvoiceTable.jsx           ← Transactions table
│           ├── InvoiceCharts.jsx          ← Recharts bar/pie charts
│           ├── EditModal.jsx              ← Edit extracted data modal
│           ├── Reports.jsx                ← Reports list component
│           ├── ExportMenu.jsx             ← Export dropdown
│           ├── Pagination.jsx             ← Table pagination
│           ├── ProfileMenu.jsx            ← User avatar / logout menu
│           ├── ConfirmDialog.jsx          ← Reusable confirm modal
│           ├── Tooltip.jsx                ← Tooltip component
│           └── Logo.jsx                   ← FinBridge brand logo
│
├── sample_uploads/            ← Sample PDFs for testing
│   ├── 01_purchase_invoice.pdf
│   ├── 02_sales_invoice.pdf
│   ├── 03_salary_register.pdf
│   ├── 04_bank_statement.pdf
│   └── 05_ledger_statement.pdf
│
├── generate_samples.js        ← Script to regenerate sample PDFs
└── .gitignore
```

---

## Setup & Running

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) **or** a MongoDB Atlas connection string
- Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

---

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

### 2. Configure Environment

```bash
cd backend
cp .env.example .env   # Windows: copy .env.example .env
```

Edit `backend/.env`:

```env
ANTHROPIC_API_KEY=sk-ant-...     # Your Claude API key
PORT=3001
MONGODB_URI=mongodb://localhost:27017/finbridge
```

---

### 3. Seed Data

The database **auto-seeds on first startup** — no manual step needed. On boot, `server.js` creates all demo firms, companies, and users automatically.

**To reset and re-seed from scratch:**

```bash
# Drop the database
mongosh finbridge --eval "db.dropDatabase()"

# Restart the server — it re-seeds automatically
node backend/server.js
```

**Standalone seed script (legacy):**

```bash
cd backend
node seed.js
```

---

### 4. Start the Backend

```bash
cd backend
node server.js
```

```bash
# Or with auto-reload during development:
npm run dev
```

Backend runs at **http://localhost:3001**

---

### 5a. Dev Mode — Desktop Only

```bash
cd frontend
npm run dev
```

Vite dev server at **http://localhost:5173**  
(proxies all `/api` calls to `:3001` automatically)

---

### 5b. Production Build — Desktop + Mobile

```bash
cd frontend
npm run build
```

The backend automatically serves the built frontend from `frontend/dist`.  
No Vite needed — everything runs on port 3001:

| Device | URL |
|--------|-----|
| Desktop | http://localhost:3001 |
| Mobile (same Wi-Fi) | http://\<your-local-ip\>:3001 |

Find your local IP:
- **Windows:** `ipconfig` → look for IPv4 Address
- **Mac/Linux:** `ifconfig` → look for `inet`

---

## Default Login Credentials

Created automatically on first startup.

| Role | Username | Password |
|------|----------|----------|
| Platform Admin | `platform_admin` | `platform123` |
| Firm Admin | `firm_admin` | `firm123` |
| Accountant | `accountant1` | `acc123` |
| Company Admin — Acme Corp | `acme_admin` | `comp123` |
| Company User — Acme Corp | `acme_user` | `comp123` |
| Company Admin — Beta Manufacturing | `beta_admin` | `comp123` |

---

## Demo Flow

1. Log in as **`acme_admin`** → upload a PDF from `sample_uploads/`
2. Watch status: `Processing → Extracted` (Claude reads the document)
3. Log in as **`accountant1`** → find the transaction in the Review Queue
4. Edit extracted fields if needed → click **Approve**
5. Log in as **`platform_admin`** → Audit tab → see every action logged with company and user

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login — returns session info |
| `POST` | `/api/transactions/upload` | Upload single document |
| `POST` | `/api/transactions/bulk-upload` | Upload multiple documents |
| `GET` | `/api/transactions` | List transactions (`?company_id=`, `?firm_id=`, `?status=`) |
| `PATCH` | `/api/transactions/:id` | Save reviewed / edited data |
| `PATCH` | `/api/transactions/:id/status` | Change transaction status |
| `POST` | `/api/transactions/:id/approve` | Approve transaction |
| `POST` | `/api/transactions/:id/reject` | Reject with reason |
| `DELETE` | `/api/transactions/:id` | Delete transaction |
| `GET` | `/api/audit` | Audit log (`?firm_id=`, `?company_id=`) |
| `GET` | `/api/firms` | List all firms |
| `POST` | `/api/firms` | Create firm |
| `GET` | `/api/firms/:firmId/companies` | List companies under a firm |
| `POST` | `/api/firms/:firmId/companies` | Create company |
| `GET` | `/api/reports` | List reports |
| `POST` | `/api/reports/upload` | Upload report |
| `GET` | `/api/health` | Health check (`{ status, db }`) |
