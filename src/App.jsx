import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { DataProvider } from './contexts/DataContext';
import { AuthProvider, useAuth, ROUTE_ROLES } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PurchaseDashboard from './pages/PurchaseDashboard';
import SalesDashboard from './pages/SalesDashboard';
import PurchaseInquiry from './pages/PurchaseInquiry';
import SalesInquiry from './pages/SalesInquiry';
import Valuation from './pages/Valuation';
import Stock from './pages/Stock';
import PurchaseCloser from './pages/PurchaseCloser';
import PurchaseFollowUp from './pages/PurchaseFollowUp';
import PurchaseBooking from './pages/PurchaseBooking';
import SalesFollowUp from './pages/SalesFollowUp';
import SalesCloser from './pages/SalesCloser';
import SalesBooking from './pages/SalesBooking';
import Workshop from './pages/Workshop';
import Payment from './pages/Payment';
import Delivery from './pages/Delivery';
import DeliveryNote from './pages/DeliveryNote';
import GatePass from './pages/GatePass';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import Finance from './pages/Finance';
import GstInvoice from './pages/GstInvoice';
import Expenses from './pages/Expenses';
import Customers from './pages/Customers';
import Targets from './pages/Targets';
import EmpPerf from './pages/EmpPerf';
import UserMgmt from './pages/UserMgmt';
import TestDrive from './pages/TestDrive';
import PurchaseDocuments from './pages/PurchaseDocuments';
import SalesDocuments from './pages/SalesDocuments';
import PurchaseSearch from './pages/PurchaseSearch';
import SalesSearch from './pages/SalesSearch';
import Tasks from './pages/Tasks';

import './index.css';

import SplashLoader from './components/SplashLoader';

// ── Protected Route: must be logged in ──
const ProtectedRoute = ({ children }) => {
  const { currentUser, authLoading } = useAuth();
  if (authLoading) return null; // Wait for auth to initialize
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// ── Role Route: must have one of the allowed roles ──
const RoleRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(currentUser.role)) {
    // Redirect unauthorized users to dashboard
    return <Navigate to="/" replace />;
  }
  return children;
};

function AppInner() {
  const { currentUser, authLoading } = useAuth();

  if (authLoading) return null; // Splash handles loading state

  return (
    <Routes>
      <Route path="/login" element={
        currentUser ? <Navigate to="/" replace /> : <Login />
      } />

      <Route path="/" element={
        <ProtectedRoute>
          <DataProvider>
            <NotificationProvider>
              <Layout />
            </NotificationProvider>
          </DataProvider>
        </ProtectedRoute>
      }>
        {/* Dashboards — All roles */}
        <Route index element={<Dashboard />} />
        <Route path="purchase-dashboard" element={<PurchaseDashboard />} />
        <Route path="sales-dashboard" element={<SalesDashboard />} />

        {/* Purchase Pipeline — purchase roles */}
        <Route path="purchase-inquiry" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.purchase}><PurchaseInquiry /></RoleRoute>
        } />
        <Route path="valuation" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.purchase}><Valuation /></RoleRoute>
        } />
        <Route path="purchase-follow" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.purchase}><PurchaseFollowUp /></RoleRoute>
        } />
        <Route path="purchase-closer" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.purchase}><PurchaseCloser /></RoleRoute>
        } />
        <Route path="purchase-booking" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.purchase}><PurchaseBooking /></RoleRoute>
        } />
        <Route path="purchase-search" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.purchase}><PurchaseSearch /></RoleRoute>
        } />
        <Route path="payment" element={<Payment />} />
        <Route path="purchase-documents" element={<PurchaseDocuments />} />

        {/* Stock & Workshop — purchase + sales */}
        <Route path="stock" element={<Stock />} />
        <Route path="workshop" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.purchase}><Workshop /></RoleRoute>
        } />
        <Route path="expenses" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.purchase}><Expenses /></RoleRoute>
        } />

        {/* Sales Pipeline — sales roles */}
        <Route path="sales-search" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><SalesSearch /></RoleRoute>
        } />
        <Route path="sales-inquiry" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><SalesInquiry /></RoleRoute>
        } />
        <Route path="sales-follow" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><SalesFollowUp /></RoleRoute>
        } />
        <Route path="test-drive" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><TestDrive /></RoleRoute>
        } />
        <Route path="sales-closer" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><SalesCloser /></RoleRoute>
        } />
        <Route path="sales-booking" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><SalesBooking /></RoleRoute>
        } />
        <Route path="sale-documents" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><SalesDocuments /></RoleRoute>
        } />
        <Route path="finance" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><Finance /></RoleRoute>
        } />
        <Route path="gst-invoice" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><GstInvoice /></RoleRoute>
        } />
        <Route path="delivery" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><Delivery /></RoleRoute>
        } />
        <Route path="delivery-note" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><DeliveryNote /></RoleRoute>
        } />
        <Route path="gate-pass" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><GatePass /></RoleRoute>
        } />

        {/* Sales Tools — sales roles */}
        <Route path="customers" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><Customers /></RoleRoute>
        } />
        <Route path="targets" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><Targets /></RoleRoute>
        } />
        <Route path="emp-perf" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.sales}><EmpPerf /></RoleRoute>
        } />
        <Route path="tasks" element={<Tasks />} />

        {/* Admin / Management */}
        <Route path="user-mgmt" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.admin}><UserMgmt /></RoleRoute>
        } />
        <Route path="reports" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.admin}><Reports /></RoleRoute>
        } />
        <Route path="settings" element={
          <RoleRoute allowedRoles={ROUTE_ROLES.admin}><Settings /></RoleRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const [appLoading, setAppLoading] = React.useState(true);

  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          {appLoading && <SplashLoader onComplete={() => setAppLoading(false)} />}
          {!appLoading && <AppInner />}
        </AuthProvider>
      </BrowserRouter>
    </>
  );
}
