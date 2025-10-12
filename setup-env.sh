#!/bin/bash
# Setup environment variables for Zlyzer

cat > .env.local << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://kukwbyphnxxmhywprmup.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt1a3dieXBobnh4bWh5d3BybXVwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODUzMjMsImV4cCI6MjA2ODk2MTMyM30.bjZjBbR13d2k0DLslpOmqZOffZ06iQFLJK3RaNkRCyY

# API Configuration
VITE_API_BASE_URL=http://localhost:3000
EOF

echo "✅ Environment variables created in .env.local"
echo "⚠️  Remember to update VITE_API_BASE_URL if your backend runs on a different port"

