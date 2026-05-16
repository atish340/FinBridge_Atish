// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeXML(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toFixed2(n) {
  return parseFloat(parseFloat(n || 0).toFixed(2));
}

function triggerDownload(blob, filename) {
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function safeFilename(invoice) {
  return (invoice.extracted_data?.invoice_number || invoice.id || 'invoice')
    .replace(/[^a-z0-9]/gi, '_');
}

// ─── Tally XML ───────────────────────────────────────────────────────────────

export function convertToTallyXML(invoice) {
  const d    = invoice.extracted_data || {};
  const total = toFixed2(d.total_amount);
  const tax   = toFixed2(d.tax_amount);
  const base  = toFixed2(total - tax);
  const cgst  = toFixed2(tax / 2);
  const sgst  = toFixed2(tax / 2);

  // YYYY-MM-DD → YYYYMMDD
  const date = (d.invoice_date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');

  const vendor    = escapeXML(d.vendor         || 'Unknown Vendor');
  const invoiceNo = escapeXML(d.invoice_number || 'INV-UNKNOWN');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>##SVCURRENTCOMPANY</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Purchase" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${date}</DATE>
            <VOUCHERTYPENAME>Purchase</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${invoiceNo}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${vendor}</PARTYLEDGERNAME>
            <NARRATION>Invoice ${invoiceNo} from ${vendor}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${vendor}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${total.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>Purchase Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${base.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>CGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${cgst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>SGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${sgst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function downloadXML(xmlString, filename) {
  const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
  triggerDownload(blob, filename);
}

export function exportToTally(invoice) {
  if (!invoice.extracted_data) throw new Error('No extracted data to export');
  downloadXML(convertToTallyXML(invoice), `tally_${safeFilename(invoice)}.xml`);
}

// ─── QuickBooks IIF ──────────────────────────────────────────────────────────

function toQBDate(dateStr) {
  // YYYY-MM-DD → MM/DD/YYYY
  if (!dateStr) return new Date().toLocaleDateString('en-US');
  const [y, m, d] = dateStr.split('-');
  return `${m}/${d}/${y}`;
}

export function convertToQuickBooksIIF(invoices) {
  const rows = [
    '!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tDOCNUM\tMEMO',
    '!SPL\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO',
    '!ENDTRNS',
  ];

  (Array.isArray(invoices) ? invoices : [invoices]).forEach(inv => {
    const d     = inv.extracted_data || {};
    const total = toFixed2(d.total_amount);
    const tax   = toFixed2(d.tax_amount);
    const base  = toFixed2(total - tax);
    const date  = toQBDate(d.invoice_date);
    const vendor = (d.vendor || 'Unknown Vendor').replace(/\t/g, ' ');
    const docNum = (d.invoice_number || inv.id || '').replace(/\t/g, ' ');
    const memo   = `Invoice ${docNum} from ${vendor}`;
    const acctType = inv.type === 'invoice_sales' ? 'Accounts Receivable' : 'Accounts Payable';
    const ledger   = inv.type === 'invoice_sales' ? 'Sales Revenue'       : 'Purchase Account';
    const sign     = inv.type === 'invoice_sales' ? 1 : -1;

    rows.push(`TRNS\tBILL\t${date}\t${acctType}\t${vendor}\t${(sign * total).toFixed(2)}\t${docNum}\t${memo}`);
    if (base) rows.push(`SPL\tBILL\t${date}\t${ledger}\t${vendor}\t${(-sign * base).toFixed(2)}\t${memo}`);
    if (tax)  rows.push(`SPL\tBILL\t${date}\tGST/Tax Payable\t${vendor}\t${(-sign * tax).toFixed(2)}\tGST on ${docNum}`);
    rows.push('ENDTRNS');
  });

  return rows.join('\r\n');
}

export function exportToQuickBooks(invoices) {
  const content = convertToQuickBooksIIF(invoices);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const ts = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `quickbooks_export_${ts}.iif`);
}

// ─── Zoho Books CSV (bulk) ────────────────────────────────────────────────────

export function convertToZohoCSV(invoices) {
  const headers = [
    'VendorName', 'BillNumber', 'BillDate', 'DueDate', 'Currency',
    'ItemDescription', 'ItemQuantity', 'ItemRate', 'TaxName', 'TaxAmount', 'SubTotal', 'Total',
    'ReferenceNumber', 'Notes',
  ];

  const escCSV = (v) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = [(Array.isArray(invoices) ? invoices : [invoices]).flatMap(inv => {
    const d      = inv.extracted_data || {};
    const total  = toFixed2(d.total_amount);
    const tax    = toFixed2(d.tax_amount);
    const base   = toFixed2(total - tax);
    const items  = d.line_items?.length ? d.line_items : [{ description: `Invoice ${d.invoice_number || ''}`, quantity: 1, unit_price: base, amount: base }];

    return items.map((item, idx) => [
      d.vendor         || 'Unknown',
      d.invoice_number || '',
      d.invoice_date   || '',
      d.invoice_date   || '',
      'INR',
      item.description || '',
      item.quantity    || '1',
      item.unit_price  || item.amount || '',
      idx === 0 ? 'GST' : '',
      idx === 0 ? tax.toFixed(2) : '',
      idx === 0 ? base.toFixed(2) : '',
      idx === 0 ? total.toFixed(2) : '',
      d.invoice_number || '',
      d.notes          || '',
    ].map(escCSV).join(','));
  })];

  return [headers.join(','), ...rows[0]].join('\n');
}

export function exportToZohoCSV(invoices) {
  const content = convertToZohoCSV(invoices);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const ts = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `zoho_books_export_${ts}.csv`);
}

// ─── Tally XML (bulk) ─────────────────────────────────────────────────────────

export function convertToTallyXMLBulk(invoices) {
  const vouchers = (Array.isArray(invoices) ? invoices : [invoices]).map(inv => {
    const d       = inv.extracted_data || {};
    const total   = toFixed2(d.total_amount);
    const tax     = toFixed2(d.tax_amount);
    const base    = toFixed2(total - tax);
    const cgst    = toFixed2(tax / 2);
    const sgst    = toFixed2(tax / 2);
    const date    = (d.invoice_date || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    const vendor  = escapeXML(d.vendor || 'Unknown Vendor');
    const invNo   = escapeXML(d.invoice_number || 'INV-UNKNOWN');
    const vchType = inv.type === 'invoice_sales' ? 'Sales' : 'Purchase';

    return `        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${vchType}" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${date}</DATE>
            <VOUCHERTYPENAME>${vchType}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${invNo}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${vendor}</PARTYLEDGERNAME>
            <NARRATION>Invoice ${invNo} | ${vendor}</NARRATION>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${vendor}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${total.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${vchType} Account</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${base.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>CGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${cgst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>SGST</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${sgst.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>##SVCURRENTCOMPANY</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
${vouchers}
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

export function exportToTallyBulk(invoices) {
  const xml = convertToTallyXMLBulk(invoices);
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const ts = new Date().toISOString().slice(0, 10);
  triggerDownload(blob, `tally_export_${ts}.xml`);
}

// ─── Zoho Books JSON ─────────────────────────────────────────────────────────

export function convertToZohoJSON(invoice) {
  const d     = invoice.extracted_data || {};
  const total = toFixed2(d.total_amount);
  const tax   = toFixed2(d.tax_amount);
  const base  = toFixed2(total - tax);
  const cgst  = toFixed2(tax / 2);
  const sgst  = toFixed2(tax / 2);
  const taxPct = base > 0 ? toFixed2((tax / base) * 100) : 0;

  return {
    vendor_name:      d.vendor         || 'Unknown Vendor',
    bill_number:      d.invoice_number || 'INV-UNKNOWN',
    date:             d.invoice_date   || new Date().toISOString().slice(0, 10),
    due_date:         d.invoice_date   || new Date().toISOString().slice(0, 10),
    currency_code:    'INR',
    reference_number: d.invoice_number || '',
    line_items: [
      {
        description:    `Purchase – ${d.invoice_number || 'Invoice'}`,
        rate:           base,
        quantity:       1,
        tax_name:       'GST',
        tax_percentage: taxPct,
        item_total:     base,
      },
    ],
    taxes: [
      { tax_name: 'CGST', tax_amount: cgst },
      { tax_name: 'SGST', tax_amount: sgst },
    ],
    sub_total: base,
    tax_total: tax,
    total,
    notes: `Imported via InvoSmart | Tenant: ${invoice.tenant_name || ''}`,
  };
}

export function downloadJSON(jsonObj, filename) {
  const blob = new Blob([JSON.stringify(jsonObj, null, 2)], { type: 'application/json;charset=utf-8' });
  triggerDownload(blob, filename);
}

export function exportToZoho(invoice) {
  if (!invoice.extracted_data) throw new Error('No extracted data to export');
  downloadJSON(convertToZohoJSON(invoice), `zoho_${safeFilename(invoice)}.json`);
}
