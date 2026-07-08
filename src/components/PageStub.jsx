import React from 'react';

// A reusable stub for pages not yet fully implemented
const PageStub = ({ icon, title, subtitle, colName, columns, color = 'var(--or1)' }) => {
  const [items, setItems] = React.useState([]);

  return (
    <div className="page on">
      <div className="ph">
        <div className="ph-left">
          <h1>
            <div className="ph-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}88)` }}>
              <i className={`fa ${icon}`}></i>
            </div>
            {title}
          </h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="tc">
        <div className="tc-hdr">
          <div className="tc-title">{title}</div>
        </div>
        <div className="tbl-wrap">
          <div className="empty" style={{ padding: 48 }}>
            <i className={`fa ${icon}`} style={{ fontSize: 36, color: 'var(--border2)', display: 'block', marginBottom: 12 }}></i>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>No records yet</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Records added from other modules will appear here.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageStub;
