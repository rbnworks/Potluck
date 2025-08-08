
import React, { useEffect, useState } from 'react';
import './App.css';

const CATEGORIES = [
  'Starters',
  'Veg curry',
  'Non-veg Curry',
  'Chapatis/Naan/Roti (Breads)',
  'Rice Items',
  'Sweets',
];

type Entry = {
  name: string;
  category: string;
  dish: string;
  quantity: number;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

function App() {
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
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

  // Summary by category
  const summary = CATEGORIES.map(cat => {
    const items = entries.filter(e => e.category === cat);
    const total = items.reduce((sum, e) => sum + (e.quantity || 0), 0);
    return { cat, total, items };
  });

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#333'
    }}>
      {/* Left: Entry Form */}
      <div style={{ 
        flex: 1, 
        padding: '1.5rem', 
        background: '#ffffff',
        margin: '1rem 0.5rem 1rem 1rem',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflowY: 'auto'
      }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: '600' }}>🍽️ Add Your Dish</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input 
            required 
            placeholder="Your Name" 
            value={name} 
            onChange={e => setName(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: 8,
              fontSize: '16px',
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
              padding: '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: 8,
              fontSize: '16px',
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none'
            }}
          >
            {CATEGORIES.map(c => <option key={c} style={{ color: '#333' }}>{c}</option>)}
          </select>
          <input 
            required 
            placeholder="Dish Name" 
            value={dish} 
            onChange={e => setDish(e.target.value)}
            style={{
              padding: '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: 8,
              fontSize: '16px',
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none'
            }}
          />
          <input 
            required 
            type="number" 
            min={1} 
            placeholder="Quantity" 
            value={quantity} 
            onChange={e => setQuantity(Number(e.target.value))}
            style={{
              padding: '12px 16px',
              border: '2px solid #e1e8ed',
              borderRadius: 8,
              fontSize: '16px',
              color: '#333',
              backgroundColor: '#fff',
              outline: 'none'
            }}
          />
          <button 
            type="submit" 
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff', 
              border: 0, 
              padding: '14px 24px', 
              borderRadius: 8,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
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
      </div>

      {/* Right: Summary & Admin */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '1.5rem',
        margin: '1rem 1rem 1rem 0.5rem',
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        overflowY: 'auto'
      }}>
        <div style={{ flex: 1, marginBottom: '2rem' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: '600' }}>📊 Summary</h2>
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
                      padding: '16px 20px',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}>Category</th>
                    <th style={{ 
                      textAlign: 'right', 
                      padding: '16px 20px',
                      color: '#ffffff',
                      fontSize: '16px',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}>Total Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.map((s, idx) => (
                    <tr key={s.cat} style={{ 
                      background: idx % 2 === 0 ? '#ffffff' : '#f1f3f4',
                      borderBottom: '1px solid #e9ecef'
                    }}>
                      <td style={{ 
                        padding: '14px 20px',
                        color: '#2c3e50',
                        fontSize: '15px',
                        fontWeight: '500'
                      }}>{s.cat}</td>
                      <td style={{ 
                        padding: '14px 20px', 
                        textAlign: 'right',
                        color: '#2c3e50',
                        fontSize: '15px',
                        fontWeight: '600'
                      }}>{s.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom: Who brings what */}
        <div style={{ flex: 1, marginBottom: '2rem' }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.4rem', fontWeight: '600' }}>👥 Who brings what?</h3>
          {entries.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#7f8c8d',
              fontSize: '16px',
              background: '#f8f9fa',
              borderRadius: 12,
              border: '2px dashed #dee2e6'
            }}>
              No entries yet. Be the first to add your dish! 🎉
            </div>
          ) : (
            <div style={{ 
              maxHeight: 280, 
              overflowY: 'auto',
              background: '#f8f9fa',
              borderRadius: 12,
              boxShadow: '0 4px 15px rgba(0,0,0,0.08)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)', position: 'sticky', top: 0 }}>
                    <th style={{ 
                      padding: '12px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}>Name</th>
                    <th style={{ 
                      padding: '12px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}>Category</th>
                    <th style={{ 
                      padding: '12px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'left'
                    }}>Dish</th>
                    <th style={{ 
                      padding: '12px 16px',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'right'
                    }}>Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e, i) => (
                    <tr key={i} style={{ 
                      background: i % 2 === 0 ? '#ffffff' : '#f1f3f4',
                      borderBottom: '1px solid #e9ecef'
                    }}>
                      <td style={{ 
                        padding: '12px 16px',
                        color: '#2c3e50',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>{e.name}</td>
                      <td style={{ 
                        padding: '12px 16px',
                        color: '#34495e',
                        fontSize: '14px'
                      }}>{e.category}</td>
                      <td style={{ 
                        padding: '12px 16px',
                        color: '#2c3e50',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>{e.dish}</td>
                      <td style={{ 
                        padding: '12px 16px', 
                        textAlign: 'right',
                        color: '#e74c3c',
                        fontSize: '14px',
                        fontWeight: '600'
                      }}>{e.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Admin actions */}
        <div style={{ 
          borderTop: '2px solid #ecf0f1',
          paddingTop: '1.5rem'
        }}>
          <h3 style={{ color: '#2c3e50', marginBottom: '1rem', fontSize: '1.4rem', fontWeight: '600' }}>🔐 Admin Panel</h3>
          {!adminMode ? (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="password" 
                placeholder="Admin password" 
                value={adminPw} 
                onChange={e => setAdminPw(e.target.value)}
                style={{
                  padding: '10px 14px',
                  border: '2px solid #e1e8ed',
                  borderRadius: 8,
                  fontSize: '14px',
                  color: '#333',
                  backgroundColor: '#fff',
                  outline: 'none',
                  minWidth: 180
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  background: 'linear-gradient(135deg, #34495e 0%, #2c3e50 100%)',
                  color: '#fff', 
                  border: 0, 
                  padding: '10px 20px', 
                  borderRadius: 8,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
              >
                🔓 Login
              </button>
              {adminMsg && (
                <span style={{ 
                  color: adminMsg.includes('enabled') ? '#27ae60' : '#e74c3c', 
                  marginLeft: 8,
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {adminMsg}
                </span>
              )}
            </form>
          ) : (
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={handleDownload} 
                disabled={downloading} 
                style={{ 
                  background: downloading ? '#95a5a6' : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                  color: '#fff', 
                  border: 0, 
                  padding: '12px 24px', 
                  borderRadius: 8,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: downloading ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)'
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
                  padding: '12px 20px', 
                  borderRadius: 8,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease'
                }}
              >
                🚪 Logout
              </button>
              {adminMsg && (
                <span style={{ 
                  color: adminMsg.includes('enabled') ? '#27ae60' : '#e74c3c', 
                  marginLeft: 8,
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {adminMsg}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
