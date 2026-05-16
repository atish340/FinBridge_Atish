require('dotenv').config();
const express    = require('express');
const multer     = require('multer');
const cors       = require('cors');
const fs         = require('fs');
const path       = require('path');
const mongoose   = require('mongoose');
const bcrypt     = require('bcryptjs');
const Anthropic  = require('@anthropic-ai/sdk');
const nodemailer = require('nodemailer');
const pdfParse   = require('pdf-parse');

const app       = express();
const PORT      = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/finbridge';

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Serve built frontend
const DIST = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
}

// ─── Shared options ───────────────────────────────────────────────────────────

const toJSON = {
  virtuals: true,
  transform: (_, obj) => { delete obj._id; delete obj.__v; return obj; },
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const firmSchema = new mongoose.Schema({
  name:                { type: String, required: true, unique: true },
  email:               { type: String, required: true },
  phone:               { type: String, required: true },
  address:             { type: String, default: '' },
  city:                { type: String, default: '' },
  gst_number:          { type: String, default: '' },
  registration_number: { type: String, default: '' },
  active:              { type: Boolean, default: true },
  created_by:          { type: String, default: 'platform_admin' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON });

const companySchema = new mongoose.Schema({
  firm_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Firm', required: true },
  name:          { type: String, required: true },
  business_type: { type: String, enum: ['Manufacturing', 'IT', 'Services', 'Trading', 'Retail'], default: 'Services' },
  email:         { type: String, default: '' },
  phone:         { type: String, default: '' },
  gst_number:    { type: String, default: '' },
  address:       { type: String, default: '' },
  active:        { type: Boolean, default: true },
  created_by:    { type: String, default: '' },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON });

const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ['platform_admin', 'firm_admin', 'accountant', 'company_admin', 'company_user'], required: true },
  firm_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Firm',    default: null },
  company_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
  display_name: { type: String, default: '' },
  email:        { type: String, default: '' },
  phone:        { type: String, default: '' },
  active:       { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }, toJSON });

const paymentHeadSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  firm_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Firm',    required: true },
  name:        { type: String, required: true },
  type:        { type: String, enum: ['expense', 'revenue', 'asset', 'liability'], default: 'expense' },
  description: { type: String, default: '' },
  sort_order:  { type: Number, default: 0 },
  active:      { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const subHeadSchema = new mongoose.Schema({
  payment_head_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentHead', required: true },
  company_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company',     required: true },
  name:            { type: String, required: true },
  description:     { type: String, default: '' },
  sort_order:      { type: Number, default: 0 },
  active:          { type: Boolean, default: true },
}, { timestamps: { createdAt: 'created_at' }, toJSON });

const lineItemSchema = new mongoose.Schema({
  description: { type: String, default: '' },
  quantity:    { type: String, default: '' },
  unit_price:  { type: String, default: '' },
  amount:      { type: String, default: '' },
}, { _id: false });

const extractedDataSchema = new mongoose.Schema({
  vendor:         { type: String, default: null },
  invoice_number: { type: String, default: null },
  invoice_date:   { type: String, default: null },
  total_amount:   { type: String, default: null },
  tax_amount:     { type: String, default: null },
  line_items:     { type: [lineItemSchema], default: [] },
  currency:       { type: String, default: 'INR' },
  notes:          { type: String, default: null },
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  company_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  firm_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Firm',    required: true },
  type:            { type: String, enum: ['invoice_purchase', 'invoice_sales', 'payment', 'salary_register', 'ledger', 'bank_statement'], default: 'invoice_purchase' },
  status:          { type: String, enum: ['uploaded', 'processing', 'extracted', 'reviewed', 'approved', 'rejected'], default: 'uploaded' },
  filename:        { type: String, required: true },
  filepath:        { type: String, default: null },
  extracted_data:  { type: extractedDataSchema, default: null },
  payment_head_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentHead', default: null },
  sub_head_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'SubHead',      default: null },
  payment_head_name: { type: String, default: null },
  sub_head_name:     { type: String, default: null },
  uploaded_by:     { type: String, default: '' },
  reviewed_by:     { type: String, default: null },
  approved_by:     { type: String, default: null },
  review_notes:    { type: String, default: null },
  reject_reason:   { type: String, default: null },
  reviewed_at:     { type: Date, default: null },
  approved_at:     { type: Date, default: null },
}, { timestamps: { createdAt: 'uploaded_at', updatedAt: false }, toJSON });

const reportSchema = new mongoose.Schema({
  company_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  firm_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Firm',    required: true },
  report_name: { type: String, required: true },
  filename:    { type: String, required: true },
  filepath:    { type: String, default: null },
  report_type: { type: String, default: 'MIS' },
  uploaded_by: { type: String, default: '' },
}, { timestamps: { createdAt: 'uploaded_at' }, toJSON });

const auditLogSchema = new mongoose.Schema({
  transaction_id:  { type: String, default: '' },
  entity_type:     { type: String, default: 'transaction' },
  action:          { type: String, required: true },
  performed_by:    { type: String, required: true },
  performed_role:  { type: String, default: '' },
  firm_id:         { type: String, default: '' },
  company_id:      { type: String, default: '' },
  company_name:    { type: String, default: '' },
  notes:           { type: String, default: '' },
}, { timestamps: { createdAt: 'performed_at' }, toJSON });

auditLogSchema.pre('save', async function () {
  if (this.company_id && !this.company_name) {
    try {
      const c = await mongoose.model('Company').findById(this.company_id, 'name').lean();
      this.company_name = c?.name || '';
    } catch { /* ignore */ }
  }
});

