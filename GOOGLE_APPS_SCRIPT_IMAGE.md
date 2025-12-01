# Google Apps Script - Image Storage Update

## 📸 Updated Script for Image Storage

This script handles BOTH image uploads and payment data in your Google Sheet.

---

## Setup Instructions

### Step 1: Update Your Google Apps Script

1. Go to: https://script.google.com/home
2. Open your existing "Shopping Cart Webhook" project
3. **Replace ALL code in `Code.gs`** with the code below

---

## Updated Apps Script Code

```javascript
function doPost(e) {
  try {
    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    // Check if this is image data or payment data
    if (data.imageData) {
      // Handle image data
      return handleImageData(spreadsheet, data);
    } else {
      // Handle payment data
      return handlePaymentData(spreadsheet, data);
    }
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        'success': false,
        'error': error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleImageData(spreadsheet, data) {
  try {
    // Get or create "Images" sheet (separate tab)
    var imageSheet = spreadsheet.getSheetByName("Images");
    if (!imageSheet) {
      imageSheet = spreadsheet.insertSheet("Images");
      // Add headers
      imageSheet.appendRow(["Timestamp", "Textbook Name", "Image URL"]);
    }
    
    var timestamp = Utilities.formatDate(
      new Date(data.timestamp),
      "Asia/Seoul",
      "yyyy-MM-dd HH:mm:ss"
    );
    
    // Upload image to Google Drive and get URL
    var imageUrl = uploadImageToDrive(data.imageData, timestamp);
    
    // Add row to Images sheet
    imageSheet.appendRow([
      timestamp,
      data.textbookName || "Unknown",
      imageUrl
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        'success': true,
        'message': 'Image saved successfully',
        'imageUrl': imageUrl
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        'success': false,
        'error': 'Image error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handlePaymentData(spreadsheet, data) {
  try {
    // Get or create "Payments" sheet (separate tab)
    var paymentSheet = spreadsheet.getSheetByName("Payments");
    if (!paymentSheet) {
      paymentSheet = spreadsheet.insertSheet("Payments");
      // Add headers
      paymentSheet.appendRow(["Timestamp", "User Email", "Items", "Total"]);
    }
    
    var timestamp = Utilities.formatDate(
      new Date(),
      "Asia/Seoul",
      "yyyy-MM-dd HH:mm:ss"
    );
    
    paymentSheet.appendRow([
      timestamp,
      data.userEmail,
      data.itemCount,
      data.total
    ]);
    
    return ContentService
      .createTextOutput(JSON.stringify({
        'success': true,
        'message': 'Payment data saved successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        'success': false,
        'error': 'Payment error: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function uploadImageToDrive(base64Data, timestamp) {
  try {
    // Remove data:image/xxx;base64, prefix if present
    var base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
    
    // Decode base64
    var blob = Utilities.newBlob(
      Utilities.base64Decode(base64Image),
      'image/png',
      'cart-item-' + timestamp.replace(/[:\s]/g, '-') + '.png'
    );
    
    // Get or create folder in Google Drive
    var folders = DriveApp.getFoldersByName('Shopping Cart Images');
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder('Shopping Cart Images');
    
    // Upload file
    var file = folder.createFile(blob);
    
    // Make file publicly accessible
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Return the URL
    return file.getUrl();
  } catch (error) {
    Logger.log('Error uploading to Drive: ' + error.toString());
    return 'Error: ' + error.toString();
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput('Webhook is active. Use POST to submit data.')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

---

## After Updating the Script

### Step 2: Redeploy

1. Click **Deploy** → **Manage deployments**
2. Click the **Edit** icon (pencil) on your existing deployment
3. Under "Version", click **New version**
4. Click **Deploy**
5. **Copy the Web App URL** (it should be the same as before)

---

## What This Does

### When User Adds Item to Cart:
1. Image is sent to Google Apps Script
2. Image is uploaded to Google Drive folder: "Shopping Cart Images"
3. Image URL is saved to "Images" sheet in your Google Sheet

### When User Completes Payment:
1. Email, item count, and total are sent
2. Data is saved to "Payments" sheet

---

## Your Google Sheet Structure

After the update, your Google Sheet will have TWO tabs:

### Tab 1: "Images"
| Timestamp | Textbook Name | Image URL |
|-----------|---------------|-----------|
| 2025-12-01 14:23:45 | 생각하는 황소 | https://drive.google.com/... |

### Tab 2: "Payments"
| Timestamp | User Email | Items | Total |
|-----------|------------|-------|-------|
| 2025-12-01 14:30:12 | user@email.com | 1 | 50 |

---

## Verification

### Test Image Upload:
1. On localhost: `http://localhost:3000`
2. Take a photo
3. Click CTA button to add to cart
4. **Check Google Sheet** → "Images" tab → Image URL should appear
5. **Click the image URL** → Opens in Google Drive

### Test Payment:
1. Enter email in cart
2. Click payment button
3. **Check Google Sheet** → "Payments" tab → Email should appear

---

## Important Notes

- **Images are stored in Google Drive**, not in the sheet (sheets can't handle large images well)
- **Image URLs** are stored in the "Images" tab
- **Payment data** is stored in the "Payments" tab
- Images are automatically made **publicly accessible** via the URL
- All images are organized in a folder: **"Shopping Cart Images"** in your Google Drive

---

## Troubleshooting

### Images not appearing?
1. Check Apps Script **Executions** tab for errors
2. Verify the script has permission to access Google Drive
3. Check if "Shopping Cart Images" folder was created in your Drive

### Permission errors?
1. When you redeploy, you may need to re-authorize
2. Click "Authorize access"
3. Allow access to both Sheets and Drive

---

**Your Google Sheet:** https://docs.google.com/spreadsheets/d/1b7XbC1dMpQos6J1ApzN-vBijYJhy5Mkz2a65T7ZPFAE/edit?gid=1352959042

