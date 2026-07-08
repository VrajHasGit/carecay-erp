import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { today } from '../utils/helpers';

export default function DailyTaskManager({ isOpen, onClose }) {
  const { data } = useData();
  const [quickTasks, setQuickTasks] = useState(() => {
    const saved = localStorage.getItem('cc_quick_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 1, text: 'Check inventory keys', done: false },
      { id: 2, text: 'Deposit cash to bank', done: false }
    ];
  });

  useEffect(() => {
    localStorage.setItem('cc_quick_tasks', JSON.stringify(quickTasks));
  }, [quickTasks]);

  const td = today();

  const getDeliveries = () => {
    if (!data.delivery) return [];
    return Object.values(data.delivery).filter(r => r.status !== 'Delivered' && (r.exp === td || r.act === td));
  };

  const getFollowUps = () => {
    let fup = [];
    if (data.pur_inq) {
      fup = [...fup, ...Object.values(data.pur_inq).filter(r => r.stage !== 'Closed' && r.fu)];
    }
    if (data.sal_inq) {
      fup = [...fup, ...Object.values(data.sal_inq).filter(r => r.stage !== 'Closed' && r.fu)];
    }
    return fup.slice(0, 5); // Just show top 5
  };

  const toggleTask = (id) => {
    setQuickTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addQuickTask = () => {
    const text = prompt('Enter new task:');
    if (text) {
      setQuickTasks(prev => [...prev, { id: Date.now(), text, done: false }]);
    }
  };

  const removeTask = (e, id) => {
    e.stopPropagation();
    setQuickTasks(prev => prev.filter(t => t.id !== id));
  };

  const deliveries = getDeliveries();
  const followUps = getFollowUps();

  return (
    <div className={`dtm-panel ${isOpen ? 'open' : ''}`}>
      <div className="dtm-hdr">
        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa fa-clipboard-list" style={{ color: 'var(--or1)' }}></i> Daily Task Manager
        </div>
        <button className="btn-icon" onClick={onClose}><i className="fa fa-times"></i></button>
      </div>

      <div className="dtm-body">
        <div className="dtm-section">
          <div className="dtm-sec-title"><i className="fa fa-phone-flip" style={{color: 'var(--info)'}}></i> Today's Follow-ups</div>
          <div id="dtm_followups">
            {followUps.length === 0 ? <div style={{ fontSize: 11, color: 'var(--text3)' }}>No follow-ups today.</div> : 
              followUps.map((f, i) => (
                <div className="task-item" key={i}>
                  <div className="task-check" style={{background: 'rgba(59,130,246,.1)', borderColor: 'var(--info)'}}>
                    <i className="fa fa-phone" style={{fontSize: 9, color: 'var(--info)'}}></i>
                  </div>
                  <div className="task-text">
                    {f.sellerName || f.buyerName || 'Customer'}
                    <div style={{fontSize: 9, color: 'var(--text3)'}}>{f.vehicle || f.make}</div>
                  </div>
                  <span className="task-tag" style={{background: '#EFF6FF', color: 'var(--info)'}}>{f.stage || 'Inquiry'}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="dtm-section">
          <div className="dtm-sec-title"><i className="fa fa-truck" style={{color: 'var(--success)'}}></i> Today's Deliveries</div>
          <div id="dtm_deliveries">
            {deliveries.length === 0 ? <div style={{ fontSize: 11, color: 'var(--text3)' }}>No deliveries today.</div> : 
              deliveries.map((d, i) => (
                <div className="task-item" key={i}>
                  <div className="task-check" style={{background: 'rgba(5,150,105,.1)', borderColor: 'var(--success)'}}>
                    <i className="fa fa-truck" style={{fontSize: 9, color: 'var(--success)'}}></i>
                  </div>
                  <div className="task-text">
                    {d.cust || 'Customer'}
                    <div style={{fontSize: 9, color: 'var(--text3)'}}>{d.vehicle}</div>
                  </div>
                  <span className="task-tag" style={{background: '#ECFDF5', color: 'var(--success)'}}>{d.status}</span>
                </div>
              ))
            }
          </div>
        </div>

        <div className="dtm-section">
          <div className="dtm-sec-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span><i className="fa fa-check-square" style={{color: 'var(--or1)'}}></i> Quick Tasks</span>
            <button className="btn btn-or" style={{padding: '2px 6px', fontSize: 10}} onClick={addQuickTask}><i className="fa fa-plus"></i></button>
          </div>
          <div id="dtm_tasks">
            {quickTasks.length === 0 ? <div style={{ fontSize: 11, color: 'var(--text3)' }}>No quick tasks.</div> : 
              quickTasks.map(t => (
                <div className="task-item" key={t.id} onClick={() => toggleTask(t.id)} style={{cursor: 'pointer'}}>
                  <div className={`task-check ${t.done ? 'done' : ''}`}>
                    {t.done && <i className="fa fa-check" style={{fontSize: 10}}></i>}
                  </div>
                  <div className={`task-text ${t.done ? 'done' : ''}`} style={{flex: 1}}>
                    {t.text}
                  </div>
                  <button onClick={(e) => removeTask(e, t.id)} style={{background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 4}}>
                    <i className="fa fa-times" style={{fontSize: 10}}></i>
                  </button>
                </div>
              ))}
          </div>
        </div>

      </div>
    </div>
  );
}
