import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jicgcmigrnvejhmnvvcs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppY2djbWlncm52ZWpobW52dmNzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTEwMTMsImV4cCI6MjA5MzM4NzAxM30.8wonSsJFi7sbuTnzECAievffMTn5xwDQ6q-U3eLVTiw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
