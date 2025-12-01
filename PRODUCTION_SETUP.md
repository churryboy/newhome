# Production Deployment Setup

## Environment Variables Required for Vercel

For the app to work in production, configure these environment variables in Vercel Dashboard:

### 1. OPENAI_API_KEY
Your OpenAI API key for image analysis and solution generation.

**Where to add:** Vercel Dashboard → Project Settings → Environment Variables

```
Name: OPENAI_API_KEY
Value: sk-proj-YOUR_OPENAI_API_KEY
Environments: ✅ Production ✅ Preview ✅ Development
```

### 2. GOOGLE_SHEETS_WEBHOOK
Your Google Apps Script Web App URL for saving cart data.

**Where to add:** Vercel Dashboard → Project Settings → Environment Variables

```
Name: GOOGLE_SHEETS_WEBHOOK
Value: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
Environments: ✅ Production ✅ Preview ✅ Development
```

## After Adding Environment Variables

**IMPORTANT:** You must redeploy after adding/updating environment variables.

1. Go to **Deployments** tab in Vercel
2. Click **"..."** menu on latest deployment
3. Click **"Redeploy"**

OR

Push a new commit to GitHub to trigger automatic deployment.

## Verifying Production Setup

After deployment, check:

1. **OpenAI Integration:** Upload an image → Solution should generate
2. **Google Sheets Integration:** Complete a purchase → Email should appear in Google Sheet
3. **Console Logs:** Open browser DevTools → Check for any errors

## Troubleshooting

### "Server error: OPENAI_API_KEY not configured"
- Environment variable not set in Vercel
- Go to Vercel Dashboard → Settings → Environment Variables
- Add `OPENAI_API_KEY`
- Redeploy

### "Failed to save data to Google Sheets"
- Environment variable not set in Vercel
- Go to Vercel Dashboard → Settings → Environment Variables
- Add `GOOGLE_SHEETS_WEBHOOK`
- Redeploy

### Changes not reflected in production
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vercel deployment logs
- Verify latest commit is deployed

## Production URL

Check your production URL in Vercel Dashboard → Domains

Example: `https://your-app.vercel.app`

