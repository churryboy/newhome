# Production Deployment Setup for Render

## Environment Variables Required for Render

For the app to work in production on Render, you need to configure these environment variables.

---

## Step 1: Add Environment Variables to Render

### 🔗 Go to Render Dashboard
1. Open: https://dashboard.render.com/
2. Click on your **Web Service** (your app)
3. Go to **Environment** tab (left sidebar)
4. Click **Add Environment Variable**

---

### Required Environment Variables

#### 1. OPENAI_API_KEY ⚠️ REQUIRED
Your OpenAI API key for image analysis and solution generation.

```
Key:   OPENAI_API_KEY
Value: sk-proj-YOUR_OPENAI_API_KEY_HERE
```

**How to get it:**
- Go to: https://platform.openai.com/api-keys
- Copy your API key
- Paste in Render

---

#### 2. GOOGLE_SHEETS_WEBHOOK ⚠️ REQUIRED
Your Google Apps Script Web App URL for saving cart data to Google Sheets.

```
Key:   GOOGLE_SHEETS_WEBHOOK
Value: https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

**Your current webhook URL:**
```
https://script.google.com/macros/s/AKfycbw4IHyPlbU5gQb3s9I90sZ3sHVkrDdvvHMCRT1-Cjj3IFrSKOo_mEtTTV84_N33tvG1/exec
```

**Copy this URL and paste it into Render as the value for `GOOGLE_SHEETS_WEBHOOK`**

---

#### 3. PORT (Optional)
Render usually sets this automatically, but if needed:

```
Key:   PORT
Value: 3000
```

---

## Step 2: Save and Redeploy

### After adding environment variables:

1. **Click "Save Changes"** at the bottom of the Environment tab
2. **Render will automatically redeploy** your app with the new environment variables
3. **Wait for deployment to complete** (check the Events tab)
4. Look for **"Deploy live"** status ✅

---

## Step 3: Verify Production

Once deployment is complete:

1. **Open your production URL** (e.g., `https://your-app.onrender.com`)
2. **Test the complete flow:**
   - Take a photo
   - Click CTA button in verification section
   - Enter your email address
   - Select payment method
   - Click "₩50 결제하기"
3. **Check your Google Sheet** → Your email should appear! 🎉

**Google Sheet URL:**
https://docs.google.com/spreadsheets/d/1b7XbC1dMpQos6J1ApzN-vBijYJhy5Mkz2a65T7ZPFAE/edit

---

## Troubleshooting

### ❌ "Failed to save data to Google Sheets"

**Cause:** `GOOGLE_SHEETS_WEBHOOK` not set in Render

**Fix:**
1. Go to Render Dashboard → Your Service → Environment
2. Add environment variable:
   - Key: `GOOGLE_SHEETS_WEBHOOK`
   - Value: Your Google Apps Script webhook URL
3. Save and wait for redeploy

---

### ❌ "Server error: OPENAI_API_KEY not configured"

**Cause:** `OPENAI_API_KEY` not set in Render

**Fix:**
1. Go to Render Dashboard → Your Service → Environment
2. Add environment variable:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (starts with `sk-proj-`)
3. Save and wait for redeploy

---

### ❌ Changes not reflected in production

**Fix:**
1. Go to Render Dashboard → Your Service
2. Click **Manual Deploy** → **Deploy latest commit**
3. Or push a new commit to trigger automatic deployment

---

### ✅ How to Check if Variables Are Set

1. Go to **Render Dashboard** → Your Service → **Environment**
2. You should see:
   ```
   OPENAI_API_KEY          ••••••••••••••••
   GOOGLE_SHEETS_WEBHOOK   https://script.google.com/macros/s/...
   ```

**Note:** For security, Render hides the actual value of `OPENAI_API_KEY` after saving.

---

## Quick Checklist

- [ ] Opened Render Dashboard
- [ ] Went to my Web Service → Environment tab
- [ ] Added `OPENAI_API_KEY` environment variable
- [ ] Added `GOOGLE_SHEETS_WEBHOOK` environment variable
- [ ] Clicked "Save Changes"
- [ ] Waited for automatic redeploy to complete (✅ Deploy live)
- [ ] Tested on production URL
- [ ] Email appears in Google Sheet! 🎉

---

## Production URL

Your Render app URL should be something like:
- `https://your-app-name.onrender.com`

Check it in: **Render Dashboard → Your Service → Settings → scroll to "Domains"**

