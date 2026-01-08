# 🚀 Render Deployment Guide

## Overview

This guide explains how to deploy the IWC Approval Portal to Render.com. The application uses:
- **Node.js** backend with Express.js
- **PostgreSQL 17** database
- **Clerk** for authentication
- **Marinesia & AISStream** APIs for vessel data

---

## Prerequisites

1. A [Render.com](https://render.com) account
2. A [Clerk.com](https://clerk.com) account
3. Your code pushed to GitHub

---

## Step 1: Clerk Setup (Production)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. **Create a Production Instance** (not Development):
   - Click your app name → Settings → Instances
   - Create a new production instance
3. Copy your **Production** API keys:
   - `CLERK_PUBLISHABLE_KEY` (starts with `pk_live_`)
   - `CLERK_SECRET_KEY` (starts with `sk_live_`)

> ⚠️ **Important**: Use production keys for Render, not test keys!

---

## Step 2: Push to GitHub

Make sure all files are committed and pushed:

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

---

## Step 3: Set Environment Variables in Render

After your first deploy (or before), go to your **Render Dashboard**:

1. Select your web service (`iwc-approval-portal`)
2. Click **Environment** in the sidebar
3. Add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `CLERK_PUBLISHABLE_KEY` | `pk_live_xxxxx` | From Clerk production instance |
| `CLERK_SECRET_KEY` | `sk_live_xxxxx` | From Clerk production instance |
| `MARINESIA_API_KEY` | `JlOZeHWxHmsGRViFvaVwSNiCH` | Your Marinesia API key |
| `AISSTREAM_API_KEY` | `38bd336ae27761db109eec3c6d6c684c404708b0` | Your AISStream API key |

The following are **auto-configured** by `render.yaml`:
- `NODE_ENV` = production
- `DATABASE_URL` = auto-connected to Render PostgreSQL
- `SESSION_SECRET` = auto-generated
- `CLIENT_URL` = your app URL

---

## Step 4: Configure Clerk Redirect URLs

In your Clerk Dashboard (production instance):

1. Go to **Paths** (or **URLs** in older UI)
2. Add these URLs:
   - **Sign-in URL**: `https://iwc-approval-portal.onrender.com/login.html`
   - **Sign-up URL**: `https://iwc-approval-portal.onrender.com/login.html`
   - **After sign-in URL**: `https://iwc-approval-portal.onrender.com/`
   - **After sign-up URL**: `https://iwc-approval-portal.onrender.com/`

3. Go to **Domains** (if available):
   - Add `iwc-approval-portal.onrender.com` as an allowed domain

---

## Step 5: Update CLIENT_URL (After First Deploy)

1. After your first deploy, Render will assign you a URL like:
   `https://iwc-approval-portal.onrender.com`

2. If your URL is different, update `CLIENT_URL` in Render Environment Variables

3. Also update it in `render.yaml` for future deploys:
   ```yaml
   - key: CLIENT_URL
     value: https://YOUR-ACTUAL-URL.onrender.com
   ```

---

## Step 6: Verify Deployment

After deployment completes:

1. **Check Health**: Visit `https://your-app.onrender.com/api/health`
   - Should return `{ "status": "ok", ... }`

2. **Check Services**: Visit `https://your-app.onrender.com/health`
   - Verify `marinesia` and `aisstream` show `"available"`

3. **Test Login**: 
   - Visit your app URL
   - Click "Sign In with Google" (or your configured provider)
   - Should redirect through Clerk and back to your app

---

## Troubleshooting

### "Database connection failed"
- Wait 2-3 minutes after first deploy for database to initialize
- Check Render logs for specific error messages

### "Clerk authentication not working"
- Verify you're using **production** keys, not test keys
- Check Clerk Dashboard for any errors
- Ensure redirect URLs are configured correctly

### "Marinesia/AISStream not working"
- Verify API keys are set in Render Environment Variables
- Check Render logs for connection errors

### "CORS errors"
- Update `CLIENT_URL` to match your actual Render URL
- Redeploy after changing

---

## Manual Deploy (if auto-deploy is off)

```bash
# Trigger a deploy from Render Dashboard
# OR use Render CLI:
render deploys create --service iwc-approval-portal
```

---

## Database Migrations

If you need to run migrations in production:

1. Go to Render Dashboard → Shell
2. Run: `npx prisma db push`

Or add to your build command in `render.yaml`:
```yaml
buildCommand: npm install && npx prisma generate && npx prisma db push
```

---

## Environment Variables Summary

| Variable | Required | Source |
|----------|----------|--------|
| `NODE_ENV` | ✅ | Auto (render.yaml) |
| `DATABASE_URL` | ✅ | Auto (Render DB) |
| `SESSION_SECRET` | ✅ | Auto (generated) |
| `CLIENT_URL` | ✅ | Auto (render.yaml) |
| `CLERK_PUBLISHABLE_KEY` | ✅ | Manual (Clerk Dashboard) |
| `CLERK_SECRET_KEY` | ✅ | Manual (Clerk Dashboard) |
| `MARINESIA_API_KEY` | Optional | Manual |
| `AISSTREAM_API_KEY` | Optional | Manual |

---

## File Structure for Deployment

```
├── server/
│   └── index.js          # Main server entry point
├── public/               # Static files served by Express
│   ├── index.html
│   ├── login.html
│   ├── css/
│   └── js/
├── prisma/
│   └── schema.prisma     # Database schema
├── package.json          # npm scripts & dependencies
├── render.yaml           # Render configuration
└── .env                  # Local only (not deployed)
```

---

## Post-Deployment Checklist

- [ ] App loads without errors
- [ ] `/api/health` returns OK
- [ ] Clerk sign-in works
- [ ] Form autosave works
- [ ] Vessel search returns results (Marinesia)
- [ ] Generate WMS produces document
- [ ] Print/Save PDF works

