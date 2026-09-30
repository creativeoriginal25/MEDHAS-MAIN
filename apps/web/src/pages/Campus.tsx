import React, { useState, useEffect } from 'react';
import { campusApi } from '../api/client';
import { 
  Building2, 
  Coffee, 
  Phone, 
  BookOpen, 
  HeartPulse, 
  Bus, 
  ExternalLink,
  Tag
} from 'lucide-react';

const CAFETERIA_CATEGORIES = [
  'All',
  'Breakfast',
  'Beverages & Juices',
  'Quick Bites & Snacks',
  'Lunch Specials',
  'Desserts'
];

const DEMO_CAFETERIA_ITEMS = [
  { id: 1, name: 'South Indian Masala Dosa', category: 'Breakfast', price: 45, is_veg: true, description: 'Crispy fermented crepe stuffed with spiced potato masala and served with coconut chutney & sambar.' },
  { id: 2, name: 'Ghee Idli Sambhar (2 Pcs)', category: 'Breakfast', price: 35, is_veg: true, description: 'Steamed rice cakes drenched in piping hot spiced lentil sambar and pure desi ghee.' },
  { id: 3, name: 'Filter Coffee', category: 'Beverages & Juices', price: 20, is_veg: true, description: 'Traditional South Indian brass-filtered frothy aromatic coffee.' },
  { id: 4, name: 'Chilled Badam Milk', category: 'Beverages & Juices', price: 30, is_veg: true, description: 'Sweetened almond milk enriched with saffron and crushed pistachios.' },
  { id: 5, name: 'Veg Samosa (2 Pcs)', category: 'Quick Bites & Snacks', price: 25, is_veg: true, description: 'Golden flaky pastries filled with green peas, potatoes, and cumin.' },
  { id: 6, name: 'Paneer Butter Masala Roll', category: 'Quick Bites & Snacks', price: 60, is_veg: true, description: 'Whole wheat wrap stuffed with spiced cottage cheese cubes in rich creamy gravy.' },
  { id: 7, name: 'Executive Veg Thali', category: 'Lunch Specials', price: 90, is_veg: true, description: 'Full meal served with 2 rotis, paneer curry, dal tadka, jeera rice, curd, and papad.' },
  { id: 8, name: 'Chicken Dum Biryani', category: 'Lunch Specials', price: 130, is_veg: false, description: 'Fragrant basmati rice slow-cooked with tender marinated chicken pieces and spices.' },
  { id: 9, name: 'Gulab Jamun (2 Pcs)', category: 'Desserts', price: 30, is_veg: true, description: 'Warm khoya dumplings soaked in fragrant cardamom rose syrup.' },
];

export const Campus: React.FC = () => {
  const [subTab, setSubTab] = useState<'cafeteria' | 'services'>('cafeteria');
  const [services, setServices] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [items, setItems] = useState(DEMO_CAFETERIA_ITEMS);

  useEffect(() => {
    campusApi.getServices().then(setServices).catch(console.error);
  }, []);

  const filteredItems = selectedCategory === 'All' 
    ? items 
    : items.filter(i => i.category === selectedCategory);

  return (
    <div>
      {/* Sub Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.75rem',
      }}>
        <button
          className={`btn btn-sm ${subTab === 'cafeteria' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSubTab('cafeteria')}
        >
          <Coffee size={16} />
          <span>NutriDelight Cafeteria</span>
        </button>

        <button
          className={`btn btn-sm ${subTab === 'services' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setSubTab('services')}
        >
          <Building2 size={16} />
          <span>Campus Services & Contacts</span>
        </button>
      </div>

      {/* SUB-VIEW 1: CAFETERIA */}
      {subTab === 'cafeteria' && (
        <div>
          {/* Cafeteria Notice Banner */}
          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem', borderLeft: '4px solid #f43f5e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Coffee size={20} style={{ color: '#f43f5e' }} />
                  NutriDelight College Cafeteria Catalog
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Live menu and price catalog. Timings: 7:30 AM – 7:00 PM (Monday to Saturday).
                </p>
              </div>
              <span className="badge badge-neutral" style={{ color: 'var(--status-good)' }}>
                ● Open Now
              </span>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1.25rem',
          }}>
            {CAFETERIA_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className="btn btn-sm"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: selectedCategory === cat ? 'var(--primary)' : 'var(--bg-surface)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                  border: selectedCategory === cat ? 'none' : '1px solid var(--border-subtle)',
                  whiteSpace: 'nowrap',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            {filteredItems.map((item) => (
              <div key={item.id} className="metric-card glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '2px',
                        border: `1.5px solid ${item.is_veg ? '#10b981' : '#ef4444'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <span style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: item.is_veg ? '#10b981' : '#ef4444',
                        }} />
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {item.category}
                      </span>
                    </div>

                    <span className="mono-num" style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-light)' }}>
                      ₹{item.price}
                    </span>
                  </div>

                  <h4 style={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
                    {item.name}
                  </h4>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.4 }}>
                    {item.description}
                  </p>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    NutriDelight Main Counter
                  </span>
                  <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
                    Available
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CAMPUS SERVICES & HELPLINES */}
      {subTab === 'services' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Emergency Contacts Banner */}
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid var(--accent-gold)' }}>
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Phone size={18} style={{ color: 'var(--accent-gold)' }} />
              Important Campus Helplines
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Exam Section Helpdesk</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>+91 8816 223344</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Student Affairs & Discipline</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>+91 8816 223355</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Campus Health Clinic</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>+91 8816 223366</div>
              </div>
            </div>
          </div>

          {/* College Services Directory */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1rem',
          }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <BookOpen size={24} style={{ color: 'var(--primary-light)', marginBottom: '0.5rem' }} />
              <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Central Library</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Open 8:00 AM – 8:00 PM. Digital library access, IEEE Xplore, DELNET subscriptions.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <HeartPulse size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
              <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Dispensary & Health Care</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Full-time campus medical officer, emergency first aid, ambulance on standby.
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <Bus size={24} style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem' }} />
              <h4 style={{ fontWeight: 700, fontSize: '1rem' }}>Campus Transportation</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Buses covering Bhimavaram, Tanuku, Palakollu, Tadepalligudem, and Narasapuram.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
