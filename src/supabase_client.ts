import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yxkbvrpqjhutlzngywji.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4a2J2cnBxamh1dGx6bmd5d2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODUzNDg5NDQsImV4cCI6MjAwMDkyNDk0NH0.I6_D8Pt8wzS19vx9QjObmhGijH49L2n9BKnbqtuSkN4';

const supabase = createClient(supabaseUrl, supabaseKey)

export default supabase;