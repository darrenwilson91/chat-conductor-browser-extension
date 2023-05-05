import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://fejgqerwrcmnqqhgmwgh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZlamdxZXJ3cmNtbnFxaGdtd2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODMwMDM0ODYsImV4cCI6MTk5ODU3OTQ4Nn0.ex_M9R2CY05r64kr9wvXetmOGN7hS8NDmFheoGNpm0w';

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;