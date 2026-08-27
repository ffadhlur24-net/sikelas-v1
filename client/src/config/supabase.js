// ==========================================
// Client Supabase Instance (Realtime Subscriptions)
// ==========================================

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://mhruetsjhvuzkihgdael.supabase.co"
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocnVldHNqaHZ1emtpaGdkYWVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMDM1MzksImV4cCI6MjA5ODg3OTUzOX0.YOUR_PUBLIC_ANON_KEY"
export const supabaseClient = createClient(supabaseUrl, supabaseKey)
