import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { addRecord, updateRecord, deleteRecord, getNextCounter } from '../services/db';
import { today, genId, fmtDate } from '../utils/helpers';

const PRIORITIES = ['High', 'Medium', 'Low'];
const PRIORITY_COLOR = { High: 'var(--danger)', Medium: 'var(--warn)', Low: 'var(--success)' };
const PRIORITY_CLASS = { High: 'task-priority-high', Medium: 'task-priority-medium', Low: 'task-priority-low' };

/* ── Date helpers ────────────────────────────────── */
function addDays(date, n) {
  const d = new Date(date); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10);
}
function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} ${d.getDate()}`;
}

/* ── Task Modal ──────────────────────────────────── */
function TaskModal({ editData, users, currentUser, onClose, onSave }) {
  const [form, setForm] = useState(editData || { title: '', description: '', priority: 'Medium', dueDate: today(), dueTime: '', assignedTo: currentUser?.name || '', linkedType: '', linkedId: '', status: 'Todo' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true); await onSave(form); setSaving(false);
  };
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="m-hdr"><div className="m-title"><i className="fa fa-list-check" style={{ color: 'var(--or1)' }}></i> {editData ? 'Edit Task' : 'Add Task'}</div><button className="m-close" onClick={onClose}>✕</button></div>
        <div className="m-body" style={{ padding: 20 }}>
          <div className="grid1 fg" style={{ marginBottom: 10 }}><label>Title *</label><input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Short task title" autoFocus /></div>
          <div className="fg" style={{ marginBottom: 10 }}><label>Description</label><textarea rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional details…" style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border2)', color: 'var(--text)', borderRadius: 'var(--radius-sm)', padding: 8, fontFamily: 'inherit', fontSize: 12, resize: 'none' }} /></div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <div className="fg"><label>Priority</label>
              <select value={form.priority} onChange={e => set('priority', e.target.value)}>
                {PRIORITIES.map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div className="fg"><label>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                {['Todo', 'In Progress', 'Completed'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid2" style={{ marginBottom: 10 }}>
            <div className="fg"><label>Due Date *</label><input type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} /></div>
            <div className="fg"><label>Due Time</label><input type="time" value={form.dueTime} onChange={e => set('dueTime', e.target.value)} /></div>
          </div>
          <div className="fg" style={{ marginBottom: 10 }}><label>Assigned To</label>
            <select value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}>
              {[currentUser?.name, ...(users || []).map(u => u.name).filter(n => n !== currentUser?.name)].filter(Boolean).map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
            <button className="btn btn-out" onClick={onClose}>Cancel</button>
            <button className="btn btn-or" onClick={handleSave} disabled={!form.title.trim() || saving}>
              {saving ? <><i className="car-spinner"></i> Saving…</> : <><i className="fa fa-check"></i> {editData ? 'Save Changes' : 'Add Task'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const Tasks = () => {
  const { data, refresh } = useData();
  const { currentUser } = useAuth();
  const isManager = ['admin', 'manager'].includes((currentUser?.role || '').toLowerCase());

  const [selectedDate, setSelectedDate] = useState(today());
  const [viewScope, setViewScope] = useState('mine'); // 'mine' | 'all' | 'team'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500); };

  const tasks = data.tasks || [];
  const users = data.users || [];

  // Generate 7-day navigator centered on selected date
  const weekDates = useMemo(() => {
    const center = new Date(selectedDate + 'T00:00:00');
    const start = new Date(center); start.setDate(center.getDate() - 3);
    return [...Array(7)].map((_, i) => addDays(start.toISOString().slice(0, 10), i));
  }, [selectedDate]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchScope = viewScope === 'all' || t.assignedTo === currentUser?.name || viewScope === 'team';
      const matchDate = !selectedDate || t.dueDate === selectedDate;
      return matchScope && matchDate;
    });
  }, [tasks, viewScope, currentUser, selectedDate]);

  const tasksByPriority = useMemo(() => {
    const groups = { High: [], Medium: [], Low: [] };
    filteredTasks.forEach(t => { (groups[t.priority] || (groups.Low)).push(t); });
    return groups;
  }, [filteredTasks]);

  const taskHasDates = useMemo(() => {
    const set = new Set(tasks.map(t => t.dueDate));
    return set;
  }, [tasks]);

  const handleSave = async (formData) => {
    try {
      const actor = { id: currentUser?.id, name: currentUser?.name || 'Admin', role: currentUser?.role || 'Admin' };
      if (editTask) {
        await updateRecord('tasks', editTask.id, formData, { title: 'Task Updated', message: formData.title + ' — assigned to ' + (formData.assignedTo || ''), link: '/tasks', actor });
        showToast('Task updated!');
      } else {
        const cnt = await getNextCounter('TASK');
        await addRecord('tasks', { ...formData, taskId: genId('TASK', cnt), createdBy: currentUser?.name, createdAt: new Date().toISOString() }, { title: 'New Task Assigned', message: formData.title + ' — assigned to ' + (formData.assignedTo || ''), link: '/tasks', actor });
        showToast('Task added! ✅');
      }
      await refresh('tasks'); setIsModalOpen(false); setEditTask(null);
    } catch (e) { showToast('Failed: ' + e.message, 'error'); }
  };

  const handleComplete = async (task) => {
    try {
      const isDone = task.status === 'Completed';
      await updateRecord('tasks', task.id, { status: isDone ? 'Todo' : 'Completed', completedAt: isDone ? null : new Date().toISOString() });
      await refresh('tasks');
      if (!isDone) showToast('Task completed! 🎉');
    } catch (e) { showToast('Failed.', 'error'); }
  };

  const handleDelete = async (task) => {
    if (!await window.confirm(`Delete task "${task.title}"?`)) return;
    try { await deleteRecord('tasks', task.id); await refresh('tasks'); showToast('Task deleted.', 'info'); }
    catch (e) { showToast('Delete failed.', 'error'); }
  };

  const totalToday = tasks.filter(t => t.dueDate === today()).length;
  const doneToday = tasks.filter(t => t.dueDate === today() && t.status === 'Completed').length;
  const overdueCount = tasks.filter(t => t.dueDate < today() && t.status !== 'Completed').length;
  const totalAll = tasks.length;

  return (
    <div className="page on" id="pg_tasks">
      {toast && <div className="toast-wrap"><div className={`toast ${toast.type === 'success' ? 'suc' : toast.type === 'error' ? 'err' : 'inf'}`} style={{ display: 'flex' }}><span style={{ flex: 1 }}>{toast.msg}</span><button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>✕</button></div></div>}
      {isModalOpen && <TaskModal editData={editTask} users={users} currentUser={currentUser} onClose={() => { setIsModalOpen(false); setEditTask(null); }} onSave={handleSave} />}

      {/* Header */}
      <div className="ph">
        <div className="ph-left">
          <h1><div className="ph-icon" style={{ background: 'linear-gradient(135deg,#7C3AED,#A78BFA)' }}><i className="fa fa-list-check"></i></div>Daily Tasks</h1>
          <p>Personal + team task management · Priority kanban · Due date tracking</p>
        </div>
        <div className="ph-actions">
          {isManager && (
            <div className="view-toggle">
              {[{ id: 'mine', label: 'My Tasks' }, { id: 'team', label: 'Team' }, { id: 'all', label: 'All' }].map(v => (
                <button key={v.id} className={viewScope === v.id ? 'active' : ''} onClick={() => setViewScope(v.id)} style={{ padding: '0 10px', width: 'auto' }}>{v.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        {[
          { icon: 'fa-list-check', val: totalToday, lbl: "Today's Tasks", color: '#7C3AED' },
          { icon: 'fa-circle-check', val: doneToday, lbl: 'Completed Today', color: '#22C55E' },
          { icon: 'fa-circle-exclamation', val: overdueCount, lbl: 'Overdue', color: '#EF4444' },
          { icon: 'fa-layer-group', val: totalAll, lbl: 'Total Tasks', color: '#C8A84B' },
        ].map((k, i) => (
          <div key={i} className="kpi" style={{ borderLeft: `3px solid ${k.color}` }}>
            <div className="kpi-icon"><i className={`fa ${k.icon}`} style={{ color: k.color }}></i></div>
            <div className="kpi-val">{k.val}</div>
            <div className="kpi-lbl">{k.lbl}</div>
          </div>
        ))}
      </div>

      {/* Date Navigator */}
      <div className="date-nav">
        <button className="date-nav-btn" onClick={() => setSelectedDate(d => addDays(d, -7))}>‹</button>
        {weekDates.map(d => (
          <button key={d} className={`date-pill ${selectedDate === d ? 'active' : ''} ${taskHasDates.has(d) ? 'has-tasks' : ''}`}
            onClick={() => setSelectedDate(d)}>
            {dayLabel(d)} {d === today() ? '●' : ''}
          </button>
        ))}
        <button className="date-nav-btn" onClick={() => setSelectedDate(d => addDays(d, 7))}>›</button>
        <button className="date-pill" onClick={() => setSelectedDate(today())} style={{ marginLeft: 8, opacity: .7 }}>Today</button>
      </div>

      {/* Kanban Columns */}
      <div className="task-kanban">
        {PRIORITIES.map(priority => (
          <div key={priority} className="task-col">
            <div className="task-col-hdr">
              <span style={{ color: PRIORITY_COLOR[priority] }}>
                <i className={`fa fa-${priority === 'High' ? 'circle-up' : priority === 'Medium' ? 'circle-minus' : 'circle-down'}`} style={{ marginRight: 5 }}></i>
                {priority}
              </span>
              <span className="stage-count">{tasksByPriority[priority].length}</span>
            </div>
            {tasksByPriority[priority].length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 11, padding: 20, opacity: .6 }}>
                <i className="fa fa-check" style={{ display: 'block', marginBottom: 6, fontSize: 16 }}></i>
                No {priority.toLowerCase()} tasks
              </div>
            ) : tasksByPriority[priority].map(task => {
              const isOverdue = task.dueDate < today() && task.status !== 'Completed';
              const isDone = task.status === 'Completed';
              return (
                <div key={task.id} className={`task-card ${PRIORITY_CLASS[task.priority]}`}
                  style={{ opacity: isDone ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                    <button onClick={() => handleComplete(task)} style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${isDone ? 'var(--success)' : 'var(--border2)'}`, background: isDone ? 'var(--success)' : 'transparent', color: isDone ? '#fff' : 'transparent', cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, marginTop: 1 }}>
                      {isDone && '✓'}
                    </button>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, textDecoration: isDone ? 'line-through' : 'none', color: isDone ? 'var(--text3)' : 'var(--text)' }}>{task.title}</div>
                      {task.description && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{task.description}</div>}
                    </div>
                  </div>
                  <div className={`task-due ${isOverdue ? 'overdue' : ''}`}>
                    <i className={`fa fa-${isOverdue ? 'triangle-exclamation' : 'clock'}`}></i>
                    {isOverdue ? 'OVERDUE · ' : ''}{fmtDate(task.dueDate)}{task.dueTime ? ` · ${task.dueTime}` : ''}
                  </div>
                  {task.assignedTo && (
                    <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <i className="fa fa-user"></i> {task.assignedTo}
                    </div>
                  )}
                  <div className="act-grp act-grp-tight" style={{ marginTop: 8 }}>
                    <button className="btn-icon bi-edit" style={{ width: 24, height: 24, fontSize: 10 }} onClick={() => { setEditTask(task); setIsModalOpen(true); }}><i className="fa fa-pen"></i></button>
                    <button className="btn-icon bi-del" style={{ width: 24, height: 24, fontSize: 10 }} onClick={() => handleDelete(task)}><i className="fa fa-trash"></i></button>
                  </div>
                </div>
              );
            })}
            {/* Quick Add row at bottom of each column */}
            <button className="btn btn-out btn-sm" style={{ width: '100%', marginTop: 6, fontSize: 10, opacity: .6 }}
              onClick={() => { setEditTask({ priority }); setIsModalOpen(true); }}>
              <i className="fa fa-plus"></i> Add {priority}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Tasks;
