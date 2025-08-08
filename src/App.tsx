import React, { useEffect, useState } from 'react';
import './App.css';

// Split into two lists: base names and per-qty notes
const CATEGORY_NAMES = [
  'Starters',
  'Salads',
  'Veg curry',
  'Non-veg Curry',
  'Chapatis/Naan/Roti etc',
  'Rice Items',
  'Sweets',
  'Drinks'
];
const CATEGORY_PER_QTY = [
  'Serving 5',
  'Serving 5',
  'Serving 4',
  'Serving 4',
  'Serving 15',
  'Serving 4',
  'Serving 8',
  'Serving 40'
];

const MAX_QTY = [
  '6',
  '2',
  '4',
  '7',
  '5',
  '6',
  '4',
  '1'
];

// Helpers to parse category label and extract per-qty info (for backward compatibility)
const parseCategory = (label: string) => {
  const m = label.match(/^(.*?)\s*\((.*?)\)\s*$/);
  return { name: (m ? m[1] : label).trim(), perQty: m ? m[2].trim() : '' };
};
const normalizeCategory = (label: string) => parseCategory(label).name;

type Entry = {
  name: string;
  category: string;
  dish: string;
  quantity: number;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4020';

function App() {
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORY_NAMES[0]);
  const [dish, setDish] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [formMsg, setFormMsg] = useState('');

  // Entries and summary
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  // Admin
  const [adminMode, setAdminMode] = useState(false);
  const [adminPw, setAdminPw] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Edit entry state
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);

  // Capacity control per category based on MAX_QTY
  const maxQtyNums = CATEGORY_NAMES.map((_, i) => Number(MAX_QTY[i] ?? 0));
  const totalsByName = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) {
      const n = normalizeCategory(e.category);
      map[n] = (map[n] || 0) + (e.quantity || 0);
    }
    return map;
  }, [entries]);
  const availableCategories = React.useMemo(
    () => CATEGORY_NAMES.filter((name, i) => (totalsByName[name] ?? 0) < maxQtyNums[i]),
    [totalsByName]
  );
  useEffect(() => {
    if (!availableCategories.includes(category)) {
      setCategory(availableCategories[0] ?? '');
    }
  }, [availableCategories]);
  const selectedIdx = CATEGORY_NAMES.indexOf(category);
  const remainingForSelected = selectedIdx >= 0
    ? Math.max(0, maxQtyNums[selectedIdx] - (totalsByName[normalizeCategory(category)] ?? 0))
    : 0;
  useEffect(() => {
    if (remainingForSelected > 0 && quantity > remainingForSelected) {
      setQuantity(remainingForSelected);
    }
  }, [category, totalsByName]);

  // View/UX constraints: no vertical scrolling – use tabs on mobile and pagination for the list
  const isMobile = window.innerWidth < 768;
  const [activeTab, setActiveTab] = useState<'form' | 'summary'>(isMobile ? 'form' : 'summary');
  const [showAdmin, setShowAdmin] = useState(!isMobile);
  const [page, setPage] = useState(1);
  const pageSize = isMobile ? 5 : 8;
  const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
  useEffect(() => { setPage(1); }, [entries]);

  // Fetch entries
  const fetchEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/entries`);
      const data = await res.json();
      setEntries(data);
    } catch {
      setEntries([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Submit entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg('');
    try {
      const res = await fetch(`${BACKEND_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, dish, quantity }),
      });
      if (res.ok) {
        setFormMsg('Entry saved!');
        setName(''); setDish(''); setQuantity(1);
        fetchEntries();
      } else {
        const err = await res.json();
        setFormMsg(err.detail || 'Error saving entry');
      }
    } catch {
      setFormMsg('Network error');
    }
  };

  // Admin login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg('');
    try {
      const form = new FormData();
      form.append('password', adminPw);
      const res = await fetch(`${BACKEND_URL}/admin/login`, {
        method: 'POST',
        body: form,
      });
      if (res.ok) {
        setAdminMode(true);
        setAdminMsg('Admin mode enabled');
      } else {
        setAdminMsg('Invalid password');
      }
    } catch {
      setAdminMsg('Network error');
    }
  };

  // Download Excel
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/download?password=${encodeURIComponent(adminPw)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'potluck_data.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        setAdminMsg('Download failed');
      }
    } catch {
      setAdminMsg('Network error');
    }
    setDownloading(false);
  };

  // Delete entry
  const handleDelete = async (idx: number) => {
    if (!adminMode) return;
    const entry = entries[idx];
    if (!window.confirm(`Delete entry for ${entry.name} (${entry.dish})?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPw, index: idx }),
      });
      if (res.ok) {
        fetchEntries();
      } else {
        setAdminMsg('Delete failed');
      }
    } catch {
      setAdminMsg('Network error');
    }
  };

  // Start editing
  const handleEditStart = (idx: number) => {
    setEditIdx(idx);
    setEditEntry({ ...entries[idx] });
  };

  // Cancel editing
  const handleEditCancel = () => {
    setEditIdx(null);
    setEditEntry(null);
  };

  // Save edit
  const handleEditSave = async (idx: number) => {
    if (!editEntry) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPw, index: idx, ...editEntry }),
      });
      if (res.ok) {
        setEditIdx(null);
        setEditEntry(null);
        fetchEntries();
      } else {
        setAdminMsg('Edit failed');
      }
    } catch {
      setAdminMsg('Network error');
    }
  };
  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      height: '100vh',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#333',
      padding: 0,
      gap: isMobile ? '0' : '0',
      width: '100%',
      boxSizing: 'border-box',
      overflowX: 'hidden',
      overflowY: 'hidden',
      maxWidth: '100%'
    }}>
      {isMobile && (
        <div style={{
          display: 'flex',
          gap: 8,
          padding: '8px',
          background: 'rgba(255,255,255,0.2)'
        }}>
          <button
            onClick={() => setActiveTab('form')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 0,
              borderRadius: 8,
              color: '#fff',
              background: activeTab === 'form' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(0,0,0,0.2)',
              fontWeight: 600
            }}
          >Form</button>
          <button
            onClick={() => setActiveTab('summary')}
            style={{
              flex: 1,
              padding: '10px 12px',
              border: 0,
              borderRadius: 8,
              color: '#fff',
              background: activeTab === 'summary' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(0,0,0,0.2)',
              fontWeight: 600
            }}
          >Summary</button>
        </div>
      )}
      {/* Left: Entry Form & Admin Panel */}
      <div style={{
        display: isMobile ? (activeTab === 'form' ? 'block' : 'none') : 'block',
        flex: isMobile ? 'none' : 1,
        padding: isMobile ? '0.5rem' : '1.5rem',
        background: '#ffffff',
        margin: isMobile ? '0' : '0 0.5rem 0 0',
        borderRadius: isMobile ? 0 : 12,
        boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        minWidth: isMobile ? '0' : '300px',
        maxWidth: isMobile ? '100%' : '500px',
        width: isMobile ? '100%' : 'auto',
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <h2 style={{ 
          color: '#2c3e50', 
          marginBottom: '1rem', 
          fontSize: isMobile ? '1.3rem' : '1.8rem', 
          fontWeight: '600',
          textAlign: 'center'
        }}>🍽️ Add Your Dish</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input 
            required 
            placeholder="Your Name" 
            value={name} 
            onChange={e => setName(e.target.value)}
            style={{
              padding: window.innerWidth < 768 ? '10px 14px' : '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: 8,
              fontSize: window.innerWidth < 768 ? '14px' : '16px',
              color: '#333',
              backgroundColor: '#fff',
              transition: 'border-color 0.3s ease',
              outline: 'none'
            }}
          />
          <select 
            value={category} 
            onChange={e => setCategory(e.target.value)}
            style={{
              padding: window.innerWidth < 768 ? '10px 14px' : '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: 8,
              fontSize: window.innerWidth < 768 ? '14px' : '16px',
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none'
            }}
            disabled={availableCategories.length === 0}
          >
            {availableCategories.map(c => <option key={c} style={{ color: '#333' }}>{c}</option>)}
          </select>
          {availableCategories.length === 0 ? (
            <div style={{ fontSize: 12, color: '#e74c3c', background: '#fdeaea', border: '1px solid #e74c3c', borderRadius: 6, padding: '8px 10px' }}>
              All categories have reached the maximum quantity. Please check back later.
            </div>
          ) : (
            remainingForSelected <= 3 && (
              <div style={{ fontSize: 12, color: '#8e44ad' }}>
                {remainingForSelected} qty left for this category
              </div>
            )
          )}
          <input 
            required 
            placeholder="Dish Name" 
            value={dish} 
            onChange={e => setDish(e.target.value)}
            style={{
              padding: window.innerWidth < 768 ? '10px 14px' : '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: 8,
              fontSize: window.innerWidth < 768 ? '14px' : '16px',
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none'
            }}
          />
          <input 
            required 
            type="number" 
            min={1} 
            max={Math.max(1, remainingForSelected)}
            placeholder="Quantity" 
            value={quantity} 
            onChange={e => {
              const val = Number(e.target.value);
              const clamped = Math.max(1, Math.min(val, Math.max(1, remainingForSelected)));
              setQuantity(clamped);
            }}
            style={{
              padding: window.innerWidth < 768 ? '10px 14px' : '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: 8,
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none'
            }}
            disabled={remainingForSelected === 0}
          />
          <button 
            type="submit" 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff', 
              border: 0, 
              padding: window.innerWidth < 768 ? '12px 20px' : '14px 24px', 
              borderRadius: 8,
              fontSize: window.innerWidth < 768 ? '14px' : '16px',
              fontWeight: '600',
              cursor: availableCategories.length === 0 || remainingForSelected === 0 ? 'not-allowed' : 'pointer',
              opacity: availableCategories.length === 0 || remainingForSelected === 0 ? 0.6 : 1,
              transition: 'transform 0.2s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            disabled={availableCategories.length === 0 || remainingForSelected === 0}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            ✅ Save Entry
          </button>
        </form>
        {formMsg && (
          <div style={{ 
            marginTop: 16, 
            padding: '12px 16px',
            borderRadius: 8,
            color: formMsg.includes('saved') ? '#27ae60' : '#e74c3c',
            backgroundColor: formMsg.includes('saved') ? '#d5f5d5' : '#fdeaea',
            border: `2px solid ${formMsg.includes('saved') ? '#27ae60' : '#e74c3c'}`,
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {formMsg}
          </div>
        )}
        {/* Admin toggle on mobile */}
        {isMobile && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button onClick={() => setShowAdmin(v => !v)} style={{
              background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
              color: '#fff', border: 0, padding: '8px 12px', borderRadius: 8, fontSize: '12px', fontWeight: 600
            }}>{showAdmin ? 'Hide Admin' : 'Show Admin'}</button>
          </div>
        )}
        {/* Admin actions (moved below form) */}
        <div style={{ 
          borderTop: '2px solid #ecf0f1',
          paddingTop: isMobile ? '0.8rem' : '1.5rem',
          marginTop: isMobile ? '0.8rem' : '2rem',
          display: !isMobile || showAdmin ? 'block' : 'none'
        }}>
          <h3 style={{ 
            color: '#2c3e50', 
            marginBottom: '1rem', 
            fontSize: window.innerWidth < 768 ? '1.2rem' : '1.4rem', 
            fontWeight: '600',
            textAlign: 'center'
          }}>🔐 Admin Panel</h3>
          {!adminMode ? (
            <form onSubmit={handleAdminLogin} style={{ 
              display: 'flex', 
              gap: 12, 
              alignItems: 'center', 
              flexWrap: 'wrap',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row'
            }}>
              <input 
                type="password" 
                placeholder="Admin password" 
                value={adminPw} 
                onChange={e => setAdminPw(e.target.value)}
                style={{
                  padding: window.innerWidth < 768 ? '8px 12px' : '10px 14px',
                  border: '2px solid #e1e8ed',
                  borderRadius: 8,
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  color: '#333',
                  backgroundColor: '#fff',
                  outline: 'none',
                  minWidth: window.innerWidth < 768 ? '100%' : 180,
                  width: window.innerWidth < 768 ? '100%' : 'auto'
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
                  color: '#fff', 
                  border: 0, 
                  padding: window.innerWidth < 768 ? '8px 16px' : '10px 20px', 
                  borderRadius: 8,
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  width: window.innerWidth < 768 ? '100%' : 'auto'
                }}
              >
                🔓 Login
              </button>
              {adminMsg && (
                <span style={{ 
                  color: adminMsg.includes('enabled') ? '#27ae60' : '#e74c3c', 
                  marginLeft: window.innerWidth < 768 ? 0 : 8,
                  marginTop: window.innerWidth < 768 ? 8 : 0,
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  {adminMsg}
                </span>
              )}
            </form>
          ) : (
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              alignItems: 'center', 
              flexWrap: 'wrap',
              flexDirection: window.innerWidth < 768 ? 'column' : 'row'
            }}>
              <button 
                onClick={handleDownload} 
                disabled={downloading} 
                style={{ 
                  background: downloading ? '#95a5a6' : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  color: '#fff', 
                  border: 0, 
                  padding: window.innerWidth < 768 ? '10px 20px' : '12px 24px', 
                  borderRadius: 8,
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)',
                  width: window.innerWidth < 768 ? '100%' : 'auto'
                }}
              >
                {downloading ? '📥 Downloading...' : '📊 Download Excel'}
              </button>
              <button 
                onClick={() => { 
                  setAdminMode(false); 
                  setAdminPw(''); 
                  setAdminMsg(''); 
                }} 
                style={{ 
                  background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                  color: '#fff', 
                  border: 0, 
                  padding: window.innerWidth < 768 ? '10px 20px' : '12px 20px', 
                  borderRadius: 8,
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  width: window.innerWidth < 768 ? '100%' : 'auto'
                }}
              >
                🚪 Logout
              </button>
              {adminMsg && (
                <span style={{ 
                  color: adminMsg.includes('enabled') ? '#27ae60' : '#e74c3c', 
                  marginLeft: window.innerWidth < 768 ? 0 : 8,
                  marginTop: window.innerWidth < 768 ? 8 : 0,
                  fontSize: window.innerWidth < 768 ? '12px' : '14px',
                  fontWeight: '500',
                  textAlign: 'center'
                }}>
                  {adminMsg}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Right: Summary & Who brings what */}
      <div style={{
        display: isMobile ? (activeTab === 'summary' ? 'flex' : 'none') : 'flex',
        flex: isMobile ? 'none' : 1,
        flexDirection: 'column',
        padding: isMobile ? '0.5rem' : '1.5rem',
        margin: isMobile ? '0' : '0 0 0 0.5rem',
        background: '#ffffff',
        borderRadius: isMobile ? 0 : 12,
        boxShadow: isMobile ? 'none' : '0 8px 32px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        minWidth: isMobile ? '0' : '500px',
        width: isMobile ? '100%' : 'auto',
        maxWidth: isMobile ? '100%' : '100vw',
        height: '100vh',
        boxSizing: 'border-box'
      }}>
        <div style={{ flex: 1, marginBottom: '1rem' }}>
          <h2 style={{ 
            color: '#2c3e50', 
            marginBottom: '1rem', 
            fontSize: window.innerWidth < 768 ? '1.5rem' : '1.8rem', 
            fontWeight: '600',
            textAlign: 'center'
          }}>📊 Summary</h2>
          {loading ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#7f8c8d',
              fontSize: '16px'
            }}>
              Loading...
            </div>
          ) : (
            <div style={{ 
              background: '#f8f9fa',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: window.innerWidth < 768 ? '12px 16px' : '16px 20px',
                      color: '#ffffff',
                      fontSize: window.innerWidth < 768 ? '14px' : '16px',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}>Category</th>
                    <th style={{ 
                      textAlign: 'center', 
                      padding: window.innerWidth < 768 ? '12px 16px' : '16px 20px',
                      color: '#ffffff',
                      fontSize: window.innerWidth < 768 ? '14px' : '16px',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}>Per Qty</th>
                    <th style={{ 
                      textAlign: 'right', 
                      padding: window.innerWidth < 768 ? '12px 16px' : '16px 20px',
                      color: '#ffffff',
                      fontSize: window.innerWidth < 768 ? '14px' : '16px',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}>Total Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {CATEGORY_NAMES.map((baseName, i) => {
                    const items = entries.filter(e => normalizeCategory(e.category) === baseName);
                    const total = items.reduce((sum, e) => sum + (e.quantity || 0), 0);
                    return (
                      <tr key={baseName} style={{ 
                        background: i % 2 === 0 ? '#ffffff' : '#f1f3f4',
                        borderBottom: '1px solid #e9ecef'
                      }}>
                        <td style={{ padding: window.innerWidth < 768 ? '10px 16px' : '14px 20px', color: '#2c3e50', fontSize: window.innerWidth < 768 ? '13px' : '15px', fontWeight: '500' }}>{baseName}</td>
                        <td style={{ padding: window.innerWidth < 768 ? '10px 16px' : '14px 20px', color: '#2c3e50', fontSize: window.innerWidth < 768 ? '13px' : '15px', fontWeight: '500', textAlign: 'center' }}>{CATEGORY_PER_QTY[i]}</td>
                        <td style={{ padding: window.innerWidth < 768 ? '10px 16px' : '14px 20px', textAlign: 'right', color: '#2c3e50', fontSize: window.innerWidth < 768 ? '13px' : '15px', fontWeight: '600' }}>{`${total} / ${maxQtyNums[i]}`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {/* Bottom: Who brings what */}
        <div style={{ flex: 1, marginBottom: isMobile ? '0.5rem' : '2rem' }}>
          <h3 style={{ 
            color: '#2c3e50', 
            marginBottom: '1rem', 
            fontSize: window.innerWidth < 768 ? '1.2rem' : '1.4rem', 
            fontWeight: '600',
            textAlign: 'center'
          }}>👥 Who brings what?</h3>
          {entries.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: isMobile ? '1.2rem' : '2rem',
              color: '#7f8c8d',
              fontSize: isMobile ? '14px' : '16px',
              background: '#f8f9fa',
              borderRadius: 12,
              border: '2px dashed #dee2e6'
            }}>
              No entries yet. Be the first to add your dish! 🎉
            </div>
          ) : (
            <div style={{ background: '#f8f9fa', borderRadius: 12, boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', position: 'sticky', top: 0 }}>
                    <th style={{ 
                      padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px',
                      color: '#ffffff',
                      fontSize: window.innerWidth < 768 ? '12px' : '14px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}>Name</th>
                    <th style={{ 
                      padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px',
                      color: '#ffffff',
                      fontSize: window.innerWidth < 768 ? '12px' : '14px',
                      fontWeight: '600',
                      textAlign: 'left',
                      display: window.innerWidth < 480 ? 'none' : 'table-cell'
                    }}>Category</th>
                    <th style={{ 
                      padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px',
                      color: '#ffffff',
                      fontSize: window.innerWidth < 768 ? '12px' : '14px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}>Dish</th>
                    <th style={{ 
                      padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px',
                      color: '#ffffff',
                      fontSize: window.innerWidth < 768 ? '12px' : '14px',
                      fontWeight: '600',
                      textAlign: 'right'
                    }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const reversed = entries.slice().reverse();
                    const start = (page - 1) * pageSize;
                    const pageItems = reversed.slice(start, start + pageSize);
                    return pageItems.map((e, i) => {
                      const originalIndex = entries.length - 1 - (start + i);
                      return (
                        <tr key={originalIndex} style={{ 
                          background: (start + i) % 2 === 0 ? '#ffffff' : '#f1f3f4',
                          borderBottom: '1px solid #e9ecef'
                        }}>
                          {editIdx === originalIndex ? (
                            <>
                              <td style={{ padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px' }}>
                                <input value={editEntry?.name || ''} onChange={ev => setEditEntry(editEntry ? { ...editEntry, name: ev.target.value } : null)} style={{ width: '100%' }} />
                              </td>
                              <td style={{ padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px', display: window.innerWidth < 480 ? 'none' : 'table-cell' }}>
                                <select value={editEntry ? normalizeCategory(editEntry.category) : ''} onChange={ev => setEditEntry(editEntry ? { ...editEntry, category: ev.target.value } : null)} style={{ width: '100%' }}>
                                  {CATEGORY_NAMES.map(c => <option key={c}>{c}</option>)}
                                </select>
                              </td>
                              <td style={{ padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px' }}>
                                <input value={editEntry?.dish || ''} onChange={ev => setEditEntry(editEntry ? { ...editEntry, dish: ev.target.value } : null)} style={{ width: '100%' }} />
                              </td>
                              <td style={{ padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px', textAlign: 'right' }}>
                                <input type="number" min={1} value={editEntry?.quantity || 1} onChange={ev => setEditEntry(editEntry ? { ...editEntry, quantity: Number(ev.target.value) } : null)} style={{ width: 60 }} />
                              </td>
                              {adminMode && (
                                <td colSpan={2} style={{ padding: 4, textAlign: 'right' }}>
                                  <button onClick={() => handleEditSave(originalIndex)} style={{ marginRight: 8, background: '#27ae60', color: '#fff', border: 0, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Save</button>
                                  <button onClick={handleEditCancel} style={{ background: '#e74c3c', color: '#fff', border: 0, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Cancel</button>
                                </td>
                              )}
                            </>
                          ) : (
                            <>
                              <td style={{ 
                                padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px',
                                color: '#2c3e50',
                                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                                fontWeight: '500'
                              }}>{e.name}</td>
                              <td style={{ 
                                padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px',
                                color: '#34495e',
                                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                                display: window.innerWidth < 480 ? 'none' : 'table-cell'
                              }}>{normalizeCategory(e.category)}</td>
                              <td style={{ 
                                padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px',
                                color: '#2c3e50',
                                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                                fontWeight: '500'
                              }}>{e.dish}</td>
                              <td style={{ 
                                padding: window.innerWidth < 768 ? '8px 12px' : '12px 16px', 
                                textAlign: 'right',
                                color: '#e74c3c',
                                fontSize: window.innerWidth < 768 ? '12px' : '14px',
                                fontWeight: '600'
                              }}>{e.quantity}</td>
                              {adminMode && (
                                <td style={{ padding: 4, textAlign: 'right' }}>
                                  <button onClick={() => handleEditStart(originalIndex)} style={{ marginRight: 8, background: '#2980b9', color: '#fff', border: 0, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Edit</button>
                                  <button onClick={() => handleDelete(originalIndex)} style={{ background: '#e74c3c', color: '#fff', border: 0, borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}>Delete</button>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
              {/* Pagination controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{
                  background: page === 1 ? '#bdc3c7' : 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
                  color: '#fff', border: 0, padding: '6px 12px', borderRadius: 6, cursor: page === 1 ? 'not-allowed' : 'pointer'
                }}>Prev</button>
                <span style={{ fontSize: 12, color: '#2c3e50' }}>Page {page} of {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{
                  background: page === totalPages ? '#bdc3c7' : 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
                  color: '#fff', border: 0, padding: '6px 12px', borderRadius: 6, cursor: page === totalPages ? 'not-allowed' : 'pointer'
                }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
