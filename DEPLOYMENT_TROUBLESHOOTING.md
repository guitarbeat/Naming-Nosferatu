# Vercel Deployment Troubleshooting Guide

## Issue: Build succeeds but site doesn't load

### Quick Checks

1. **Verify Vercel Project Settings:**
   - Framework Preset: `Vite` (or `Other`)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Check Build Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check if build completed successfully
   - Look for any warnings or errors

3. **Verify Environment Variables:**
   - Vercel Dashboard → Settings → Environment Variables
   - Ensure these are set:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)
   - Make sure they're set for **Production**, **Preview**, and **Development** environments

### Common Issues and Solutions

#### Issue 1: Blank Page / Scripts Not Loading

**Symptoms:**
- Page loads but shows blank white screen
- Browser console shows 404 errors for JavaScript files
- Network tab shows scripts returning 404

**Solution:**
1. Check that `vercel.json` has correct rewrites:
   ```json
   {
     "rewrites": [
       {
         "source": "/((?!api/|assets/).*)",
         "destination": "/index.html"
       }
     ]
   }
   ```

2. Verify build output structure:
   - Build should create `dist/index.html`
   - Scripts should be in `dist/assets/js/`
   - Check that Vite transformed the script tag in `dist/index.html`

3. Check Content Security Policy:
   - Ensure `script-src` includes `'self'`, `'unsafe-inline'`, and `blob:`
   - Current CSP in `vercel.json` should be sufficient

#### Issue 2: Environment Variables Missing

**Symptoms:**
- Error message about missing environment variables
- App shows configuration error screen
- Check browser console for environment variable errors

**Solution:**
1. Add environment variables in Vercel Dashboard
2. Ensure variable names start with `VITE_` prefix
3. Redeploy after adding variables

#### Issue 3: Build Output Directory Mismatch

**Symptoms:**
- Vercel shows "No Output Directory" error
- Build succeeds but nothing deploys

**Solution:**
1. Verify Output Directory is set to `dist` in Vercel project settings
2. Check that `vite.config.ts` has `outDir: resolveFromRoot('dist')`
3. Ensure build command outputs to `dist` directory

#### Issue 4: Script Tag Not Transformed

**Symptoms:**
- Browser tries to load `/src/index.jsx` (404 error)
- Script tag in deployed `index.html` still points to `/src/`

**Solution:**
1. Ensure `index.html` is in project root (not in `src/`)
2. Verify Vite is processing `index.html` during build
3. Check that build output `dist/index.html` has transformed script tags pointing to `/assets/js/`

### Debugging Steps

1. **Test Build Locally:**
   ```bash
   npm run build
   npm run preview
   ```
   - Visit `http://localhost:4173`
   - Check if site works locally
   - Inspect `dist/index.html` to see transformed script tags

2. **Check Browser Console:**
   - Open deployed site
   - Press F12 to open DevTools
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Verify Build Output:**
   ```bash
   npm run build
   ls -la dist/
   cat dist/index.html | grep script
   ```
   - Should see script tags pointing to `/assets/js/index-[hash].js`

4. **Check Vercel Function Logs:**
   - Vercel Dashboard → Your Project → Functions
   - Look for any runtime errors

### Verification Checklist

- [ ] Build command completes successfully
- [ ] Output directory is `dist`
- [ ] Environment variables are set in Vercel
- [ ] `vercel.json` has correct rewrites for SPA routing
- [ ] CSP allows scripts from `'self'`
- [ ] `dist/index.html` exists after build
- [ ] Script tags in `dist/index.html` point to `/assets/js/` (not `/src/`)
- [ ] No 404 errors in browser console
- [ ] No CSP violations in browser console

### Still Not Working?

1. **Check Vercel Build Logs:**
   - Look for any warnings or errors during build
   - Check if all dependencies installed correctly

2. **Try Clean Build:**
   ```bash
   rm -rf dist node_modules/.vite
   npm install
   npm run build
   ```

3. **Verify Vite Version:**
   - Current: `vite@^7.2.2`
   - Ensure compatibility with React 19

4. **Check for Known Issues:**
   - Vercel + Vite compatibility
   - React 19 + Vite compatibility
   - Check GitHub issues for your stack

### Contact Support

If none of the above works, provide:
- Vercel deployment URL
- Build logs from Vercel
- Browser console errors
- Contents of `dist/index.html` (first 50 lines)
- Output of `npm run build` locally
