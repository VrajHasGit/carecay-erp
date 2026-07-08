import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { initials } from '../utils/helpers';

const Sidebar = ({ isSlim, isMobileOpen }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = currentUser?.role || 'Admin';
  const isAdmin = ['Admin', 'Partner', 'Manager'].includes(role);
  const isPurchase = isAdmin || ['Closer', 'Executive', 'Valuator', 'Workshop'].includes(role);
  const isSales = isAdmin || ['Sales'].includes(role);

  const navItem = (to, icon, label, badge, style = {}) => (
    <NavLink
      key={to}
      to={to}
      className={({ isActive }) => `sb-item${isActive ? ' act' : ''}`}
      style={style}
    >
      <i className={`${icon} sb-ico`}></i>
      <span className="sb-lbl">{label}</span>
      {badge !== undefined && badge !== null && (
        <span className="sb-badge">{badge}</span>
      )}
    </NavLink>
  );

  return (
    <div id="sb" className={`${isSlim ? 'slim' : ''}${isMobileOpen ? ' mob-on' : ''}`}>
      <div className="sb-hdr">
        <div className="sb-logo" id="sbLogoWrap" title="Carecay ERP" style={{ background: 'transparent' }}>
          <img src="/logo.png" alt="Carecay Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div className="sb-brand">
          <div className="sb-name" id="sbName">CARE<em>CAY</em></div>
          <div className="sb-tag" id="sbTag">Carecay Pvt. Ltd.</div>
        </div>
      </div>

      <nav className="sb-nav" id="sbNav">
        {/* OVERVIEW */}
        <div className="sb-sec" data-role="all">OVERVIEW</div>
        {navItem('/', 'fa fa-gauge-high', 'Dashboard')}

        {/* ROLE DASHBOARDS */}
        <div className="sb-sec" data-role="all" style={{ color: 'rgba(80,220,160,.7)' }}>📊 ROLE DASHBOARDS</div>
        {navItem('/purchase-dashboard', 'fa fa-car-side', 'Purchase Dashboard', null, { color: '#34D399' })}
        {navItem('/sales-dashboard', 'fa fa-tags', 'Sales Dashboard', null, { color: '#67E8F9' })}

        {/* PURCHASE PIPELINE */}
        {isPurchase && <>
          <div className="sb-sec" data-role="purchase admin" style={{ color: 'rgba(255,160,80,.7)' }}>⬇ PURCHASE PIPELINE</div>
          <NavLink
            to="/purchase-search"
            className={({ isActive }) => `sb-item${isActive ? ' act' : ''}`}
            style={{ color: '#c084fc' }}
          >
            <i className="fa fa-magnifying-glass sb-ico sb-ico-pulse"></i>
            <span className="sb-lbl">Purchase Search</span>
          </NavLink>
          {navItem('/purchase-inquiry', 'fa fa-car-side', 'Purchase Inquiry', null, { paddingLeft: '22px' })}
          {navItem('/valuation', 'fa fa-magnifying-glass-dollar', 'Valuation', null, { paddingLeft: '22px' })}
          {navItem('/purchase-follow', 'fa fa-phone-volume', 'Purchase Follow-Up', null, { paddingLeft: '22px' })}
          {navItem('/purchase-documents', 'fa fa-file-contract', 'Documents', null, { paddingLeft: '22px' })}
          {navItem('/purchase-booking', 'fa fa-file-pen', 'Order Booking', null, { paddingLeft: '22px' })}
          {navItem('/purchase-closer', 'fa fa-handshake', 'Purchase Closer', null, { paddingLeft: '22px' })}
          {navItem('/stock', 'fa fa-warehouse', 'Car Stock', null, { paddingLeft: '22px' })}
          {navItem('/workshop', 'fa fa-screwdriver-wrench', 'Workshop / Refurb', null, { paddingLeft: '22px' })}
          {navItem('/expenses', 'fa fa-receipt', 'Expenses', null, { paddingLeft: '22px' })}
        </>}

        {/* SALES PIPELINE */}
        {isSales && <>
          <div className="sb-sec" data-role="sales admin" style={{ color: 'rgba(80,160,255,.7)' }}>⬇ SALES PIPELINE</div>
          <NavLink
            to="/sales-search"
            className={({ isActive }) => `sb-item${isActive ? ' act' : ''}`}
            style={{ color: '#67e8f9' }}
          >
            <i className="fa fa-magnifying-glass sb-ico sb-ico-pulse"></i>
            <span className="sb-lbl">Sales Search</span>
          </NavLink>
          {navItem('/sales-inquiry', 'fa fa-tags', 'Sales Inquiry', null, { paddingLeft: '22px' })}
          {navItem('/sales-follow', 'fa fa-comments', 'Sales Follow-Up', null, { paddingLeft: '22px' })}
          {navItem('/sales-booking', 'fa fa-clipboard-list', 'Sales Order Booking', null, { paddingLeft: '22px' })}
          {navItem('/sales-closer', 'fa fa-trophy', 'Sales Closer', null, { paddingLeft: '22px' })}
          {navItem('/finance', 'fa fa-landmark', 'Finance / Loan', null, { paddingLeft: '22px' })}
          {navItem('/payment', 'fa fa-credit-card', 'Sale Payment', null, { paddingLeft: '22px' })}
          {navItem('/sale-documents', 'fa fa-file-contract', 'Sale Documents', null, { paddingLeft: '22px' })}
          {navItem('/delivery-note', 'fa fa-file-lines', 'Delivery Note', null, { paddingLeft: '22px' })}
          {navItem('/gate-pass', 'fa fa-door-open', 'Gate Pass', null, { paddingLeft: '22px' })}
          {navItem('/delivery', 'fa fa-truck', 'Delivery', null, { paddingLeft: '22px' })}
        </>}

        {/* SALES TOOLS */}
        {isSales && <>
          <div className="sb-sec" data-role="sales admin" style={{ color: 'rgba(103,232,249,.7)' }}>🛠 SALES TOOLS</div>
          {navItem('/customers', 'fa fa-users', 'Customers')}
          {navItem('/gst-invoice', 'fa fa-file-invoice', 'GST Invoice')}
          {navItem('/targets', 'fa fa-bullseye', 'Targets & Achievements')}
          {navItem('/emp-perf', 'fa fa-chart-line', 'Employee Performance')}
          {navItem('/tasks', 'fa fa-list-check', 'Daily Tasks')}
        </>}


        {/* MANAGEMENT (ADMIN ONLY) */}
        {isAdmin && <>
          <div className="sb-sec" data-role="admin">MANAGEMENT</div>
          {navItem('/user-mgmt', 'fa fa-user-shield', 'User Management')}
          {navItem('/settings', 'fa fa-gear', 'Settings')}
          {navItem('/reports', 'fa fa-chart-bar', 'Reports')}
        </>}
      </nav>

      <div className="sb-foot">
        <div className="sb-user" onClick={() => navigate('/settings')} style={{ cursor: 'pointer' }}>
          <div className="sb-avatar" id="sbAv">
            {initials(currentUser?.name || 'Admin')}
          </div>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="sb-uname" id="sbUname">{currentUser?.name || 'Administrator'}</div>
            <div className="sb-urole" id="sbRole">{currentUser?.role || 'Admin'}</div>
          </div>
          <i className="fa fa-chevron-right" style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 10 }}></i>
        </div>
        <div
          className="sb-item"
          onClick={handleLogout}
          style={{ marginTop: 4, color: 'var(--danger)', cursor: 'pointer' }}
        >
          <i className="fa fa-right-from-bracket sb-ico"></i>
          <span className="sb-lbl">Logout</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
