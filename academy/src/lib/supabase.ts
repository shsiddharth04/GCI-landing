import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tyxioxfmkflzokzvfaxc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eGlveGZta2Zsem9renZmYXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM5NDQxNjksImV4cCI6MjA5OTUyMDE2OX0.v4X5TauEfXx7yQZkBUeBLMYWwlGekfSGKbJ1hu4Y5VU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
