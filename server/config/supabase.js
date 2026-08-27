import 'dotenv/config'
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://mhruetsjhvuzkihgdael.supabase.co"
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocnVldHNqaHZ1emtpaGdkYWVsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzMwMzUzOSwiZXhwIjoyMDk4ODc5NTM5fQ.eAXH4TIR0skySpTol4P6-TljQZRa-vPzTwfQJdazkpo"

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export default supabase
