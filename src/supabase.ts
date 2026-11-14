import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://pnsagffhylqftfyijxmt.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_401wBiZ1bQx6cHABBwGqGg_18jaQ_S7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export interface DBEvent {
  id: string;
  client_name: string;
  date: string;
  total_amount: number;
  brought_by: string;
  notes?: string;
  created_at?: string;
}

export interface DBExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  paid_by: string;
  event_id?: string;
  date: string;
  created_at?: string;
}

// Convert app Event to DB Event
export const toDBEvent = (e: any): DBEvent => ({
  id: e.id,
  client_name: e.clientName,
  date: e.date,
  total_amount: Number(e.totalAmount) || 0,
  brought_by: e.broughtBy,
  notes: e.notes || '',
});

// Convert DB Event to app Event
export const fromDBEvent = (row: DBEvent) => ({
  id: row.id,
  clientName: row.client_name,
  date: row.date,
  totalAmount: Number(row.total_amount) || 0,
  broughtBy: row.brought_by,
  notes: row.notes || '',
});

// Convert app Expense to DB Expense
export const toDBExpense = (x: any): DBExpense => ({
  id: x.id,
  title: x.title,
  category: x.category || 'General',
  amount: Number(x.amount) || 0,
  paid_by: x.paidBy,
  event_id: x.eventId || 'GENERAL',
  date: x.date,
});

// Convert DB Expense to app Expense
export const fromDBExpense = (row: DBExpense) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  amount: Number(row.amount) || 0,
  paidBy: row.paid_by,
  eventId: row.event_id || 'GENERAL',
  date: row.date,
});
