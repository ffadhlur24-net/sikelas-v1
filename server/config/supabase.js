import 'dotenv/config'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: Missing Supabase URL or Service Key")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default supabase
