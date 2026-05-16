const PDFDocument = require('./backend/node_modules/pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'sample_uploads');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

/* ── helpers ── */
const INR = (n) => `INR ${parseFloat(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

function header(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 80).fill('#1e40af');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('FinBridge', 40, 22);
  doc.fontSize(10).font('Helvetica').text('Automated Financial Management', 40, 50);
  doc.fontSize(18).font('Helvetica-Bold').text(title, 300, 22, { align: 'right', width: 255 });
  doc.fontSize(10).font('Helvetica').fillColor('#bfdbfe').text(subtitle, 300, 50, { align: 'right', width: 255 });
  doc.fillColor('#000000');
  doc.y = 100;
}

function sectionLine(doc) {
  doc.moveDown(0.3).moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke().moveDown(0.3);
}

function kv(doc, label, value, x = 40, y = null) {
  const ty = y !== null ? y : doc.y;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b').text(label, x, ty);
  doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(value, x, ty + 12);
  if (y === null) doc.y = ty + 28;
}

function tableHeader(doc, cols, y) {
  doc.rect(40, y, doc.page.width - 80, 22).fill('#1e40af');
  let x = 40;
  cols.forEach(c => {
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text(c.label, x + 4, y + 6, { width: c.w - 8, align: c.align || 'left' });
    x += c.w;
  });
  return y + 22;
}

function tableRow(doc, cols, row, y, shade) {
  const h = 20;
  if (shade) doc.rect(40, y, doc.page.width - 80, h).fill('#f8fafc');
  let x = 40;
  cols.forEach((c, i) => {
    doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text(String(row[i] ?? ''), x + 4, y + 5, { width: c.w - 8, align: c.align || 'left' });
    x += c.w;
  });
  // bottom border
  doc.moveTo(40, y + h).lineTo(doc.page.width - 80 + 40, y + h).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
  return y + h;
}

function footer(doc, docType) {
  const y = doc.page.height - 60;
  doc.rect(0, y, doc.page.width, 60).fill('#f8fafc');
  doc.font('Helvetica').fontSize(8).fillColor('#94a3b8')
    .text(`Document Type: ${docType}  |  Generated for FinBridge upload testing  |  All figures in INR`, 40, y + 12, { align: 'center', width: doc.page.width - 80 })
    .text('This is a sample document. Upload this PDF to the FinBridge Company Portal for AI extraction.', 40, y + 26, { align: 'center', width: doc.page.width - 80 });
}

/* ════════════════════════════════════════════════════════
   1. PURCHASE INVOICE
════════════════════════════════════════════════════════ */
function genPurchaseInvoice() {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(fs.createWriteStream(path.join(OUT, '01_purchase_invoice.pdf')));

  header(doc, 'TAX INVOICE', 'Purchase Invoice');

  // From / To
  doc.y = 110;
  kv(doc, 'VENDOR / SELLER', 'Tata Consultancy Services Ltd', 40);
  kv(doc, 'ADDRESS', '12th Floor, Air India Building, Nariman Point, Mumbai - 400021');
  kv(doc, 'GSTIN (Seller)', '27AABCT3518Q1ZS');

  doc.y = 110;
  kv(doc, 'BILL TO', 'Acme Corp Pvt Ltd', 320);
  kv(doc, 'ADDRESS', '5th Floor, Maker Chambers V, Nariman Point, Mumbai', 320);
  kv(doc, 'GSTIN (Buyer)', '27AABCU9603R1ZX', 320);

  sectionLine(doc);

  // Invoice meta
  const metaY = doc.y;
  kv(doc, 'INVOICE NUMBER', 'TCS/INV/2026/04512', 40, metaY);
  kv(doc, 'INVOICE DATE', '2026-05-10', 200, metaY);
  kv(doc, 'DUE DATE', '2026-06-09', 340, metaY);
  kv(doc, 'CURRENCY', 'INR', 460, metaY);
  doc.y = metaY + 40;

  sectionLine(doc);

  // Line items table
  const cols = [
    { label: '#',           w: 30  },
    { label: 'Description', w: 200 },
    { label: 'HSN/SAC',     w: 70  },
    { label: 'Qty',         w: 45, align: 'right' },
    { label: 'Unit Price',  w: 80, align: 'right' },
    { label: 'Amount',      w: 90, align: 'right' },
  ];

  const items = [
    ['1', 'Software Development Services - Phase 1',  '998314', '1',  '250000.00', '250000.00'],
    ['2', 'Cloud Infrastructure Setup & Configuration','998313', '1',  '85000.00',  '85000.00'],
    ['3', 'Annual Support & Maintenance Contract',     '998315', '12', '8500.00',   '102000.00'],
    ['4', 'Project Management & Consulting',           '998316', '40', '4500.00',   '180000.00'],
    ['5', 'Data Migration Services',                   '998314', '1',  '45000.00',  '45000.00'],
  ];

  let ty = tableHeader(doc, cols, doc.y);
  items.forEach((row, i) => { ty = tableRow(doc, cols, row, ty, i % 2 === 1); });

  // Totals
  doc.y = ty + 10;
  const totX = 370;
  const subtotal = 662000;
  const cgst = 59580;
  const sgst = 59580;
  const total = 781160;

  [
    ['Sub Total',      INR(subtotal)],
    ['CGST @ 9%',      INR(cgst)],
    ['SGST @ 9%',      INR(sgst)],
    ['Total Tax (GST)',INR(cgst + sgst)],
  ].forEach(([l, v]) => {
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(l, totX, doc.y, { width: 120 });
    doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(v, totX + 120, doc.y, { width: 100, align: 'right' });
    doc.y += 16;
  });

  doc.rect(totX - 5, doc.y, 245, 24).fill('#1e40af');
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff')
    .text('TOTAL AMOUNT', totX, doc.y + 6, { width: 120 })
    .text(INR(total), totX + 120, doc.y + 6, { width: 100, align: 'right' });
  doc.y += 34;
  doc.fillColor('#000000');

  // Notes
  sectionLine(doc);
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#64748b').text('PAYMENT TERMS', 40, doc.y);
  doc.font('Helvetica').fontSize(9).fillColor('#0f172a').text('Payment due within 30 days. Bank: HDFC Bank, A/C: 50100123456789, IFSC: HDFC0001234', 40, doc.y + 12);

  footer(doc, 'invoice_purchase');
  doc.end();
  console.log('✅ 01_purchase_invoice.pdf');
}

/* ════════════════════════════════════════════════════════
   2. SALES INVOICE
════════════════════════════════════════════════════════ */
function genSalesInvoice() {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(fs.createWriteStream(path.join(OUT, '02_sales_invoice.pdf')));

  header(doc, 'SALES INVOICE', 'Sales Invoice');

  doc.y = 110;
  kv(doc, 'SELLER / ISSUER', 'Acme Corp Pvt Ltd', 40);
  kv(doc, 'ADDRESS', '5th Floor, Maker Chambers V, Nariman Point, Mumbai - 400021');
  kv(doc, 'GSTIN', '27AABCU9603R1ZX');

  doc.y = 110;
  kv(doc, 'BILL TO', 'Beta Manufacturing Pvt Ltd', 320);
  kv(doc, 'ADDRESS', 'Plot No. 14, MIDC Industrial Area, Pune - 411019', 320);
  kv(doc, 'GSTIN', '27AABCB1234R1ZX', 320);

  sectionLine(doc);

  const metaY = doc.y;
  kv(doc, 'INVOICE NUMBER', 'ACME/SI/2026/00198', 40, metaY);
  kv(doc, 'INVOICE DATE', '2026-05-12', 200, metaY);
  kv(doc, 'DUE DATE', '2026-06-11', 340, metaY);
  kv(doc, 'CURRENCY', 'INR', 460, metaY);
  doc.y = metaY + 40;

  sectionLine(doc);

  const cols = [
    { label: '#',           w: 30  },
    { label: 'Description', w: 200 },
    { label: 'HSN',         w: 70  },
    { label: 'Qty',         w: 45, align: 'right' },
    { label: 'Rate',        w: 80, align: 'right' },
    { label: 'Amount',      w: 90, align: 'right' },
  ];

  const items = [
    ['1', 'Enterprise Software License (Annual)',  '998315', '5',  '120000.00', '600000.00'],
    ['2', 'Implementation & Integration Services', '998314', '1',  '200000.00', '200000.00'],
    ['3', 'User Training (5 days)',                '998316', '5',  '15000.00',  '75000.00'],
  ];

  let ty = tableHeader(doc, cols, doc.y);
  items.forEach((row, i) => { ty = tableRow(doc, cols, row, ty, i % 2 === 1); });

  doc.y = ty + 10;
  const totX = 370;
  [
    ['Sub Total', INR(875000)],
    ['IGST @ 18%', INR(157500)],
  ].forEach(([l, v]) => {
    doc.font('Helvetica').fontSize(10).fillColor('#475569').text(l, totX, doc.y, { width: 120 });
    doc.font('Helvetica').fontSize(10).fillColor('#0f172a').text(v, totX + 120, doc.y, { width: 100, align: 'right' });
    doc.y += 16;
  });
  doc.rect(totX - 5, doc.y, 245, 24).fill('#1e40af');
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff')
    .text('TOTAL AMOUNT', totX, doc.y + 6, { width: 120 })
    .text(INR(1032500), totX + 120, doc.y + 6, { width: 100, align: 'right' });
  doc.y += 34; doc.fillColor('#000000');

  footer(doc, 'invoice_sales');
  doc.end();
  console.log('✅ 02_sales_invoice.pdf');
}

/* ════════════════════════════════════════════════════════
   3. SALARY REGISTER
════════════════════════════════════════════════════════ */
function genSalaryRegister() {
  const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
  doc.pipe(fs.createWriteStream(path.join(OUT, '03_salary_register.pdf')));

  header(doc, 'SALARY REGISTER', 'May 2026 — Acme Corp Pvt Ltd');

  doc.y = 110;
  const metaY = doc.y;
  kv(doc, 'COMPANY', 'Acme Corp Pvt Ltd', 40, metaY);
  kv(doc, 'PAY PERIOD', 'May 2026 (01-05-2026 to 31-05-2026)', 250, metaY);
  kv(doc, 'DEPARTMENT', 'All Departments', 530, metaY);
  doc.y = metaY + 40;
  sectionLine(doc);

  const cols = [
    { label: 'Emp ID',        w: 55  },
    { label: 'Employee Name', w: 115 },
    { label: 'Designation',   w: 100 },
    { label: 'Basic (INR)',   w: 75, align: 'right' },
    { label: 'HRA',           w: 60, align: 'right' },
    { label: 'Allowances',    w: 70, align: 'right' },
    { label: 'Gross',         w: 75, align: 'right' },
    { label: 'PF Dedn',       w: 60, align: 'right' },
    { label: 'TDS',           w: 55, align: 'right' },
    { label: 'Net Pay',       w: 75, align: 'right' },
  ];

  const employees = [
    ['E001', 'Rahul Sharma',    'Senior Developer',    '85000',  '34000', '12000', '131000', '10200', '8500',  '112300'],
    ['E002', 'Priya Mehta',     'Product Manager',     '95000',  '38000', '15000', '148000', '11400', '12000', '124600'],
    ['E003', 'Amit Patel',      'UI/UX Designer',      '72000',  '28800', '10000', '110800', '8640',  '6500',  '95660'],
    ['E004', 'Sneha Nair',      'QA Engineer',         '65000',  '26000', '8000',  '99000',  '7800',  '5200',  '86000'],
    ['E005', 'Vikram Singh',    'DevOps Engineer',     '88000',  '35200', '12500', '135700', '10560', '9200',  '115940'],
    ['E006', 'Anjali Gupta',    'Business Analyst',    '78000',  '31200', '11000', '120200', '9360',  '7800',  '103040'],
    ['E007', 'Rajesh Kumar',    'Backend Developer',   '80000',  '32000', '11500', '123500', '9600',  '8100',  '105800'],
    ['E008', 'Deepika Joshi',   'HR Manager',          '70000',  '28000', '10500', '108500', '8400',  '6800',  '93300'],
  ];

  let ty = tableHeader(doc, cols, doc.y);
  employees.forEach((row, i) => { ty = tableRow(doc, cols, row, ty, i % 2 === 1); });

  // Totals row
  doc.y = ty + 6;
  doc.rect(40, doc.y, doc.page.width - 80, 22).fill('#1e40af');
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff')
    .text('TOTAL', 44, doc.y + 6, { width: 165 })
    .text('633000', 326, doc.y + 6, { width: 71, align: 'right' })
    .text('253200', 396, doc.y + 6, { width: 56, align: 'right' })
    .text('90500', 452, doc.y + 6, { width: 66, align: 'right' })
    .text('976700', 518, doc.y + 6, { width: 71, align: 'right' })
    .text('75960', 589, doc.y + 6, { width: 56, align: 'right' })
    .text('64100', 645, doc.y + 6, { width: 51, align: 'right' })
    .text('836640', 696, doc.y + 6, { width: 71, align: 'right' });
  doc.y += 30; doc.fillColor('#000000');

  footer(doc, 'salary_register');
  doc.end();
  console.log('✅ 03_salary_register.pdf');
}

/* ════════════════════════════════════════════════════════
   4. BANK STATEMENT
════════════════════════════════════════════════════════ */
function genBankStatement() {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(fs.createWriteStream(path.join(OUT, '04_bank_statement.pdf')));

  header(doc, 'BANK STATEMENT', 'Account Statement — April 2026');

  doc.y = 110;
  const m = doc.y;
  kv(doc, 'ACCOUNT HOLDER', 'Acme Corp Pvt Ltd', 40, m);
  kv(doc, 'ACCOUNT NUMBER', 'HDFC50100123456789', 300, m);
  kv(doc, 'BANK', 'HDFC Bank Ltd', 40, m + 30);
  kv(doc, 'BRANCH', 'Nariman Point, Mumbai', 300, m + 30);
  kv(doc, 'IFSC', 'HDFC0001234', 40, m + 60);
  kv(doc, 'STATEMENT PERIOD', '01-Apr-2026 to 30-Apr-2026', 300, m + 60);
  doc.y = m + 95;
  sectionLine(doc);

  const cols = [
    { label: 'Date',        w: 75  },
    { label: 'Description', w: 190 },
    { label: 'Ref / Chq No',w: 90  },
    { label: 'Debit (INR)', w: 80, align: 'right' },
    { label: 'Credit (INR)',w: 80, align: 'right' },
    { label: 'Balance (INR)',w: 100, align: 'right' },
  ];

  const txns = [
    ['01-Apr-2026', 'Opening Balance',                      '',             '',          '',           '2450000.00'],
    ['02-Apr-2026', 'NEFT - TCS INV/2026/04512 Payment',   'NEFT2045678',  '781160.00', '',           '1668840.00'],
    ['05-Apr-2026', 'RTGS - Payroll April 2026',            'RTGS9087654',  '836640.00', '',           '832200.00'],
    ['08-Apr-2026', 'Inward - ACME/SI/2026/00155 Receipt', 'NEFT1122334',  '',          '1032500.00', '1864700.00'],
    ['10-Apr-2026', 'Office Rent - April 2026',             'ACH0056781',   '120000.00', '',           '1744700.00'],
    ['12-Apr-2026', 'GST Payment Q4',                       'IMPS3345678',  '245000.00', '',           '1499700.00'],
    ['15-Apr-2026', 'Inward - Beta Mfg Invoice Settle',     'NEFT5566778',  '',          '875000.00',  '2374700.00'],
    ['18-Apr-2026', 'Software Subscription - Microsoft',    'ACH0067892',   '45600.00',  '',           '2329100.00'],
    ['22-Apr-2026', 'Internet & Cloud Services - AWS',      'ACH0078903',   '38500.00',  '',           '2290600.00'],
    ['25-Apr-2026', 'Legal & Consulting Fees',               'NEFT8890123',  '85000.00',  '',           '2205600.00'],
    ['28-Apr-2026', 'Inward - Client Advance Payment',      'RTGS2234567',  '',          '500000.00',  '2705600.00'],
    ['30-Apr-2026', 'Bank Charges & GST',                   '',             '1250.00',   '',           '2704350.00'],
    ['30-Apr-2026', 'Closing Balance',                      '',             '',          '',           '2704350.00'],
  ];

  let ty = tableHeader(doc, cols, doc.y);
  txns.forEach((row, i) => { ty = tableRow(doc, cols, row, ty, i % 2 === 1); });

  doc.y = ty + 12;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e40af')
    .text(`Opening Balance: INR 2,450,000.00`, 40, doc.y)
    .text(`Total Debits: INR 2,153,150.00`, 220, doc.y)
    .text(`Total Credits: INR 2,407,500.00`, 380, doc.y)
    .text(`Closing Balance: INR 2,704,350.00`, 530, doc.y);

  footer(doc, 'bank_statement');
  doc.end();
  console.log('✅ 04_bank_statement.pdf');
}

/* ════════════════════════════════════════════════════════
   5. LEDGER STATEMENT
════════════════════════════════════════════════════════ */
function genLedger() {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  doc.pipe(fs.createWriteStream(path.join(OUT, '05_ledger_statement.pdf')));

  header(doc, 'LEDGER STATEMENT', 'General Ledger — Q1 FY 2026-27');

  doc.y = 110;
  const m = doc.y;
  kv(doc, 'COMPANY', 'Acme Corp Pvt Ltd', 40, m);
  kv(doc, 'LEDGER ACCOUNT', 'Purchases Account', 300, m);
  kv(doc, 'GSTIN', '27AABCU9603R1ZX', 40, m + 30);
  kv(doc, 'PERIOD', 'April 2026 — June 2026 (Q1 FY 2026-27)', 300, m + 30);
  doc.y = m + 72;
  sectionLine(doc);

  const cols = [
    { label: 'Date',        w: 75  },
    { label: 'Particulars', w: 185 },
    { label: 'Voucher No',  w: 90  },
    { label: 'Type',        w: 70  },
    { label: 'Debit (INR)', w: 80, align: 'right' },
    { label: 'Credit (INR)',w: 80, align: 'right' },
    { label: 'Balance',     w: 85, align: 'right' },
  ];

  const entries = [
    ['01-Apr-2026', 'Opening Balance',                  '',              'B/F',    '',          '',          '125000.00 Dr'],
    ['02-Apr-2026', 'TCS Software Services Purchase',   'PUR/2026/0045', 'Purchase','781160.00','',         '906160.00 Dr'],
    ['05-Apr-2026', 'Prestige Realty - Office Rent',    'PUR/2026/0046', 'Expense', '120000.00','',         '1026160.00 Dr'],
    ['08-Apr-2026', 'AWS Cloud Services',               'PUR/2026/0047', 'Expense', '38500.00', '',         '1064660.00 Dr'],
    ['12-Apr-2026', 'Microsoft Azure Subscription',     'PUR/2026/0048', 'Purchase','45600.00', '',         '1110260.00 Dr'],
    ['15-Apr-2026', 'Payment to TCS - NEFT',            'PMT/2026/0089', 'Payment', '',         '781160.00', '329100.00 Dr'],
    ['18-Apr-2026', 'Legal Advisory Services - LLP',    'PUR/2026/0049', 'Expense', '85000.00', '',         '414100.00 Dr'],
    ['22-Apr-2026', 'Telecom & Internet - Jio',         'PUR/2026/0050', 'Expense', '12500.00', '',         '426600.00 Dr'],
    ['28-Apr-2026', 'Payment to Prestige - RTGS',       'PMT/2026/0090', 'Payment', '',         '120000.00', '306600.00 Dr'],
    ['30-Apr-2026', 'Closing Balance',                  '',              'C/F',    '',          '',          '306600.00 Dr'],
  ];

  let ty = tableHeader(doc, cols, doc.y);
  entries.forEach((row, i) => { ty = tableRow(doc, cols, row, ty, i % 2 === 1); });

  doc.y = ty + 12;
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#1e40af')
    .text('Total Debits: INR 1,082,760.00', 40, doc.y)
    .text('Total Credits: INR 901,160.00', 260, doc.y)
    .text('Closing Balance: INR 306,600.00 Dr', 460, doc.y);

  footer(doc, 'ledger');
  doc.end();
  console.log('✅ 05_ledger_statement.pdf');
}

/* ── run all ── */
genPurchaseInvoice();
genSalesInvoice();
genSalaryRegister();
genBankStatement();
genLedger();

console.log(`\nAll PDFs saved to: ${OUT}`);
