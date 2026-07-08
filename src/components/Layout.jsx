import React, { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import WelcomeModal from './WelcomeModal';
import DailyTaskManager from './DailyTaskManager';
import NotificationToast from './NotificationToast';

const Layout = () => {
  const [isSlim, setIsSlim] = useState(false);
  const [isDTMOpen, setIsDTMOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const toggleSidebar = useCallback(() => {
    // On mobile (window width <= 768), toggle the mobile overlay
    if (window.innerWidth <= 768) {
      setIsMobileOpen(s => !s);
    } else {
      setIsSlim(s => !s);
    }
  }, []);

  const toggleDTM = () => setIsDTMOpen(s => !s);

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div
          className="mob-backdrop"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <Sidebar isSlim={isSlim} isMobileOpen={isMobileOpen} />
      <Topbar isSlim={isSlim} toggleSidebar={toggleSidebar} toggleDTM={toggleDTM} />
      <div id="main" className={isSlim ? 'slim' : ''}>
        <Outlet />
      </div>
      <WelcomeModal />
      <DailyTaskManager isOpen={isDTMOpen} onClose={() => setIsDTMOpen(false)} />
      <NotificationToast />
    </>
  );
};

export default Layout;

