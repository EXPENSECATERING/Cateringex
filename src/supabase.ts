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
  last_edited_by?: string;
  last_edited_at?: string;
  edit_reason?: string;
  edit_history?: any[];
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
  last_edited_by?: string;
  last_edited_at?: string;
  edit_reason?: string;
  edit_history?: any[];
}

// Convert app Event to DB Event
export const toDBEvent = (e: any): any => {
  const obj: any = {
    id: e.id,
    client_name: e.clientName,
    date: e.date,
    total_amount: Number(e.totalAmount) || 0,
    brought_by: e.broughtBy,
    notes: e.notes || '',
  };
  if (e.lastEditedBy) obj.last_edited_by = e.lastEditedBy;
  if (e.lastEditedAt) obj.last_edited_at = e.lastEditedAt;
  if (e.editReason) obj.edit_reason = e.editReason;
  if (e.editHistory) obj.edit_history = e.editHistory;
  return obj;
};

// Convert DB Event to app Event
export const fromDBEvent = (row: any) => ({
  id: row.id,
  clientName: row.client_name,
  date: row.date,
  totalAmount: Number(row.total_amount) || 0,
  broughtBy: row.brought_by,
  notes: row.notes || '',
  lastEditedBy: row.last_edited_by || null,
  lastEditedAt: row.last_edited_at || null,
  editReason: row.edit_reason || null,
  editHistory: row.edit_history || [],
});

// Convert app Expense to DB Expense
export const toDBExpense = (x: any): any => {
  const obj: any = {
    id: x.id,
    title: x.title,
    category: x.category || 'General',
    amount: Number(x.amount) || 0,
    paid_by: x.paidBy,
    event_id: x.eventId || 'GENERAL',
    date: x.date,
  };
  if (x.lastEditedBy) obj.last_edited_by = x.lastEditedBy;
  if (x.lastEditedAt) obj.last_edited_at = x.lastEditedAt;
  if (x.editReason) obj.edit_reason = x.editReason;
  if (x.editHistory) obj.edit_history = x.editHistory;
  return obj;
};

// Convert DB Expense to app Expense
export const fromDBExpense = (row: any) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  amount: Number(row.amount) || 0,
  paidBy: row.paid_by,
  eventId: row.event_id || 'GENERAL',
  date: row.date,
  lastEditedBy: row.last_edited_by || null,
  lastEditedAt: row.last_edited_at || null,
  editReason: row.edit_reason || null,
  editHistory: row.edit_history || [],
});
