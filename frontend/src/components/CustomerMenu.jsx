import React, { useState, useEffect } from 'react';
import { ShoppingCart, Utensils, CheckCircle, Plus, Minus, Sparkles, Clock, MapPin, Phone, Info, Home, ArrowRight, ClipboardList, Mail, Globe, ShieldCheck, Heart } from 'lucide-react';
import { getDatabase, ref, push, set, onValue } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['All', 'Mains', 'Appetizers', 'Beverages'];
const TABLES = ['Table 01', 'Table 02', 'Table 03', 'Table 04', 'Table 05', 'Table 06'];

export default function CustomerMenu() {
  const [cart, setCart] = useState([]);
  const [tableName, setTableName] = useState(() => localStorage.getItem('bistro_kandy_table') || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const db = getDatabase();
    
    // Menu Listener
    const menuRef = ref(db, 'menu');
    const unsubMenu = onValue(menuRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const itemsList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setMenuItems(itemsList);
      } else {
        setMenuItems([]);
      }
    });

    // Orders Listener
    const ordersRef = ref(db, 'orders');
    const unsubOrders = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const ordersList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setAllOrders(ordersList);
      } else {
        setAllOrders([]);
      }
    });

    return () => {
      unsubMenu();
      unsubOrders();
    };
  }, []);

  const handleTableSelection = (table) => {
    setTableName(table);
    if (table) {
      localStorage.setItem('bistro_kandy_table', table);
    } else {
      localStorage.removeItem('bistro_kandy_table');
    }
  };

  const scrollToSection = (id) => {
    setActiveTab(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredItems = activeCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!tableName) {
      alert('لطفاً / Please select your table number from the menu cart before ordering!');
      return;
    }
    if (cart.length === 0) {
      alert('Your cart is empty. Please select items to order.');
      return;
    }

    const activeTableOrder = allOrders.find(
      order => order.tableName === tableName && order.status && !order.status.includes('COMPLETED')
    );

    if (activeTableOrder) {
      alert(`⚠️ ${tableName} is currently occupied with an active order (${activeTableOrder.status}). Please choose another table or wait until the current order completes.`);
      return;
    }

    setLoading(true);
    try {
      const db = getDatabase();
      const ordersRef = ref(db, 'orders');
      const newOrderRef = push(ordersRef);
      
      await set(newOrderRef, {
        tableName: tableName,
        items: cart,
        total: calculateTotal(),
        status: 'PENDING',
        paymentMethod: 'Pay at Counter',
        timestamp: Date.now()
      });

      setOrderPlaced(true);
      setCart([]);
      setTimeout(() => setOrderPlaced(false), 7000);
    } catch (err) {
      console.error('Order error:', err);
      alert('Failed to place order. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans relative overflow-x-hidden scroll-smooth">
      
      {/* Background Glowing Effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[160px] pointer-events-none -z-10" />

      {/* HEADER */}
      <header className="border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3.5 cursor-pointer group" 
            onClick={() => scrollToSection('home')}
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Utensils className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                Udarata Bistro
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">Kandy</span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">Fine Dining & Autonomous Ordering</p>
            </div>
          </motion.div>

          <nav className="hidden md:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 p-1.5 rounded-2xl backdrop-blur-md">
            {[
              { id: 'home', label: 'Home', icon: Home },
              { id: 'menu', label: 'Menu & Cart', icon: Utensils },
              { id: 'my-orders', label: 'Live Orders', icon: ClipboardList },
              { id: 'about', label: 'About Us', icon: Info },
              { id: 'contact', label: 'Contact', icon: Phone },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 flex items-center gap-2 ${
                    activeTab === tab.id ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-slate-950' : 'text-amber-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToSection('menu')}
            className="relative flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all text-xs font-semibold text-slate-200 shadow-md"
          >
            <ShoppingCart className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Cart</span>
            {cart.length > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-1.5 bg-amber-400 text-slate-950 font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
              >
                {cart.reduce((a, c) => a + c.qty, 0)}
              </motion.span>
            )}
          </motion.button>

        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#070b14]/95 backdrop-blur-2xl border-t border-slate-800/80 z-40 px-4 py-2.5 flex justify-around">
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'menu', label: 'Menu', icon: Utensils },
          { id: 'my-orders', label: 'Orders', icon: ClipboardList },
          { id: 'about', label: 'About', icon: Info },
          { id: 'contact', label: 'Contact', icon: Phone },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              onClick={() => scrollToSection(tab.id)} 
              className={`flex flex-col items-center gap-1 text-[10px] font-medium transition-all ${
                activeTab === tab.id ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 text-amber-400" /> 
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="max-w-7xl mx-auto p-4 md:p-8 space-y-24 pb-32 md:pb-16">
        
        {/* SUCCESS BANNER */}
        <AnimatePresence>
          {orderPlaced && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 text-sm font-semibold shadow-xl"
            >
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>🎉 Successfully placed your order for <strong>{tableName}</strong>! Check live updates in the "Live Orders" section.</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HERO SECTION */}
        <section id="home" className="pt-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-[#070b14] border border-slate-800/80 shadow-2xl p-8 md:p-16 space-y-6">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold border border-amber-500/20">
              <Sparkles className="w-4 h-4" /> Heart of Kandy City • Tables 01 to 06
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-[1.1] max-w-3xl">
              Experience Authentic Flavours & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Seamless Table Ordering</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
              Welcome to Udarata Bistro, located amidst the scenic hills of Kandy. Select your dining table, browse our exquisite chef-curated menu, and experience lightning-fast live table ordering.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={() => scrollToSection('menu')}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-amber-500/25 transition-all text-sm flex items-center gap-2"
              >
                Explore Menu & Order <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => scrollToSection('about')}
                className="px-8 py-4 bg-slate-800/80 hover:bg-slate-800 text-white font-bold rounded-2xl border border-slate-700/80 transition-all text-sm"
              >
                Learn More About Us
              </button>
            </div>
          </div>
        </section>

        {/* MENU & CART SECTION */}
        <section id="menu" className="space-y-6 pt-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <span className="text-amber-400 text-xs font-bold uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Kandy Culinary Selection</span>
              <h2 className="text-3xl font-black text-white tracking-tight mt-2">Dine-In Menu</h2>
            </div>
            
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 whitespace-nowrap ${
                    activeCategory === category
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-lg font-bold'
                      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* FOOD ITEMS GRID */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredItems.length === 0 ? (
                <div className="col-span-2 text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80">
                  <Utensils className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
                  <p className="text-slate-400 text-sm">No items available in this category right now.</p>
                </div>
              ) : (
                filteredItems.map(item => (
                  <motion.div 
                    whileHover={{ y: -4 }}
                    key={item.id} 
                    className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl transition-all"
                  >
                    <div className="relative h-48 bg-slate-950 overflow-hidden">
                      <img 
                        src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80'} 
                        alt={item.name} 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 right-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-400 border border-slate-800">
                        {item.category}
                      </span>
                    </div>
                    <div className="p-5 space-y-2">
                      <h3 className="font-bold text-white text-base">{item.name}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="p-5 pt-0 flex items-center justify-between border-t border-slate-800/40 mt-2">
                      <span className="text-amber-400 font-mono font-black text-base">LKR {item.price}.00</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to Cart
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* CHECKOUT CART SIDEBAR */}
            <div className="space-y-6">
              <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/80 rounded-3xl p-6 h-fit sticky top-28 shadow-2xl space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <h2 className="text-sm font-bold text-white">Your Table Cart</h2>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 text-slate-400 rounded-lg border border-slate-800">
                    {cart.reduce((acc, i) => acc + i.qty, 0)} items
                  </span>
                </div>

                {/* TABLE SELECTION DROPDOWN */}
                <div className="space-y-2">
                  <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                    Select Your Dining Table <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={tableName}
                    onChange={(e) => handleTableSelection(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                  >
                    <option value="">-- Choose Table 01 to 06 --</option>
                    {TABLES.map(tbl => {
                      const isOccupied = allOrders.some(o => o.tableName === tbl && o.status && !o.status.includes('COMPLETED'));
                      return (
                        <option key={tbl} value={tbl}>
                          {tbl} {isOccupied ? '🔴 (Currently Occupied)' : '🟢 (Available)'}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* CART ITEMS LIST */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500 italic">Your cart is currently empty. Add dishes from the menu!</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex items-center justify-between bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-sm">
                        <div>
                          <p className="font-semibold text-slate-200 text-xs">{item.name}</p>
                          <p className="text-[11px] text-amber-400 font-mono font-bold">LKR {Number(item.price) * item.qty}.00</p>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-300 hover:text-white"><Minus className="w-3 h-3" /></button>
                          <span className="font-mono text-xs w-4 text-center text-white font-bold">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1 text-slate-300 hover:text-white"><Plus className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-4">
                  <div className="flex items-center justify-between text-base font-extrabold">
                    <span className="text-white">Subtotal</span>
                    <span className="text-amber-400 font-mono">LKR {calculateTotal()}.00</span>
                  </div>

                  <button
                    disabled={loading || cart.length === 0}
                    onClick={handleCheckout}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 disabled:opacity-50 text-slate-950 font-extrabold rounded-2xl shadow-lg text-sm transition-all"
                  >
                    {loading ? 'Submitting Order...' : 'Place Table Order'}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* LIVE ORDERS SECTION */}
        <section id="my-orders" className="space-y-6 pt-6">
          <div className="border-b border-slate-800/80 pb-4">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Kitchen Telemetry</span>
            <h2 className="text-3xl font-black text-white tracking-tight mt-2">Live Table Order Tracker</h2>
            <p className="text-xs text-slate-400 mt-1">Track the preparation status of orders placed across our dining tables.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-4">
              <label className="text-xs font-bold text-slate-300">Filter View by Table:</label>
              <select
                value={tableName}
                onChange={(e) => handleTableSelection(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white font-mono"
              >
                <option value="">-- All Tables --</option>
                {TABLES.map(tbl => (
                  <option key={tbl} value={tbl}>{tbl}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {allOrders.filter(o => !tableName || o.tableName === tableName).length === 0 ? (
                <div className="col-span-2 text-center py-12 text-slate-500 text-sm">
                  No active or past orders found for this selection.
                </div>
              ) : (
                allOrders
                  .filter(o => !tableName || o.tableName === tableName)
                  .map((order) => (
                    <div key={order.id} className="bg-slate-950 border border-slate-800/90 p-5 rounded-2xl space-y-3 shadow-md">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                        <div>
                          <span className="text-xs font-extrabold text-amber-400 font-mono">{order.tableName}</span>
                          <span className="text-[10px] text-slate-500 block">{new Date(order.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full border ${
                          order.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          order.status && order.status.includes('CONFIRMED') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {order.status || 'PENDING'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-300">Ordered Items:</p>
                        {order.items?.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-400 font-mono">
                            <span>{it.qty}x {it.name}</span>
                            <span>LKR {it.price * it.qty}.00</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-800/60 pt-3 flex items-center justify-between font-bold text-sm">
                        <span className="text-slate-300">Total Bill:</span>
                        <span className="text-amber-400 font-mono">LKR {order.total}.00</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </section>

        {/* DETAILED ABOUT US SECTION */}
        <section id="about" className="space-y-6 pt-6">
          <div className="border-b border-slate-800/80 pb-4">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Our Heritage</span>
            <h2 className="text-3xl font-black text-white tracking-tight mt-2">About Udarata Bistro - Kandy</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 shadow-xl">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" /> Crafted for Perfection in the Hill Capital
              </h3>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Nestled in the cultural heart of **Kandy**, Udarata Bistro combines traditional Sri Lankan hospitality with modern automated dining technology. Established with a vision to streamline dine-in ordering, our restaurant features 6 exclusive dining tables equipped with real-time kitchen telemetry.
              </p>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                Whether you're enjoying our signature mains, refreshing beverages, or delectable appetizers, every dish is prepared with fresh locally-sourced ingredients under the supervision of master chefs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-1">
                <span className="text-2xl font-black text-amber-400">06</span>
                <p className="text-xs text-slate-400 font-medium">Exclusive Tables</p>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-1">
                <span className="text-2xl font-black text-amber-400">100%</span>
                <p className="text-xs text-slate-400 font-medium">Real-Time Sync</p>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-1">
                <span className="text-2xl font-black text-amber-400">24/7</span>
                <p className="text-xs text-slate-400 font-medium">Support Ready</p>
              </div>
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-center space-y-1">
                <span className="text-2xl font-black text-amber-400">Kandy</span>
                <p className="text-xs text-slate-400 font-medium">Prime Location</p>
              </div>
            </div>
          </div>
        </section>

        {/* DETAILED CONTACT & SUPPORT SECTION */}
        <section id="contact" className="space-y-6 pt-6">
          <div className="border-b border-slate-800/80 pb-4">
            <span className="text-amber-400 text-xs font-bold uppercase tracking-wider bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">Get in Touch</span>
            <h2 className="text-3xl font-black text-white tracking-tight mt-2">Contact & Support - Kandy Branch</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Location Address</h3>
              <p className="text-xs text-slate-400 leading-relaxed">No. 42, Peradeniya Road, Kandy, Central Province, Sri Lanka</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Direct Hotline</h3>
              <p className="text-xs text-slate-400 leading-relaxed">+94 (0) 81 223 4567<br />+94 (0) 77 987 6543</p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-3 shadow-xl">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">Opening Hours</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Monday - Sunday<br />10:00 AM – 11:00 PM (Daily)</p>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500 space-y-2">
        <p>© 2026 Udarata Bistro (Kandy Branch). All rights reserved. Powered by Autonomous Dine-In Systems.</p>
      </footer>
    </div>
  );
}