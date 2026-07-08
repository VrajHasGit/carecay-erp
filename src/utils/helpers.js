// ══ HELPERS ══

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function fmt(n) {
  if (!n && n !== 0) return '—';
  return '₹' + Number(n).toLocaleString('en-IN');
}

export function genId(prefix, num) {
  const y = new Date().getFullYear();
  return `${prefix}-${y}-${String(num).padStart(4, '0')}`;
}

export function ageDays(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now - d) / (1000 * 60 * 60 * 24));
}

export function ageBadge(days) {
  if (days <= 30) return { cls: 'age-0', label: `${days}d` };
  if (days <= 60) return { cls: 'age-31', label: `${days}d` };
  if (days <= 90) return { cls: 'age-61', label: `${days}d` };
  return { cls: 'age-91', label: `${days}d` };
}

export function statusBadge(status) {
  const map = {
    'New': 'b-new',
    'In-Progress': 'b-prog',
    'Closed-Won': 'b-won',
    'Closed-Lost': 'b-lost',
    'Hold': 'b-hold',
    'In Stock': 'b-new',
    'Sold': 'b-sold',
    'Refurb': 'b-refurb',
    'Pending': 'b-pend',
    'Paid': 'b-paid',
    'Open': 'b-open',
    'Complete': 'b-complete',
    'Confirmed': 'b-won',
    'Delivered': 'b-sold',
  };
  return map[status] || 'b-new';
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function initials(name) {
  if (!name) return 'U';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function printDocument(title, contentHTML, customStyles = '', downloadOptions = null, hideHeader = false) {
  const win = window.open('', '_blank', 'width=900,height=750');
  const d = new Date();
  
  win.document.write(`<!DOCTYPE html><html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Space Grotesk','Noto Sans Gujarati',Arial,sans-serif;font-size:12px;color:#000;padding:20px;max-width:800px;margin:0 auto;text-transform:uppercase}
  .print-header { display: flex; align-items: center; justify-content: center; margin-bottom: 24px; border-bottom: 2px solid #000; padding-bottom: 12px; position: relative; }
  .print-logo-icon { background: #000; color: #fff; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 900; margin-right: 12px; font-family: monospace; }
  .print-header-text { text-align: center; }
  .print-header-text h1 { font-size: 24px; font-weight: 900; letter-spacing: 2px; margin: 0; }
  .print-header-text h1 em { color: #F59E0B; font-style: normal; }
  .print-header-text p { font-size: 11px; color: #555; margin-top: 4px; }
  .print-date { position: absolute; right: 0; top: 10px; font-size: 10px; font-weight: 600; text-align: right; }
  
  .no-print { display: none; }
  @media screen { .no-print { display: flex; gap: 10px; justify-content: flex-end; margin-bottom: 20px; } }
  ${customStyles}
</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
</head>
<body>
  <div class="no-print" data-html2canvas-ignore="true">
    <button onclick="downloadPDF()" style="padding:6px 12px;background:#f59e0b;color:#fff;border:none;border-radius:20px;cursor:pointer;font-weight:700;font-size:12px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 5px rgba(0,0,0,0.1);transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <i class="fa fa-download"></i> Download
    </button>
    <button onclick="window.print()" style="padding:6px 12px;background:#000;color:#fff;border:none;border-radius:20px;cursor:pointer;font-weight:700;font-size:12px;display:flex;align-items:center;gap:6px;box-shadow:0 2px 5px rgba(0,0,0,0.1);transition:transform 0.1s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
      <i class="fa fa-print"></i> Print
    </button>
  </div>
  
  <div id="print-content">
  
  ${hideHeader ? '' : `
  <div class="print-header">
    <div style="height: 50px; margin-right: 15px;"><img src="/logo.png" style="height: 100%; object-fit: contain;" /></div>
    <div class="print-header-text">
      <h1>CARE<em>CAY</em></h1>
      <p>Carecay Pvt. Ltd. | Mumatpura Road, Off. S. G. Highway, Ahmedabad - 380058</p>
    </div>
    <div class="print-date">
      Printed On<br/>
      ${d.toLocaleDateString('en-IN')} ${d.toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'})}
    </div>
  </div>
  `}

  ${contentHTML}
  </div>
  
  <script>
    const opts = ${downloadOptions ? JSON.stringify(downloadOptions) : JSON.stringify({ jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } })};
    function downloadPDF() {
      const element = document.getElementById('print-content');
      html2pdf().set({
        margin: 5,
        filename: document.title + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: opts.jsPDF
      }).from(element).save();
    }
  <\/script>
</body></html>`);
  win.document.close();
}
