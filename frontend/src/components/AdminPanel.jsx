import React, { useState, useEffect } from 'react';
import { 
  Shield, LogOut, Utensils, ClipboardList, Plus, Trash2, Edit3, 
  CheckCircle, AlertTriangle, Scale, Lock, Mail, RefreshCw, X, Save,
  Battery, MapPin, Navigation, Wifi
} from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'menu', or 'robot'
  
  // Data states
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [robotWeight, setRobotWeight] = useState(0);
  const WEIGHT_LIMIT = 200; // Minimum weight threshold in grams to confirm delivery

  // Robot Telemetry Detailed State
  const [robotStatusData, setRobotStatusData] = useState({
    battery: 0,
    assignedTable: 'None',
    location: 'Charging Dock',
    roadblock: false,
    status: 'IDLE'
  });

  // Modal states for Food Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [foodForm, setFoodForm] = useState({ name: '', price: '', category: 'Mains', image: '', desc: '' });

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  // Fetch Orders, Menu, and Robot Telemetry in Real-time
  useEffect(() => {
    if (!user) return;

    // 1. Listen to Orders
    const ordersRef = ref(db, 'orders');
    const unsubscribeOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setOrders(list.reverse());
      } else {
        setOrders([]);
      }
    });

    // 2. Listen to Menu Items
    const menuRef = ref(db, 'menu');
    const unsubscribeMenu = onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMenuItems(list);
      } else {
        setMenuItems([]);
      }
    });

    // 3. Listen to Robot Weight Sensor Telemetry
    const weightRef = ref(db, 'robotStatus/currentWeight');
    const unsubscribeWeight = onValue(weightRef, (snapshot) => {
      const weight = snapshot.val();
      setRobotWeight(weight !== null ? Number(weight) : 0);
    });

    // 4. Listen to Full Robot Status Node (Battery, Location, Roadblock, etc.)
    const robotStatusRef = ref(db, 'robotStatus');
    const unsubscribeRobotStatus = onValue(robotStatusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setRobotStatusData({
          battery: data.battery || 0,
          assignedTable: data.assignedTable || 'None',
          location: data.location || 'Charging Dock',
          roadblock: data.roadblock || false,
          status: data.status || 'IDLE'
        });
      }
    });

    return () => {
      unsubscribeOrders();
      unsubscribeMenu();
      unsubscribeWeight();
      unsubscribeRobotStatus();
    };
  }, [user, db]);

  // Handle Secure Admin Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      console.error(err);
      setLoginError('Invalid email or password. Access denied.');
    }
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  // Confirm Order Action
  const handleConfirmOrder = async (orderId) => {
    if (robotWeight < WEIGHT_LIMIT) {
      alert(`⚠️ Cannot confirm order! Robot weight sensor reads ${robotWeight}g. Please place the food package onto the robot container first (Required min: ${WEIGHT_LIMIT}g).`);
      return;
    }

    try {
      const orderRef = ref(db, `orders/${orderId}`);
      await update(orderRef, { status: 'CONFIRMED & DISPATCHED' });
    } catch (err) {
      console.error(err);
      alert('Failed to update order status.');
    }
  };

  // Delete Order Function
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await remove(ref(db, `orders/${orderId}`));
      } catch (err) {
        console.error(err);
        alert('Failed to delete order.');
      }
    }
  };

  // Save or Update Food Item
  const handleSaveFood = async (e) => {
    e.preventDefault();
    if (!foodForm.name || !foodForm.price) {
      alert('Please fill out name and price.');
      return;
    }

    try {
      if (editingFood) {
        const foodRef = ref(db, `menu/${editingFood.id}`);
        await update(foodRef, foodForm);
      } else {
        const menuRef = ref(db, 'menu');
        const newFoodRef = push(menuRef);
        await set(newFoodRef, foodForm);
      }
      setIsModalOpen(false);
      setEditingFood(null);
      setFoodForm({ name: '', price: '', category: 'Mains', image: '', desc: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to save food item.');
    }
  };

  // Delete Food Item
  const handleDeleteFood = async (id) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await remove(ref(db, `menu/${id}`));
      } catch (err) {
        console.error(err);
        alert('Failed to delete item.');
      }
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // ================= SECURE LOGIN SCREEN =================
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl relative z-10"
        >
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <Shield className="w-8 h-8" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal</h1>
            <p className="text-xs text-slate-400">Udarata Bistro Secure Kitchen Management</p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-medium">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="admin@udaratabistro.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm"
            >
              Secure Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // ================= ADMIN DASHBOARD =================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-bold shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-white tracking-tight">Kitchen & Admin Dashboard</h1>
              <p className="text-[11px] text-emerald-400 font-mono font-medium">Logged in as {user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            
            {/* Live Robot Weight Indicator Badge */}
            <div className={`hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-mono font-bold ${
              robotWeight >= WEIGHT_LIMIT 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}>
              <Scale className="w-4 h-4" />
              <span>Robot Load: {robotWeight}g</span>
              <span className="text-[10px] font-normal opacity-75">({robotWeight >= WEIGHT_LIMIT ? 'Ready' : 'Empty'})</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-red-500/10 hover:text-red-400 text-slate-300 border border-slate-800 hover:border-red-500/30 rounded-xl text-xs font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> Live Orders ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('robot')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'robot'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Navigation className="w-4 h-4" /> Robot Status & Telemetry
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'menu'
                ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Utensils className="w-4 h-4" /> Manage Foods ({menuItems.length})
          </button>
        </div>

        {/* ================= TAB 1: LIVE ORDERS & WEIGHT VALIDATION ================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Kitchen Rule: Orders can only be confirmed when the autonomous robot load cell sensor reads <strong>≥ {WEIGHT_LIMIT}g</strong>.</span>
              </div>
              <div className="sm:hidden flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-950 text-xs font-mono font-bold text-emerald-400 border-emerald-500/30">
                <Scale className="w-3.5 h-3.5" /> Load: {robotWeight}g
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {orders.length === 0 ? (
                <div className="col-span-full text-center py-16 text-slate-500 space-y-2">
                  <ClipboardList className="w-10 h-10 mx-auto opacity-40" />
                  <p className="text-sm">No incoming customer orders found.</p>
                </div>
              ) : (
                orders.map((order) => {
                  const isConfirmed = order.status && order.status.includes('CONFIRMED');
                  return (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                          <span className="font-extrabold text-white text-base font-mono">{order.tableName}</span>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                            isConfirmed 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                          }`}>
                            {order.status || 'PENDING'}
                          </span>
                        </div>

                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {order.items && order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs text-slate-300">
                              <span>{item.qty}x {item.name}</span>
                              <span className="font-mono text-emerald-400">LKR {item.price * item.qty}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-4 space-y-3">
                        <div className="flex justify-between items-center text-sm font-extrabold">
                          <span className="text-slate-400">Total</span>
                          <span className="text-emerald-400 font-mono">LKR {order.total}.00</span>
                        </div>

                        <div className="flex gap-2">
                          {!isConfirmed && (
                            <button
                              onClick={() => handleConfirmOrder(order.id)}
                              className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle className="w-4 h-4" /> Confirm
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="px-3 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: ROBOT STATUS & TELEMETRY ================= */}
        {activeTab === 'robot' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">ESP8266 Telemetry</span>
                  <h2 className="text-2xl font-black text-white tracking-tight mt-2">AGV Robot Live Diagnostics</h2>
                </div>
                <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-emerald-400 font-mono">
                  <Wifi className="w-3.5 h-3.5 animate-pulse" /> Live Hardware Sync
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Battery Status */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase">Battery Level</span>
                    <Battery className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white font-mono">{robotStatusData.battery}%</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{robotStatusData.battery > 20 ? 'Optimal' : 'Low Power'}</span>
                  </div>
                </div>

                {/* Current Assigned Table */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase">Assigned Table</span>
                    <Navigation className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-white font-mono">{robotStatusData.assignedTable}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{robotStatusData.status}</span>
                  </div>
                </div>

                {/* Current Location */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase">Current Location</span>
                    <MapPin className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white">{robotStatusData.location}</span>
                  </div>
                </div>

                {/* Road Block / Obstacle Status */}
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2 shadow-md">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase">Obstacle Status</span>
                    {robotStatusData.roadblock ? (
                      <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-xl font-bold ${robotStatusData.roadblock ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {robotStatusData.roadblock ? 'Path Blocked!' : 'Path Clear'}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: MANAGE FOODS (CRUD) ================= */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-black text-white tracking-tight">Menu Inventory Control</h2>
              <button
                onClick={() => { setEditingFood(null); setFoodForm({ name: '', price: '', category: 'Mains', image: '', desc: '' }); setIsModalOpen(true); }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" /> Add New Food Item
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <div key={item.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between">
                  <div>
                    <div className="h-40 bg-slate-950 relative overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <span className="absolute top-3 right-3 text-[10px] font-mono px-2.5 py-1 bg-slate-950/80 text-emerald-400 rounded-full border border-slate-700">
                        {item.category}
                      </span>
                    </div>
                    <div className="p-5 space-y-1.5">
                      <h3 className="font-bold text-white text-sm">{item.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{item.desc}</p>
                      <p className="text-emerald-400 font-mono font-extrabold text-sm pt-1">LKR {item.price}.00</p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex gap-2 border-t border-slate-800/60 mt-3">
                    <button
                      onClick={() => { setEditingFood(item); setFoodForm(item); setIsModalOpen(true); }}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteFood(item.id)}
                      className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-red-500/20"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Add / Edit Food Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="font-extrabold text-white text-base">
                  {editingFood ? 'Edit Food Item' : 'Add New Food Item'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveFood} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Food Name</label>
                  <input
                    type="text"
                    required
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Price (LKR)</label>
                    <input
                      type="number"
                      required
                      value={foodForm.price}
                      onChange={(e) => setFoodForm({ ...foodForm, price: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Category</label>
                    <select
                      value={foodForm.category}
                      onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Mains">Mains</option>
                      <option value="Appetizers">Appetizers</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Image URL (Unsplash)</label>
                  <input
                    type="text"
                    value={foodForm.image}
                    onChange={(e) => setFoodForm({ ...foodForm, image: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">Description</label>
                  <textarea
                    rows="3"
                    value={foodForm.desc}
                    onChange={(e) => setFoodForm({ ...foodForm, desc: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" /> Save Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}