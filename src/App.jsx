import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, PlusCircle, CheckCircle2, XCircle,
  AlertTriangle, Download, Lock, Unlock, Edit2, Trash2,
  ArrowUpDown, ChevronUp, ChevronDown, X, RefreshCw,
  TrendingUp, Calendar, Coins, Trophy, ArrowRightLeft
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────
const START_DATE = new Date('2026-05-02T00:00:00');
const DAILY_AMOUNT = 1000; // ₦ per hand per day
const FINE_AMOUNT = 500;
const DEFAULT_PASSWORD = '3914';
const STORAGE_KEYS = {
  payments: 'ajo_payments_v2',
  order: 'ajo_order_v2',
  password: 'ajo_password_v2',
  fines: 'ajo_fines_v2',
  defaults: 'ajo_defaults_v2',
};

const INITIAL_HANDS = [
  { no: 1, name: "Mummy David 1" }, { no: 2, name: "ID 1" }, { no: 3, name: "Sis Esther 1" },
  { no: 4, name: "Mr Akeem" }, { no: 5, name: "Sis Esther 2" }, { no: 6, name: "Mrs Dosu" },
  { no: 7, name: "T&K 1" }, { no: 8, name: "Mummy Ola 1" }, { no: 9, name: "Bidex 1" },
  { no: 10, name: "Sis Esther 3" }, { no: 11, name: "T&K 2" }, { no: 12, name: "Mummy Aishat" },
  { no: 13, name: "ID 2" }, { no: 14, name: "Bidex 2" }, { no: 15, name: "Mummy David 2" },
  { no: 16, name: "Mr Habeeb" }, { no: 17, name: "Mrs Abiola 1" }, { no: 18, name: "Sis Tomi 1" },
  { no: 19, name: "Mrs Abiola 2" }, { no: 20, name: "Esther 1" }, { no: 21, name: "Mummy Ola 2" },
  { no: 22, name: "Sis Tomi 2" }, { no: 23, name: "Sis Tomi 3" }, { no: 24, name: "ID 3" },
  { no: 25, name: "Esther 2" }, { no: 26, name: "Mummy Awal" }, { no: 27, name: "Sis Tomi 4" },
  { no: 28, name: "Mathew" }, { no: 29, name: "Mrs Abiola 3" }, { no: 30, name: "T&K 3" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n) => '₦' + Number(n).toLocaleString('en-NG');
const dayKey = (date) => date.toISOString().slice(0, 10);
const today = () => new Date();
const todayKey = () => dayKey(today());
const isAfter8pm = () => today().getHours() >= 20;

function getDaysElapsed() {
  const now = today();
  const diff = Math.floor((now - START_DATE) / 86400000);
  return Math.max(0, diff);
}

function getCollectorForDay(dayIndex, order) {
  // dayIndex is 0-based from start
  if (dayIndex < 0 || dayIndex >= order.length) return null;
  return order[dayIndex];
}

function loadLS(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}
function saveLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Pill({ children, variant = 'default' }) {
  const cls = {
    default: 'bg-[#2a2a2a] text-[#a3a3a3]',
    green: 'bg-accent/10 text-accent border border-accent/20',
    red: 'bg-red-500/10 text-red-400 border border-red-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  }[variant];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${cls}`}>{children}</span>;
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="card p-5 flex flex-col gap-2 animate-slide-up">
      <div className="flex items-center justify-between">
        <span className="text-[#6b7280] text-xs font-medium uppercase tracking-wider">{label}</span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent ? 'bg-accent/10' : 'bg-[#2a2a2a]'}`}>
          <Icon size={15} className={accent ? 'text-accent' : 'text-[#6b7280]'} />
        </div>
      </div>
      <div className="font-display text-2xl text-white">{value}</div>
      {sub && <div className="text-xs text-[#6b7280]">{sub}</div>}
    </div>
  );
}

function ProgressBar({ pct }) {
  return (
    <div className="w-full bg-[#2a2a2a] rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-accent rounded-full transition-all duration-700"
        style={{ width: `${Math.min(100, pct)}%` }}
      />
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#141414] border border-[#2a2a2a] rounded-3xl w-full max-w-md max-h-[90dvh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
          <h3 className="font-display text-lg text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#2a2a2a] transition-colors">
            <X size={16} className="text-[#6b7280]" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function PasswordGate({ onUnlock, onClose }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState(false);
  const stored = loadLS(STORAGE_KEYS.password, DEFAULT_PASSWORD);

  const attempt = () => {
    if (pw === stored) { onUnlock(); }
    else { setErr(true); setPw(''); }
  };
  return (
    <Modal open onClose={onClose} title="Admin Access">
      <div className="flex flex-col gap-4">
        <p className="text-[#6b7280] text-sm">Enter admin password to log payments.</p>
        <input
          type="password"
          className={`input ${err ? 'border-red-500' : ''}`}
          placeholder="Password"
          value={pw}
          autoFocus
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === 'Enter' && attempt()}
        />
        {err && <p className="text-red-400 text-xs">Incorrect password</p>}
        <button className="btn-primary w-full" onClick={attempt}>Unlock</button>
      </div>
    </Modal>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function Dashboard({ payments, order, fines, defaults }) {
  const daysElapsed = getDaysElapsed();
  const totalDays = INITIAL_HANDS.length; // 30 hands = 30 days cycle
  const todayIdx = daysElapsed;
  const todayCollector = getCollectorForDay(todayIdx, order);
  const todayCollectorHand = INITIAL_HANDS.find(h => h.no === todayCollector);

  // Calculate totals
  const allPayments = Object.values(payments).flat();
  const totalCollected = allPayments.reduce((s, p) => s + (p.amount || 0), 0);
  const totalFines = Object.values(fines).reduce((s, f) => s + f, 0);
  const defaultCount = Object.keys(defaults).length;
  const pct = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

  // Today's stats
  const todayPmts = payments[todayKey()] || [];
  const todayTotal = todayPmts.reduce((s, p) => s + (p.amount || 0), 0);

  // Recent activity (last 5 payments across all days)
  const recentPmts = Object.entries(payments)
    .flatMap(([date, pmts]) => pmts.map(p => ({ ...p, date })))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Today's collector hero */}
      {todayCollectorHand && (
        <div className="card p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs text-[#6b7280] uppercase tracking-widest font-medium">Today's Collector</span>
                <h2 className="font-display text-3xl text-white mt-1">{todayCollectorHand.name}</h2>
                <p className="text-[#6b7280] text-sm mt-1">Hand #{todayCollectorHand.no} · Day {daysElapsed + 1}</p>
              </div>
              <div className="text-4xl select-none">🎉</div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar pct={pct} />
                <div className="flex justify-between mt-1.5 text-xs text-[#6b7280]">
                  <span>Day {daysElapsed} of {totalDays}</span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={Coins} label="Total Collected" value={fmt(totalCollected)} sub="All time" accent />
        <StatCard icon={Calendar} label="Days Elapsed" value={daysElapsed} sub={`of ${totalDays} days`} />
        <StatCard icon={TrendingUp} label="Today's Total" value={fmt(todayTotal)} sub={`${todayPmts.length} payment${todayPmts.length !== 1 ? 's' : ''}`} />
        <StatCard icon={AlertTriangle} label="Total Fines" value={fmt(totalFines)} sub={`${defaultCount} default${defaultCount !== 1 ? 's' : ''}`} />
      </div>

      {/* Expected payout for today's collector */}
      {todayCollectorHand && (() => {
        const handFines = fines[todayCollector] || 0;
        const expectedPayout = (INITIAL_HANDS.length * DAILY_AMOUNT) - handFines;
        return (
          <div className="card2 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-[#6b7280] uppercase tracking-wider mb-1">Expected Payout Today</p>
              <p className="font-display text-xl text-white">{fmt(expectedPayout)}</p>
              {handFines > 0 && (
                <p className="text-xs text-red-400 mt-0.5">−{fmt(handFines)} fines deducted</p>
              )}
            </div>
            <Trophy size={28} className="text-accent opacity-60" />
          </div>
        );
      })()}

      {/* Recent Activity */}
      {recentPmts.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="flex flex-col gap-2">
            {recentPmts.map((p, i) => {
              const hand = INITIAL_HANDS.find(h => h.no === p.handNo);
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#1e1e1e] last:border-0">
                  <div>
                    <p className="text-sm text-white font-medium">{hand?.name || `Hand #${p.handNo}`}</p>
                    <p className="text-xs text-[#6b7280]">{p.date} · {p.note || 'Payment'}</p>
                  </div>
                  <span className="font-mono text-accent text-sm font-medium">+{fmt(p.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hands Tab ────────────────────────────────────────────────────────────────
function HandsTab({ payments, order, setOrder, fines, setFines, defaults, setDefaults }) {
  const [swapMode, setSwapMode] = useState(false);
  const [swapA, setSwapA] = useState(null);
  const [showSwap, setShowSwap] = useState(false);

  const daysElapsed = getDaysElapsed();
  const after8 = isAfter8pm();

  // Compute paid days per hand
  const getPaidDays = (handNo) => {
    return Object.values(payments)
      .flat()
      .filter(p => p.handNo === handNo)
      .length;
  };

  // Check if hand paid today
  const paidToday = (handNo) => {
    const tp = payments[todayKey()] || [];
    return tp.some(p => p.handNo === handNo);
  };

  // Default check: after 8pm, not paid today, and day has elapsed
  const isDefaulted = (handNo) => {
    if (daysElapsed === 0 && !after8) return false;
    return after8 && !paidToday(handNo);
  };

  const handleSwapSelect = (handNo) => {
    if (!swapA) {
      setSwapA(handNo);
      toast('Select second hand to swap with', { icon: '🔄' });
    } else if (swapA === handNo) {
      setSwapA(null);
    } else {
      // Perform swap
      const newOrder = [...order];
      const iA = newOrder.indexOf(swapA);
      const iB = newOrder.indexOf(handNo);
      if (iA !== -1 && iB !== -1) {
        [newOrder[iA], newOrder[iB]] = [newOrder[iB], newOrder[iA]];
        setOrder(newOrder);
        saveLS(STORAGE_KEYS.order, newOrder);
        toast.success(`Swapped positions ${iA + 1} & ${iB + 1}`);
      }
      setSwapA(null);
      setSwapMode(false);
    }
  };

  const moveToEnd = (handNo) => {
    const newOrder = order.filter(n => n !== handNo);
    newOrder.push(handNo);
    setOrder(newOrder);
    saveLS(STORAGE_KEYS.order, newOrder);
    toast.success('Moved to end of cycle');
  };

  // Auto-move double-defaulters to end
  useEffect(() => {
    const dbl = Object.entries(defaults).filter(([, v]) => v >= 2).map(([k]) => Number(k));
    dbl.forEach(handNo => {
      const idx = order.indexOf(handNo);
      const lastTwo = order.slice(-2);
      if (idx !== -1 && !lastTwo.includes(handNo)) {
        moveToEnd(handNo);
        toast(`Hand #${handNo} moved to end (2 defaults)`, { icon: '⚠️' });
      }
    });
  }, [defaults]);

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-white">All Hands <span className="text-[#6b7280] font-sans text-base font-normal">({INITIAL_HANDS.length})</span></h2>
        <button
          onClick={() => { setSwapMode(!swapMode); setSwapA(null); }}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${swapMode ? 'bg-accent text-black' : 'btn-ghost'}`}
        >
          <ArrowRightLeft size={13} />
          {swapMode ? 'Cancel Swap' : 'Swap Order'}
        </button>
      </div>

      {swapMode && (
        <div className="card2 p-3 text-xs text-[#6b7280] flex items-center gap-2">
          <ArrowRightLeft size={13} className="text-accent shrink-0" />
          {swapA ? `Selected Hand #${swapA}. Now tap the hand to swap with.` : 'Tap any two hands to swap their payout positions.'}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {order.map((handNo, posIdx) => {
          const hand = INITIAL_HANDS.find(h => h.no === handNo);
          if (!hand) return null;
          const paidDays = getPaidDays(handNo);
          const paid = paidToday(handNo);
          const defaulted = isDefaulted(handNo);
          const handFines = fines[handNo] || 0;
          const defaultCount = defaults[handNo] || 0;
          const isToday = posIdx === daysElapsed;
          const isPast = posIdx < daysElapsed;
          const isSelected = swapA === handNo;

          const payoutDate = new Date(START_DATE);
          payoutDate.setDate(payoutDate.getDate() + posIdx);
          const dateStr = payoutDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

          return (
            <div
              key={handNo}
              onClick={swapMode ? () => handleSwapSelect(handNo) : undefined}
              className={`card2 p-4 transition-all duration-200
                ${swapMode ? 'cursor-pointer hover:border-accent/50' : ''}
                ${isSelected ? 'border-accent ring-1 ring-accent' : ''}
                ${isToday ? 'border-accent/40 bg-accent/5' : ''}
              `}
            >
              <div className="flex items-center gap-3">
                {/* Position number */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-mono font-medium shrink-0
                  ${isToday ? 'bg-accent text-black' : isPast ? 'bg-[#2a2a2a] text-[#6b7280]' : 'bg-[#2a2a2a] text-[#a3a3a3]'}
                `}>
                  {posIdx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-medium text-sm truncate">{hand.name}</span>
                    {isToday && <Pill variant="green">Today 🎉</Pill>}
                    {defaultCount >= 2 && <Pill variant="red">2× default</Pill>}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-[#6b7280]">#{hand.no} · {dateStr}</span>
                    <span className="text-xs text-[#6b7280]">{paidDays}d paid</span>
                    {handFines > 0 && <span className="text-xs text-red-400">Fine: {fmt(handFines)}</span>}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {paid ? (
                    <CheckCircle2 size={18} className="text-accent" />
                  ) : defaulted ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <XCircle size={18} className="text-red-400" />
                      <span className="text-[10px] text-red-400 font-medium">+{fmt(FINE_AMOUNT)} fine</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-[#3a3a3a]" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Log Payment Tab ──────────────────────────────────────────────────────────
function LogPaymentTab({ payments, setPayments, fines, setFines, defaults, setDefaults, order }) {
  const [unlocked, setUnlocked] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [form, setForm] = useState({ handNo: '', amount: DAILY_AMOUNT, note: '', date: todayKey() });
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showChangePw, setShowChangePw] = useState(false);
  const [newPw, setNewPw] = useState('');
  const [filterDate, setFilterDate] = useState(todayKey());

  const daysElapsed = getDaysElapsed();

  const handleSubmit = () => {
    if (!form.handNo) return toast.error('Select a hand');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter valid amount');

    const payment = {
      id: Date.now(),
      handNo: Number(form.handNo),
      amount: Number(form.amount),
      note: form.note,
      timestamp: new Date().toISOString(),
    };

    const dateKey = form.date || todayKey();
    const updated = { ...payments };
    if (!updated[dateKey]) updated[dateKey] = [];

    if (editingId) {
      updated[dateKey] = updated[dateKey].map(p => p.id === editingId ? { ...payment, id: editingId } : p);
      setEditingId(null);
      toast.success('Payment updated');
    } else {
      updated[dateKey] = [...updated[dateKey], payment];
      toast.success(`Logged ${fmt(payment.amount)} for ${INITIAL_HANDS.find(h => h.no === Number(form.handNo))?.name}`);
    }

    setPayments(updated);
    saveLS(STORAGE_KEYS.payments, updated);
    setForm({ handNo: '', amount: DAILY_AMOUNT, note: '', date: todayKey() });
  };

  const startEdit = (p, date) => {
    setEditingId(p.id);
    setForm({ handNo: String(p.handNo), amount: p.amount, note: p.note || '', date });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deletePayment = (id, date) => {
    const updated = { ...payments };
    updated[date] = (updated[date] || []).filter(p => p.id !== id);
    if (updated[date].length === 0) delete updated[date];
    setPayments(updated);
    saveLS(STORAGE_KEYS.payments, updated);
    setDeleteConfirm(null);
    toast.success('Payment deleted');
  };

  const markDefault = (handNo, date) => {
    // Add fine
    const updFines = { ...fines, [handNo]: (fines[handNo] || 0) + FINE_AMOUNT };
    setFines(updFines);
    saveLS(STORAGE_KEYS.fines, updFines);

    // Track defaults
    const updDef = { ...defaults, [handNo]: (defaults[handNo] || 0) + 1 };
    setDefaults(updDef);
    saveLS(STORAGE_KEYS.defaults, updDef);

    toast(`Hand marked as defaulted. ${fmt(FINE_AMOUNT)} fine added.`, { icon: '⚠️' });
  };

  const exportCSV = () => {
    const rows = [['Date', 'Hand No', 'Name', 'Amount', 'Note', 'Timestamp']];
    Object.entries(payments).sort().forEach(([date, pmts]) => {
      pmts.forEach(p => {
        const hand = INITIAL_HANDS.find(h => h.no === p.handNo);
        rows.push([date, p.handNo, hand?.name || '', p.amount, p.note || '', p.timestamp]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ajo_payments.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const changePw = () => {
    if (!newPw || newPw.length < 4) return toast.error('Min 4 characters');
    saveLS(STORAGE_KEYS.password, newPw);
    setNewPw('');
    setShowChangePw(false);
    toast.success('Password changed');
  };

  const filteredDates = Object.keys(payments).sort().reverse();

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center">
          <Lock size={32} className="text-[#6b7280]" />
        </div>
        <div className="text-center">
          <h2 className="font-display text-2xl text-white mb-2">Admin Area</h2>
          <p className="text-[#6b7280] text-sm">Password required to log payments</p>
        </div>
        <button className="btn-primary px-8 py-3" onClick={() => setShowGate(true)}>Enter Password</button>
        {showGate && <PasswordGate onUnlock={() => { setUnlocked(true); setShowGate(false); toast.success('Unlocked!'); }} onClose={() => setShowGate(false)} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Unlock size={16} className="text-accent" />
          <h2 className="font-display text-xl text-white">Log Payment</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowChangePw(true)} className="btn-ghost text-xs px-3 py-2">Change PW</button>
          <button onClick={exportCSV} className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* Log form */}
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">
          {editingId ? '✏️ Edit Payment' : 'New Payment'}
        </h3>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-[#6b7280] mb-1.5 block">Hand</label>
            <select
              className="input"
              value={form.handNo}
              onChange={e => setForm(f => ({ ...f, handNo: e.target.value }))}
            >
              <option value="">Select hand…</option>
              {order.map(no => {
                const h = INITIAL_HANDS.find(x => x.no === no);
                return h ? <option key={no} value={no}>#{no} — {h.name}</option> : null;
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#6b7280] mb-1.5 block">Amount (₦)</label>
              <input
                type="number"
                className="input"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-[#6b7280] mb-1.5 block">Date</label>
              <input
                type="date"
                className="input"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#6b7280] mb-1.5 block">Note (optional)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Cash, Transfer…"
              value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            />
          </div>

          <div className="flex gap-2">
            <button className="btn-primary flex-1" onClick={handleSubmit}>
              {editingId ? 'Update Payment' : 'Log Payment'}
            </button>
            {editingId && (
              <button className="btn-ghost px-4" onClick={() => { setEditingId(null); setForm({ handNo: '', amount: DAILY_AMOUNT, note: '', date: todayKey() }); }}>
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mark Default */}
      <div className="card p-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">Mark as Defaulted</h3>
        <div className="flex gap-2">
          <select className="input flex-1" id="defaultSelect">
            <option value="">Select hand…</option>
            {order.map(no => {
              const h = INITIAL_HANDS.find(x => x.no === no);
              return h ? <option key={no} value={no}>#{no} — {h.name}</option> : null;
            })}
          </select>
          <button
            className="bg-red-500/10 text-red-400 border border-red-500/20 px-4 rounded-xl text-sm font-medium hover:bg-red-500/20 transition-colors"
            onClick={() => {
              const sel = document.getElementById('defaultSelect');
              if (sel.value) markDefault(Number(sel.value));
            }}
          >
            Fine
          </button>
        </div>
        <p className="text-xs text-[#6b7280]">Adds {fmt(FINE_AMOUNT)} fine. 2 defaults = moved to end of cycle.</p>
      </div>

      {/* Payment history */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">Payment History</h3>
          <select
            className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-3 py-1.5 text-xs text-[#a3a3a3] focus:outline-none"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          >
            <option value="">All dates</option>
            {filteredDates.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {filteredDates.filter(d => !filterDate || d === filterDate).length === 0 && (
          <p className="text-[#6b7280] text-sm text-center py-4">No payments logged yet</p>
        )}

        {filteredDates
          .filter(d => !filterDate || d === filterDate)
          .map(date => {
            const pmts = payments[date] || [];
            const dayTotal = pmts.reduce((s, p) => s + p.amount, 0);
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[#6b7280]">{date}</span>
                  <span className="text-xs font-mono text-accent">{fmt(dayTotal)}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {pmts.map(p => {
                    const hand = INITIAL_HANDS.find(h => h.no === p.handNo);
                    return (
                      <div key={p.id} className="card2 p-3 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{hand?.name || `Hand #${p.handNo}`}</p>
                          <p className="text-xs text-[#6b7280]">{p.note || 'Payment'} · {fmt(p.amount)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => startEdit(p, date)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors"
                          >
                            <Edit2 size={12} className="text-[#6b7280]" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: p.id, date })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* Fines Summary */}
      {Object.keys(fines).length > 0 && (
        <div className="card p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">Fines Summary</h3>
          {Object.entries(fines).map(([handNo, amount]) => {
            const hand = INITIAL_HANDS.find(h => h.no === Number(handNo));
            const defCnt = defaults[handNo] || 0;
            return (
              <div key={handNo} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{hand?.name || `Hand #${handNo}`}</p>
                  <p className="text-xs text-[#6b7280]">{defCnt} default{defCnt !== 1 ? 's' : ''}</p>
                </div>
                <span className="text-red-400 text-sm font-mono font-medium">{fmt(amount)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete">
        <div className="flex flex-col gap-4">
          <p className="text-[#a3a3a3] text-sm">Are you sure you want to delete this payment? This cannot be undone.</p>
          <div className="flex gap-2">
            <button className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-2.5 rounded-xl text-sm font-medium"
              onClick={() => deletePayment(deleteConfirm.id, deleteConfirm.date)}>
              Delete
            </button>
            <button className="flex-1 btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal open={showChangePw} onClose={() => setShowChangePw(false)} title="Change Password">
        <div className="flex flex-col gap-4">
          <input type="password" className="input" placeholder="New password (min 4 chars)" value={newPw} onChange={e => setNewPw(e.target.value)} />
          <button className="btn-primary w-full" onClick={changePw}>Update Password</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [payments, setPayments] = useState(() => loadLS(STORAGE_KEYS.payments, {}));
  const [order, setOrder] = useState(() => loadLS(STORAGE_KEYS.order, INITIAL_HANDS.map(h => h.no)));
  const [fines, setFines] = useState(() => loadLS(STORAGE_KEYS.fines, {}));
  const [defaults, setDefaults] = useState(() => loadLS(STORAGE_KEYS.defaults, {}));

  // Sync order if new hands appear
  useEffect(() => {
    const allNos = INITIAL_HANDS.map(h => h.no);
    const missing = allNos.filter(n => !order.includes(n));
    if (missing.length) {
      const updated = [...order, ...missing];
      setOrder(updated);
      saveLS(STORAGE_KEYS.order, updated);
    }
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hands', label: 'Hands', icon: Users },
    { id: 'log', label: 'Log', icon: PlusCircle },
  ];

  return (
    <div className="min-h-dvh bg-[#0a0a0a] font-body">
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1e1e1e', color: '#f5f5f5', border: '1px solid #2a2a2a', borderRadius: '12px', fontSize: '13px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#0a0a0a' } },
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl text-white leading-none">Ajo Tracker</h1>
            <p className="text-[10px] text-[#6b7280] mt-0.5 font-mono">
              Day {getDaysElapsed() + 1} · {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs text-[#6b7280]">Live</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-5 pb-28">
        {tab === 'dashboard' && (
          <Dashboard payments={payments} order={order} fines={fines} defaults={defaults} />
        )}
        {tab === 'hands' && (
          <HandsTab
            payments={payments} order={order} setOrder={setOrder}
            fines={fines} setFines={setFines}
            defaults={defaults} setDefaults={setDefaults}
          />
        )}
        {tab === 'log' && (
          <LogPaymentTab
            payments={payments} setPayments={setPayments}
            fines={fines} setFines={setFines}
            defaults={defaults} setDefaults={setDefaults}
            order={order}
          />
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-[#1a1a1a]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-around">
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex flex-col items-center gap-1 px-5 py-1 rounded-2xl transition-all duration-200
                  ${active ? 'text-accent' : 'text-[#4a4a4a] hover:text-[#6b7280]'}
                `}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                <span className={`text-[10px] font-medium tracking-wide ${active ? 'text-accent' : ''}`}>{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
