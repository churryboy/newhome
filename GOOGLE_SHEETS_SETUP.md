# Google Sheets Integration Setup

This guide will help you set up Google Sheets to receive email addresses from the shopping cart.

**Google Sheet URL:** https://docs.google.com/spreadsheets/d/1b7XbC1dMpQos6J1ApzN-vBijYJhy5Mkz2a65T7ZPFAE/edit?gid=0#gid=0

## Step 1: Set Up Google Sheets Headers

1. Open your Google Sheet
2. In **Row 1**, add the following headers:
   - Column A: `Timestamp`
   - Column B: `User Email`
   - Column C: `Items`
   - Column D: `Total`

## Step 2: Create Google Apps Script

1. In your Google Sheet, go to **Extensions** > **Apps Script**
2. Delete any existing code
3. Paste the following script:

```javascript
function doPost(e) {
  try {
    // Get the active spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Parse the incoming JSON data
    var data = JSON.parse(e.postData.contents);
    
    // Get current timestamp in Korean timezone
    var timestamp = Utilities.formatDate(
      new Date(), 
      "Asia/Seoul", 
      "yyyy-MM-dd HH:mm:ss"
    );
    
    // Append the data to the sheet
    sheet.appendRow([
      timestamp,
      data.userEmail,
      data.itemCount,
      data.total
    ]);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({
        'success': true,
        'message': 'Data added successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({
        'success': false,
        'error': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Webhook is active. Use POST to submit data.')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

4. Click **Save** (💾 icon)
5. Name your project: "Shopping Cart Webhook"

## Step 3: Deploy the Script as Web App

1. Click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Configure the deployment:
   - **Description:** Shopping cart data collector
   - **Execute as:** Me (your email)
   - **Who has access:** Anyone
5. Click **Deploy**
6. **Authorize access:**
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" > "Go to Shopping Cart Webhook (unsafe)"
   - Click "Allow"
7. **Copy the Web App URL** - it will look like:
   ```
   https://script.google.com/macros/s/XXXXX.../exec
   ```

## Step 4: Update Your .env File

Add the Web App URL to your `.env` file:

```env
GOOGLE_SHEETS_WEBHOOK=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## Step 5: Test the Integration

1. Restart your server: `npm start`
2. Add an item to cart
3. Enter an email address
4. Click the payment button
5. Check your Google Sheet - you should see a new row with:
   - Timestamp (in Korean time)
   - User email
   - Number of items
   - Total amount

## Troubleshooting

### Script not receiving data?
- Make sure "Who has access" is set to "Anyone"
- Check that you copied the correct Web App URL
- Verify the URL ends with `/exec` (not `/dev`)

### Authorization errors?
- Re-deploy the script
- Make sure you authorized access during deployment
- Try using an incognito window to authorize

### Data not appearing in sheet?
- Check the **Executions** log in Apps Script (left sidebar)
- Look for error messages
- Verify the sheet has headers in Row 1

## Updating the Script

If you need to modify the script:

1. Make your changes in Apps Script
2. Click **Deploy** > **Manage deployments**
3. Click the edit icon (✏️) next to your deployment
4. Click **Deploy**
5. The URL will remain the same

## Security Notes

- The webhook URL is public but only accepts POST requests
- Anyone with the URL can submit data (consider adding authentication if needed)
- Data is written directly to your Google Sheet
- You can see all requests in the Apps Script execution log

## Sample Data Format

The webhook expects JSON data in this format:
```json
{
  "userEmail": "user@example.com",
  "itemCount": 1,
  "total": 50
}
```

## Advanced: Adding Authentication (Optional)

To add a simple API key authentication:

```javascript
function doPost(e) {
  var API_KEY = "your-secret-key-here";
  
  // Check API key
  var apiKey = e.parameter.apiKey || JSON.parse(e.postData.contents).apiKey;
  if (apiKey !== API_KEY) {
    return ContentService.createTextOutput(JSON.stringify({
      'success': false,
      'error': 'Invalid API key'
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Rest of the code...
}
```

Then add to `.env`:
```env
GOOGLE_SHEETS_API_KEY=your-secret-key-here
```

