import React, { useMemo, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useData } from '../../contexts/DataContext';

export const QrModal = ({ isOpen, onClose, stkId }) => {
  const { data } = useData();
  const qrRef = useRef(null);

  const vehicle = useMemo(() => {
    if (!stkId || !data?.stk) return null;
    return data.stk.find(r => r.stkId === stkId || r.id === stkId);
  }, [stkId, data]);

  if (!isOpen) return null;

  if (!vehicle) return (
    <div className="overlay">
      <div className="mbox" style={{ maxWidth: 400, padding: 24, textAlign: 'center' }}>
        <p>Loading vehicle data...</p>
        <button className="btn btn-out" onClick={onClose}>Close</button>
      </div>
    </div>
  );

  const qrText = `CARECAY VEHICLE INFORMATION
-----------------------------
Make: ${vehicle.make || 'N/A'}
Model: ${vehicle.model || 'N/A'}
Variant: ${vehicle.variant || 'N/A'}
Year: ${vehicle.year || 'N/A'}
Reg No: ${vehicle.regNo || 'N/A'}
Fuel: ${vehicle.fuel || 'N/A'}
Transmission: ${vehicle.trans || 'N/A'}
KM Driven: ${vehicle.km ? Number(vehicle.km).toLocaleString('en-IN') : 'N/A'} km
Colour: ${vehicle.color || 'N/A'}
Price: ₹${vehicle.sp ? Number(vehicle.sp).toLocaleString('en-IN') : 'N/A'}
Stock ID: ${vehicle.stkId || vehicle.id}`;

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${vehicle.regNo || vehicle.stkId}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const windowContent = `<!DOCTYPE html>
    <html>
    <head><title>Print QR Code - ${vehicle.regNo}</title></head>
    <body style="text-align: center; font-family: sans-serif; padding-top: 50px;">
      <h2>${vehicle.make} ${vehicle.model} (${vehicle.year})</h2>
      <p style="font-weight: bold; font-size: 24px; margin-bottom: 30px; letter-spacing: 2px;">${vehicle.regNo}</p>
      <img src="${dataUrl}" style="width: 250px; height: 250px; border: 1px solid #ccc; padding: 10px; border-radius: 8px;">
      <p style="color: #666; margin-top: 20px; font-size: 14px;">Scan with smartphone camera for vehicle details</p>
      <script>
        window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 300); }
      </script>
    </body>
    </html>`;
    const printWin = window.open('', '', 'width=600,height=800');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(windowContent);
      printWin.document.close();
    }
  };

  return (
    <div className="overlay" id="m_qr" onClick={(e) => e.target.classList.contains('overlay') && onClose()}>
      <div className="mbox" style={{ maxWidth: '400px' }}>
        <div className="m-hdr">
          <div className="m-hdr-icon" style={{ background: 'linear-gradient(135deg, #3B82F6, #1E40AF)', color: '#fff', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa fa-qrcode"></i>
          </div>
          <h3 id="qr_title">Vehicle QR Code</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="m-body" style={{ textAlign: 'center', padding: '32px 20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 6px 0', color: 'var(--bl5)', fontSize: '20px', letterSpacing: '1px' }}>{vehicle.regNo}</h4>
            <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: 600 }}>{vehicle.make} {vehicle.model} ({vehicle.year})</div>
          </div>

          <div ref={qrRef} style={{ background: '#fff', padding: '16px', display: 'inline-block', borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <QRCodeCanvas value={qrText} size={200} level="M" />
          </div>
          
          <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text3)' }}>
            Scan with any smartphone camera to instantly read vehicle information in text form.
          </div>

          <div style={{ marginTop: '28px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button className="btn btn-or" onClick={handleDownload} style={{ flex: 1, padding: '10px' }}>
              <i className="fa fa-download"></i> Download
            </button>
            <button className="btn btn-out" onClick={handlePrint} style={{ flex: 1, padding: '10px' }}>
              <i className="fa fa-print"></i> Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
