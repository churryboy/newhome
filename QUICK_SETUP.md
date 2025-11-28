# Quick Google Sheets Setup Guide

## Current Status
❌ **Error:** `Webhook returned 500` - Google Apps Script not deployed yet

## Fix in 5 Steps (5 minutes)

### Step 1: Open Your Google Sheet
Click here: https://docs.google.com/spreadsheets/d/1b7XbC1dMpQos6J1ApzN-vBijYJhy5Mkz2a65T7ZPFAE/edit

### Step 2: Add Column Headers
In Row 1, add these headers:
- **A1:** Timestamp
- **B1:** User Email  
- **C1:** Items
- **D1:** Total

### Step 3: Open Apps Script Editor
1. In your Google Sheet, click **Extensions** → **Apps Script**
2. Delete any existing code
3. Copy and paste this code:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
    
    sheet.appendRow([timestamp, data.userEmail, data.itemCount, data.total]);
    
    return ContentService.createTextOutput(JSON.stringify({
      'success': true,
      'message': 'Data added successfully'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      'success': false,
      'error': error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Click 💾 **Save** (or Ctrl+S)
5. Name it: "Shopping Cart Webhook"

### Step 4: Deploy as Web App
1. Click **Deploy** → **New deployment**
2. Click the ⚙️ gear icon next to "Select type"
3. Choose **Web app**
4. Configure:
   - Description: `Shopping cart data`
   - Execute as: **Me (your-email@gmail.com)**
   - Who has access: **Anyone**
5. Click **Deploy**
6. Click **Authorize access**
   - Choose your Google account
   - Click **Advanced** → **Go to Shopping Cart Webhook (unsafe)**
   - Click **Allow**
7. **COPY THE WEB APP URL** - it will look like:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXX/exec
   ```

### Step 5: Update .env File
1. Open `.env` file in your project
2. Find the line:
   ```env
   GOOGLE_SHEETS_WEBHOOK=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
   ```
3. Replace `YOUR_DEPLOYMENT_ID` with your actual deployment ID from Step 4
4. Save the file

Example:
```env
GOOGLE_SHEETS_WEBHOOK=https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXXXXXXX/exec
```

### Step 6: Restart Server
```bash
npm start
```

## Test It
1. Add item to cart
2. Enter email: `test@example.com`
3. Click payment button
4. Check your Google Sheet - you should see a new row!

## Troubleshooting

### "Google Docs에 오류가 발생했습니다" Error
- You haven't deployed the Apps Script yet
- Follow Step 4 above

### "Authorization required" Error
- Click "Advanced" → "Go to Shopping Cart Webhook (unsafe)" → "Allow"
- This is safe - you're authorizing your own script

### Still getting 500 error?
- Make sure the URL ends with `/exec` not `/dev`
- Copy the ENTIRE URL from deployment
- Restart your server after updating .env

### Need to update the script?
1. Make changes in Apps Script editor
2. Click **Deploy** → **Manage deployments**
3. Click ✏️ edit icon
4. Click **Deploy**
5. URL stays the same - no need to update .env

## What Happens After Setup

✅ User enters email → Clicks payment  
✅ Data sent to Google Sheets  
✅ New row appears with:
   - Timestamp (Korean time)
   - User email
   - Number of items
   - Total amount

## Check if It's Working

Server logs should show:
```
📊 Sending data to Google Sheets
User Email: test@example.com
Items: 1
Total: 50
✅ Data sent to Google Sheets successfully!
```

If you see ❌ errors, the webhook URL is still wrong or not deployed.

