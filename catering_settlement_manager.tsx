import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import {
  ChefHat,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Receipt,
  CheckCircle2,
  Scale,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Download,
  Upload,
  Copy,
  Check,
  Archive,
  History,
  Lock,
  Sparkles,
  CalendarCheck,
  Home,
  Briefcase,
  X,
  ArrowUpRight,
  Sun,
  Moon,
  Smartphone,
  Share,
  Menu,
  Cloud,
  CloudOff
} from 'lucide-react';
import { supabase, toDBEvent, fromDBEvent, toDBExpense, fromDBExpense } from './src/supabase';

// --- SINGLETON INDIAN RUPEE FORMATTER (ZERO RE-INSTANTIATION OVERHEAD) ---
const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const formatINR = (amount) => {
  const num = Number(amount) || 0;
  return inrFormatter.format(Math.abs(num));
};

// --- DATE HELPERS ---
const getOffsetDate = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return 'Select Date';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const dateObj = new Date(year, month, day);
  if (isNaN(dateObj.getTime())) return dateStr;
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

const getCurrentMonthYear = () => {
  const d = new Date();
  return {
    month: MONTH_NAMES[d.getMonth()],
    year: String(d.getFullYear())
  };
};

const getNextMonthYear = (monthName, yearStr) => {
  const idx = MONTH_NAMES.indexOf(monthName);
  const yr = parseInt(yearStr, 10) || new Date().getFullYear();
  if (idx === -1) return getCurrentMonthYear();
  if (idx === 11) {
    return { month: MONTH_NAMES[0], year: String(yr + 1) };
  }
  return { month: MONTH_NAMES[idx + 1], year: String(yr) };
};

// --- DYNAMIC INFINITE YEAR RANGE GENERATOR ---
const getDynamicYears = (centerYearStr) => {
  const center = parseInt(centerYearStr, 10) || new Date().getFullYear();
  const start = Math.min(2000, center - 50);
  const end = Math.max(2100, center + 50);
  const list = [];
  for (let y = start; y <= end; y++) {
    list.push(String(y));
  }
  return list;
};

// --- MEMOIZED MOBILE-SAFE INLINE CLICKABLE DATE PICKER ---
interface ClickableDateInputProps {
  value: string;
  onChange: (val: any) => void;
  label?: string;
  isDark?: boolean;
}

