# FinBridge — AI-Powered Financial Data Exchange

Multi-tenant invoice management platform with Claude AI extraction.

---

## Folder Structure

```
FinBridge_Atish/
├── backend/
│   ├── server.js          ← Express API (single file)
│   ├── package.json
│   ├── .env.example
│   └── uploads/           ← auto-created on first upload
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        └── components/
            ├── InvoiceUpload.jsx
            ├── InvoiceTable.jsx
            ├── EditModal.jsx
            └── Reports.jsx
```

---

## Quick Start (2 terminals)

### Terminal 1 — Backend

```bash
cd backend
npm install

# Add your Claude API key (copy from Anthropic Console)
copy .env.example .env
# Edit .env and paste your key: ANTHROPIC_API_KEY=sk-ant-...

npm start
# Server running at http://localhost:3001
```

### Terminal 2 — Frontend

```bash
cd frontend
npm install
npm run dev
# App running at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

> **No API key?** Backend runs in mock mode — returns sample extracted data automatically.

---

## Features

| Role | Capabilities |
|------|-------------|
| **Company User** | Upload invoices (PDF/image), view extracted data, view reports |
| **Accountant** | View all invoices, edit extracted fields, approve transactions, upload reports |

- Switch roles via the toggle in the header
- Select tenant from the dropdown (Company role)
- AI extraction runs async — table auto-polls every 5 seconds

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/upload` | Upload invoice (multipart: invoice, tenant_name) |
| `GET` | `/api/invoices` | List invoices (optional `?tenant_name=`) |
| `GET` | `/api/invoices/:id` | Single invoice |
| `PUT` | `/api/invoices/:id` | Update extracted fields |
| `POST` | `/api/invoices/:id/approve` | Approve invoice |
| `POST` | `/api/reports/upload` | Upload report (multipart: report, tenant_name, report_name) |
| `GET` | `/api/reports` | List reports (optional `?tenant_name=`) |
| `GET` | `/api/reports/:id/download` | Download report file |

### Example Invoice Object
```json
{
  "id": "1",
  "tenant_name": "Acme Corp",
  "filename": "acme_invoice_jan.pdf",
  "status": "extracted",
  "uploaded_at": "2026-04-10T00:00:00.000Z",
  "extracted_data": {
    "vendor": "TechSupplies Ltd",
    "invoice_number": "INV-2026-001",
    "invoice_date": "2026-04-08",
    "total_amount": "15000.00",
    "tax_amount": "1800.00"
  }
}
```

---

## Tech Stack

- **Backend**: Node.js, Express, Multer, @anthropic-ai/sdk
- **Frontend**: React 18, Vite, plain CSS
- **AI**: Claude Sonnet 4.6 (vision + PDF document blocks)
- **Storage**: In-memory (resets on restart — by design for hackathon)

---

## Demo Flow

1. Switch to **Company** → select "Acme Corp"
2. Upload a PDF or image invoice → watch status: `Processing → Extracted`
3. Switch to **Accountant** → click **Edit** → modify fields → **Save & Approve**
4. Back to **Accountant** → upload a report PDF
5. Switch to **Company** → Reports tab → view/download the report
