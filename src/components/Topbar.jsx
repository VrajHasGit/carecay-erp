import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { exportToExcel } from '../utils/exportData';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/purchase-dashboard': 'Purchase Dashboard',
  '/sales-dashboard': 'Sales Dashboard',
  '/purchase-inquiry': 'Purchase Inquiry',
  '/purchase-search': 'Purchase Pipeline Search',
  '/valuation': 'Valuation',
  '/purchase-follow': 'Purchase Follow-Up',
  '/purchase-closer': 'Purchase Closer',
  '/purchase-booking': 'Order Booking',
  '/payment': 'Payment',
  '/purchase-documents': 'Purchase Documents',
  '/sale-documents': 'Sale Documents',
  '/sales-inquiry': 'Sales Inquiry',
  '/sales-follow': 'Sales Follow-Up',
  '/test-drive': 'Test Drive',
  '/stock': 'Car Stock',
  '/sales-closer': 'Sales Closer',
  '/sales-booking': 'Sales Order Booking',
  '/finance': 'Finance / Loan',
  '/gst-invoice': 'GST Invoice',
  '/delivery': 'Delivery',
  '/delivery-note': 'Delivery Note',
  '/gate-pass': 'Gate Pass',
  '/workshop': 'Workshop / Refurb',
  '/expenses': 'Expenses',
  '/customers': 'Customers',
  '/targets': 'Targets & Achievements',
  '/emp-perf': 'Employee Performance',
  '/user-mgmt': 'User Management',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

// Map route to data collection for export
const ROUTE_COLLECTION = {
  '/purchase-inquiry': 'pur_inq',
  '/valuation': 'val',
  '/purchase-follow': 'pfu',
  '/purchase-closer': 'pcl',
  '/purchase-booking': 'ob',
  '/payment': 'pay',
  '/purchase-documents': 'doc',
  '/sale-documents': 'sale_doc',
  '/sales-inquiry': 'sal_inq',
  '/sales-follow': 'sfu',
  '/test-drive': 'td',
  '/sales-closer': 'scl',
  '/sales-booking': 'sob',
  '/finance': 'fin',
  '/delivery': 'del',
  '/delivery-note': 'dn',
  '/gate-pass': 'gp',
  '/stock': 'stk',
  '/workshop': 'ws',
  '/expenses': 'exp_rec',
  '/customers': 'cust',
  '/targets': 'targets',
  '/user-mgmt': 'users',
};

// ── Time ago helper ──
function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 10) return 'Just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const NOTIF_TABS = [
  { key: 'all', label: 'All', icon: 'fa-layer-group' },
  { key: 'unread', label: 'Unread', icon: 'fa-circle-dot' },
  { key: 'purchase', label: 'Purchase', icon: 'fa-car-side' },
  { key: 'sales', label: 'Sales', icon: 'fa-tags' },
  { key: 'workshop', label: 'Workshop', icon: 'fa-wrench' },
];