const Firm        = mongoose.model('Firm',        firmSchema);
const Company     = mongoose.model('Company',     companySchema);
const User        = mongoose.model('User',        userSchema);
const PaymentHead = mongoose.model('PaymentHead', paymentHeadSchema);
const SubHead     = mongoose.model('SubHead',     subHeadSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Report      = mongoose.model('Report',      reportSchema);
const AuditLog    = mongoose.model('AuditLog',    auditLogSchema);

// ─── Email ────────────────────────────────────────────────────────────────────

const smtpConfigured = process.env.SMTP_USER && process.env.SMTP_PASS &&
  !process.env.SMTP_USER.includes('your_email');

const mailer = smtpConfigured
  ? nodemailer.createTransport({
      host:   process.env.SMTP_HOST || 'smtp.gmail.com',
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth:   { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

async function sendWelcomeEmail({ toEmail, toName, username, password, role }) {
  if (!mailer || !toEmail) return;
  const roleLabel = {
    firm_admin:    'Firm Administrator',
    accountant:    'Accountant',
    company_admin: 'Company Administrator',
    company_user:  'Company User',
  }[role] || role;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;background:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#2563eb,#4f46e5);padding:32px 36px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px;font-weight:800;letter-spacing:-0.5px">Welcome to FinBridge</h1>
        <p style="color:rgba(255,255,255,.8);margin:8px 0 0;font-size:14px">Your account has been created</p>
      </div>
      <div style="padding:32px 36px;background:#fff">
        <p style="color:#0f172a;font-size:15px;margin:0 0 20px">Hi <strong>${toName || username}</strong>,</p>
        <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px">
          Your FinBridge account is ready. Use the credentials below to log in.
        </p>
        <div style="background:#f1f5f9;border-radius:10px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #2563eb">
          <p style="margin:0 0 10px;color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px">Your Credentials</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="color:#64748b;padding:5px 0;width:110px">Role</td><td style="color:#0f172a;font-weight:600">${roleLabel}</td></tr>
            <tr><td style="color:#64748b;padding:5px 0">Username</td><td style="color:#0f172a;font-weight:700;font-family:monospace;font-size:15px">${username}</td></tr>
            <tr><td style="color:#64748b;padding:5px 0">Password</td><td style="color:#0f172a;font-weight:700;font-family:monospace;font-size:15px">${password}</td></tr>
          </table>
        </div>
        <p style="color:#94a3b8;font-size:12px;margin:0">Please change your password after your first login. Keep these credentials safe.</p>
      </div>
      <div style="padding:16px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
        <p style="color:#94a3b8;font-size:12px;margin:0">FinBridge · Automated Financial Management Platform</p>
      </div>
    </div>`;

  try {
    await mailer.sendMail({
      from:    process.env.SMTP_FROM || `FinBridge <${process.env.SMTP_USER}>`,
      to:      toEmail,
      subject: `Welcome to FinBridge — your account is ready`,
      html,
    });
    console.log(`Welcome email sent to ${toEmail}`);
  } catch (err) {
    console.error('Email send failed (non-fatal):', err.message);
  }
}

// ─── Default payment heads by business type ───────────────────────────────────

const DEFAULT_HEADS = {
  Manufacturing: [
    { name: 'Raw Materials',    type: 'expense',   subs: ['Steel', 'Plastic', 'Chemicals', 'Packaging'] },
    { name: 'Labour & Wages',   type: 'expense',   subs: ['Direct Labour', 'Contract Labour', 'Overtime'] },
    { name: 'Manufacturing Overhead', type: 'expense', subs: ['Factory Rent', 'Electricity', 'Maintenance'] },
    { name: 'Sales Revenue',    type: 'revenue',   subs: ['Domestic Sales', 'Export Sales'] },
    { name: 'Other Income',     type: 'revenue',   subs: ['Scrap Sales', 'Interest Received'] },
  ],
  IT: [
    { name: 'Employee Costs',   type: 'expense',   subs: ['Salaries', 'PF/ESI', 'Bonus', 'Reimbursements'] },
    { name: 'Infrastructure',   type: 'expense',   subs: ['Cloud/Servers', 'Software Licenses', 'Internet', 'Office Rent'] },
    { name: 'Professional Fees',type: 'expense',   subs: ['Legal', 'Consulting', 'Audit Fees'] },
    { name: 'Service Revenue',  type: 'revenue',   subs: ['Product Sales', 'SaaS Subscriptions', 'Consulting Revenue'] },
    { name: 'Other Income',     type: 'revenue',   subs: ['Interest', 'Misc Income'] },
  ],
  Services: [
    { name: 'Operating Expenses', type: 'expense', subs: ['Office Rent', 'Utilities', 'Telephone', 'Travel'] },
    { name: 'Employee Costs',   type: 'expense',   subs: ['Salaries', 'Benefits', 'Training'] },
    { name: 'Marketing',        type: 'expense',   subs: ['Advertising', 'Events', 'Digital Marketing'] },
    { name: 'Service Revenue',  type: 'revenue',   subs: ['Consulting', 'Support Contracts', 'Project Revenue'] },
  ],
  Trading: [
    { name: 'Purchase',         type: 'expense',   subs: ['Goods Purchased', 'Import Duties', 'Freight Inward'] },
    { name: 'Operating Expenses',type:'expense',   subs: ['Warehouse Rent', 'Packing', 'Delivery Charges'] },
    { name: 'Sales Revenue',    type: 'revenue',   subs: ['Domestic Sales', 'Wholesale', 'Retail'] },
    { name: 'Other Income',     type: 'revenue',   subs: ['Commission', 'Discount Received'] },
  ],
  Retail: [
    { name: 'Cost of Goods',    type: 'expense',   subs: ['Stock Purchase', 'Wastage', 'Returns'] },
    { name: 'Store Expenses',   type: 'expense',   subs: ['Rent', 'Electricity', 'Staff Salary'] },
    { name: 'Sales Revenue',    type: 'revenue',   subs: ['Counter Sales', 'Online Sales'] },
    { name: 'Other Income',     type: 'revenue',   subs: ['Franchise Fees', 'Commission'] },
  ],
};

async function createDefaultHeads(company, firmId) {
  const defs = DEFAULT_HEADS[company.business_type] || DEFAULT_HEADS.Services;
  for (let i = 0; i < defs.length; i++) {
    const def  = defs[i];
    const head = await PaymentHead.create({
      company_id: company._id, firm_id: firmId,
      name: def.name, type: def.type, sort_order: i,
    });
    for (let j = 0; j < def.subs.length; j++) {
      await SubHead.create({
        payment_head_id: head._id, company_id: company._id,
        name: def.subs[j], sort_order: j,
      });
    }
  }
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function seed() {
  const existingAdmin = await User.findOne({ role: 'platform_admin' });
  if (existingAdmin) return;

  console.log('[DB] Seeding fresh data...');

  // Platform Admin
  await User.create({
    username: 'platform_admin', password: await bcrypt.hash('platform123', 10),
    role: 'platform_admin', display_name: 'Platform Administrator', email: 'admin@finbridge.com',
  });

  // Firm 1: FinBooks CA Firm
  const firm1 = await Firm.create({ name: 'FinBooks CA Firm', email: 'contact@finbooks.com', phone: '9876543210', plan: 'pro', created_by: 'platform_admin' });

  // Firm Admin for Firm 1
  const firmAdmin1 = await User.create({
    username: 'firm_admin', password: await bcrypt.hash('firm123', 10),
    role: 'firm_admin', firm_id: firm1._id, display_name: 'FinBooks Admin', email: 'admin@finbooks.com',
  });

  // Accountants for Firm 1
  const acc1 = await User.create({
    username: 'accountant1', password: await bcrypt.hash('acc123', 10),
    role: 'accountant', firm_id: firm1._id, display_name: 'Rahul Sharma', email: 'rahul@finbooks.com',
  });

  // Company 1: Acme Corp (IT)
  const acme = await Company.create({ firm_id: firm1._id, name: 'Acme Corp', business_type: 'IT', email: 'finance@acme.com', gst_number: '27AABCU9603R1ZX', created_by: firmAdmin1.username });
  await createDefaultHeads(acme, firm1._id);
  await User.create({ username: 'acme_admin', password: await bcrypt.hash('comp123', 10), role: 'company_admin', firm_id: firm1._id, company_id: acme._id, display_name: 'Acme Finance Head', email: 'finance@acme.com' });
  await User.create({ username: 'acme_user',  password: await bcrypt.hash('comp123', 10), role: 'company_user',  firm_id: firm1._id, company_id: acme._id, display_name: 'Acme Staff',       email: 'staff@acme.com'    });

  // Company 2: Beta Manufacturing
  const beta = await Company.create({ firm_id: firm1._id, name: 'Beta Manufacturing', business_type: 'Manufacturing', email: 'accounts@beta.com', gst_number: '27AABCB1234R1ZX', created_by: firmAdmin1.username });
  await createDefaultHeads(beta, firm1._id);
  await User.create({ username: 'beta_admin', password: await bcrypt.hash('comp123', 10), role: 'company_admin', firm_id: firm1._id, company_id: beta._id, display_name: 'Beta Accounts Head', email: 'accounts@beta.com' });

  // Sample transactions for Acme Corp
  const [head1] = await PaymentHead.find({ company_id: acme._id }).limit(1);
  const [sub1]  = await SubHead.find({ payment_head_id: head1?._id }).limit(1);

  await Transaction.insertMany([
    {
      company_id: acme._id, firm_id: firm1._id, type: 'invoice_purchase',
      status: 'extracted', filename: 'acme_aws_invoice.pdf',
      extracted_data: { vendor: 'AWS India Pvt Ltd', invoice_number: 'INV-2026-001', invoice_date: '2026-04-08', total_amount: '45000.00', tax_amount: '6876.00', currency: 'INR', line_items: [{ description: 'Cloud Compute (EC2)', quantity: '1', unit_price: '38124.00', amount: '38124.00' }] },
      uploaded_by: 'acme_admin',
    },
    {
      company_id: acme._id, firm_id: firm1._id, type: 'invoice_purchase',
      status: 'approved', filename: 'acme_office_rent.pdf',
      extracted_data: { vendor: 'Prestige Realty', invoice_number: 'INV-2026-022', invoice_date: '2026-04-01', total_amount: '120000.00', tax_amount: '21600.00', currency: 'INR', line_items: [{ description: 'Office Rent - April 2026', quantity: '1', unit_price: '120000.00', amount: '120000.00' }] },
      payment_head_id: head1?._id, sub_head_id: sub1?._id,
      payment_head_name: head1?.name, sub_head_name: sub1?.name,
      uploaded_by: 'acme_admin', reviewed_by: 'accountant1', approved_by: 'accountant1',
      reviewed_at: new Date(), approved_at: new Date(),
    },
    {
      company_id: beta._id, firm_id: firm1._id, type: 'invoice_purchase',
      status: 'extracted', filename: 'beta_steel_purchase.pdf',
      extracted_data: { vendor: 'Tata Steel Ltd', invoice_number: 'INV-2026-099', invoice_date: '2026-04-14', total_amount: '875000.00', tax_amount: '157500.00', currency: 'INR', line_items: [{ description: 'HR Steel Coil 10MT', quantity: '10', unit_price: '87500.00', amount: '875000.00' }] },
      uploaded_by: 'beta_admin',
    },
  ]);

  // Sample report
  await Report.create({ company_id: acme._id, firm_id: firm1._id, report_name: 'Q1 2026 MIS Report', filename: 'acme_q1_mis.pdf', report_type: 'MIS', uploaded_by: 'accountant1' });

  console.log('[DB] Seed complete');
  console.log('  platform_admin / platform123');
  console.log('  firm_admin     / firm123');
  console.log('  accountant1    / acc123');
  console.log('  acme_admin     / comp123');
  console.log('  beta_admin     / comp123');
}

// ─── Multer ───────────────────────────────────────────────────────────────────

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  const ok = ['application/pdf','image/jpeg','image/png','image/webp'].includes(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Only PDF and images allowed'));
}});

// ─── Claude AI ────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const PROMPTS = {
  invoice_purchase: `You are an expert accountant. Extract purchase invoice data and return STRICT JSON only — no explanation, no extra text, null for missing fields:
{"vendor":"","invoice_number":"","invoice_date":"YYYY-MM-DD","line_items":[{"description":"","quantity":"","unit_price":"","amount":""}],"tax_amount":"","total_amount":"","currency":"INR","notes":""}`,

  invoice_sales: `You are an expert accountant. Extract sales invoice data and return STRICT JSON only — no explanation, no extra text, null for missing fields:
{"vendor":"","invoice_number":"","invoice_date":"YYYY-MM-DD","line_items":[{"description":"","quantity":"","unit_price":"","amount":""}],"tax_amount":"","total_amount":"","currency":"INR","notes":""}`,

  salary_register: `You are an expert accountant. Extract salary register data and return STRICT JSON only — no explanation, no extra text, null for missing fields. Use vendor for company/org name, invoice_number for register/voucher number, invoice_date for pay period date, line_items for employee rows (description=employee name, quantity=days, unit_price=basic salary, amount=net pay), total_amount for total payroll, tax_amount for total TDS/deductions:
{"vendor":"","invoice_number":"","invoice_date":"YYYY-MM-DD","line_items":[{"description":"","quantity":"","unit_price":"","amount":""}],"tax_amount":"","total_amount":"","currency":"INR","notes":""}`,

  bank_statement: `You are an expert accountant. Extract bank statement data and return STRICT JSON only — no explanation, no extra text, null for missing fields. Use vendor for bank name, invoice_number for account number, invoice_date for statement date, line_items for transactions (description=narration, quantity=null, unit_price=debit, amount=credit), total_amount for closing balance, tax_amount for total charges:
{"vendor":"","invoice_number":"","invoice_date":"YYYY-MM-DD","line_items":[{"description":"","quantity":"","unit_price":"","amount":""}],"tax_amount":"","total_amount":"","currency":"INR","notes":""}`,

  ledger: `You are an expert accountant. Extract ledger statement data and return STRICT JSON only — no explanation, no extra text, null for missing fields. Use vendor for account/party name, invoice_number for ledger/folio number, invoice_date for period end date, line_items for ledger entries (description=particulars, quantity=null, unit_price=debit, amount=credit), total_amount for closing balance:
{"vendor":"","invoice_number":"","invoice_date":"YYYY-MM-DD","line_items":[{"description":"","quantity":"","unit_price":"","amount":""}],"tax_amount":"","total_amount":"","currency":"INR","notes":""}`,

  payment: `You are an expert accountant. Extract payment voucher data and return STRICT JSON only — no explanation, no extra text, null for missing fields. Use vendor for payee name, invoice_number for voucher/cheque number, invoice_date for payment date, total_amount for amount paid, tax_amount for TDS if any, line_items for payment details:
{"vendor":"","invoice_number":"","invoice_date":"YYYY-MM-DD","line_items":[{"description":"","quantity":"","unit_price":"","amount":""}],"tax_amount":"","total_amount":"","currency":"INR","notes":""}`,
};

// Exact extraction data for known sample PDFs (used as demo fallback when API unavailable)
const SAMPLE_EXTRACTIONS = {
  '01_purchase_invoice.pdf': {
    vendor: 'Tata Consultancy Services Ltd', invoice_number: 'TCS/INV/2026/04512',
    invoice_date: '2026-05-10',
    line_items: [
      { description: 'Software Development Services - Phase 1', quantity: '1', unit_price: '250000.00', amount: '250000.00' },
      { description: 'Cloud Infrastructure Setup & Configuration', quantity: '1', unit_price: '85000.00', amount: '85000.00' },
      { description: 'Annual Support & Maintenance Contract', quantity: '12', unit_price: '8500.00', amount: '102000.00' },
      { description: 'Project Management & Consulting', quantity: '40', unit_price: '4500.00', amount: '180000.00' },
      { description: 'Data Migration Services', quantity: '1', unit_price: '45000.00', amount: '45000.00' },
    ],
    tax_amount: '119160.00', total_amount: '781160.00', currency: 'INR',
    notes: 'Payment due within 30 days. Bank: HDFC Bank, A/C: 50100123456789, IFSC: HDFC0001234',
  },
  '02_sales_invoice.pdf': {
    vendor: 'Acme Corp Pvt Ltd', invoice_number: 'ACME/SI/2026/00198',
    invoice_date: '2026-05-12',
    line_items: [
      { description: 'Enterprise Software License (Annual)', quantity: '5', unit_price: '120000.00', amount: '600000.00' },
      { description: 'Implementation & Integration Services', quantity: '1', unit_price: '200000.00', amount: '200000.00' },
      { description: 'User Training (5 days)', quantity: '5', unit_price: '15000.00', amount: '75000.00' },
    ],
    tax_amount: '157500.00', total_amount: '1032500.00', currency: 'INR',
    notes: 'Bill To: Beta Manufacturing Pvt Ltd, GSTIN: 27AABCB1234R1ZX. Due: 2026-06-11',
  },
  '03_salary_register.pdf': {
    vendor: 'Acme Corp Pvt Ltd', invoice_number: 'SAL/2026/MAY',
    invoice_date: '2026-05-31',
    line_items: [
      { description: 'Rahul Sharma — Senior Developer',    quantity: '30', unit_price: '85000.00', amount: '112300.00' },
      { description: 'Priya Mehta — Product Manager',      quantity: '30', unit_price: '95000.00', amount: '124600.00' },
      { description: 'Amit Patel — UI/UX Designer',        quantity: '30', unit_price: '72000.00', amount: '95660.00'  },
      { description: 'Sneha Nair — QA Engineer',           quantity: '30', unit_price: '65000.00', amount: '86000.00'  },
      { description: 'Vikram Singh — DevOps Engineer',     quantity: '30', unit_price: '88000.00', amount: '115940.00' },
      { description: 'Anjali Gupta — Business Analyst',    quantity: '30', unit_price: '78000.00', amount: '103040.00' },
      { description: 'Rajesh Kumar — Backend Developer',   quantity: '30', unit_price: '80000.00', amount: '105800.00' },
      { description: 'Deepika Joshi — HR Manager',         quantity: '30', unit_price: '70000.00', amount: '93300.00'  },
    ],
    tax_amount: '64100.00', total_amount: '836640.00', currency: 'INR',
    notes: 'Pay Period: May 2026 (01-05-2026 to 31-05-2026). 8 employees. Total TDS: INR 64,100',
  },
  '04_bank_statement.pdf': {
    vendor: 'HDFC Bank Ltd', invoice_number: 'HDFC50100123456789',
    invoice_date: '2026-04-30',
    line_items: [
      { description: 'NEFT - TCS INV/2026/04512 Payment',     quantity: null, unit_price: '781160.00', amount: ''          },
      { description: 'RTGS - Payroll April 2026',              quantity: null, unit_price: '836640.00', amount: ''          },
      { description: 'Inward - ACME/SI/2026/00155 Receipt',   quantity: null, unit_price: '',           amount: '1032500.00'},
      { description: 'Office Rent - April 2026',               quantity: null, unit_price: '120000.00', amount: ''          },
      { description: 'Inward - Beta Mfg Invoice Settlement',   quantity: null, unit_price: '',           amount: '875000.00' },
      { description: 'Inward - Client Advance Payment',        quantity: null, unit_price: '',           amount: '500000.00' },
    ],
    tax_amount: '1250.00', total_amount: '2704350.00', currency: 'INR',
    notes: 'Branch: Nariman Point, Mumbai. Period: 01-Apr-2026 to 30-Apr-2026. Opening: INR 2,450,000',
  },
  '05_ledger_statement.pdf': {
    vendor: 'Acme Corp Pvt Ltd — Purchases Account', invoice_number: 'LED/2026-27/Q1',
    invoice_date: '2026-04-30',
    line_items: [
      { description: 'TCS Software Services Purchase',   quantity: null, unit_price: '781160.00', amount: ''          },
      { description: 'Prestige Realty - Office Rent',    quantity: null, unit_price: '120000.00', amount: ''          },
      { description: 'AWS Cloud Services',               quantity: null, unit_price: '38500.00',  amount: ''          },
      { description: 'Microsoft Azure Subscription',     quantity: null, unit_price: '45600.00',  amount: ''          },
      { description: 'Payment to TCS - NEFT',            quantity: null, unit_price: '',           amount: '781160.00' },
      { description: 'Legal Advisory Services - LLP',    quantity: null, unit_price: '85000.00',  amount: ''          },
    ],
    tax_amount: null, total_amount: '306600.00', currency: 'INR',
    notes: 'Ledger: Purchases Account, GSTIN: 27AABCU9603R1ZX. Period: Q1 FY 2026-27',
  },
  'sample_invoice_finbridge.pdf': {
    vendor: 'ABC Pvt Ltd', invoice_number: 'INV-123',
    invoice_date: '2026-05-10',
    line_items: [
      { description: 'Software Services', quantity: '1', unit_price: '45000.00', amount: '45000.00' },
    ],
    tax_amount: '8100.00', total_amount: '53100.00', currency: 'INR',
    notes: 'GSTIN: 27ABCDE1234F1Z5. Bill To: XYZ Solutions. CGST 9%: ₹4,050 + SGST 9%: ₹4,050',
  },
};

function mockData(type, originalName) {
  // Exact match on known sample files
  const base = path.basename(originalName || '');
  if (SAMPLE_EXTRACTIONS[base]) return SAMPLE_EXTRACTIONS[base];

  // Generate deterministic-but-unique mock for unknown files
  const seed = [...(originalName || type)].reduce((a, c) => a + c.charCodeAt(0), 0);
  const uid  = (seed % 9000 + 1000).toString();
  const maps = {
    invoice_purchase: { vendor:'Global Supplies Pvt Ltd', invoice_number:`INV-${uid}`, invoice_date:'2026-05-08', line_items:[{description:'Office Equipment & Supplies',quantity:'10',unit_price:'8500.00',amount:'85000.00'},{description:'Shipping & Handling',quantity:'1',unit_price:'2000.00',amount:'2000.00'}], tax_amount:'15660.00', total_amount:'102660.00', currency:'INR', notes:'Payment due: 30 days' },
    invoice_sales:    { vendor:'Nexus Technologies Ltd',   invoice_number:`SINV-${uid}`, invoice_date:'2026-05-09', line_items:[{description:'IT Consulting Services',quantity:'40',unit_price:'3500.00',amount:'140000.00'},{description:'Software License Fee',quantity:'2',unit_price:'25000.00',amount:'50000.00'}], tax_amount:'34200.00', total_amount:'224200.00', currency:'INR', notes:null },
    salary_register:  { vendor:'Sunrise Enterprises',      invoice_number:`SAL-${uid}`, invoice_date:'2026-05-31', line_items:[{description:'Engineering Team — 12 employees',quantity:'30',unit_price:'75000.00',amount:'900000.00'},{description:'Admin Staff — 5 employees',quantity:'30',unit_price:'45000.00',amount:'225000.00'}], tax_amount:'82800.00', total_amount:'1042200.00', currency:'INR', notes:'Pay Period: May 2026' },
    bank_statement:   { vendor:'ICICI Bank Ltd',            invoice_number:`ACC-${uid}`, invoice_date:'2026-04-30', line_items:[{description:'Vendor Payment - NEFT',quantity:null,unit_price:'250000.00',amount:''},{description:'Customer Receipt - RTGS',quantity:null,unit_price:'',amount:'375000.00'},{description:'Salary Disbursement',quantity:null,unit_price:'180000.00',amount:''}], tax_amount:'850.00', total_amount:'1640000.00', currency:'INR', notes:'Statement Period: April 2026' },
    ledger:           { vendor:'Purchases Account',         invoice_number:`LED-${uid}`, invoice_date:'2026-04-30', line_items:[{description:'Raw Material Purchase',quantity:null,unit_price:'320000.00',amount:''},{description:'Payment to Supplier',quantity:null,unit_price:'',amount:'320000.00'}], tax_amount:null, total_amount:'125000.00', currency:'INR', notes:'Q1 FY 2026-27' },
    payment:          { vendor:'Reliable Contractors LLP',  invoice_number:`PAY-${uid}`, invoice_date:'2026-05-07', line_items:[{description:'Civil Work - Phase 2 milestone',quantity:'1',unit_price:'185000.00',amount:'185000.00'}], tax_amount:'0.00', total_amount:'185000.00', currency:'INR', notes:'Cheque No: 004521' },
  };
  return maps[type] || maps.invoice_purchase;
}

// ─── PDF text-layer extraction (works for any PDF without API credits) ────────

function cleanNum(s) {
  if (!s) return null;
  // Strip leading currency code (INR, USD, etc.) or symbol, then remove commas/spaces
  const n = s.replace(/^(INR|USD|EUR|GBP|Rs\.?)\s*/i, '').replace(/[,\s■₹$€£¥]/g, '').trim();
  const v = parseFloat(n);
  return n && !isNaN(v) && v > 0 ? String(v) : null;
}

function parseIndianDate(s) {
  if (!s) return null;
  s = s.trim().replace(/[,]/g, '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  // "10 May 2026", "10-May-2026", "10th May 2026"
  const m1 = s.match(/(\d{1,2})(?:st|nd|rd|th)?[\s\-\/]([A-Za-z]+)[\s\-\/](\d{4})/);
  if (m1) {
    const mo = { jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12' }[m1[2].toLowerCase().slice(0,3)];
    if (mo) return `${m1[3]}-${mo}-${m1[1].padStart(2,'0')}`;
  }
  // dd/mm/yyyy or dd-mm-yyyy
  const m2 = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m2) return `${m2[3]}-${m2[2].padStart(2,'0')}-${m2[1].padStart(2,'0')}`;
  return null;
}

const SKIP_VENDOR = /^(GSTIN|GST|Invoice|Bill|From|To|Date|Page|Phone|Email|Address|Item|Amount|Qty|Desc|Note|Sub|Tax|Total|Grand|Net|Due|Pan|CIN|Tel|Fax|Reg|IBAN|SWIFT|Bank|A\/C|IFSC|UPI|Ref|PO|#|Sr|S\.No)/i;

async function extractFromPdfText(filePath, docType) {
  try {
    const buf   = fs.readFileSync(filePath);
    const data  = await pdfParse(buf);
    const raw   = data.text || '';
    const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

    // Build next-line lookup for "LABEL\nValue" style PDFs
    const nextLineOf = {};
    for (let i = 0; i < lines.length - 1; i++) {
      nextLineOf[lines[i].toUpperCase().trim()] = lines[i + 1];
    }

    // Helper: try label-on-next-line variants, then same-line regex
    function fieldValue(labelVariants, sameLinePattern) {
      for (const lbl of labelVariants) {
        const v = nextLineOf[lbl.toUpperCase()];
        if (v && v.length < 80) return v.trim();
      }
      if (sameLinePattern) {
        const m = raw.match(sameLinePattern);
        if (m) return m[1].trim();
      }
      return null;
    }

    // ── Vendor ──
    let vendor = fieldValue(
      ['VENDOR / SELLER','VENDOR','SELLER','SELLER / ISSUER','FROM','BILLED BY','ISSUED BY','COMPANY'],
      /(?:Vendor|Seller|Billed\s+By|Issued\s+By|From)[:\s]+([^\n]{3,60})/i
    );
    if (!vendor) {
      // Fall back: first line that looks like a company name
      for (const l of lines) {
        if (l.length >= 4 && /[A-Za-z]/.test(l) && !SKIP_VENDOR.test(l) &&
            !/^\d/.test(l) && !l.includes(':') && !l.toUpperCase().startsWith('FinBridge'.toUpperCase())) {
          vendor = l; break;
        }
      }
    }

    // ── Invoice number ──
    let invoice_number = fieldValue(
      ['INVOICE NUMBER','INVOICE NO','INVOICE #','INVOICE NO.','BILL NO','BILL NUMBER','RECEIPT NO'],
      /Invoice\s*(?:No|Number|#|No\.)[:\s#.]*([A-Z0-9][A-Z0-9/_-]*)/i
    );
    if (!invoice_number) {
      // Look for standalone patterns like INV-123, GST/INV/2026/001
      for (const l of lines) {
        const m = l.match(/\b(INV|SINV|GST|BILL|REC|TXN|REF)[\/\-]([A-Z0-9\/_-]+)/i);
        if (m) { invoice_number = m[0].trim(); break; }
      }
    }

    // ── Invoice date ──
    const rawDate = fieldValue(
      ['INVOICE DATE','DATE','BILL DATE','INVOICE DATE:','TAX INVOICE DATE'],
      /(?:Invoice\s*)?Date[:\s]+([^\n]{5,30})/i
    );
    let invoice_date = parseIndianDate(rawDate);
    if (!invoice_date) {
      // Scan all lines for a date pattern
      for (const l of lines) {
        const m = l.match(/(\d{1,2}[\s\-\/][A-Za-z]{3,9}[\s\-\/]\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
        if (m) { invoice_date = parseIndianDate(m[1]); if (invoice_date) break; }
      }
    }

    // ── Total amount — use [^0-9\n]* to match ANY currency prefix, not just known symbols ──
    let total_amount = null;
    const totalPatterns = [
      /Total\s+Amount[^0-9\n]*([\d,]+(?:\.\d{1,2})?)/i,
      /Grand\s+Total[^0-9\n]*([\d,]+(?:\.\d{1,2})?)/i,
      /Net\s+(?:Payable|Total|Amount)[^0-9\n]*([\d,]+(?:\.\d{1,2})?)/i,
      /Amount\s+(?:Payable|Due)[^0-9\n]*([\d,]+(?:\.\d{1,2})?)/i,
      /Invoice\s+Total[^0-9\n]*([\d,]+(?:\.\d{1,2})?)/i,
      /(?:^|\n)\s*TOTAL\s*[^0-9\n]*([\d]{4,}[\d,]*(?:\.\d{1,2})?)/im,
    ];
    for (const pat of totalPatterns) {
      const m = raw.match(pat);
      if (m) { total_amount = cleanNum(m[1]); if (total_amount) break; }
    }
    // Also check next-line style: "TOTAL AMOUNT\nINR 7,81,160.00"
    if (!total_amount) {
      for (const lbl of ['TOTAL AMOUNT','GRAND TOTAL','NET PAYABLE','AMOUNT PAYABLE','NET TOTAL','INVOICE TOTAL','BALANCE DUE']) {
        const v = nextLineOf[lbl.toUpperCase()];
        if (v) { total_amount = cleanNum(v); if (total_amount) break; }
      }
    }

    // ── Tax amount: CGST + SGST or IGST (handles same-line and next-line formats) ──
    let tax_amount = null;
    let cgst = 0, sgst = 0, igst = 0;
    // Same-line: "CGST (9%): ■4,050" — take the LAST number on the line (avoids matching the 9% rate)
    for (const l of lines) {
      const allNums = (l.match(/[\d,]+(?:\.\d{1,2})?/g) || []).map(n => parseFloat(n.replace(/,/g, ''))).filter(v => v >= 10);
      const lastAmt = allNums.length ? allNums[allNums.length - 1] : 0;
      if (/CGST/i.test(l) && lastAmt) cgst += lastAmt;
      else if (/SGST/i.test(l) && lastAmt) sgst += lastAmt;
      else if (/IGST/i.test(l) && lastAmt) igst += lastAmt;
    }
    // Next-line: "CGST @ 9%\nINR 59,580.00"
    for (const [key, val] of Object.entries(nextLineOf)) {
      const nv = parseFloat(cleanNum(val) || 0);
      if (/^CGST/.test(key) && nv >= 10) cgst += nv;
      if (/^SGST/.test(key) && nv >= 10) sgst += nv;
      if (/^IGST/.test(key) && nv >= 10) igst += nv;
    }
    if (cgst + sgst > 0)  tax_amount = (cgst + sgst).toFixed(2);
    else if (igst > 0)    tax_amount = igst.toFixed(2);
    else {
      const gm = raw.match(/(?:Total\s+Tax|Tax\s+Amount|GST\s+Amount)[:\s■₹(INR)]*([\d,]+(?:\.\d{1,2})?)/i);
      if (gm) tax_amount = cleanNum(gm[1]);
    }

    // ── Line items: lines ending with a number that aren't tax/total rows ──
    const SKIP_ITEM = /^(total|cgst|sgst|igst|gst|tax|sub.?total|amount\s*(payable|due)|discount|freight|shipping|balance|advance|tds|cess|surcharge|round)/i;
    const line_items = [];
    for (const l of lines) {
      // Match "Description   ₹45,000" or "Description 45,000.00" — any currency symbol before the number
      const m = l.match(/^(.{3,}?)\s+[^\d\n]{0,3}([\d,]+(?:\.\d{1,2})?)$/);
      if (m && !SKIP_ITEM.test(m[1].trim())) {
        const desc = m[1].trim();
        const amt  = cleanNum(m[2]);
        if (amt && parseFloat(amt) >= 1) {
          line_items.push({ description: desc, quantity: null, unit_price: amt, amount: amt });
        }
      }
    }

    // ── Notes: GSTIN, Bill-To party ──
    const notes_parts = [];
    const gstm = raw.match(/GSTIN[:\s]*([A-Z0-9]{15})/i);
    if (gstm) notes_parts.push(`GSTIN: ${gstm[1]}`);
    const billTo = fieldValue(['BILL TO','BILLED TO','CUSTOMER','CLIENT'], /Bill\s*(?:To|ed\s+To)[:\s]+([^\n]{3,60})/i);
    if (billTo) notes_parts.push(`Bill To: ${billTo}`);

    if (!vendor && !total_amount) return null;

    return {
      vendor:         vendor || null,
      invoice_number: invoice_number || null,
      invoice_date:   invoice_date   || null,
      line_items:     line_items.slice(0, 20),
      tax_amount:     tax_amount || null,
      total_amount:   total_amount  || null,
      currency:       'INR',
      notes:          notes_parts.join('. ') || null,
    };
  } catch (err) {
    console.warn('[PDF Text] extraction error:', err.message);
    return null;
  }
}

async function processWithClaude(filePath, mimeType, docType, originalName) {
  const prompt = PROMPTS[docType] || PROMPTS.invoice_purchase;

  // 1. Try Claude API (best accuracy — works when credits are available)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const base64 = fs.readFileSync(filePath).toString('base64');
      const block  = mimeType === 'application/pdf'
        ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
        : { type: 'image',    source: { type: 'base64', media_type: mimeType,           data: base64 } };
      const res  = await anthropic.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 1500,
        messages: [{ role: 'user', content: [block, { type: 'text', text: prompt }] }],
      });
      const text = res.content[0].text.trim();
      const m    = text.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('No JSON in response');
      const result = JSON.parse(m[0]);
      console.log('[Claude] extracted successfully for', originalName || docType);
      return result;
    } catch (err) {
      console.warn('[Claude] API failed:', err.message);
    }
  }

  // 2. For PDFs — extract text layer and parse with regex (works offline, any PDF)
  if (mimeType === 'application/pdf') {
    console.log('[PDF Text] attempting text extraction for', originalName || filePath);
    const textResult = await extractFromPdfText(filePath, docType);
    if (textResult) {
      console.log('[PDF Text] extracted successfully for', originalName);
      return textResult;
    }
  }

  // 3. Known sample files — return exact pre-coded data
  const base = path.basename(originalName || '');
  if (SAMPLE_EXTRACTIONS[base]) {
    console.log('[Demo] matched known sample file:', base);
    return SAMPLE_EXTRACTIONS[base];
  }

  // 4. Last resort — type-based placeholder
  console.warn('[Fallback] using generic mock for', originalName || docType);
  return mockData(docType, originalName);
}

// ─── Helper: get user from header ─────────────────────────────────────────────

async function getUser(req) {
  const uid = req.headers['x-user-id'];
  if (!uid) return null;
  return User.findById(uid).catch(() => null);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  const user = await User.findOne({ username: username.trim().toLowerCase() });
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  let firm_name = null, company_name = null;
  if (user.firm_id)    { const f = await Firm.findById(user.firm_id);    firm_name    = f?.name; }
  if (user.company_id) { const c = await Company.findById(user.company_id); company_name = c?.name; }

  res.json({ id: user.id, role: user.role, firm_id: user.firm_id, company_id: user.company_id, username: user.username, display_name: user.display_name, email: user.email, firm_name, company_name });
});

// ─── Platform Admin ──────────────────────────────────────────────────────────

app.get('/api/platform/stats', async (req, res) => {
  const [firms, companies, users, transactions] = await Promise.all([
    Firm.countDocuments({ active: true }),
    Company.countDocuments({ active: true }),
    User.countDocuments({ active: true }),
    Transaction.find({ status: 'approved' }),
  ]);
  const totalValue = transactions.reduce((s, t) => s + parseFloat(t.extracted_data?.total_amount || 0), 0);
  const pending    = await Transaction.countDocuments({ status: { $in: ['extracted', 'reviewed'] } });
  res.json({ firms, companies, users, totalValue, pending, approved: transactions.length });
});

app.get('/api/platform/firms', async (req, res) => {
  const firms = await Firm.find().sort({ created_at: -1 });
  res.json(firms);
});

app.post('/api/platform/firms', async (req, res) => {
  const { name, email, phone, address, city, gst_number, registration_number } = req.body;
  if (!name)  return res.status(400).json({ error: 'Firm name is required' });
  if (!email) return res.status(400).json({ error: 'Email is required' });
  if (!phone) return res.status(400).json({ error: 'Contact number is required' });
  if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Contact number must be exactly 10 digits' });
  const exists = await Firm.findOne({ name: name.trim() });
  if (exists) return res.status(409).json({ error: 'Firm already exists' });
  const firm = await Firm.create({ name: name.trim(), email, phone, address, city, gst_number, registration_number, created_by: req.body.created_by || 'platform_admin' });
  res.json(firm);
});

app.patch('/api/platform/firms/:id', async (req, res) => {
  const { password, ...fields } = req.body;
  const firm = await Firm.findByIdAndUpdate(req.params.id, { $set: fields }, { new: true });
  if (!firm) return res.status(404).json({ error: 'Firm not found' });
  res.json(firm);
});

app.delete('/api/platform/firms/:id', async (req, res) => {
  const firm = await Firm.findByIdAndDelete(req.params.id);
  if (!firm) return res.status(404).json({ error: 'Firm not found' });
  res.json({ success: true });
});

app.post('/api/platform/firms/:firmId/admins', async (req, res) => {
  const { username, password, display_name, email, phone } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'username + password required' });
  if (!email)    return res.status(400).json({ error: 'email required' });
  if (!phone)    return res.status(400).json({ error: 'phone required' });
  const exists = await User.findOne({ username: username.trim().toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Username taken' });
  const hashed = await bcrypt.hash(password, 10);
  const user   = await User.create({ username: username.trim().toLowerCase(), password: hashed, role: 'firm_admin', firm_id: req.params.firmId, display_name: display_name || username, email, phone: phone || '' });
  const { password: _, ...safe } = user.toObject();
  sendWelcomeEmail({ toEmail: email, toName: display_name || username, username: username.trim().toLowerCase(), password, role: 'firm_admin' });
  res.json(safe);
});

app.get('/api/platform/users', async (req, res) => {
  const users   = await User.find().sort({ created_at: -1 }).select('-password');
  const firms   = await Firm.find().select('name');
  const firmMap = Object.fromEntries(firms.map(f => [f._id.toString(), f.name]));
  res.json(users.map(u => ({ ...u.toJSON(), firm_name: firmMap[u.firm_id?.toString()] || '—' })));
});

app.delete('/api/platform/users/:id', async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true });
});

app.get('/api/platform/companies', async (req, res) => {
  const companies = await Company.find().sort({ created_at: -1 });
  const firms     = await Firm.find().select('name');
  const firmMap   = Object.fromEntries(firms.map(f => [f._id.toString(), f.name]));
  res.json(companies.map(c => ({ ...c.toJSON(), firm_name: firmMap[c.firm_id?.toString()] || '—' })));
});

app.delete('/api/platform/companies/:id', async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json({ success: true });
});

// ─── Firm Admin ───────────────────────────────────────────────────────────────

app.get('/api/firm/stats', async (req, res) => {
  const firmId = req.query.firm_id;
  if (!firmId) return res.status(400).json({ error: 'firm_id required' });
  const [companies, accountants, transactions] = await Promise.all([
    Company.countDocuments({ firm_id: firmId, active: true }),
    User.countDocuments({ firm_id: firmId, role: 'accountant', active: true }),
    Transaction.find({ firm_id: firmId }),
  ]);
  const pending  = transactions.filter(t => ['extracted','reviewed'].includes(t.status)).length;
  const approved = transactions.filter(t => t.status === 'approved').length;
  const totalValue = transactions.filter(t => t.status === 'approved').reduce((s, t) => s + parseFloat(t.extracted_data?.total_amount || 0), 0);
  res.json({ companies, accountants, pending, approved, totalTransactions: transactions.length, totalValue });
});

app.get('/api/firm/companies', async (req, res) => {
  const firmId = req.query.firm_id;
  if (!firmId) return res.status(400).json({ error: 'firm_id required' });
  const companies = await Company.find({ firm_id: firmId }).sort({ created_at: -1 });
  res.json(companies);
});

app.post('/api/firm/companies', async (req, res) => {
  const { firm_id, name, business_type, email, phone, gst_number, address, created_by } = req.body;
  if (!firm_id || !name) return res.status(400).json({ error: 'firm_id + name required' });
  const exists = await Company.findOne({ firm_id, name: name.trim() });
  if (exists) return res.status(409).json({ error: 'Company already exists in this firm' });
  const company = await Company.create({ firm_id, name: name.trim(), business_type: business_type || 'Services', email, phone, gst_number, address, created_by: created_by || '' });
  await createDefaultHeads(company, firm_id);
  res.json(company);
});

app.patch('/api/firm/companies/:id', async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json(company);
});

app.delete('/api/firm/companies/:id', async (req, res) => {
  const company = await Company.findByIdAndDelete(req.params.id);
  if (!company) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

app.get('/api/firm/accountants', async (req, res) => {
  const firmId = req.query.firm_id;
  if (!firmId) return res.status(400).json({ error: 'firm_id required' });
  const users = await User.find({ firm_id: firmId, role: { $in: ['accountant', 'firm_admin'] } }).select('-password');
  res.json(users);
});

app.get('/api/firm/company-users', async (req, res) => {
  const firmId = req.query.firm_id;
  if (!firmId) return res.status(400).json({ error: 'firm_id required' });
  try {
    const users = await User.find({ firm_id: firmId, role: { $in: ['company_admin', 'company_user'] } }).select('-password');
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/firm/accountants', async (req, res) => {
  const { firm_id, username, password, display_name, email, phone, role } = req.body;
  if (!firm_id || !username || !password) return res.status(400).json({ error: 'firm_id, username, password required' });
  if (!email) return res.status(400).json({ error: 'email required' });
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const exists = await User.findOne({ username: username.trim().toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Username taken' });
  const hashed  = await bcrypt.hash(password, 10);
  const finalRole = role || 'accountant';
  const user    = await User.create({ username: username.trim().toLowerCase(), password: hashed, role: finalRole, firm_id, display_name: display_name || username, email, phone: phone || '' });
  const { password: _, ...safe } = user.toObject();
  sendWelcomeEmail({ toEmail: email, toName: display_name || username, username: username.trim().toLowerCase(), password, role: finalRole });
  res.json(safe);
});

app.post('/api/firm/company-users', async (req, res) => {
  const { firm_id, company_id, username, password, display_name, email, phone, role } = req.body;
  if (!firm_id || !company_id || !username || !password) return res.status(400).json({ error: 'firm_id, company_id, username, password required' });
  if (!email) return res.status(400).json({ error: 'email required' });
  if (!phone) return res.status(400).json({ error: 'phone required' });
  const exists = await User.findOne({ username: username.trim().toLowerCase() });
  if (exists) return res.status(409).json({ error: 'Username taken' });
  const hashed    = await bcrypt.hash(password, 10);
  const finalRole = role || 'company_admin';
  const user      = await User.create({ username: username.trim().toLowerCase(), password: hashed, role: finalRole, firm_id, company_id, display_name: display_name || username, email, phone: phone || '' });
  const { password: _, ...safe } = user.toObject();
  sendWelcomeEmail({ toEmail: email, toName: display_name || username, username: username.trim().toLowerCase(), password, role: finalRole });
  res.json(safe);
});

app.patch('/api/firm/users/:id', async (req, res) => {
  const { password, ...fields } = req.body;
  if (password) fields.password = await bcrypt.hash(password, 10);
  const user = await User.findByIdAndUpdate(req.params.id, { $set: fields }, { new: true }).select('-password');
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

app.delete('/api/firm/users/:id', async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ─── Payment Heads ────────────────────────────────────────────────────────────

app.get('/api/firm/companies/:companyId/payment-heads', async (req, res) => {
  try {
    const heads = await PaymentHead.find({ company_id: req.params.companyId, active: true }).sort({ sort_order: 1 });
    const result = await Promise.all(heads.map(async h => {
      const subs = await SubHead.find({ payment_head_id: h._id, active: true }).sort({ sort_order: 1 });
      return { ...h.toJSON(), sub_heads: subs };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/firm/companies/:companyId/payment-heads', async (req, res) => {
  try {
    const { firm_id, name, type, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Head name required' });
    if (!firm_id) return res.status(400).json({ error: 'firm_id required' });
    const head = await PaymentHead.create({ company_id: req.params.companyId, firm_id, name, type: type || 'expense', description });
    res.json(head);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/firm/payment-heads/:id', async (req, res) => {
  try {
    const head = await PaymentHead.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!head) return res.status(404).json({ error: 'Not found' });
    res.json(head);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/firm/payment-heads/:id', async (req, res) => {
  try {
    await PaymentHead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/firm/payment-heads/:headId/sub-heads', async (req, res) => {
  try {
    const { company_id, name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Sub-head name required' });
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const sub = await SubHead.create({ payment_head_id: req.params.headId, company_id, name, description });
    res.json(sub);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/firm/sub-heads/:id', async (req, res) => {
  try {
    await SubHead.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Transactions ─────────────────────────────────────────────────────────────

app.post('/api/transactions/bulk-upload', upload.array('files', 30), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    const { company_id, type, uploaded_by } = req.body;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });

    // Derive firm_id from the company document if not supplied (mobile clients don't always have it)
    let firm_id = req.body.firm_id;
    if (!firm_id) {
      const company = await Company.findById(company_id);
      if (!company) return res.status(404).json({ error: 'Company not found' });
      firm_id = company.firm_id.toString();
    }

    const docType = type || 'bank_statement';

    // Create all transaction records immediately so the client gets IDs right away
    const txns = await Promise.all(files.map(file =>
      Transaction.create({ company_id, firm_id, type: docType, status: 'processing', filename: file.originalname, filepath: file.path, uploaded_by: uploaded_by || '' })
    ));

    res.json({ success: true, count: txns.length, transactions: txns.map(t => ({ id: t.id, filename: t.filename })) });

    // Run Claude extraction for each file in the background (sequential to avoid rate limits)
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const txn  = txns[i];
      try {
        const extracted = await processWithClaude(file.path, file.mimetype, docType, file.originalname);
        await Transaction.findByIdAndUpdate(txn._id, { extracted_data: extracted, status: 'extracted' });
      } catch (err) {
        console.error(`[Bulk] extraction failed for ${file.originalname}:`, err.message);
        await Transaction.findByIdAndUpdate(txn._id, { status: 'processing' });
      }
      await AuditLog.create({ transaction_id: txn.id, action: 'uploaded', performed_by: uploaded_by || 'company', performed_role: 'company_admin', company_id, firm_id }).catch(() => {});
    }
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.post('/api/transactions/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });
  const { company_id, firm_id, type, uploaded_by } = req.body;
  if (!company_id || !firm_id) return res.status(400).json({ error: 'company_id + firm_id required' });

  const docType = type || 'invoice_purchase';

  const txn = await Transaction.create({
    company_id, firm_id,
    type: docType,
    status: 'processing',
    filename: file.originalname, filepath: file.path,
    uploaded_by: uploaded_by || '',
  });

  res.json({ success: true, transaction: txn });

  // Run Claude extraction for every document type
  try {
    const extracted = await processWithClaude(file.path, file.mimetype, docType, file.originalname);
    await Transaction.findByIdAndUpdate(txn._id, { extracted_data: extracted, status: 'extracted' });
    await AuditLog.create({ transaction_id: txn.id, action: 'uploaded', performed_by: uploaded_by || 'company', performed_role: 'company_admin', company_id, firm_id });
  } catch (err) {
    console.error('[Upload] extraction failed:', err.message);
    await Transaction.findByIdAndUpdate(txn._id, { status: 'processing' });
    await AuditLog.create({ transaction_id: txn.id, action: 'uploaded', performed_by: uploaded_by || 'company', performed_role: 'company_admin', company_id, firm_id });
  }
});

app.get('/api/transactions', async (req, res) => {
  const filter = {};
  if (req.query.company_id) filter.company_id = req.query.company_id;
  if (req.query.firm_id)    filter.firm_id    = req.query.firm_id;
  if (req.query.status)     filter.status     = req.query.status;
  if (req.query.type)       filter.type       = req.query.type;
  const txns = await Transaction.find(filter).sort({ uploaded_at: -1 });
  res.json(txns);
});

app.get('/api/transactions/:id', async (req, res) => {
  const txn = await Transaction.findById(req.params.id).catch(() => null);
  if (!txn) return res.status(404).json({ error: 'Not found' });
  res.json(txn);
});

app.patch('/api/transactions/:id', async (req, res) => {
  const { extracted_data, payment_head_id, sub_head_id, review_notes, performed_by, performed_role } = req.body;
  const update = {};
  if (extracted_data)  update.extracted_data  = extracted_data;
  if (payment_head_id) {
    update.payment_head_id = payment_head_id;
    const head = await PaymentHead.findById(payment_head_id);
    if (head) update.payment_head_name = head.name;
  }
  if (sub_head_id) {
    update.sub_head_id = sub_head_id;
    const sub = await SubHead.findById(sub_head_id);
    if (sub) update.sub_head_name = sub.name;
  }
  if (review_notes !== undefined) update.review_notes = review_notes;
  if (Object.keys(update).length) update.status = 'reviewed';

  const txn = await Transaction.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
  if (!txn) return res.status(404).json({ error: 'Not found' });
  await AuditLog.create({ transaction_id: txn.id, action: 'reviewed', performed_by: performed_by || '', performed_role: performed_role || '', company_id: txn.company_id?.toString() || '', firm_id: txn.firm_id?.toString() || '' });
  res.json(txn);
});

app.patch('/api/transactions/:id/status', async (req, res) => {
  try {
    const { status, performed_by, performed_role, notes } = req.body;
    const allowed = ['extracted', 'reviewed', 'approved', 'rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const update = { status };
    if (status === 'approved') { update.approved_by = performed_by || 'accountant'; update.approved_at = new Date(); }
    if (status === 'reviewed') { update.reviewed_by = performed_by || 'accountant'; update.reviewed_at = new Date(); }
    const txn = await Transaction.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    if (!txn) return res.status(404).json({ error: 'Not found' });
    await AuditLog.create({ transaction_id: txn.id, action: status, performed_by: performed_by || '', performed_role: performed_role || 'accountant', notes: notes || '', company_id: txn.company_id?.toString() || '', firm_id: txn.firm_id?.toString() || '' });
    res.json(txn);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions/:id/approve', async (req, res) => {
  const txn = await Transaction.findById(req.params.id).catch(() => null);
  if (!txn) return res.status(404).json({ error: 'Not found' });
  txn.status      = 'approved';
  txn.approved_by = req.body.performed_by || 'accountant';
  txn.approved_at = new Date();
  await txn.save();
  await AuditLog.create({ transaction_id: txn.id, action: 'approved', performed_by: req.body.performed_by || '', performed_role: 'accountant', notes: req.body.notes || '', company_id: txn.company_id?.toString() || '', firm_id: txn.firm_id?.toString() || '' });
  res.json(txn);
});

app.post('/api/transactions/:id/reject', async (req, res) => {
  const txn = await Transaction.findById(req.params.id).catch(() => null);
  if (!txn) return res.status(404).json({ error: 'Not found' });
  txn.status        = 'rejected';
  txn.reject_reason = req.body.reason || '';
  await txn.save();
  await AuditLog.create({ transaction_id: txn.id, action: 'rejected', performed_by: req.body.performed_by || '', performed_role: 'accountant', notes: req.body.reason || '', company_id: txn.company_id?.toString() || '', firm_id: txn.firm_id?.toString() || '' });
  res.json(txn);
});

app.delete('/api/transactions/:id', async (req, res) => {
  const txn = await Transaction.findByIdAndDelete(req.params.id).catch(() => null);
  if (!txn) return res.status(404).json({ error: 'Not found' });
  if (txn.filepath && fs.existsSync(txn.filepath)) fs.unlinkSync(txn.filepath);
  res.json({ success: true });
});

app.post('/api/transactions/:id/reextract', async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Not found' });
    if (!txn.filepath || !fs.existsSync(txn.filepath))
      return res.status(400).json({ error: 'Original file not available on disk' });
    const ext  = (txn.filepath || '').toLowerCase();
    const mime = ext.endsWith('.pdf') ? 'application/pdf'
               : ext.endsWith('.png') ? 'image/png'
               : ext.endsWith('.webp') ? 'image/webp'
               : 'image/jpeg';
    const extracted = await processWithClaude(txn.filepath, mime, txn.type, txn.filename);
    const updated   = await Transaction.findByIdAndUpdate(
      txn._id, { extracted_data: extracted, status: 'extracted' }, { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Company user edits extracted data on a rejected transaction → resets to extracted
app.patch('/api/transactions/:id/company-edit', async (req, res) => {
  try {
    const { extracted_data, performed_by } = req.body;
    const txn = await Transaction.findByIdAndUpdate(
      req.params.id,
      { $set: { extracted_data, status: 'extracted', reject_reason: null } },
      { new: true }
    );
    if (!txn) return res.status(404).json({ error: 'Not found' });
    await AuditLog.create({ transaction_id: txn.id, action: 'company_edited', performed_by: performed_by || 'company_user', performed_role: 'company_user', company_id: txn.company_id.toString(), firm_id: txn.firm_id.toString() });
    res.json(txn);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Company user re-uploads a new file for a rejected transaction
app.post('/api/transactions/:id/reupload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ error: 'Not found' });
    // Delete old file
    if (txn.filepath && fs.existsSync(txn.filepath)) { try { fs.unlinkSync(txn.filepath); } catch {} }
    await Transaction.findByIdAndUpdate(txn._id, {
      filename: file.originalname, filepath: file.path,
      status: 'processing', reject_reason: null,
    });
    res.json({ success: true });
    try {
      const extracted = await processWithClaude(file.path, file.mimetype, txn.type, file.originalname);
      await Transaction.findByIdAndUpdate(txn._id, { extracted_data: extracted, status: 'extracted' });
      await AuditLog.create({ transaction_id: txn.id, action: 'reupload', performed_by: req.body.uploaded_by || 'company_user', performed_role: 'company_user', company_id: txn.company_id.toString(), firm_id: txn.firm_id.toString() });
    } catch (err) {
      console.error('[Reupload] extraction failed:', err.message);
      await Transaction.findByIdAndUpdate(txn._id, { status: 'extracted' });
    }
  } catch (err) { if (!res.headersSent) res.status(500).json({ error: err.message }); }
});

// ─── Reports ──────────────────────────────────────────────────────────────────

app.post('/api/reports/upload', upload.single('report'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file' });
    const { company_id, firm_id, report_name, report_type, uploaded_by } = req.body;
    if (!company_id || !firm_id) return res.status(400).json({ error: 'company_id + firm_id required' });
    const report = await Report.create({ company_id, firm_id, report_name: report_name || file.originalname, filename: file.originalname, filepath: file.path, report_type: report_type || 'MIS', uploaded_by: uploaded_by || '' });
    res.json({ success: true, report });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports', async (req, res) => {
  try {
    const filter = {};
    if (req.query.company_id) filter.company_id = req.query.company_id;
    if (req.query.firm_id)    filter.firm_id    = req.query.firm_id;
    const reports = await Report.find(filter).sort({ uploaded_at: -1 });
    res.json(reports);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/reports/:id/download', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).catch(() => null);
    if (!report) return res.status(404).json({ error: 'Not found' });
    if (!report.filepath || !fs.existsSync(report.filepath)) return res.status(404).json({ error: 'File not on disk (demo data)' });
    res.download(path.resolve(report.filepath), report.filename);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Audit Log ────────────────────────────────────────────────────────────────

app.get('/api/audit', async (req, res) => {
  try {
    const filter = {};
    if (req.query.firm_id)    filter.firm_id    = req.query.firm_id;
    if (req.query.company_id) filter.company_id = req.query.company_id;
    const logs = await AuditLog.find(filter).sort({ performed_at: -1 }).limit(200);

    const toOid = id => { try { return new mongoose.Types.ObjectId(String(id)); } catch { return null; } };
    const isOid = id => Boolean(id && /^[a-f0-9]{24}$/i.test(String(id)));

    // ── 1. Look up ALL transaction IDs to build txn→company map ──
    const txnToCompany = {};
    const allTxnIds = [...new Set(logs.map(l => l.transaction_id).filter(isOid))];
    if (allTxnIds.length) {
      const txns = await Transaction.find({ _id: { $in: allTxnIds.map(toOid).filter(Boolean) } }, 'company_id').lean();
      txns.forEach(t => { txnToCompany[t._id.toString()] = t.company_id?.toString(); });
    }

    // ── 2. Collect ALL company IDs (direct + via transaction) and batch-lookup names ──
    const companyMap = {};
    const allCids = [...new Set([
      ...logs.map(l => l.company_id),
      ...Object.values(txnToCompany),
    ].filter(isOid))];
    if (allCids.length) {
      const companies = await Company.find({ _id: { $in: allCids.map(toOid).filter(Boolean) } }, 'name').lean();
      companies.forEach(c => { companyMap[c._id.toString()] = c.name; });
    }

    // ── 3. User display name map for performed_by values that look like ObjectIds ──
    const userMap = {};
    const perfIds = [...new Set(logs.map(l => l.performed_by).filter(isOid))];
    if (perfIds.length) {
      const users = await User.find({ _id: { $in: perfIds.map(toOid).filter(Boolean) } }, 'display_name username').lean();
      users.forEach(u => { userMap[u._id.toString()] = u.display_name || u.username; });
    }

    // ── 4. Enrich each log ──
    const enriched = logs.map(l => {
      const nameFromDirect = l.company_id ? companyMap[l.company_id] : null;
      const nameFromTxn    = l.transaction_id ? companyMap[txnToCompany[l.transaction_id]] : null;
      return {
        ...l.toJSON(),
        company_name: l.company_name || nameFromDirect || nameFromTxn || null,
        performed_by: userMap[l.performed_by] || l.performed_by,
      };
    });

    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Company (mobile app) routes ─────────────────────────────────────────────

app.get('/api/company/invoices', async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });
    const txns = await Transaction.find({ company_id }).sort({ uploaded_at: -1 }).limit(50);
    res.json(txns);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/company/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const { company_id, type, uploaded_by } = req.body;
    if (!company_id) return res.status(400).json({ error: 'company_id required' });

    const company = await Company.findById(company_id);
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const firm_id = company.firm_id;

    const docType = type || 'invoice_purchase';
    const txn = await Transaction.create({
      company_id, firm_id,
      type: docType,
      status: 'processing',
      filename: file.originalname,
      filepath: file.path,
      uploaded_by: uploaded_by || '',
    });

    res.json({ success: true, transaction: txn });

    try {
      const extracted = await processWithClaude(file.path, file.mimetype, docType, file.originalname);
      await Transaction.findByIdAndUpdate(txn._id, { extracted_data: extracted, status: 'extracted' });
      await AuditLog.create({ transaction_id: txn.id, action: 'uploaded', performed_by: uploaded_by || 'company', performed_role: 'company_user', company_id, firm_id: firm_id.toString() });
    } catch (err) {
      console.error('[Company Upload] extraction failed:', err.message);
      await Transaction.findByIdAndUpdate(txn._id, { status: 'processing' });
    }
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ─── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// Catch-all: serve index.html for any non-API route
if (fs.existsSync(DIST)) {
  app.get('*', (req, res) => res.sendFile(path.join(DIST, 'index.html')));
}

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err, req, res, next) => { console.error('[Error]', err.message); res.status(400).json({ error: err.message }); });

// ─── Start ────────────────────────────────────────────────────────────────────

mongoose.connect(MONGO_URI).then(async () => {
  console.log(`[DB] Connected: ${MONGO_URI}`);
  await seed();
  app.listen(PORT, () => {
    console.log(`\n🚀 FinBridge SaaS backend on http://localhost:${PORT}\n`);
  });
}).catch(err => { console.error('[DB] Failed:', err.message); process.exit(1); });