const ClickableDateInput = memo(function ClickableDateInput({
  value,
  onChange,
  label,
  isDark
}: ClickableDateInputProps) {
  const [isOpen, setIsOpen] = useState(false);

  const initialDate = useMemo(() => {
    if (value && value.split('-').length === 3) {
      const [y, m] = value.split('-');
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
    }
    return new Date();
  }, [value]);

  const [viewMonth, setViewMonth] = useState(initialDate);

  useEffect(() => {
    if (value && value.split('-').length === 3) {
      const [y, m] = value.split('-');
      setViewMonth(new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1));
    }
  }, [value]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const selectDay = (dayNum) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    onChange(`${year}-${m}-${d}`);
    setIsOpen(false);
  };

  return (
    <div className="w-full min-w-0">
      {label && (
        <label
          className={`block text-xs font-semibold mb-1.5 ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {label}
        </label>
      )}

      {/* Entire Box is Clickable with Zero Tap Delay */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-left touch-manipulation active:scale-[0.99] transition-transform ${
          isOpen
            ? isDark
              ? 'bg-slate-800 border-indigo-400 ring-2 ring-indigo-500/20'
              : 'bg-white border-indigo-600 ring-2 ring-indigo-500/15'
            : isDark
            ? 'bg-slate-800/90 border-slate-700 hover:border-slate-600'
            : 'bg-slate-50 border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`p-1.5 rounded-lg shrink-0 ${
              isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div
              className={`text-base font-semibold leading-tight truncate ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}
            >
              {formatDisplayDate(value)}
            </div>
            <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Tap anywhere to select date
            </div>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-lg shrink-0 ${
            isDark
              ? 'bg-slate-700 text-slate-200'
              : 'bg-white text-slate-700 border border-slate-200 shadow-2xs'
          }`}
        >
          {isOpen ? 'Close' : 'Change'}
        </span>
      </button>

      {/* Quick One-Tap Date Pills */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {[
          { label: 'Today', offset: 0 },
          { label: 'Yesterday', offset: -1 },
          { label: 'Tomorrow', offset: 1 }
        ].map((preset) => {
          const targetDate = getOffsetDate(preset.offset);
          const isSelected = value === targetDate;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                onChange(targetDate);
                setIsOpen(false);
              }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium touch-manipulation active:scale-95 transition border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Inline Calendar Grid (Never clips off mobile screen) */}
      {isOpen && (
        <div
          className={`mt-2 w-full rounded-2xl p-3.5 border shadow-lg ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              className={`p-1.5 rounded-lg touch-manipulation active:scale-95 transition ${
                isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {viewMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </div>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              className={`p-1.5 rounded-lg touch-manipulation active:scale-95 transition ${
                isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div
                key={d}
                className={`text-[10px] font-bold uppercase py-1 ${
                  isDark ? 'text-slate-400' : 'text-slate-400'
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateFormatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(
                dayNum
              ).padStart(2, '0')}`;
              const isSelected = value === dateFormatted;
              const isToday = getOffsetDate(0) === dateFormatted;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => selectDay(dayNum)}
                  className={`h-8 rounded-lg text-xs font-semibold touch-manipulation active:scale-90 transition flex items-center justify-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : isToday
                      ? isDark
                        ? 'border border-indigo-400 text-indigo-300 bg-indigo-500/10'
                        : 'border border-indigo-600 text-indigo-700 bg-indigo-50'
                      : isDark
                      ? 'text-slate-200 hover:bg-slate-700'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

// --- INITIAL SAMPLE DATA ---
const DEFAULT_EVENTS = [
  {
    id: 'evt-1',
    clientName: 'Sharma Wedding Reception',
    date: '2026-11-10',
    totalAmount: 100000,
    broughtBy: 'ME',
    notes: '500 plates full catering package'
  },
  {
    id: 'evt-2',
    clientName: 'Verma Corporate Diwali Lunch',
    date: '2026-11-12',
    totalAmount: 80000,
    broughtBy: 'BROTHER',
    notes: '250 VIP buffet plates'
  }
];

const DEFAULT_EXPENSES = [
  {
    id: 'exp-1',
    title: 'Raw Vegetables, Paneer & Dairy',
    category: 'Raw Material & Groceries',
    amount: 35000,
    paidBy: 'ME',
    eventId: 'evt-1',
    date: '2026-11-10'
  },
  {
    id: 'exp-2',
    title: 'Halwai, Waiters & Cleaning Staff',
    category: 'Cooking Staff & Waiters',
    amount: 20000,
    paidBy: 'ME',
    eventId: 'evt-2',
    date: '2026-11-12'
  },
  {
    id: 'exp-3',
    title: 'Commercial Gas Cylinders & Tempo',
    category: 'Gas, Fuel & Kitchen',
    amount: 8000,
    paidBy: 'ME',
    eventId: 'GENERAL',
    date: '2026-11-12'
  },
  {
    id: 'exp-4',
    title: 'Tent House & Extra Chafing Dishes',
    category: 'Crockery, Tent & Rentals',
    amount: 14000,
    paidBy: 'BROTHER',
    eventId: 'evt-2',
    date: '2026-11-12'
  }
];

export default function App() {
  // --- THEME STATE (PERSISTENT UNTIL USER SWITCHES) ---
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('catering_theme_preference');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      // ignore
    }
    return 'light';
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    const next = isDark ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('catering_theme_preference', next);
    } catch (e) {
      // ignore
    }
  };

  // --- NAVIGATION & CORE STATE ---
  const [activeTab, setActiveTab] = useState('home');
  const [expenseOwnerTab, setExpenseOwnerTab] = useState('ME');
  const [monthSubTab, setMonthSubTab] = useState('REPORT');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Fixed Partner Names: Nandu & Shekhar
  const names = { me: 'Nandu', brother: 'Shekhar' };

  const [activeCycleMonth, setActiveCycleMonth] = useState(() => {
    try {
      const saved = localStorage.getItem('catering_active_cycle_month_v1');
      return saved ? JSON.parse(saved) : getCurrentMonthYear();
    } catch {
      return getCurrentMonthYear();
    }
  });

  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('catering_events_v3');
      return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
    } catch {
      return DEFAULT_EVENTS;
    }
  });

  const [expenses, setExpenses] = useState(() => {
    try {
      const saved = localStorage.getItem('catering_expenses_v3');
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSES;
    } catch {
      return DEFAULT_EXPENSES;
    }
  });

  const [settlements, setSettlements] = useState(() => {
    try {
      const saved = localStorage.getItem('catering_settlements_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [carryForward, setCarryForward] = useState(() => {
    try {
      const saved = localStorage.getItem('catering_carry_forward_v3');
      return saved ? JSON.parse(saved) : { amount: 0, note: '' };
    } catch {
      return { amount: 0, note: '' };
    }
  });

  const [archivedSettlements, setArchivedSettlements] = useState(() => {
    try {
      const saved = localStorage.getItem('catering_archived_settlements_v3');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- CLOUD SYNC STATE (SUPABASE) ---
  const [syncStatus, setSyncStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  // --- SEPARATE MODAL STATES ---
  const [addModalType, setAddModalType] = useState(null); // 'EXPENSE' | 'EVENT' | null
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showSettleCarryModal, setShowSettleCarryModal] = useState(false);
  const [carrySettleMode, setCarrySettleMode] = useState('FULL'); // 'FULL' | 'PARTIAL'
  const [carrySettleCustom, setCarrySettleCustom] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // --- ADD EVENT FORM STATE ---
  const [evtClient, setEvtClient] = useState('');
  const [evtAmount, setEvtAmount] = useState('');
  const [evtBroughtBy, setEvtBroughtBy] = useState('ME');
  const [evtDate, setEvtDate] = useState(getOffsetDate(0));
  const [evtNotes, setEvtNotes] = useState('');

  // --- ADD EXPENSE FORM STATE ---
  const [expTitle, setExpTitle] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('');
  const [expPaidBy, setExpPaidBy] = useState('ME');
  const [expEventId, setExpEventId] = useState('GENERAL');
  const [expDate, setExpDate] = useState(getOffsetDate(0));

  // --- CLOSE MONTH FORM STATE ---
  const [closeMonthName, setCloseMonthName] = useState(activeCycleMonth.month);
  const [closeMonthYear, setCloseMonthYear] = useState(activeCycleMonth.year);
  const [closePaidOption, setClosePaidOption] = useState('FULL');
  const [closeCustomPaid, setCloseCustomPaid] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  // --- EXCEL SYNC STATE ---
  const [pasteData, setPasteData] = useState('');
  const [pasteTarget, setPasteTarget] = useState('MY_EXPENSES');
  const [copiedId, setCopiedId] = useState('');
  const fileInputRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  // --- CONFIGURE VIEWPORT SAFE AREAS & LISTEN FOR ANDROID INSTALL PROMPT ---
  useEffect(() => {
    const metaViewport = document.querySelector('meta[name="viewport"]');
    if (metaViewport) {
      metaViewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      );
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // --- LOCK BODY SCROLL WHEN MOBILE SIDEBAR OR MODALS ARE OPEN ---
  useEffect(() => {
    const anyModalOpen =
      isSidebarOpen ||
      Boolean(addModalType) ||
      showSettleModal ||
      showSettleCarryModal ||
      showInstallModal;

    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSidebarOpen, addModalType, showSettleModal, showSettleCarryModal, showInstallModal]);

  // --- PERSIST DATA TO LOCALSTORAGE ---
  useEffect(() => {
    try {
      localStorage.setItem('catering_active_cycle_month_v1', JSON.stringify(activeCycleMonth));
    } catch {}
  }, [activeCycleMonth]);

  useEffect(() => {
    try {
      localStorage.setItem('catering_events_v3', JSON.stringify(events));
    } catch {}
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('catering_expenses_v3', JSON.stringify(expenses));
    } catch {}
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('catering_settlements_v3', JSON.stringify(settlements));
    } catch {}
  }, [settlements]);

  useEffect(() => {
    try {
      localStorage.setItem('catering_carry_forward_v3', JSON.stringify(carryForward));
    } catch {}
  }, [carryForward]);

  useEffect(() => {
    try {
      localStorage.setItem('catering_archived_settlements_v3', JSON.stringify(archivedSettlements));
    } catch {}
  }, [archivedSettlements]);

  // --- REAL-TIME SUPABASE CLOUD SYNC ---
  useEffect(() => {
    let active = true;

    async function initSupabase() {
      try {
        const [evtsRes, expsRes, stateRes] = await Promise.all([
          supabase.from('events').select('*').order('date', { ascending: false }),
          supabase.from('expenses').select('*').order('date', { ascending: false }),
          supabase.from('app_state').select('*')
        ]);

        if (evtsRes.error && expsRes.error) {
          if (active) setSyncStatus('offline');
          return;
        }

        if (active) setSyncStatus('connected');

        if (evtsRes.data && evtsRes.data.length > 0) {
          if (active) setEvents(evtsRes.data.map(fromDBEvent));
        } else if (events.length > 0) {
          supabase.from('events').insert(events.map(toDBEvent)).then();
        }

        if (expsRes.data && expsRes.data.length > 0) {
          if (active) setExpenses(expsRes.data.map(fromDBExpense));
        } else if (expenses.length > 0) {
          supabase.from('expenses').insert(expenses.map(toDBExpense)).then();
        }

        if (stateRes.data && stateRes.data.length > 0) {
          stateRes.data.forEach((row: any) => {
            if (row.key === 'carry_forward' && row.value && active) setCarryForward(row.value);
            if (row.key === 'active_cycle_month' && row.value && active) setActiveCycleMonth(row.value);
            if (row.key === 'archived_settlements' && row.value && active) setArchivedSettlements(row.value);
          });
        }
      } catch (err) {
        if (active) setSyncStatus('offline');
      }
    }

    initSupabase();

    const channel = supabase
      .channel('catering_live_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload: any) => {
        if (!active) return;
        if (payload.eventType === 'INSERT') {
          const item = fromDBEvent(payload.new);
          setEvents((prev) => (prev.some((e) => e.id === item.id) ? prev : [item, ...prev]));
        } else if (payload.eventType === 'DELETE') {
          setEvents((prev) => prev.filter((e) => e.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          const item = fromDBEvent(payload.new);
          setEvents((prev) => prev.map((e) => (e.id === item.id ? item : e)));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, (payload: any) => {
        if (!active) return;
        if (payload.eventType === 'INSERT') {
          const item = fromDBExpense(payload.new);
          setExpenses((prev) => (prev.some((x) => x.id === item.id) ? prev : [item, ...prev]));
        } else if (payload.eventType === 'DELETE') {
          setExpenses((prev) => prev.filter((x) => x.id !== payload.old.id));
        } else if (payload.eventType === 'UPDATE') {
          const item = fromDBExpense(payload.new);
          setExpenses((prev) => prev.map((x) => (x.id === item.id ? item : x)));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state' }, (payload: any) => {
        if (!active) return;
        if (payload.new?.key === 'carry_forward' && payload.new?.value) {
          setCarryForward(payload.new.value);
        } else if (payload.new?.key === 'active_cycle_month' && payload.new?.value) {
          setActiveCycleMonth(payload.new.value);
        } else if (payload.new?.key === 'archived_settlements' && payload.new?.value) {
          setArchivedSettlements(payload.new.value);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' && active) {
          setSyncStatus('connected');
        }
      });

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const triggerToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(''), 2800);
  }, []);

  const switchTabFast = useCallback((tabId) => {
    setActiveTab(tabId);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const openAddExpenseModal = useCallback((defaultOwner = 'ME') => {
    setExpPaidBy(defaultOwner);
    setAddModalType('EXPENSE');
  }, []);

  const openAddEventModal = useCallback((defaultOwner = 'ME') => {
    setEvtBroughtBy(defaultOwner);
    setAddModalType('EVENT');
  }, []);

  // --- FAST EVENT MAP FOR O(1) LABEL LOOKUPS ---
  const eventMap = useMemo(() => {
    const map = new Map();
    for (let i = 0; i < events.length; i++) {
      map.set(events[i].id, events[i]);
    }
    return map;
  }, [events]);

  const getEventLabel = useCallback(
    (eventId) => {
      if (!eventId || eventId === 'GENERAL') return 'Daily / General Catering';
      const found = eventMap.get(eventId);
      if (!found) return 'Daily / General Catering';
      return `${found.clientName} (${found.broughtBy === 'ME' ? names.me : names.brother})`;
    },
    [eventMap, names.me, names.brother]
  );

  const dynamicYearList = useMemo(
    () => getDynamicYears(activeCycleMonth.year),
    [activeCycleMonth.year]
  );

  // --- CORE BUSINESS FORMULA (SINGLE-PASS OPTIMIZED) ---
  // Balance = (Nandu's Full Events) - (10% Commission on Nandu's Events) - (All Nandu's Daily Expenses) + CarryForward
  const calculations = useMemo(() => {
    const myEvents = [];
    const brotherEvents = [];
    const myEventIds = new Set();
    const brotherEventIds = new Set();
    let myEventsTotal = 0;
    let brotherEventsTotal = 0;

    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      const amt = Number(ev.totalAmount) || 0;
      if (ev.broughtBy === 'ME') {
        myEvents.push(ev);
        myEventIds.add(ev.id);
        myEventsTotal += amt;
      } else {
        brotherEvents.push(ev);
        brotherEventIds.add(ev.id);
        brotherEventsTotal += amt;
      }
    }

    const myCommissionTotal = myEventsTotal * 0.1;
    const myEventsAfterCommission = myEventsTotal - myCommissionTotal;

    const myExpensesList = [];
    const brotherExpensesList = [];
    let myTotalExpenses = 0;
    let brotherTotalExpenses = 0;
    let myExpensesOnMyEvents = 0;
    let myExpensesOnBrotherEvents = 0;
    let myGeneralExpenses = 0;

    for (let i = 0; i < expenses.length; i++) {
      const x = expenses[i];
      const amt = Number(x.amount) || 0;
      if (x.paidBy === 'ME') {
        myExpensesList.push(x);
        myTotalExpenses += amt;
        if (myEventIds.has(x.eventId)) {
          myExpensesOnMyEvents += amt;
        } else if (brotherEventIds.has(x.eventId)) {
          myExpensesOnBrotherEvents += amt;
        } else {
          myGeneralExpenses += amt;
        }
      } else {
        brotherExpensesList.push(x);
        brotherTotalExpenses += amt;
      }
    }

    const rawFormulaBalance = myEventsTotal - myCommissionTotal - myTotalExpenses;

    let paidByMeToBrother = 0;
    let paidByBrotherToMe = 0;
    for (let i = 0; i < settlements.length; i++) {
      const s = settlements[i];
      const amt = Number(s.amount) || 0;
      if (s.direction === 'ME_TO_BROTHER') paidByMeToBrother += amt;
      else if (s.direction === 'BROTHER_TO_ME') paidByBrotherToMe += amt;
    }

    const carryForwardAmount = Number(carryForward?.amount) || 0;

    const netBalance =
      rawFormulaBalance + carryForwardAmount - paidByMeToBrother + paidByBrotherToMe;

    return {
      myEvents,
      brotherEvents,
      myEventsCount: myEvents.length,
      brotherEventsCount: brotherEvents.length,
      myEventsTotal,
      brotherEventsTotal,
      myCommissionTotal,
      myEventsAfterCommission,
      myExpensesList,
      brotherExpensesList,
      myTotalExpenses,
      brotherTotalExpenses,
      myExpensesOnMyEvents,
      myExpensesOnBrotherEvents,
      myGeneralExpenses,
      rawFormulaBalance,
      carryForwardAmount,
      netBalance
    };
  }, [events, expenses, settlements, carryForward]);

  // --- HANDLERS ---
  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!evtClient.trim() || !evtAmount || Number(evtAmount) <= 0) return;

    const newEvent = {
      id: `evt-${Date.now()}`,
      clientName: evtClient.trim(),
      totalAmount: Number(evtAmount),
      broughtBy: evtBroughtBy,
      date: evtDate || getOffsetDate(0),
      notes: evtNotes.trim()
    };

    setEvents([newEvent, ...events]);
    try {
      supabase.from('events').insert(toDBEvent(newEvent)).then();
    } catch {}
    setEvtClient('');
    setEvtAmount('');
    setEvtNotes('');
    setAddModalType(null);
    triggerToast(`Event "${newEvent.clientName}" added!`);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expTitle.trim() || !expAmount || Number(expAmount) <= 0) return;

    const newExp = {
      id: `exp-${Date.now()}`,
      title: expTitle.trim(),
      amount: Number(expAmount),
      category: expCategory.trim() || 'General Catering',
      paidBy: expPaidBy,
      eventId: expEventId,
      date: expDate || getOffsetDate(0)
    };

    setExpenses([newExp, ...expenses]);
    try {
      supabase.from('expenses').insert(toDBExpense(newExp)).then();
    } catch {}
    setExpTitle('');
    setExpAmount('');
    setExpCategory('');
    setAddModalType(null);
    triggerToast(
      `Expense logged (${newExp.paidBy === 'ME' ? `${names.me}'s Account` : `${names.brother} Ref`})`
    );
  };

  const handleDeleteEvent = useCallback(
    (id) => {
      setEvents((prev) => prev.filter((e) => e.id !== id));
      try {
        supabase.from('events').delete().eq('id', id).then();
      } catch {}
      triggerToast('Event removed');
    },
    [triggerToast]
  );

  const handleDeleteExpense = useCallback(
    (id) => {
      setExpenses((prev) => prev.filter((x) => x.id !== id));
      try {
        supabase.from('expenses').delete().eq('id', id).then();
      } catch {}
      triggerToast('Expense removed');
    },
    [triggerToast]
  );

  // --- SETTLE CARRY FORWARD AT ANY POINT ---
  const openSettleCarryForwardModal = () => {
    setCarrySettleMode('FULL');
    setCarrySettleCustom('');
    setShowSettleCarryModal(true);
  };

  const handleSettleCarryForwardNow = (e) => {
    e.preventDefault();
    const currentCF = Number(carryForward?.amount) || 0;
    const absCF = Math.abs(currentCF);
    if (absCF === 0) {
      setShowSettleCarryModal(false);
      return;
    }

    const paidAmount =
      carrySettleMode === 'FULL'
        ? absCF
        : Math.min(absCF, Math.max(0, Number(carrySettleCustom) || 0));

    if (paidAmount <= 0) return;

    let updatedCF = 0;
    if (currentCF > 0) {
      updatedCF = Math.max(0, currentCF - paidAmount);
    } else if (currentCF < 0) {
      updatedCF = Math.min(0, currentCF + paidAmount);
    }

    const newCFObj = {
      amount: updatedCF,
      note:
        updatedCF !== 0
          ? `${carryForward.note || 'Carry forward'} (${formatINR(paidAmount)} settled on ${formatDisplayDate(getOffsetDate(0))})`
          : ''
    };
    setCarryForward(newCFObj);
    try {
      supabase.from('app_state').upsert({ key: 'carry_forward', value: newCFObj, updated_at: new Date().toISOString() }).then();
    } catch {}

    setShowSettleCarryModal(false);
    setCarrySettleCustom('');
    triggerToast(
      updatedCF === 0
        ? 'Carry forward balance settled in full!'
        : `${formatINR(paidAmount)} settled from carry forward!`
    );
  };

  // --- CLOSE MONTHLY CYCLE & ARCHIVE ---
  const handleCloseAndArchiveMonth = (e) => {
    e.preventDefault();
    const currentNet = calculations.netBalance;
    const absNet = Math.abs(currentNet);

    let actualPaid = 0;
    if (closePaidOption === 'FULL') {
      actualPaid = absNet;
    } else if (closePaidOption === 'NONE') {
      actualPaid = 0;
    } else {
      actualPaid = Math.min(absNet, Math.max(0, Number(closeCustomPaid) || 0));
    }

    let remainingCarryForward = 0;
    if (currentNet > 0) {
      remainingCarryForward = Math.max(0, currentNet - actualPaid);
    } else if (currentNet < 0) {
      remainingCarryForward = Math.min(0, currentNet + actualPaid);
    }

    const monthTitle = `${closeMonthName} ${closeMonthYear}`;

    const snapshot = {
      id: `month-${Date.now()}`,
      title: monthTitle,
      monthName: closeMonthName,
      year: closeMonthYear,
      closedAt: getOffsetDate(0),
      namesSnapshot: { ...names },
      myEventsCount: calculations.myEventsCount,
      myEventsTotal: calculations.myEventsTotal,
      myCommissionTotal: calculations.myCommissionTotal,
      brotherEventsCount: calculations.brotherEventsCount,
      brotherEventsTotal: calculations.brotherEventsTotal,
      myTotalExpenses: calculations.myTotalExpenses,
      brotherTotalExpenses: calculations.brotherTotalExpenses,
      previousCarryForward: calculations.carryForwardAmount,
      finalNetBalanceBeforeClose: currentNet,
      amountSettledAtClose: actualPaid,
      newCarryForwardToNextCycle: remainingCarryForward,
      notes: closeNotes.trim() || `Closed monthly cycle for ${monthTitle}`,
      eventsSnapshot: [...events],
      expensesSnapshot: [...expenses]
    };

    const newArchived = [snapshot, ...archivedSettlements];
    const newCF = {
      amount: remainingCarryForward,
      note:
        remainingCarryForward !== 0
          ? `Carry forward from ${monthTitle} (${formatDisplayDate(getOffsetDate(0))})`
          : ''
    };

    setArchivedSettlements(newArchived);
    setEvents([]);
    setExpenses([]);
    setSettlements([]);
    setCarryForward(newCF);

    const nextCycle = getNextMonthYear(closeMonthName, closeMonthYear);
    setActiveCycleMonth(nextCycle);

    try {
      supabase.from('settlements').insert({ id: snapshot.id, data: snapshot }).then();
      supabase.from('app_state').upsert([
        { key: 'carry_forward', value: newCF, updated_at: new Date().toISOString() },
        { key: 'active_cycle_month', value: nextCycle, updated_at: new Date().toISOString() },
        { key: 'archived_settlements', value: newArchived, updated_at: new Date().toISOString() }
      ]).then();
      supabase.from('events').delete().neq('id', 'NONE').then();
      supabase.from('expenses').delete().neq('id', 'NONE').then();
    } catch {}
    setCloseMonthName(nextCycle.month);
    setCloseMonthYear(nextCycle.year);
    setShowSettleModal(false);
    setCloseCustomPaid('');
    setCloseNotes('');
    setActiveTab('month');
    setMonthSubTab('ARCHIVES');
    triggerToast(`${monthTitle} saved! Moved to ${nextCycle.month} ${nextCycle.year}.`);
  };

  // --- EXCEL / CSV EXPORT ---
  const handleDownloadCSV = () => {
    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const currentMonthLabel = `${activeCycleMonth.month} ${activeCycleMonth.year}`;

    const rows = [
      ['CATERING MONTHLY SETTLEMENT SHEET', currentMonthLabel, `Exported: ${getOffsetDate(0)}`],
      [],
      ['1. MONTHLY FORMULA SUMMARY', 'AMOUNT (INR)', 'STATUS / NOTE'],
      [
        `Events Brought by ${names.me} (${calculations.myEventsCount})`,
        calculations.myEventsTotal,
        '100% Event Value'
      ],
      [
        `Less: ${names.me} 10% Commission`,
        -calculations.myCommissionTotal,
        'Flat 10% Deduction'
      ],
      [
        `Less: All Daily Expenses Paid by ${names.me}`,
        -calculations.myTotalExpenses,
        'All Events + Daily Spend'
      ],
      ['Previous Month Carry Forward', calculations.carryForwardAmount, carryForward.note || 'None'],
      [
        'FINAL NET SETTLEMENT BALANCE',
        calculations.netBalance,
        calculations.netBalance > 0
          ? `${names.me} Owes ${names.brother}`
          : calculations.netBalance < 0
          ? `${names.brother} Owes ${names.me}`
          : 'All Settled (0)'
      ],
      [],
      ['2. ALL CATERING EVENTS', 'DATE', 'BROUGHT BY', 'EVENT TOTAL (INR)', '10% COMMISSION', 'NOTES'],
      ...events.map((e) => [
        e.clientName,
        e.date,
        e.broughtBy === 'ME' ? names.me : names.brother,
        e.totalAmount,
        e.broughtBy === 'ME' ? Math.round(e.totalAmount * 0.1) : 0,
        e.notes || ''
      ]),
      [],
      [
        `3. ${names.me.toUpperCase()} DAILY EXPENSES (IN FORMULA)`,
        'DATE',
        'CATEGORY',
        'LINKED EVENT',
        'AMOUNT (INR)'
      ],
      ...calculations.myExpensesList.map((x) => [
        x.title,
        x.date,
        x.category,
        getEventLabel(x.eventId),
        x.amount
      ]),
      [],
      [
        `4. ${names.brother.toUpperCase()} EXPENSES (REFERENCE ONLY)`,
        'DATE',
        'CATEGORY',
        'LINKED EVENT',
        'AMOUNT (INR)'
      ],
      ...calculations.brotherExpensesList.map((x) => [
        x.title,
        x.date,
        x.category,
        getEventLabel(x.eventId),
        x.amount
      ])
    ];

    const csvString =
      '\uFEFF' + rows.map((row) => row.map((cell) => escapeCSV(cell)).join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `Catering_${activeCycleMonth.month}_${activeCycleMonth.year}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Excel (.CSV) downloaded!');
  };

  // --- DOWNLOAD STANDALONE MOBILE WEB-APP PACKAGE ---
  const handleDownloadMobileAppPackage = () => {
    const appHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
<meta name="theme-color" content="#4f46e5" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Catering Ledger" />
<title>Catering Ledger (${names.me} & ${names.brother})</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: env(safe-area-inset-top, 20px) 16px env(safe-area-inset-bottom, 20px); background: #f8fafc; color: #0f172a; }
  .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; max-width: 500px; margin: 24px auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #eef2ff; color: #4f46e5; }
  h1 { font-size: 20px; margin: 12px 0 4px; }
  .amount { font-size: 32px; font-weight: 900; margin: 12px 0; color: #4f46e5; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
</style>
</head>
<body>
  <div class="card">
    <span class="badge">${activeCycleMonth.month} ${activeCycleMonth.year} Snapshot</span>
    <h1>${names.me} & ${names.brother} Catering Ledger</h1>
    <div class="amount">${calculations.netBalance < 0 ? '-' : ''}${formatINR(calculations.netBalance)}</div>
    <p style="font-size:13px;color:#475569;margin-top:0;">
      <strong>Status:</strong> ${
        calculations.netBalance > 0
          ? `${names.me} Owes ${names.brother}`
          : calculations.netBalance < 0
          ? `${names.brother} Owes ${names.me}`
          : 'All Settled'
      }
    </p>
    <div class="row"><span>1. ${names.me}'s Full Events (${calculations.myEventsCount})</span><strong>${formatINR(calculations.myEventsTotal)}</strong></div>
    <div class="row"><span>2. Less 10% Commission</span><strong style="color:#059669;">-${formatINR(calculations.myCommissionTotal)}</strong></div>
    <div class="row"><span>3. Less ${names.me}'s Expenses</span><strong style="color:#e11d48;">-${formatINR(calculations.myTotalExpenses)}</strong></div>
    <div class="row"><span>${names.brother}'s Reference Spend</span><strong>${formatINR(calculations.brotherTotalExpenses)}</strong></div>
  </div>
</body>
</html>`;

    const blob = new Blob([appHtml], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Catering_Ledger_Mobile_App.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Standalone Mobile Web-App file downloaded!');
  };

  const handleTriggerNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallModal(false);
        triggerToast('App installation started!');
      }
    } else {
      triggerToast('Use browser menu -> "Install App" or "Add to Home Screen"');
    }
  };

  // --- SAFE CLIPBOARD COPY HELPER (HANDLES IFRAME PERMISSION POLICY) ---
  const copyTextSafely = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        // Fallback to textarea execCommand when Clipboard API is blocked by permissions policy
      }
    }
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    } catch (fallbackErr) {
      return false;
    }
  };

  // --- COPY FOR GOOGLE SHEETS ---
  const handleCopyForSheets = async () => {
    const lines = [
      `CATERING MONTHLY LEDGER (${activeCycleMonth.month} ${activeCycleMonth.year})`,
      `1. Events Brought by ${names.me}\t${calculations.myEventsTotal}`,
      `2. Less 10% Commission\t-${calculations.myCommissionTotal}`,
      `3. Less All Daily Expenses Paid by ${names.me}\t-${calculations.myTotalExpenses}`,
      `FINAL NET BALANCE\t${calculations.netBalance}`
    ];
    const copied = await copyTextSafely(lines.join('\n'));
    if (copied) {
      setCopiedId('SUMMARY');
      triggerToast('Copied! Paste directly into Excel or Google Sheets.');
      setTimeout(() => setCopiedId(''), 2500);
    } else {
      triggerToast('Clipboard blocked—please use Download Master Excel (.CSV).');
    }
  };

  // --- PASTE IMPORT FROM EXCEL ---
  const handlePasteImport = (e) => {
    e.preventDefault();
    if (!pasteData.trim()) return;

    const lines = pasteData
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    let count = 0;
    const newEvts = [];
    const newExps = [];

    lines.forEach((line, idx) => {
      const cols = line.includes('\t') ? line.split('\t') : line.split(',');
      if (cols.length >= 2) {
        const titleOrClient = cols[0].replace(/^"|"$/g, '').trim();
        const rawAmount = cols[1].replace(/[₹,\s"]/g, '').trim();
        const numAmount = Number(rawAmount);
        const maybeDate = cols[2] ? cols[2].replace(/^"|"$/g, '').trim() : getOffsetDate(0);
        const validDate = /^\d{4}-\d{2}-\d{2}$/.test(maybeDate) ? maybeDate : getOffsetDate(0);

        if (titleOrClient && !isNaN(numAmount) && numAmount > 0) {
          count++;
          if (pasteTarget === 'MY_EVENTS' || pasteTarget === 'BROTHER_EVENTS') {
            newEvts.push({
              id: `evt-imp-${Date.now()}-${idx}`,
              clientName: titleOrClient,
              totalAmount: numAmount,
              broughtBy: pasteTarget === 'MY_EVENTS' ? 'ME' : 'BROTHER',
              date: validDate,
              notes: 'Imported from Excel'
            });
          } else {
            newExps.push({
              id: `exp-imp-${Date.now()}-${idx}`,
              title: titleOrClient,
              amount: numAmount,
              category: cols[3] ? cols[3].trim() : 'General Catering',
              paidBy: pasteTarget === 'MY_EXPENSES' ? 'ME' : 'BROTHER',
              eventId: 'GENERAL',
              date: validDate
            });
          }
        }
      }
    });

    if (newEvts.length > 0) setEvents((prev) => [...newEvts, ...prev]);
    if (newExps.length > 0) setExpenses((prev) => [...newExps, ...prev]);

    if (count > 0) {
      setPasteData('');
      triggerToast(`Imported ${count} rows from Excel!`);
    } else {
      triggerToast('Format each row as: Name , Amount');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setPasteData((evt.target?.result as string) || '');
      triggerToast('CSV loaded! Click "Import Rows" below.');
    };
    reader.readAsText(file);
  };

  // --- THEME TOKENS ---
  const t = {
    pageBg: isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#F8FAFC] text-slate-900',
    headerBg: isDark
      ? 'bg-slate-900/95 border-slate-800'
      : 'bg-white/95 border-slate-200/90',
    cardBg: isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90',
    subtleBg: isDark ? 'bg-slate-800/70 border-slate-700/80' : 'bg-slate-50/90 border-slate-200/70',
    textPrimary: isDark ? 'text-white' : 'text-slate-900',
    textSecondary: isDark ? 'text-slate-400' : 'text-slate-500',
    inputBg: isDark
      ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400',
    border: isDark ? 'border-slate-800' : 'border-slate-200',
    shadow: isDark ? 'shadow-xl shadow-black/30' : 'shadow-xs'
  };

  const navItems = [
    { id: 'home', label: 'Home Overview', icon: Home, badge: null },
    { id: 'events', label: 'Business & Events', icon: Briefcase, badge: events.length },
    { id: 'expenses', label: 'Daily Expenses', icon: Receipt, badge: expenses.length },
    { id: 'month', label: 'Monthly Report & Excel', icon: CalendarCheck, badge: archivedSettlements.length || null }
  ];

  return (
    <div
      className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden flex select-none antialiased touch-manipulation ${t.pageBg}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* BRANDED APP STYLE INJECTIONS FOR SMOOTH NATIVE SCROLL & ANIMATIONS */}
      <style>{`
        html, body {
          overscroll-behavior-y: none;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        @keyframes slideUpSheet {
          from { transform: translate3d(0, 100%, 0); opacity: 0.6; }
          to { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        .animate-sheet {
          animation: slideUpSheet 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform;
        }
      `}</style>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 flex items-center gap-2.5 text-xs font-semibold pointer-events-none"
          style={{ top: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* =========================================================
          MOBILE SIDEBAR BACKDROP OVERLAY
         ========================================================= */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* =========================================================
          ORGANIZED SIDEBAR (FIXED ON DESKTOP, GPU SLIDE-OVER ON MOBILE)
         ========================================================= */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-[100dvh] w-72 shrink-0 border-r flex flex-col justify-between transition-transform duration-200 ease-out will-change-transform ${
          t.headerBg
        } ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Top Brand + Quick Add Buttons + Navigation */}
        <div className="p-4 space-y-5 overflow-y-auto overscroll-contain flex-1">
          {/* Brand Header inside Sidebar */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shadow-sm shadow-indigo-500/20 shrink-0">
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className={`text-base font-extrabold tracking-tight truncate ${t.textPrimary}`}>
                  Catering Ledger
                </h1>
                <p className={`text-xs font-semibold truncate ${t.textSecondary}`}>
                  {names.me} &amp; {names.brother}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className={`lg:hidden p-2 rounded-xl border active:scale-95 transition-transform ${t.subtleBg} ${t.textSecondary}`}
              aria-label="Close Sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Add Primary Actions */}
          <div className="space-y-2">
            <div className={`text-[10px] font-bold uppercase tracking-wider px-1 ${t.textSecondary}`}>
              Quick Entry
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  openAddExpenseModal('ME');
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-transform"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  openAddEventModal('ME');
                }}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold active:scale-95 transition-transform ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700'
                    : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Event
              </button>
            </div>
          </div>

          {/* Main Navigation Links */}
          <div className="space-y-1">
            <div className={`text-[10px] font-bold uppercase tracking-wider px-1 mb-1.5 ${t.textSecondary}`}>
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => switchTabFast(item.id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform ${
                    active
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : `${t.textSecondary} hover:${t.textPrimary} ${
                          isDark ? 'hover:bg-slate-800/70' : 'hover:bg-slate-100'
                        }`
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                        active
                          ? 'bg-white/20 text-white'
                          : isDark
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Monthly Cycle & Tools Section */}
          <div className="space-y-1.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className={`text-[10px] font-bold uppercase tracking-wider px-1 mb-1.5 ${t.textSecondary}`}>
              Tools &amp; Cycle Actions
            </div>

            {/* Close Month & Archive */}
            <button
              type="button"
              onClick={() => {
                setIsSidebarOpen(false);
                setCloseMonthName(activeCycleMonth.month);
                setCloseMonthYear(activeCycleMonth.year);
                setShowSettleModal(true);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border active:scale-[0.98] transition-transform ${
                isDark
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span className="truncate">
                Close {activeCycleMonth.month.slice(0, 3)} {activeCycleMonth.year} &amp; Save
              </span>
            </button>

            {/* Download Excel CSV */}
            <button
              type="button"
              onClick={() => {
                setIsSidebarOpen(false);
                handleDownloadCSV();
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform ${t.subtleBg} hover:opacity-90`}
            >
              <Download className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className={`truncate ${t.textPrimary}`}>Export Excel (.CSV)</span>
            </button>

            {/* Install App on Android / iOS */}
            <button
              type="button"
              onClick={() => {
                setIsSidebarOpen(false);
                setShowInstallModal(true);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform ${t.subtleBg} hover:opacity-90`}
            >
              <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className={`truncate ${t.textPrimary}`}>Install App (APK / iOS)</span>
            </button>
          </div>
        </div>

        {/* Bottom Preferences Footer: Theme Switch & Reset Data */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
          {/* Persistent Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold active:scale-[0.98] transition-transform ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Appearance</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] bg-black/10 dark:bg-white/10">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </button>

          {/* Reset Demo Data */}
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold active:scale-95 transition-transform ${t.textSecondary} hover:text-rose-500`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Sample Data
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-xl">
              <span className="text-[11px] font-bold text-rose-500">Restore sample data?</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEvents(DEFAULT_EVENTS);
                    setExpenses(DEFAULT_EXPENSES);
                    setSettlements([]);
                    setCarryForward({ amount: 0, note: '' });
                    setConfirmReset(false);
                    setIsSidebarOpen(false);
                    triggerToast('Sample data restored');
                  }}
                  className="text-[11px] font-extrabold bg-rose-600 text-white px-2.5 py-1 rounded-lg active:scale-95"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className={`text-[11px] font-bold px-2 py-1 rounded-lg active:scale-95 ${t.subtleBg}`}
                >
                  No
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================
          RIGHT SIDE MAIN APPLICATION COLUMN
         ========================================================= */}
      <div
        className="flex-1 flex flex-col min-w-0"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* =========================================================
            CLEAN, BRANDED MOBILE & DESKTOP TOP HEADER BAR
           ========================================================= */}
        <header
          className={`sticky top-0 z-30 backdrop-blur-md border-b ${t.headerBg}`}
        >
          <div className="max-w-5xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
            {/* Left: Sidebar Hamburger (Mobile) + Active Section Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open Menu Sidebar"
                className={`lg:hidden p-2 rounded-xl border active:scale-90 transition-transform ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-slate-100 border-slate-200/90 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="min-w-0">
                <h2
                  className={`text-sm sm:text-base font-extrabold tracking-tight truncate leading-tight ${t.textPrimary}`}
                >
                  {activeTab === 'home' && 'Monthly Overview'}
                  {activeTab === 'events' && 'Business & Events'}
                  {activeTab === 'expenses' && 'Daily Expenses'}
                  {activeTab === 'month' && 'Reports & Excel Sync'}
                </h2>
                <p className={`text-[11px] font-medium truncate leading-tight ${t.textSecondary}`}>
                  {names.me} &amp; {names.brother} Catering
                </p>
              </div>
            </div>

            {/* Right: Cloud Sync Status + Month & Year Selector */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition-all shrink-0 ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    : 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20'
                }`}
                title={
                  syncStatus === 'connected'
                    ? 'Connected to Supabase. Live 2-way sync active between phones!'
                    : syncStatus === 'syncing'
                    ? 'Connecting to Supabase...'
                    : 'Local Cache Mode (Run SQL schema in Supabase to enable cloud sync)'
                }
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    syncStatus === 'connected'
                      ? 'bg-emerald-500 animate-pulse'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-500 animate-bounce'
                      : 'bg-slate-400'
                  }`}
                />
                <span className="hidden sm:inline">
                  {syncStatus === 'connected'
                    ? 'Live Sync'
                    : syncStatus === 'syncing'
                    ? 'Syncing'
                    : 'Local Cache'}
                </span>
              </div>

              <div
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border shrink-0 ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-100/90 border-slate-200/90'
                }`}
              >
              <CalendarCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0 hidden sm:inline" />
              <select
                value={activeCycleMonth.month}
                onChange={(e) =>
                  setActiveCycleMonth({ ...activeCycleMonth, month: e.target.value })
                }
                aria-label="Select Month"
                className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer ${t.textPrimary}`}
              >
                {MONTH_NAMES.map((m) => (
                  <option
                    key={m}
                    value={m}
                    className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                  >
                    {m.slice(0, 3)}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-0.5 pl-1 border-l border-slate-300 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() =>
                    setActiveCycleMonth({
                      ...activeCycleMonth,
                      year: String(
                        (parseInt(activeCycleMonth.year, 10) || new Date().getFullYear()) - 1
                      )
                    })
                  }
                  title="Previous Year"
                  className={`p-0.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-700 active:scale-90 transition-transform ${t.textSecondary}`}
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <select
                  value={activeCycleMonth.year}
                  onChange={(e) =>
                    setActiveCycleMonth({ ...activeCycleMonth, year: e.target.value })
                  }
                  aria-label="Select Year"
                  className={`bg-transparent text-xs font-bold focus:outline-none cursor-pointer ${t.textSecondary}`}
                >
                  {dynamicYearList.map((y) => (
                    <option
                      key={y}
                      value={y}
                      className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}
                    >
                      {y}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setActiveCycleMonth({
                      ...activeCycleMonth,
                      year: String(
                        (parseInt(activeCycleMonth.year, 10) || new Date().getFullYear()) + 1
                      )
                    })
                  }
                  title="Next Year"
                  className={`p-0.5 rounded hover:bg-slate-200/70 dark:hover:bg-slate-700 active:scale-90 transition-transform ${t.textSecondary}`}
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

        {/* =========================================================
            MAIN CONTENT CONTAINER
           ========================================================= */}
        <main className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3.5 sm:pt-5 pb-8 space-y-4 sm:space-y-5">
        {/* =======================================================
            PAGE 1: HOME OVERVIEW
           ======================================================= */}
        {activeTab === 'home' && (
          <div className="space-y-4 sm:space-y-5">
            {/* Hero Monthly Settlement Card */}
            <section className={`rounded-2xl border overflow-hidden ${t.cardBg} ${t.shadow}`}>
              <div className="p-4 sm:p-6 space-y-4">
                {/* Top Status Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                      isDark
                        ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    {activeCycleMonth.month} {activeCycleMonth.year} Settlement
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setCloseMonthName(activeCycleMonth.month);
                      setCloseMonthYear(activeCycleMonth.year);
                      setShowSettleModal(true);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border active:scale-95 transition-transform ${
                      isDark
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Close {activeCycleMonth.month.slice(0, 3)} &amp; Save
                  </button>
                </div>

                {/* Big Balance Verdict */}
                <div
                  className={`rounded-2xl p-4 sm:p-5 border ${
                    calculations.netBalance > 0
                      ? isDark
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-amber-50/90 border-amber-200'
                      : calculations.netBalance < 0
                      ? isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-emerald-50/90 border-emerald-200'
                      : `${t.subtleBg} ${t.border}`
                  }`}
                >
                  <div className={`text-[11px] sm:text-xs font-semibold leading-snug ${t.textSecondary}`}>
                    Formula: ({names.me}&apos;s Full Events) − (10% Commission) − (All {names.me}&apos;s Daily Expenses)
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-baseline justify-between gap-2">
                    <div
                      className={`text-2xl sm:text-4xl font-black tracking-tight tabular-nums break-all ${
                        calculations.netBalance > 0
                          ? isDark
                            ? 'text-orange-400'
                            : 'text-amber-700'
                          : calculations.netBalance < 0
                          ? isDark
                            ? 'text-emerald-400'
                            : 'text-emerald-700'
                          : t.textPrimary
                      }`}
                    >
                      {calculations.netBalance < 0 ? '-' : ''}
                      {formatINR(calculations.netBalance)}
                    </div>

                    <div
                      className={`px-3 py-1 rounded-xl text-xs font-bold ${
                        calculations.netBalance > 0
                          ? isDark
                            ? 'bg-orange-500/20 text-orange-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                          : calculations.netBalance < 0
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : `${t.cardBg} ${t.textSecondary} border ${t.border}`
                      }`}
                    >
                      {calculations.netBalance > 0
                        ? `${names.me} Owes ${names.brother}`
                        : calculations.netBalance < 0
                        ? `${names.brother} Owes ${names.me}`
                        : 'All Settled'}
                    </div>
                  </div>
                </div>

                {/* 3-Column Formula Breakdown */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <div className={`min-w-0 rounded-xl p-2.5 sm:p-3.5 border ${t.subtleBg} ${t.border}`}>
                    <div className={`text-[10px] sm:text-xs font-semibold truncate ${t.textSecondary}`}>
                      1. {names.me}&apos;s Events ({calculations.myEventsCount})
                    </div>
                    <div className={`text-xs sm:text-lg font-extrabold mt-1 tabular-nums truncate ${t.textPrimary}`}>
                      {formatINR(calculations.myEventsTotal)}
                    </div>
                  </div>

                  <div
                    className={`min-w-0 rounded-xl p-2.5 sm:p-3.5 border ${
                      isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-emerald-50/70 border-emerald-200'
                    }`}
                  >
                    <div
                      className={`text-[10px] sm:text-xs font-semibold truncate ${
                        isDark ? 'text-emerald-300' : 'text-emerald-800'
                      }`}
                    >
                      2. Less 10% Cut
                    </div>
                    <div
                      className={`text-xs sm:text-lg font-extrabold mt-1 tabular-nums truncate ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700'
                      }`}
                    >
                      −{formatINR(calculations.myCommissionTotal)}
                    </div>
                  </div>

                  <div
                    className={`min-w-0 rounded-xl p-2.5 sm:p-3.5 border ${
                      isDark
                        ? 'bg-rose-500/10 border-rose-500/30'
                        : 'bg-rose-50/70 border-rose-200'
                    }`}
                  >
                    <div
                      className={`text-[10px] sm:text-xs font-semibold truncate ${
                        isDark ? 'text-rose-300' : 'text-rose-800'
                      }`}
                    >
                      3. {names.me}&apos;s Spend
                    </div>
                    <div
                      className={`text-xs sm:text-lg font-extrabold mt-1 tabular-nums truncate ${
                        isDark ? 'text-rose-400' : 'text-rose-700'
                      }`}
                    >
                      −{formatINR(calculations.myTotalExpenses)}
                    </div>
                  </div>
                </div>

                {calculations.carryForwardAmount !== 0 && (
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-xs ${
                      isDark
                        ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-bold">Carry Forward: </span>
                      <span className="truncate">{carryForward.note || 'Previous cycle balance'}</span>
                      <span className="ml-1.5 font-extrabold tabular-nums">
                        ({calculations.carryForwardAmount > 0 ? `${names.me} Owes ${names.brother} ` : `${names.brother} Owes ${names.me} `}
                        {formatINR(calculations.carryForwardAmount)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={openSettleCarryForwardModal}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs shrink-0 shadow-2xs transition-transform"
                    >
                      Settle Carry Forward
                    </button>
                  </div>
                )}

                {/* Primary Separate Action Buttons: + Add Expense & + Add Event */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => openAddExpenseModal('ME')}
                    className="flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-600/20 transition-transform"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
                    <span className="truncate">Add Expense</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddEventModal('ME')}
                    className={`flex items-center justify-center gap-1.5 py-3.5 px-3 rounded-xl border font-bold text-xs sm:text-sm transition-transform active:scale-[0.97] ${
                      isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                        : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
                    }`}
                  >
                    <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
                    <span className="truncate">Add Event</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 2-Card Summary: Nandu's Business vs Shekhar's Business */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nandu Card */}
              <div
                onClick={() => switchTabFast('events')}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border flex items-center justify-between gap-3 active:scale-[0.99] transition-transform ${t.cardBg} ${t.border} ${t.shadow}`}
              >
                <div className="min-w-0 space-y-1">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isDark
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {names.me}&apos;s Business (10% Cut)
                  </span>
                  <h3 className={`text-sm sm:text-base font-bold truncate ${t.textPrimary}`}>
                    {calculations.myEventsCount} Catering{' '}
                    {calculations.myEventsCount === 1 ? 'Event' : 'Events'}
                  </h3>
                  <p className={`text-xs truncate ${t.textSecondary}`}>
                    10% Commission:{' '}
                    <strong className={`tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                      {formatINR(calculations.myCommissionTotal)}
                    </strong>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-base sm:text-xl font-black tabular-nums ${t.textPrimary}`}>
                    {formatINR(calculations.myEventsTotal)}
                  </div>
                  <span
                    className={`text-[11px] font-semibold inline-flex items-center gap-0.5 mt-1 ${
                      isDark ? 'text-indigo-400' : 'text-indigo-600'
                    }`}
                  >
                    Details <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Shekhar Card */}
              <div
                onClick={() => switchTabFast('events')}
                className={`cursor-pointer rounded-2xl p-4 sm:p-5 border flex items-center justify-between gap-3 active:scale-[0.99] transition-transform ${t.cardBg} ${t.border} ${t.shadow}`}
              >
                <div className="min-w-0 space-y-1">
                  <span
                    className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      isDark
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {names.brother}&apos;s Business
                  </span>
                  <h3 className={`text-sm sm:text-base font-bold truncate ${t.textPrimary}`}>
                    {calculations.brotherEventsCount} Catering{' '}
                    {calculations.brotherEventsCount === 1 ? 'Event' : 'Events'}
                  </h3>
                  <p className={`text-xs truncate ${t.textSecondary}`}>
                    {names.brother} Ref Spend:{' '}
                    <strong className={`tabular-nums ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                      {formatINR(calculations.brotherTotalExpenses)}
                    </strong>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-base sm:text-xl font-black tabular-nums ${t.textPrimary}`}>
                    {formatINR(calculations.brotherEventsTotal)}
                  </div>
                  <span
                    className={`text-[11px] font-semibold inline-flex items-center gap-0.5 mt-1 ${
                      isDark ? 'text-purple-300' : 'text-purple-700'
                    }`}
                  >
                    Details <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Activity List */}
            <div className={`rounded-2xl p-4 sm:p-5 border ${t.cardBg} ${t.border} ${t.shadow}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${t.textPrimary}`}>Recent Expenses</h3>
                <button
                  type="button"
                  onClick={() => switchTabFast('expenses')}
                  className={`text-xs font-bold active:scale-95 transition-transform ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}
                >
                  View All ({expenses.length}) →
                </button>
              </div>

              {expenses.length === 0 ? (
                <p className={`text-xs py-6 text-center ${t.textSecondary}`}>
                  No expenses logged in {activeCycleMonth.month} yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {expenses.slice(0, 4).map((x) => (
                    <div
                      key={x.id}
                      className={`flex items-center justify-between gap-2.5 p-3 rounded-xl border ${t.subtleBg}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-xs font-bold truncate ${t.textPrimary}`}>
                            {x.title}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              x.paidBy === 'ME'
                                ? isDark
                                  ? 'bg-rose-500/20 text-rose-300'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                                : isDark
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}
                          >
                            {x.paidBy === 'ME' ? `${names.me} Paid` : `${names.brother} Ref`}
                          </span>
                        </div>
                        <div className={`text-[11px] mt-0.5 truncate ${t.textSecondary}`}>
                          {formatDisplayDate(x.date)} • {x.category}
                        </div>
                      </div>
                      <div
                        className={`text-sm font-black tabular-nums shrink-0 ${
                          x.paidBy === 'ME'
                            ? isDark
                              ? 'text-rose-400'
                              : 'text-rose-600'
                            : isDark
                            ? 'text-purple-300'
                            : 'text-purple-700'
                        }`}
                      >
                        {formatINR(x.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =======================================================
            PAGE 2: BUSINESS & EVENTS (NANDU VS SHEKHAR)
           ======================================================= */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div
              className={`flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border ${t.cardBg} ${t.border} ${t.shadow}`}
            >
              <div>
                <h2 className={`text-base sm:text-lg font-extrabold ${t.textPrimary}`}>
                  Business &amp; Events ({names.me} vs {names.brother})
                </h2>
                <p className={`text-xs ${t.textSecondary}`}>
                  {names.me} gets 10% commission on events brought by {names.me}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddEventModal('ME')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-transform"
              >
                <Plus className="w-4 h-4" /> Add New Event
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* SECTION 1: NANDU'S BUSINESS */}
              <div className={`rounded-2xl p-4 sm:p-5 border space-y-4 ${t.cardBg} ${t.border} ${t.shadow}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        isDark
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}
                    >
                      Section 1 • 10% Commission Applies
                    </span>
                    <h3 className={`text-base font-extrabold mt-1 ${t.textPrimary}`}>
                      Events Brought by {names.me}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddEventModal('ME')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border active:scale-95 transition-transform ${
                      isDark
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }`}
                  >
                    + Add {names.me} Event
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className={`rounded-xl p-2.5 border ${t.subtleBg}`}>
                    <div className={`text-[10px] font-semibold ${t.textSecondary}`}>Events</div>
                    <div className={`text-base font-black tabular-nums mt-0.5 ${t.textPrimary}`}>
                      {calculations.myEventsCount}
                    </div>
                  </div>
                  <div className={`rounded-xl p-2.5 border ${t.subtleBg}`}>
                    <div className={`text-[10px] font-semibold ${t.textSecondary}`}>Total Value</div>
                    <div className={`text-xs sm:text-sm font-black tabular-nums mt-0.5 truncate ${t.textPrimary}`}>
                      {formatINR(calculations.myEventsTotal)}
                    </div>
                  </div>
                  <div
                    className={`rounded-xl p-2.5 border ${
                      isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-semibold ${
                        isDark ? 'text-emerald-300' : 'text-emerald-800'
                      }`}
                    >
                      10% Cut
                    </div>
                    <div
                      className={`text-xs sm:text-sm font-black tabular-nums mt-0.5 truncate ${
                        isDark ? 'text-emerald-400' : 'text-emerald-700'
                      }`}
                    >
                      {formatINR(calculations.myCommissionTotal)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {calculations.myEvents.length === 0 ? (
                    <div className={`text-center py-6 text-xs rounded-xl border ${t.subtleBg} ${t.textSecondary}`}>
                      No events logged under {names.me} yet.
                    </div>
                  ) : (
                    calculations.myEvents.map((ev) => (
                      <div key={ev.id} className={`p-3.5 rounded-xl border ${t.subtleBg}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className={`text-sm font-bold truncate ${t.textPrimary}`}>
                              {ev.clientName}
                            </h4>
                            <p className={`text-[11px] mt-0.5 ${t.textSecondary}`}>
                              {formatDisplayDate(ev.date)} {ev.notes ? `• ${ev.notes}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 active:scale-90 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs tabular-nums">
                          <span>
                            Total: <strong className={t.textPrimary}>{formatINR(ev.totalAmount)}</strong>
                          </span>
                          <span
                            className={`font-bold ${
                              isDark ? 'text-emerald-400' : 'text-emerald-700'
                            }`}
                          >
                            10% Cut: {formatINR(ev.totalAmount * 0.1)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SECTION 2: SHEKHAR'S BUSINESS */}
              <div className={`rounded-2xl p-4 sm:p-5 border space-y-4 ${t.cardBg} ${t.border} ${t.shadow}`}>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${
                        isDark
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      Section 2 • Partner Events
                    </span>
                    <h3 className={`text-base font-extrabold mt-1 ${t.textPrimary}`}>
                      Events Brought by {names.brother}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddEventModal('BROTHER')}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border active:scale-95 transition-transform ${
                      isDark
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                        : 'bg-purple-50 text-purple-700 border-purple-200'
                    }`}
                  >
                    + Add {names.brother} Event
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className={`rounded-xl p-2.5 border ${t.subtleBg}`}>
                    <div className={`text-[10px] font-semibold ${t.textSecondary}`}>Events</div>
                    <div className={`text-base font-black tabular-nums mt-0.5 ${t.textPrimary}`}>
                      {calculations.brotherEventsCount}
                    </div>
                  </div>
                  <div className={`rounded-xl p-2.5 border ${t.subtleBg}`}>
                    <div className={`text-[10px] font-semibold ${t.textSecondary}`}>Total Value</div>
                    <div className={`text-xs sm:text-sm font-black tabular-nums mt-0.5 truncate ${t.textPrimary}`}>
                      {formatINR(calculations.brotherEventsTotal)}
                    </div>
                  </div>
                  <div
                    className={`rounded-xl p-2.5 border ${
                      isDark ? 'bg-rose-500/10 border-rose-500/30' : 'bg-rose-50 border-rose-200'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-semibold ${
                        isDark ? 'text-rose-300' : 'text-rose-800'
                      }`}
                    >
                      {names.me} Spent Here
                    </div>
                    <div
                      className={`text-xs sm:text-sm font-black tabular-nums mt-0.5 truncate ${
                        isDark ? 'text-rose-400' : 'text-rose-700'
                      }`}
                    >
                      {formatINR(calculations.myExpensesOnBrotherEvents)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {calculations.brotherEvents.length === 0 ? (
                    <div className={`text-center py-6 text-xs rounded-xl border ${t.subtleBg} ${t.textSecondary}`}>
                      No events logged under {names.brother} yet.
                    </div>
                  ) : (
                    calculations.brotherEvents.map((ev) => (
                      <div key={ev.id} className={`p-3.5 rounded-xl border ${t.subtleBg}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className={`text-sm font-bold truncate ${t.textPrimary}`}>
                              {ev.clientName}
                            </h4>
                            <p className={`text-[11px] mt-0.5 ${t.textSecondary}`}>
                              {formatDisplayDate(ev.date)} {ev.notes ? `• ${ev.notes}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(ev.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 active:scale-90 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs tabular-nums">
                          <span>
                            Total: <strong className={t.textPrimary}>{formatINR(ev.totalAmount)}</strong>
                          </span>
                          <span className={t.textSecondary}>0% Commission for {names.me}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            PAGE 3: ALL EXPENSES (DEDICATED EXPENSE VIEW ONLY)
           ======================================================= */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {/* Header + Add Expense Button */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border ${t.cardBg} ${t.border} ${t.shadow}`}
            >
              <div>
                <h2 className={`text-base sm:text-lg font-extrabold ${t.textPrimary}`}>
                  Daily Catering Expenses
                </h2>
                <p className={`text-xs ${t.textSecondary}`}>
                  Switch between {names.me}&apos;s expenses (deducted in settlement) and {names.brother}&apos;s reference list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => openAddExpenseModal(expenseOwnerTab)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-transform"
              >
                <Plus className="w-4 h-4" /> Add Expense
              </button>
            </div>

            {/* Segmented Toggle: Nandu's Expenses vs Shekhar's Expenses */}
            <div
              className={`grid grid-cols-2 gap-2 p-1.5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/70 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => setExpenseOwnerTab('ME')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 ${
                  expenseOwnerTab === 'ME'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : `${t.textSecondary} hover:${t.textPrimary}`
                }`}
              >
                <span className="truncate">
                  {names.me}&apos;s Spend ({calculations.myExpensesList.length})
                </span>
              </button>
              <button
                type="button"
                onClick={() => setExpenseOwnerTab('BROTHER')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 ${
                  expenseOwnerTab === 'BROTHER'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : `${t.textSecondary} hover:${t.textPrimary}`
                }`}
              >
                <span className="truncate">
                  {names.brother} Ref ({calculations.brotherExpensesList.length})
                </span>
              </button>
            </div>

            {expenseOwnerTab === 'ME' ? (
              <div className={`rounded-2xl p-4 sm:p-5 border space-y-4 ${t.cardBg} ${t.border} ${t.shadow}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        isDark
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      Counted in Settlement Formula
                    </span>
                    <h3 className={`text-base font-extrabold mt-1 ${t.textPrimary}`}>
                      All Expenses Paid by {names.me}
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className={`text-[11px] font-medium ${t.textSecondary}`}>Total Deducted</div>
                    <div
                      className={`text-xl font-black tabular-nums ${
                        isDark ? 'text-rose-400' : 'text-rose-600'
                      }`}
                    >
                      −{formatINR(calculations.myTotalExpenses)}
                    </div>
                  </div>
                </div>

                {calculations.myExpensesList.length === 0 ? (
                  <p className={`text-center py-8 text-xs ${t.textSecondary}`}>
                    No expenses logged by {names.me} yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {calculations.myExpensesList.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border ${t.subtleBg}`}
                      >
                        <div className="min-w-0">
                          <div className={`text-sm font-bold truncate ${t.textPrimary}`}>
                            {item.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                            <span className={t.textSecondary}>{formatDisplayDate(item.date)}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold ${
                                isDark
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {item.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold truncate max-w-[180px] ${
                                isDark
                                  ? 'bg-indigo-500/15 text-indigo-300'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              {getEventLabel(item.eventId)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm font-black tabular-nums ${
                              isDark ? 'text-rose-400' : 'text-rose-600'
                            }`}
                          >
                            −{formatINR(item.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 active:scale-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className={`rounded-2xl p-4 sm:p-5 border space-y-4 ${t.cardBg} ${t.border} ${t.shadow}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        isDark
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      Reference Only • Does Not Change {names.me}&apos;s Formula
                    </span>
                    <h3 className={`text-base font-extrabold mt-1 ${t.textPrimary}`}>
                      {names.brother}&apos;s Own Expenses
                    </h3>
                  </div>
                  <div className="text-right">
                    <div className={`text-[11px] font-medium ${t.textSecondary}`}>
                      {names.brother} Total
                    </div>
                    <div
                      className={`text-xl font-black tabular-nums ${
                        isDark ? 'text-purple-300' : 'text-purple-700'
                      }`}
                    >
                      {formatINR(calculations.brotherTotalExpenses)}
                    </div>
                  </div>
                </div>

                {calculations.brotherExpensesList.length === 0 ? (
                  <p className={`text-center py-8 text-xs ${t.textSecondary}`}>
                    No reference expenses logged for {names.brother} yet.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {calculations.brotherExpensesList.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border ${t.subtleBg}`}
                      >
                        <div className="min-w-0">
                          <div className={`text-sm font-bold truncate ${t.textPrimary}`}>
                            {item.title}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                            <span className={t.textSecondary}>{formatDisplayDate(item.date)}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold ${
                                isDark
                                  ? 'bg-slate-800 text-slate-300'
                                  : 'bg-white text-slate-700 border border-slate-200'
                              }`}
                            >
                              {item.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-semibold truncate max-w-[180px] ${
                                isDark
                                  ? 'bg-purple-500/15 text-purple-300'
                                  : 'bg-purple-50 text-purple-700'
                              }`}
                            >
                              {getEventLabel(item.eventId)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-sm font-black tabular-nums ${
                              isDark ? 'text-purple-300' : 'text-purple-700'
                            }`}
                          >
                            {formatINR(item.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 active:scale-90"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =======================================================
            PAGE 4: MONTHLY REPORT, SAVED ARCHIVES & EXCEL
           ======================================================= */}
        {activeTab === 'month' && (
          <div className="space-y-4">
            {/* Sub-navigation */}
            <div
              className={`grid grid-cols-3 gap-1.5 p-1.5 rounded-2xl border ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-200/70 border-slate-200'
              }`}
            >
              {[
                { id: 'REPORT', label: 'Monthly Statement', icon: Scale },
                { id: 'ARCHIVES', label: `Saved Months (${archivedSettlements.length})`, icon: Archive },
                { id: 'EXCEL', label: 'Excel / CSV Sync', icon: FileSpreadsheet }
              ].map((st) => {
                const Icon = st.icon;
                const active = monthSubTab === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setMonthSubTab(st.id)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 ${
                      active
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : `${t.textSecondary} hover:${t.textPrimary}`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
                    <span className="truncate">{st.label}</span>
                  </button>
                );
              })}
            </div>

            {monthSubTab === 'REPORT' && (
              <div className={`rounded-2xl p-4 sm:p-6 border space-y-4 ${t.cardBg} ${t.border} ${t.shadow}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      Active Cycle: {activeCycleMonth.month} {activeCycleMonth.year}
                    </span>
                    <h3 className={`text-base sm:text-lg font-extrabold ${t.textPrimary}`}>
                      Monthly Accounting Statement
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCloseMonthName(activeCycleMonth.month);
                      setCloseMonthYear(activeCycleMonth.year);
                      setShowSettleModal(true);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-transform"
                  >
                    <Lock className="w-3.5 h-3.5" /> Close {activeCycleMonth.month} &amp; Save
                  </button>
                </div>

                <div className="space-y-2.5 text-xs sm:text-sm">
                  <div className={`flex items-center justify-between p-3.5 rounded-xl border ${t.subtleBg}`}>
                    <span>
                      1. Full Value of Events Brought by <strong>{names.me}</strong> ({calculations.myEventsCount})
                    </span>
                    <span className={`font-black tabular-nums ${t.textPrimary}`}>
                      {formatINR(calculations.myEventsTotal)}
                    </span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      isDark
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <span>2. Less: {names.me}&apos;s 10% Commission</span>
                    <span className="font-black tabular-nums">−{formatINR(calculations.myCommissionTotal)}</span>
                  </div>

                  <div
                    className={`flex items-center justify-between p-3.5 rounded-xl border ${
                      isDark
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-rose-50 border-rose-200 text-rose-900'
                    }`}
                  >
                    <span>
                      3. Less: All Daily Expenses Paid by <strong>{names.me}</strong>
                    </span>
                    <span className="font-black tabular-nums">−{formatINR(calculations.myTotalExpenses)}</span>
                  </div>

                  {calculations.carryForwardAmount !== 0 && (
                    <div
                      className={`flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-xl border ${
                        isDark
                          ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200'
                          : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                      }`}
                    >
                      <div>
                        <span>4. Previous Month Carry Forward ({carryForward.note || 'Old Balance'})</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-black tabular-nums">
                          {calculations.carryForwardAmount > 0 ? '+' : '-'}
                          {formatINR(calculations.carryForwardAmount)}
                        </span>
                        <button
                          type="button"
                          onClick={openSettleCarryForwardModal}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs transition-transform"
                        >
                          Settle Now
                        </button>
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl border-2 ${
                      calculations.netBalance > 0
                        ? isDark
                          ? 'bg-orange-500/10 border-orange-500/40'
                          : 'bg-amber-50 border-amber-300'
                        : calculations.netBalance < 0
                        ? isDark
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-emerald-50 border-emerald-300'
                        : `${t.subtleBg} ${t.border}`
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        Final Closing Verdict ({activeCycleMonth.month} {activeCycleMonth.year})
                      </div>
                      <div className={`text-sm font-bold mt-0.5 ${t.textPrimary}`}>
                        {calculations.netBalance > 0
                          ? `${names.me} Owes ${names.brother}`
                          : calculations.netBalance < 0
                          ? `${names.brother} Owes ${names.me}`
                          : 'Both Brothers Are Fully Settled'}
                      </div>
                    </div>
                    <div className={`text-2xl font-black tabular-nums ${t.textPrimary}`}>
                      {calculations.netBalance < 0 ? '-' : ''}
                      {formatINR(calculations.netBalance)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {monthSubTab === 'ARCHIVES' && (
              <div className="space-y-3">
                {archivedSettlements.length === 0 ? (
                  <div className={`rounded-2xl p-8 text-center border ${t.cardBg} ${t.border}`}>
                    <History className={`w-8 h-8 mx-auto mb-2 ${t.textSecondary}`} />
                    <h4 className={`text-sm font-bold ${t.textPrimary}`}>No Saved Monthly Copies Yet</h4>
                    <p className={`text-xs mt-1 ${t.textSecondary}`}>
                      When you close a month, a permanent copy with that month&apos;s name is saved here.
                    </p>
                  </div>
                ) : (
                  archivedSettlements.map((arch) => (
                    <div
                      key={arch.id}
                      className={`rounded-2xl p-4 sm:p-5 border space-y-3 ${t.cardBg} ${t.border} ${t.shadow}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                          {arch.title}
                        </span>
                        <span className={`text-xs ${t.textSecondary}`}>
                          Closed: {formatDisplayDate(arch.closedAt)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs tabular-nums">
                        <div className={`p-2.5 rounded-xl border ${t.subtleBg}`}>
                          <div className={t.textSecondary}>{names.me} Events</div>
                          <div className={`font-bold mt-0.5 ${t.textPrimary}`}>
                            {formatINR(arch.myEventsTotal)}
                          </div>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${t.subtleBg}`}>
                          <div className={t.textSecondary}>10% Commission</div>
                          <div className="font-bold mt-0.5 text-emerald-600 dark:text-emerald-400">
                            {formatINR(arch.myCommissionTotal)}
                          </div>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${t.subtleBg}`}>
                          <div className={t.textSecondary}>{names.me} Expenses</div>
                          <div className="font-bold mt-0.5 text-rose-600 dark:text-rose-400">
                            {formatINR(arch.myTotalExpenses)}
                          </div>
                        </div>
                        <div className={`p-2.5 rounded-xl border ${t.subtleBg}`}>
                          <div className={t.textSecondary}>Carry Forward</div>
                          <div className="font-bold mt-0.5 text-indigo-600 dark:text-indigo-400">
                            {formatINR(arch.newCarryForwardToNextCycle)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {monthSubTab === 'EXCEL' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`rounded-2xl p-4 sm:p-5 border space-y-3 ${t.cardBg} ${t.border} ${t.shadow}`}>
                  <h3 className={`text-sm font-extrabold ${t.textPrimary}`}>
                    Export to Excel / Google Sheets
                  </h3>
                  <p className={`text-xs ${t.textSecondary}`}>
                    Download a complete `.CSV` file for {activeCycleMonth.month} {activeCycleMonth.year} or copy rows directly.
                  </p>
                  <button
                    type="button"
                    onClick={handleDownloadCSV}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-transform"
                  >
                    <Download className="w-4 h-4" /> Download Master Excel (.CSV)
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyForSheets}
                    className={`w-full py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform ${t.subtleBg}`}
                  >
                    {copiedId === 'SUMMARY' ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-500" /> Copied to Clipboard!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" /> Copy Summary for Google Sheets
                      </>
                    )}
                  </button>
                </div>

                <div className={`rounded-2xl p-4 sm:p-5 border space-y-3 ${t.cardBg} ${t.border} ${t.shadow}`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-extrabold ${t.textPrimary}`}>
                      Import Rows from Excel
                    </h3>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload .CSV
                    </button>
                  </div>

                  <select
                    value={pasteTarget}
                    onChange={(e) => setPasteTarget(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2.5 text-base border focus:outline-none ${t.inputBg}`}
                  >
                    <option value="MY_EXPENSES">Import as: {names.me}&apos;s Expenses</option>
                    <option value="MY_EVENTS">Import as: {names.me}&apos;s Events (10% Cut)</option>
                    <option value="BROTHER_EVENTS">Import as: {names.brother}&apos;s Events</option>
                    <option value="BROTHER_EXPENSES">
                      Import as: {names.brother}&apos;s Reference Expenses
                    </option>
                  </select>

                  <textarea
                    rows={3}
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    placeholder={`Paste Excel rows (Name, Amount):\nVegetable Market, 15000\nHalwai Team, 22000`}
                    className={`w-full rounded-xl p-3 text-base border font-mono focus:outline-none ${t.inputBg}`}
                  />

                  <button
                    type="button"
                    onClick={handlePasteImport}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs transition-transform"
                  >
                    Import Rows Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================
          DEDICATED MODAL 1: ADD EXPENSE ONLY (Branded Bottom Sheet on Mobile)
         ========================================================= */}
      {addModalType === 'EXPENSE' && (
        <div
          onClick={() => setAddModalType(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`animate-sheet w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-5 max-h-[90dvh] overflow-y-auto overscroll-contain shadow-2xl ${t.cardBg} ${t.border}`}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Native Mobile Pull Indicator Pill */}
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${t.textPrimary}`}>Add Daily Expense</h3>
                  <p className={`text-[11px] ${t.textSecondary}`}>
                    Log catering expense for {names.me} or {names.brother}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalType(null)}
                className={`p-1.5 rounded-xl border active:scale-90 ${t.subtleBg} ${t.textSecondary}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${t.textSecondary}`}>
                  Who Paid This Expense?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExpPaidBy('ME')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border active:scale-95 transition-transform ${
                      expPaidBy === 'ME'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : `${t.subtleBg} ${t.textSecondary}`
                    }`}
                  >
                    {names.me} Paid (In Formula)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpPaidBy('BROTHER')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border active:scale-95 transition-transform ${
                      expPaidBy === 'BROTHER'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : `${t.subtleBg} ${t.textSecondary}`
                    }`}
                  >
                    {names.brother} Paid (Ref Only)
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                  Expense Item / Description *
                </label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="e.g., Paneer, Vegetables, Halwai Labor"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-base border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g., 15000"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-base font-bold tabular-nums border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                  />
                </div>

                {/* FREE-TEXT CATEGORY INPUT */}
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                    Category (Type Your Own)
                  </label>
                  <input
                    type="text"
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    placeholder="e.g., Raw Material, Halwai, Gas"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-base border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                  Link to Event (Optional)
                </label>
                <select
                  value={expEventId}
                  onChange={(e) => setExpEventId(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-base border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                >
                  <option value="GENERAL">Daily / General Catering Expense</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.clientName} ({ev.broughtBy === 'ME' ? names.me : names.brother})
                    </option>
                  ))}
                </select>
              </div>

              <ClickableDateInput
                label="Expense Date"
                value={expDate}
                onChange={setExpDate}
                isDark={isDark}
              />

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-transform"
              >
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          DEDICATED MODAL 2: ADD EVENT ONLY (Branded Bottom Sheet on Mobile)
         ========================================================= */}
      {addModalType === 'EVENT' && (
        <div
          onClick={() => setAddModalType(null)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`animate-sheet w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-5 max-h-[90dvh] overflow-y-auto overscroll-contain shadow-2xl ${t.cardBg} ${t.border}`}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            {/* Native Mobile Pull Indicator Pill */}
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${t.textPrimary}`}>
                    Add Catering Event
                  </h3>
                  <p className={`text-[11px] ${t.textSecondary}`}>
                    Record client booking for {names.me} or {names.brother}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalType(null)}
                className={`p-1.5 rounded-xl border active:scale-90 ${t.subtleBg} ${t.textSecondary}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3.5">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${t.textSecondary}`}>
                  Who Brought This Client?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvtBroughtBy('ME')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border active:scale-95 transition-transform ${
                      evtBroughtBy === 'ME'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : `${t.subtleBg} ${t.textSecondary}`
                    }`}
                  >
                    {names.me} (Gets 10% Cut)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvtBroughtBy('BROTHER')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border active:scale-95 transition-transform ${
                      evtBroughtBy === 'BROTHER'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : `${t.subtleBg} ${t.textSecondary}`
                    }`}
                  >
                    {names.brother} (0% Cut)
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                  Client / Event Name *
                </label>
                <input
                  type="text"
                  required
                  value={evtClient}
                  onChange={(e) => setEvtClient(e.target.value)}
                  placeholder="e.g., Gupta Wedding Reception"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-base border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                  Full Event Package Amount (₹) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  value={evtAmount}
                  onChange={(e) => setEvtAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 100000"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-base font-bold tabular-nums border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                />
                {evtBroughtBy === 'ME' && Number(evtAmount) > 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1 tabular-nums">
                    <Sparkles className="w-3.5 h-3.5" /> {names.me}&apos;s 10% Commission ={' '}
                    {formatINR(Number(evtAmount) * 0.1)}
                  </p>
                )}
              </div>

              <ClickableDateInput
                label="Event Date"
                value={evtDate}
                onChange={setEvtDate}
                isDark={isDark}
              />

              <div>
                <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={evtNotes}
                  onChange={(e) => setEvtNotes(e.target.value)}
                  placeholder="e.g., 400 plates indoor buffet"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-base border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-transform"
              >
                Save Catering Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: INSTALL ON ANDROID (APK / WEBAPK) & iOS SAFARI
         ========================================================= */}
      {showInstallModal && (
        <div
          onClick={() => setShowInstallModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`animate-sheet w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border p-5 max-h-[90dvh] overflow-y-auto overscroll-contain space-y-4 shadow-2xl ${t.cardBg} ${t.border}`}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`text-base font-extrabold ${t.textPrimary}`}>
                    Install App on Android &amp; iOS
                  </h3>
                  <p className={`text-xs ${t.textSecondary}`}>
                    Full-screen mobile app with top &amp; bottom safe-area support
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className={`p-1.5 rounded-xl border active:scale-90 ${t.subtleBg}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Android Section */}
            <div className={`p-4 rounded-2xl border space-y-3 ${t.subtleBg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Option 1 • Android Phone (APK / WebAPK)
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                  Chrome / Edge
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${t.textSecondary}`}>
                Install directly on Android as a standalone app icon or download the portable offline HTML package:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleTriggerNativeInstall}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-transform"
                >
                  <Smartphone className="w-4 h-4" /> Install Android WebAPK
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMobileAppPackage}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform ${t.cardBg} ${t.textPrimary} ${t.border}`}
                >
                  <Download className="w-4 h-4 text-indigo-500" /> Download Offline Package
                </button>
              </div>
              <div className={`text-[11px] space-y-1 pt-1 ${t.textSecondary}`}>
                <div>
                  • In Android Chrome: Tap the <strong>⋮ (3-dots menu)</strong> → Select{' '}
                  <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>.
                </div>
              </div>
            </div>

            {/* iOS Safari Section */}
            <div className={`p-4 rounded-2xl border space-y-2.5 ${t.subtleBg}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Option 2 • iPhone / iPad (iOS Safari)
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                  Safari Browser
                </span>
              </div>
              <p className={`text-xs leading-relaxed ${t.textSecondary}`}>
                Apple iOS installs web apps directly from <strong>Safari</strong> with full notch &amp; home-bar safe areas:
              </p>
              <ol className={`text-xs space-y-1.5 list-decimal list-inside font-medium ${t.textPrimary}`}>
                <li>
                  Open this link in <strong>Safari</strong> on your iPhone.
                </li>
                <li className="flex items-center gap-1.5 flex-wrap">
                  <span>Tap the</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-bold">
                    <Share className="w-3.5 h-3.5" /> Share
                  </span>
                  <span>button at the bottom of Safari.</span>
                </li>
                <li>
                  Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong>.
                </li>
                <li>
                  Tap <strong>&quot;Add&quot;</strong> in the top-right corner. It will appear on your iPhone home screen like a native app!
                </li>
              </ol>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-bold text-xs transition-transform"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: CLOSE MONTH & SAVE COPY
         ========================================================= */}
      {showSettleModal && (
        <div
          onClick={() => setShowSettleModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`animate-sheet w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border p-5 max-h-[90dvh] overflow-y-auto overscroll-contain space-y-4 shadow-2xl ${t.cardBg} ${t.border}`}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className={`text-base font-extrabold ${t.textPrimary}`}>
                  Close Monthly Cycle &amp; Save Copy
                </h3>
                <p className={`text-xs ${t.textSecondary}`}>
                  Archives this month and carries forward any unpaid balance.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className={`p-1.5 rounded-xl border active:scale-90 ${t.subtleBg}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseAndArchiveMonth} className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                    Month Name
                  </label>
                  <select
                    value={closeMonthName}
                    onChange={(e) => setCloseMonthName(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2.5 text-base font-bold border ${t.inputBg}`}
                  >
                    {MONTH_NAMES.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                    Year (Any Year)
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setCloseMonthYear(
                          String((parseInt(closeMonthYear, 10) || new Date().getFullYear()) - 1)
                        )
                      }
                      className={`px-2.5 py-2.5 rounded-xl border font-bold text-sm active:scale-90 transition-transform ${t.subtleBg}`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      required
                      value={closeMonthYear}
                      onChange={(e) => setCloseMonthYear(e.target.value)}
                      placeholder="YYYY"
                      className={`w-full rounded-xl px-2 py-2.5 text-base font-bold text-center border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setCloseMonthYear(
                          String((parseInt(closeMonthYear, 10) || new Date().getFullYear()) + 1)
                        )
                      }
                      className={`px-2.5 py-2.5 rounded-xl border font-bold text-sm active:scale-90 transition-transform ${t.subtleBg}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${t.subtleBg}`}>
                <span className="text-xs font-semibold">
                  Closing Balance ({closeMonthName} {closeMonthYear}):
                </span>
                <span className={`text-base font-black tabular-nums ${t.textPrimary}`}>
                  {calculations.netBalance < 0 ? '-' : ''}
                  {formatINR(calculations.netBalance)}
                </span>
              </div>

              {Math.abs(calculations.netBalance) > 0 && (
                <div className="space-y-2">
                  <label className={`block text-xs font-semibold ${t.textSecondary}`}>
                    How are you settling this balance?
                  </label>
                  {[
                    {
                      id: 'FULL',
                      title: `Paid in Full (${formatINR(calculations.netBalance)})`,
                      desc: 'Next month starts cleanly at ₹0.'
                    },
                    {
                      id: 'PARTIAL',
                      title: 'Partial Payment Made Today',
                      desc: 'Remaining balance carries forward to next month.'
                    },
                    {
                      id: 'NONE',
                      title: 'Carry Forward Entire Balance',
                      desc: `Full ${formatINR(calculations.netBalance)} carries to next month.`
                    }
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      onClick={() => setClosePaidOption(opt.id)}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        closePaidOption === opt.id
                          ? isDark
                            ? 'bg-indigo-500/15 border-indigo-500/40'
                            : 'bg-indigo-50 border-indigo-300'
                          : t.subtleBg
                      }`}
                    >
                      <input
                        type="radio"
                        checked={closePaidOption === opt.id}
                        onChange={() => setClosePaidOption(opt.id)}
                        className="mt-1"
                      />
                      <div className="text-xs">
                        <div className={`font-bold ${t.textPrimary}`}>{opt.title}</div>
                        <div className={t.textSecondary}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}

                  {closePaidOption === 'PARTIAL' && (
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={closeCustomPaid}
                      onChange={(e) => setCloseCustomPaid(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter amount paid today (₹)"
                      className={`w-full rounded-xl px-3.5 py-2.5 text-base font-bold tabular-nums border ${t.inputBg}`}
                    />
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-transform"
              >
                Save &quot;{closeMonthName} {closeMonthYear}&quot; &amp; Start Next Month
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: SETTLE CARRY FORWARD BALANCE AT ANY POINT
         ========================================================= */}
      {showSettleCarryModal && (
        <div
          onClick={() => setShowSettleCarryModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`animate-sheet w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl border p-5 max-h-[90dvh] overflow-y-auto overscroll-contain space-y-4 shadow-2xl ${t.cardBg} ${t.border}`}
            style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-1 sm:hidden" />

            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className={`text-base font-extrabold ${t.textPrimary}`}>
                  Settle Carry Forward Balance
                </h3>
                <p className={`text-xs ${t.textSecondary}`}>
                  Clear full or partial previous balance anytime during the month
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSettleCarryModal(false)}
                className={`p-1.5 rounded-xl border active:scale-90 ${t.subtleBg}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSettleCarryForwardNow} className="space-y-4">
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${t.subtleBg}`}>
                <div className="text-xs">
                  <div className={t.textSecondary}>Current Carry Forward</div>
                  <div className={`font-bold mt-0.5 ${t.textPrimary}`}>
                    {calculations.carryForwardAmount > 0
                      ? `${names.me} Owes ${names.brother}`
                      : `${names.brother} Owes ${names.me}`}
                  </div>
                </div>
                <span className={`text-lg font-black tabular-nums ${t.textPrimary}`}>
                  {formatINR(calculations.carryForwardAmount)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCarrySettleMode('FULL')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border active:scale-95 transition-transform ${
                    carrySettleMode === 'FULL'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : `${t.subtleBg} ${t.textSecondary}`
                  }`}
                >
                  Settle Full ({formatINR(calculations.carryForwardAmount)})
                </button>
                <button
                  type="button"
                  onClick={() => setCarrySettleMode('PARTIAL')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border active:scale-95 transition-transform ${
                    carrySettleMode === 'PARTIAL'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : `${t.subtleBg} ${t.textSecondary}`
                  }`}
                >
                  Partial Payment
                </button>
              </div>

              {carrySettleMode === 'PARTIAL' && (
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${t.textSecondary}`}>
                    Enter Amount Paid Now (₹) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={carrySettleCustom}
                    onChange={(e) => setCarrySettleCustom(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder={`Max ${Math.abs(calculations.carryForwardAmount)}`}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-base font-bold tabular-nums border focus:outline-none focus:border-indigo-600 ${t.inputBg}`}
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold text-sm shadow-sm transition-transform"
              >
                {carrySettleMode === 'FULL'
                  ? `Mark ${formatINR(calculations.carryForwardAmount)} as Settled`
                  : 'Update Carry Forward Balance'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          BRANDED MOBILE BOTTOM NAVIGATION BAR (WITH ACTIVE PILL & SAFE AREA)
         ========================================================= */}
      <nav
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t backdrop-blur-xl ${t.headerBg}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="grid grid-cols-5 h-16 max-w-md mx-auto items-center px-1.5">
          <button
            type="button"
            onClick={() => switchTabFast('home')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl active:scale-90 transition-transform ${
              activeTab === 'home'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                : t.textSecondary
            }`}
          >
            {activeTab === 'home' && (
              <span className="absolute -top-1 w-5 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          <button
            type="button"
            onClick={() => switchTabFast('events')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl active:scale-90 transition-transform ${
              activeTab === 'events'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                : t.textSecondary
            }`}
          >
            {activeTab === 'events' && (
              <span className="absolute -top-1 w-5 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Events</span>
          </button>

          {/* Center + Add Expense Button */}
          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={() => openAddExpenseModal('ME')}
              aria-label="Add Expense"
              className="w-12 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 flex items-center justify-center active:scale-90 transition-transform"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => switchTabFast('expenses')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl active:scale-90 transition-transform ${
              activeTab === 'expenses'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                : t.textSecondary
            }`}
          >
            {activeTab === 'expenses' && (
              <span className="absolute -top-1 w-5 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Expenses</span>
          </button>

          <button
            type="button"
            onClick={() => switchTabFast('month')}
            className={`relative flex flex-col items-center justify-center py-1 rounded-xl active:scale-90 transition-transform ${
              activeTab === 'month'
                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                : t.textSecondary
            }`}
          >
            {activeTab === 'month' && (
              <span className="absolute -top-1 w-5 h-1 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
            <CalendarCheck className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Month</span>
          </button>
        </div>
      </nav>
      </div>
    </div>
  );
}