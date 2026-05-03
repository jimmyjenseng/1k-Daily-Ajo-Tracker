import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sthgxmutwodienywfoxl.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aGd4bXV0d29kaWVueXdmb3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MzY2NjIsImV4cCI6MjA5MzMxMjY2Mn0.EEE2aADRx-R4OmoEqiry7EGDlr6TZowKBupocoeRGYk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
