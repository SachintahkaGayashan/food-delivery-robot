import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CustomerMenu from './components/CustomerMenu';
import AdminPanel from './components/AdminPanel';

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Customer Menu View */}
        <Route path="/" element={<CustomerMenu />} />

        {/* Admin & Kitchen Panel View */}
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}