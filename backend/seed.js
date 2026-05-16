// Run once: node seed.js
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finbridge';

const toJSON = {
  virtuals: true,
  transform: (_, obj) => { delete obj._id; delete obj.__v; return obj; },
};

const invoiceSchema = new mongoose.Schema({
  tenant_name:    String,
  filename:       String,
  filepath:       { type: String, default: null },
  status:         { type: String, default: 'extracted' },
  extracted_data: { type: mongoose.Schema.Types.Mixed, default: null },
  approved_at:    { type: Date, default: null },
}, { timestamps: { createdAt: 'uploaded_at', updatedAt: false }, toJSON });

const Invoice = mongoose.model('Invoice', invoiceSchema);

const SEED = [
  // ── Acme Corp ──────────────────────────────────────────────────
  { tenant_name: 'Acme Corp', filename: 'acme_cloudworks_jan.pdf',   status: 'approved',
    daysAgo: 125, extracted_data: { vendor: 'CloudWorks India Pvt Ltd', invoice_number: 'INV-2026-0101', invoice_date: '2026-01-10', total_amount: '45000', tax_amount: '5400' } },
  { tenant_name: 'Acme Corp', filename: 'acme_infra_feb.pdf',         status: 'approved',
    daysAgo: 90,  extracted_data: { vendor: 'Infra Solutions Ltd',      invoice_number: 'INV-2026-0215', invoice_date: '2026-02-15', total_amount: '32000', tax_amount: '3840' } },
  { tenant_name: 'Acme Corp', filename: 'acme_print_mar.pdf',         status: 'approved',
    daysAgo: 60,  extracted_data: { vendor: 'PrintMaster Co',           invoice_number: 'INV-2026-0318', invoice_date: '2026-03-18', total_amount: '8500',  tax_amount: '1020' } },
  { tenant_name: 'Acme Corp', filename: 'acme_tech_apr.pdf',          status: 'approved',
    daysAgo: 30,  extracted_data: { vendor: 'TechSupplies Ltd',         invoice_number: 'INV-2026-0422', invoice_date: '2026-04-22', total_amount: '22000', tax_amount: '2640' } },
  { tenant_name: 'Acme Corp', filename: 'acme_netgear_may.pdf',       status: 'extracted',
    daysAgo: 5,   extracted_data: { vendor: 'NetGear Services',         invoice_number: 'INV-2026-0510', invoice_date: '2026-05-10', total_amount: '17500', tax_amount: '2100' } },
  { tenant_name: 'Acme Corp', filename: 'acme_office_may2.pdf',       status: 'extracted',
    daysAgo: 2,   extracted_data: { vendor: 'Office Essentials Co',     invoice_number: 'INV-2026-0513', invoice_date: '2026-05-13', total_amount: '9800',  tax_amount: '1176' } },

  // ── Beta Solutions ─────────────────────────────────────────────
  { tenant_name: 'Beta Solutions', filename: 'beta_office_jan.pdf',   status: 'approved',
    daysAgo: 115, extracted_data: { vendor: 'Office Essentials Co',    invoice_number: 'BSL-2026-001', invoice_date: '2026-01-20', total_amount: '12000', tax_amount: '1440' } },
  { tenant_name: 'Beta Solutions', filename: 'beta_hr_feb.pdf',        status: 'approved',
    daysAgo: 97,  extracted_data: { vendor: 'HR Tech Pvt Ltd',         invoice_number: 'BSL-2026-002', invoice_date: '2026-02-08', total_amount: '28000', tax_amount: '3360' } },
  { tenant_name: 'Beta Solutions', filename: 'beta_furniture_mar.pdf', status: 'approved',
    daysAgo: 70,  extracted_data: { vendor: 'Furniture World',         invoice_number: 'BSL-2026-003', invoice_date: '2026-03-05', total_amount: '55000', tax_amount: '6600' } },
  { tenant_name: 'Beta Solutions', filename: 'beta_cloud_apr.pdf',     status: 'approved',
    daysAgo: 31,  extracted_data: { vendor: 'CloudWorks India Pvt Ltd',invoice_number: 'BSL-2026-004', invoice_date: '2026-04-14', total_amount: '19500', tax_amount: '2340' } },
  { tenant_name: 'Beta Solutions', filename: 'beta_print_may.pdf',     status: 'extracted',
    daysAgo: 8,   extracted_data: { vendor: 'PrintMaster Co',          invoice_number: 'BSL-2026-005', invoice_date: '2026-05-07', total_amount: '7200',  tax_amount: '864'  } },
  { tenant_name: 'Beta Solutions', filename: 'beta_netgear_may2.pdf',  status: 'processing',
    daysAgo: 1,   extracted_data: null },

  // ── Gamma Industries ───────────────────────────────────────────
  { tenant_name: 'Gamma Industries', filename: 'gamma_machinery_jan.pdf',   status: 'approved',
    daysAgo: 110, extracted_data: { vendor: 'Heavy Machinery Corp',       invoice_number: 'GI-2026-0081', invoice_date: '2026-01-25', total_amount: '185000', tax_amount: '22200' } },
  { tenant_name: 'Gamma Industries', filename: 'gamma_safety_feb.pdf',      status: 'approved',
    daysAgo: 85,  extracted_data: { vendor: 'Safety Gear Ltd',            invoice_number: 'GI-2026-0092', invoice_date: '2026-02-20', total_amount: '34000',  tax_amount: '4080'  } },
  { tenant_name: 'Gamma Industries', filename: 'gamma_industrial_mar.pdf',  status: 'approved',
    daysAgo: 63,  extracted_data: { vendor: 'Industrial Supplies Co',     invoice_number: 'GI-2026-0103', invoice_date: '2026-03-12', total_amount: '67000',  tax_amount: '8040'  } },
  { tenant_name: 'Gamma Industries', filename: 'gamma_infra_apr.pdf',       status: 'approved',
    daysAgo: 37,  extracted_data: { vendor: 'Infra Solutions Ltd',        invoice_number: 'GI-2026-0114', invoice_date: '2026-04-08', total_amount: '41000',  tax_amount: '4920'  } },
  { tenant_name: 'Gamma Industries', filename: 'gamma_tech_may.pdf',        status: 'extracted',
    daysAgo: 12,  extracted_data: { vendor: 'TechSupplies Ltd',           invoice_number: 'GI-2026-0121', invoice_date: '2026-05-03', total_amount: '58000',  tax_amount: '6960'  } },
  { tenant_name: 'Gamma Industries', filename: 'gamma_netgear_may2.pdf',    status: 'extracted',
    daysAgo: 3,   extracted_data: { vendor: 'NetGear Services',           invoice_number: 'GI-2026-0125', invoice_date: '2026-05-12', total_amount: '93000',  tax_amount: '11160' } },
];

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('[DB] Connected');

  // Remove old seed/mock data but keep real uploaded files
  await Invoice.deleteMany({ filepath: null });
  console.log('[DB] Cleared placeholder seed records');

  const now = new Date();
  const docs = SEED.map(s => {
    const uploaded_at = new Date(now);
    uploaded_at.setDate(uploaded_at.getDate() - s.daysAgo);
    return {
      tenant_name:   s.tenant_name,
      filename:      s.filename,
      filepath:      null,
      status:        s.status,
      extracted_data: s.extracted_data,
      approved_at:   s.status === 'approved' ? new Date(uploaded_at.getTime() + 86400000) : null,
      uploaded_at,
    };
  });

  await Invoice.insertMany(docs);
  console.log(`[DB] Inserted ${docs.length} seed records`);

  const total = await Invoice.countDocuments();
  console.log(`[DB] Total invoices now: ${total}`);

  await mongoose.disconnect();
  console.log('[DB] Done ✅');
}

run().catch(err => { console.error(err); process.exit(1); });
