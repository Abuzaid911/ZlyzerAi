# Deployment Configuration Guide

This guide covers the necessary configuration for deploying Zlyzer with proper OAuth authentication.

## 🔐 Supabase Configuration

### 1. Authentication Settings

Navigate to **Supabase Dashboard** → **Authentication** → **URL Configuration**

#### Site URL
Set your production URL:
```
https://zlyzer-ai.vercel.app
```

#### Redirect URLs (PKCE Flow)
Add these URLs to support OAuth callbacks:

**Production:**
```
https://zlyzer-ai.vercel.app/auth/callback
https://zlyzer-ai.vercel.app/callback
```

**Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/callback
http://localhost:5173/auth/callback
http://localhost:5173/callback
```

**OR use wildcards (recommended):**
```
https://zlyzer-ai.vercel.app/**
http://localhost:3000/**
http://localhost:5173/**
```

#### OAuth Provider Settings

**Google OAuth:**
1. Go to **Authentication** → **Providers** → **Google**
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Save changes

---

## 🚀 Vercel Configuration

### 1. SPA Rewrites (vercel.json)

The project includes a `vercel.json` file that handles SPA routing. This ensures all routes redirect to `index.html` for client-side routing:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This file should be in the root of your project.

### 2. Environment Variables

Set these in **Vercel Dashboard** → **Settings** → **Environment Variables**:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=https://zanalyzer.fly.dev
```

### 3. Build Settings

**Framework Preset:** Vite  
**Build Command:** `npm run build`  
**Output Directory:** `dist`  
**Install Command:** `npm install`

---

## 🔧 OAuth Flow Details

### PKCE Flow (Preferred)
This project uses PKCE (Proof Key for Code Exchange) for secure OAuth:

1. **Authorization Request:**
   - User clicks "Sign In"
   - App redirects to Google with a code challenge
   - Current path saved in `sessionStorage` as `postAuthRedirect`

2. **Callback:**
   - Google redirects to `/auth/callback?code=...`
   - App calls `exchangeCodeForSession(code)`
   - Session is established securely

3. **Redirect:**
   - User is redirected to stored path or `/dashboard`
   - `postAuthRedirect` is removed from storage

### Legacy Hash Token Support
For backwards compatibility, the app also handles legacy implicit flow tokens:

- Format: `/callback#access_token=...&refresh_token=...`
- Tokens are immediately cleaned from URL using `replaceState`
- ⚠️ This is less secure; migrate to PKCE when possible

---

## 🛡️ Security Best Practices

### 1. Never Log Token URLs
```typescript
// ❌ DON'T
console.log('Callback URL:', window.location.href);

// ✅ DO
console.log('Processing OAuth callback...');
```

### 2. Clean Up URLs After Processing
```typescript
// Remove tokens from browser history
window.history.replaceState(null, '', window.location.pathname);
```

### 3. Use Explicit Callback URLs
```typescript
// ❌ DON'T
redirectTo: window.location.href

// ✅ DO
redirectTo: `${window.location.origin}/auth/callback`
```

### 4. Store Minimal Data
Only store the redirect path, never store tokens in `sessionStorage`:
```typescript
sessionStorage.setItem('postAuthRedirect', '/video-analysis');
```

---

## 📋 Checklist

### Before Deployment:
- [ ] Update Supabase Site URL
- [ ] Add all redirect URLs to Supabase
- [ ] Configure Google OAuth in Supabase
- [ ] Set environment variables in Vercel
- [ ] Verify `vercel.json` exists in root
- [ ] Test OAuth flow in development

### After Deployment:
- [ ] Test sign-in flow on production
- [ ] Verify redirect to intended page works
- [ ] Test sign-out functionality
- [ ] Clear browser storage and test fresh auth
- [ ] Verify no tokens appear in browser history

---

## 🐛 Troubleshooting

### 404 on Callback
**Problem:** Getting 404 on `/auth/callback`  
**Solution:** 
1. Verify `vercel.json` has SPA rewrites
2. Check that routes exist in `App.tsx`
3. Redeploy Vercel app

### "No authorization code found"
**Problem:** Callback URL has no `?code=` or hash tokens  
**Solution:**
1. Check Supabase redirect URLs match exactly
2. Verify Google OAuth is enabled in Supabase
3. Clear browser cache and try again

### Session Not Persisting
**Problem:** User signs in but session doesn't persist  
**Solution:**
1. Verify `exchangeCodeForSession()` is being called
2. Check browser console for errors
3. Ensure no browser extensions are blocking cookies

### Stuck on Loading Screen
**Problem:** Callback page doesn't redirect  
**Solution:**
1. Check console for JavaScript errors
2. Verify `postAuthRedirect` is set before auth
3. Try signing in from home page first

---

## 📞 Support

For issues related to:
- **Supabase:** [Supabase Discord](https://discord.supabase.com/)
- **Vercel:** [Vercel Support](https://vercel.com/support)
- **This Project:** Check GitHub issues

---

## 🔄 Migration from Legacy Flow

If you're migrating from hash-based tokens to PKCE:

1. The app already supports both flows
2. Update all redirect URLs in Supabase
3. No code changes needed
4. Legacy users will automatically migrate on next sign-in
5. Monitor console for "Using legacy hash token flow" warnings
6. Once all users migrated, you can remove legacy support

---

Last Updated: October 2025

