// ===============================
// Koneksi ke Supabase Database
// ===============================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY


// Server Role Key
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default supabase
