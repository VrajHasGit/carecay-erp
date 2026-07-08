import React, { useState, useEffect } from 'react';
import { toEmail } from '../../contexts/AuthContext';

const ReadOnlyVal = ({ value }) => (
  <div style={{ padding: '8px 12px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text2)', minHeight: '34px' }}>
    {value || '—'}
  </div>
);

export const UserModal = ({ isOpen, onClose, onSave, editData, initialMode = 'create' }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    name: "", lid: "", password: "", role: "Sales", branch: "Head Office", mobile: "", email: "", status: "Active"
  });

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      if (editData) {
        setFormData({ ...editData }); // Keep all fields including password/pw for viewing
      } else {
        setFormData({
          name: "", lid: "", password: "", role: "Sales", branch: "Head Office", mobile: "", email: "", status: "Active"
        });
      }
    }
  }, [isOpen, editData, initialMode]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const updated = { ...formData, [e.target.name]: e.target.value };
    // Auto-populate email from loginId
    if (e.target.name === 'lid') {
      updated.email = toEmail(e.target.value);
    }
    setFormData(updated);
  };

  const handleSave = async () => {
    try {
      if (onSave) { 
        await onSave(formData); 
      } else { 
        onClose(); 
      }
    } catch (error) {
      console.error("Error saving record: ", error);
      alert('Failed to save record.');
    }
  };

  const isView = mode === 'view';
  const isCreate = mode === 'create';

  return (
    <div className="overlay on" id="m_user">
      <div className="mbox" style={{ maxWidth: '600px' }}>
        <div className="m-hdr">
          <div className="m-hdr-icon">👤</div>
          <h3>{isCreate ? 'Add User' : mode === 'edit' ? 'Edit User' : 'View User Details'}</h3>
          <button className="m-close" onClick={onClose}>✕</button>
        </div>
        <div className="m-body">
          <div className="grid3">
            <div className="fg">
              <label>Full Name *</label>
              {isView ? <ReadOnlyVal value={formData.name} /> : <input name="name" value={formData.name} onChange={handleChange} placeholder="Employee name" />}
            </div>
            <div className="fg">
              <label>Login ID *</label>
              {isView ? <ReadOnlyVal value={formData.lid} /> : (
                <input name="lid" value={formData.lid} onChange={handleChange} placeholder="e.g. rajan.desai" disabled={!isCreate} />
              )}
              {isCreate && formData.lid && (
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3 }}>
                  <i className="fa fa-envelope" style={{ marginRight: 4 }}></i>
                  Auth email: {toEmail(formData.lid)}
                </div>
              )}
            </div>
            <div className="fg">
              <label>{isCreate ? 'Password *' : 'Password'}</label>
              {isView ? (
                <ReadOnlyVal value={formData.password || formData.pw || 'Not stored'} />
              ) : isCreate ? (
                <input
                  type="password"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  minLength={6}
                />
              ) : (
                <div style={{
                  padding: '8px 12px', background: 'var(--surface2)',
                  borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                  fontSize: '12px', color: 'var(--text3)', minHeight: '34px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <i className="fa fa-lock" style={{ fontSize: 10 }}></i>
                  Can only be set on creation
                </div>
              )}
            </div>
          </div>
          <div className="grid3">
            <div className="fg">
              <label>Role *</label>
              {isView ? <ReadOnlyVal value={formData.role} /> : (
                <select name="role" value={formData.role} onChange={handleChange}>
                  <option>Admin</option><option>Partner</option><option>Manager</option>
                  <option>Closer</option><option>Executive</option><option>Sales</option>
                  <option>Valuator</option><option>Workshop</option>
                </select>
              )}
            </div>
            <div className="fg">
              <label>Branch</label>
              {isView ? <ReadOnlyVal value={formData.branch} /> : (
                <select name="branch" value={formData.branch} onChange={handleChange}>
                  <option>SG Highway</option><option>Vastral</option><option>Head Office</option>
                </select>
              )}
            </div>
            <div className="fg">
              <label>Mobile</label>
              {isView ? <ReadOnlyVal value={formData.mobile} /> : <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit" maxLength="10" />}
            </div>
          </div>
          <div className="grid2">
            <div className="fg">
              <label>Email</label>
              {isView ? (
                <ReadOnlyVal value={formData.email || (formData.lid ? toEmail(formData.lid) : '—')} />
              ) : (
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  placeholder="Auto-set from Login ID"
                  disabled={isCreate} // Auto-derived from loginId in create mode
                />
              )}
            </div>
            <div className="fg">
              <label>Status</label>
              {isView ? <ReadOnlyVal value={formData.status} /> : (
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option>Active</option><option>Inactive</option>
                </select>
              )}
            </div>
          </div>
        </div>
        <div className="m-foot">
          {isView ? (
            <>
              <button className="btn btn-out" onClick={onClose}>Close</button>
              <button className="btn btn-or" onClick={() => setMode('edit')}><i className="fa fa-pen"></i> Edit User</button>
            </>
          ) : (
            <>
              <button className="btn btn-out" onClick={() => (mode === 'edit' && editData) ? setMode('view') : onClose()}>Cancel</button>
              <button className="btn btn-or" onClick={handleSave}><i className="fa fa-save"></i> Save User</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