const Topbar = ({ isSlim, toggleSidebar, toggleDTM }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data } = useData();
  const { currentUser } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead, clearNotif, clearAllNotifs, filterByCategory } = useNotifications();

  const [searchVal, setSearchVal] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [bellShake, setBellShake] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const prevUnreadRef = useRef(unreadCount);

  const title = PAGE_TITLES[location.pathname] || 'Carecay ERP';

  // Bell shake animation when new notifications arrive
  useEffect(() => {
    if (unreadCount > prevUnreadRef.current) {
      setBellShake(true);
      const t = setTimeout(() => setBellShake(false), 800);
      return () => clearTimeout(t);
    }
    prevUnreadRef.current = unreadCount;
  }, [unreadCount]);

  const handleSearch = (val) => {
    setSearchVal(val);
    if (!val.trim()) { setSearchResults([]); setShowSearch(false); return; }
    const q = val.toLowerCase();
    const results = [];

    (data.stk || []).forEach(r => {
      if ((r.regNo || '').toLowerCase().includes(q) || (r.make || '').toLowerCase().includes(q) || (r.model || '').toLowerCase().includes(q)) {
        results.push({ type: '🚗 Stock', label: `${r.regNo} — ${r.make} ${r.model}`, id: r.id, link: '/stock' });
      }
    });
    (data.pur_inq || []).forEach(r => {
      if ((r.sellerName || '').toLowerCase().includes(q) || (r.mobile || '').includes(q)) {
        results.push({ type: '📥 Purchase Inq', label: `${r.sellerName} — ${r.make} ${r.model}`, id: r.id, link: '/purchase-inquiry' });
      }
    });
    (data.sal_inq || []).forEach(r => {
      if ((r.buyerName || '').toLowerCase().includes(q) || (r.mobile || '').includes(q)) {
        results.push({ type: '🏷 Sales Inq', label: `${r.buyerName}`, id: r.id, link: '/sales-inquiry' });
      }
    });
    (data.cust || []).forEach(r => {
      if ((r.name || '').toLowerCase().includes(q) || (r.mobile || '').includes(q)) {
        results.push({ type: '👤 Customer', label: `${r.name} — ${r.mobile || ''}`, id: r.id, link: '/customers' });
      }
    });

    setSearchResults(results.slice(0, 10));
    setShowSearch(results.length > 0);
  };

  const handleExport = () => {
    const col = ROUTE_COLLECTION[location.pathname];
    if (!col || !data[col]) {
      alert('No exportable data on this page.');
      return;
    }
    const rows = data[col] || [];
    if (rows.length === 0) {
      alert('No data to export.');
      return;
    }
    exportToExcel(rows, `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Get filtered notifications for current tab
  const filteredNotifs = useMemo(() => {
    return filterByCategory(activeTab);
  }, [filterByCategory, activeTab]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = (n) => {
    markRead(n.id);
    if (n.link) navigate(n.link);
    setShowNotif(false);
  };

  return (
    <div id="tb" className={`${isSlim ? 'slim' : ''}${mobileSearchOpen ? ' mob-search-open' : ''}`}>
      <button className="tb-menu" onClick={toggleSidebar}>
        <i className="fa fa-bars"></i>
      </button>

      <div className="tb-center">
        <div className="tb-title" id="tbTitle">{title}</div>
        <div className="tb-bc" id="tbBc">
          <i className="fa fa-home"></i><span>Home</span>
          {title !== 'Dashboard' && <>
            <i className="fa fa-chevron-right" style={{ fontSize: 9 }}></i>
            <span style={{ color: 'var(--text)' }}>{title}</span>
          </>}
        </div>
      </div>

      <div className="tb-right">
        {/* Mobile Search Toggle */}
        <button
          className="tb-btn mob-search-btn"
          onClick={() => { setMobileSearchOpen(v => !v); }}
          title="Search"
          id="mobSearchBtn"
        >
          <i className={`fa ${mobileSearchOpen ? 'fa-times' : 'fa-search'}`}></i>
        </button>

        {/* Global Search */}
        <div className="tb-search-wrap" ref={searchRef}>
          <input
            className="tb-search"
            id="gsInput"
            placeholder="🔍 Search car / reg / customer…"
            value={searchVal}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => searchVal && setShowSearch(searchResults.length > 0)}
          />
          {showSearch && (
            <div id="gsResults" style={{
              display: 'block', position: 'absolute', top: 36, right: 0,
              width: 380, maxHeight: 420, overflowY: 'auto',
              background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 40px rgba(0,0,0,.5)',
              zIndex: 999,
            }}>
              {searchResults.map((r, i) => (
                <div
                  key={i}
                  onClick={() => { navigate(r.link); setShowSearch(false); setSearchVal(''); }}
                  style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <span style={{ fontSize: 11, color: 'var(--text3)', minWidth: 100 }}>{r.type}</span>
                  <span style={{ fontSize: 12, color: 'var(--text)' }}>{r.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export current page data */}
        <button
          className="tb-btn"
          onClick={handleExport}
          title="Export to Excel"
          id="exportBtn"
        >
          <i className="fa fa-file-export"></i>
        </button>

        {/* Print */}
        <button className="tb-btn" onClick={() => window.print()} title="Print" id="printBtn">
          <i className="fa fa-print"></i>
        </button>

        {/* Daily Task Manager Toggle */}
        <button className="tb-btn" onClick={toggleDTM} title="Daily Task Manager" style={{ position: 'relative' }}>
          <i className="fa fa-clipboard-list"></i>
        </button>

        {/* ═══════ NOTIFICATION BELL ═══════ */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className={`tb-btn ${bellShake ? 'notif-bell-shake' : ''}`}
            id="notifBtn"
            onClick={() => setShowNotif(v => !v)}
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <i className={`fa fa-bell ${unreadCount > 0 ? 'notif-bell-active' : ''}`}></i>
            {unreadCount > 0 && (
              <span className="notif-badge-pulse" id="notifBadge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* ═══════ NOTIFICATION CENTER PANEL ═══════ */}
          {showNotif && (
            <div className="notif-center" id="notifPanel">
              {/* Header */}
              <div className="notif-center-header">
                <div className="notif-center-title">
                  <i className="fa fa-bell" style={{ color: 'var(--or1)', marginRight: 10 }}></i>
                  Notifications
                  {unreadCount > 0 && (
                    <span className="notif-center-count">{unreadCount}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <button
                      className="notif-mark-all-btn"
                      onClick={() => markAllRead()}
                      title="Mark all as read"
                    >
                      <i className="fa fa-check-double" style={{ marginRight: 4 }}></i>
                      Read All
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      className="notif-mark-all-btn"
                      style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}
                      onClick={() => clearAllNotifs()}
                      title="Clear all notifications"
                    >
                      <i className="fa fa-trash" style={{ marginRight: 4 }}></i>
                      Clear All
                    </button>
                  )}
                  <button
                    className="notif-close-btn"
                    onClick={() => setShowNotif(false)}
                  ><i className="fa fa-times" style={{ fontSize: 12 }}></i></button>
                </div>
              </div>

              {/* Tab Bar */}
              <div className="notif-tabs">
                {NOTIF_TABS.map(tab => (
                  <button
                    key={tab.key}
                    className={`notif-tab ${activeTab === tab.key ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <i className={`fa ${tab.icon}`} style={{ marginRight: 5, fontSize: 10 }}></i>
                    {tab.label}
                    {tab.key === 'unread' && unreadCount > 0 && (
                      <span className="notif-tab-badge">{unreadCount}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Notification List */}
              <div className="notif-list" id="notifList">
                {filteredNotifs.length > 0 ? filteredNotifs.map((n) => {
                  const isUnread = !n.read?.[currentUser?.id];
                  return (
                    <div
                      key={n.id}
                      className={`notif-card ${isUnread ? 'unread' : ''}`}
                      onClick={() => handleNotifClick(n)}
                    >
                      {/* Unread indicator */}
                      {isUnread && <div className="notif-dot" />}

                      {/* Icon */}
                      <div className="notif-card-icon" style={{
                        background: `${n.color || '#6366F1'}18`,
                        borderColor: `${n.color || '#6366F1'}30`,
                      }}>
                        <i className={`fa ${n.icon || 'fa-bell'}`} style={{ color: n.color || '#6366F1' }}></i>
                      </div>

                      {/* Content */}
                      <div className="notif-card-body">
                        <div className="notif-card-top">
                          <span className="notif-card-title">{n.title}</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span className="notif-card-time">{timeAgo(n.createdAt)}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); clearNotif(n.id); }}
                              style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 0 }}
                              title="Clear"
                            >
                              <i className="fa fa-times"></i>
                            </button>
                          </div>
                        </div>
                        <p className="notif-card-msg">{n.message}</p>
                        {n.actor?.name && n.actor.name !== 'System' && (
                          <div className="notif-card-actor">
                            <span className="notif-card-avatar">
                              {(n.actor.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2)}
                            </span>
                            <span>{n.actor.name}</span>
                            <span className="notif-card-action-tag">
                              {n.action === 'created' ? 'Created' : n.action === 'updated' ? 'Updated' : n.action === 'status_changed' ? 'Status Changed' : n.action === 'deleted' ? 'Deleted' : 'Action'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="notif-empty" id="notifEmpty">
                    <div className="notif-empty-icon">
                      <i className="fa fa-check-double"></i>
                    </div>
                    <div className="notif-empty-title">
                      {activeTab === 'unread' ? 'All Caught Up!' : 'No Notifications'}
                    </div>
                    <div className="notif-empty-desc">
                      {activeTab === 'unread'
                        ? 'You have no unread notifications.'
                        : `No ${activeTab !== 'all' ? activeTab + ' ' : ''}notifications yet.`
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
