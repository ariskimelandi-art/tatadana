export type UserPlan = 'starter' | 'pro';
export type UserRole = 'user' | 'admin';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type WalletType = 'cash' | 'bank' | 'ewallet' | 'investment';
export type TransactionType = 'expense' | 'income' | 'transfer';
export type TransactionSource = 'web' | 'telegram_text' | 'telegram_receipt' | 'telegram_voice';
export type AIProviderName = 'gemini' | 'openai' | 'deepseek';
export type FailoverMode = 'single' | 'parallel';
export type PaymentMethod = 'midtrans' | 'manual_transfer';
export type PaymentStatus = 'pending' | 'paid' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  email?: string | null;
  full_name: string;
  avatar_url?: string | null;
  phone_number?: string | null;
  phone_verified: boolean;
  telegram_chat_id?: number | null;
  telegram_username?: string | null;
  telegram_bot_token?: string | null;
  telegram_link_token?: string | null;
  plan: UserPlan;
  default_wallet_id?: string | null;
  role: UserRole;
  approval_status: ApprovalStatus;
  currency: string;
  monthly_tx_count: number;
  last_tx_month: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  is_default: boolean;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  is_custom: boolean;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  month: number;
  year: number;
  alert_80_sent: boolean;
  alert_100_sent: boolean;
  created_at: string;
  updated_at: string;
  category?: Category;
  spent?: number;
  remaining?: number;
  percentage?: number;
}

export interface ReceiptItem {
  name: string;
  qty: number;
  price: number;
  total: number;
  category_suggestion?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string | null;
  destination_wallet_id?: string | null;
  type: TransactionType;
  amount: number;
  description?: string | null;
  transaction_date: string;
  receipt_image_url?: string | null;
  receipt_items?: ReceiptItem[];
  is_receipt_parent: boolean;
  parent_transaction_id?: string | null;
  source: TransactionSource;
  created_at: string;
  wallet?: Wallet;
  destination_wallet?: Wallet;
  category?: Category;
}

export interface ReminderSetting {
  id: string;
  user_id: string;
  is_active: boolean;
  frequency: '1x' | '2x';
  time_1: string;
  time_2: string;
  custom_message?: string | null;
  updated_at: string;
}

export interface AIProviderConfig {
  id: string;
  provider_name: AIProviderName;
  model_name: string;
  api_key_encrypted: string;
  is_active: boolean;
  is_default: boolean;
  priority: number;
  failover_mode: FailoverMode;
  created_at: string;
  updated_at: string;
}

export interface AILogEntry {
  id: string;
  user_id?: string | null;
  provider: string;
  feature: 'nlp_text' | 'receipt_ocr' | 'voice_transcribe' | 'financial_advisor' | 'category_recommendation';
  input_snippet?: string | null;
  output_snippet?: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  latency_ms: number;
  status: 'success' | 'error';
  error_message?: string | null;
  created_at: string;
  profile?: {
    full_name: string;
    phone_number?: string | null;
  };
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  order_id: string;
  plan: UserPlan;
  amount: number;
  payment_method: PaymentMethod;
  status: PaymentStatus;
  proof_image_url?: string | null;
  midtrans_snap_token?: string | null;
  midtrans_response?: any;
  approved_by?: string | null;
  approved_at?: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface ExportHistoryRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  format: 'pdf' | 'xlsx';
  period_start?: string | null;
  period_end?: string | null;
  expires_at: string;
  created_at: string;
}

export interface ParsedTransactionResult {
  jenis: 'pengeluaran' | 'pemasukan' | 'transfer';
  nominal: number;
  kategori: string;
  catatan: string;
  nama_wallet?: string;
  tujuan_wallet?: string;
  is_ambiguous?: boolean;
  error_reason?: string;
}

export interface ChatQuickAction {
  label: string;
  action?: string;
  href?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  quickActions?: ChatQuickAction[];
}

