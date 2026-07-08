import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const PrintInvoice = ({ invoiceData }) => {
  if (!invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="print-area" style={{ padding: '24px', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>
        <div>
          <h2>CARECAY PVT LTD</h2>
          <p>SG Highway, Ahmedabad, Gujarat</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2>INVOICE</h2>
          <p>Date: {invoiceData.date || new Date().toLocaleDateString()}</p>
        </div>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h4>Customer Details</h4>
        <p>Name: {invoiceData.buyerName}</p>
        <p>Mobile: {invoiceData.buyerMobile}</p>
        <p>Address: {invoiceData.buyerAddress}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h4>Vehicle Details</h4>
        <p>Make/Model: {invoiceData.makeModel}</p>
        <p>Reg No: {invoiceData.regNo}</p>
        <p>Engine No: {invoiceData.engineNo}</p>
        <p>Chassis No: {invoiceData.chassisNo}</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Description</th>
              <th style={{ padding: '8px', border: '1px solid #ccc' }}>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>Sale Price</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{invoiceData.salePrice}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>GST Amount</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right' }}>{invoiceData.gstAmount}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>Total</td>
              <td style={{ padding: '8px', border: '1px solid #ccc', textAlign: 'right', fontWeight: 'bold' }}>{invoiceData.totalAmount}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <QRCodeSVG value={JSON.stringify(invoiceData)} size={100} />
          <p style={{ fontSize: '10px' }}>Scan for digital copy</p>
        </div>
        <div style={{ textAlign: 'center', alignSelf: 'flex-end' }}>
          <hr style={{ width: '150px' }} />
          <p>Authorized Signature</p>
        </div>
      </div>
      
      <button className="btn btn-or print-hide" onClick={handlePrint} style={{ marginTop: '20px' }}>
        <i className="fa fa-print"></i> Print Now
      </button>
    </div>
  );
};
