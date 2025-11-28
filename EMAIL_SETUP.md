# Email Notification Setup

This application sends email notifications to `dino.lee@mathpresso.com` when a user makes a purchase.

## Setup Instructions

### 1. Gmail App Password (Recommended)

1. Go to your Google Account settings
2. Navigate to Security > 2-Step Verification (you must enable this first)
3. Scroll down to "App passwords" at the bottom
4. Or visit directly: https://myaccount.google.com/apppasswords
5. Generate a new app password for "Mail"
6. Copy the 16-character password

### 2. Update .env File

Open `.env` file and update the following values:

```env
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Important Notes:**
- Replace `your-gmail-address@gmail.com` with your actual Gmail address
- Replace `your-16-character-app-password` with the app password from step 1
- Do NOT use your regular Gmail password
- Remove any spaces from the app password

### 3. Restart the Server

After updating `.env`, restart your server:

```bash
npm start
```

### 4. Test the Email

1. Add an item to cart
2. Fill in the email field
3. Click the payment button
4. Check the server console for email confirmation
5. Check `dino.lee@mathpresso.com` inbox for the notification

## Email Format

The notification email includes:
- User's email address
- Number of items purchased
- Total amount
- Formatted in both plain text and HTML

## Troubleshooting

### Email not sending?

1. **Check .env file**: Make sure `EMAIL_USER` and `EMAIL_PASS` are set correctly
2. **Check console**: Look for error messages in the server console
3. **Gmail security**: Make sure 2-Step Verification is enabled
4. **App password**: Make sure you're using an App Password, not your regular password
5. **Less secure apps**: If using regular password, enable "Less secure app access" (not recommended)

### Still not working?

Check the server logs for specific error messages. Common issues:
- Invalid credentials
- Gmail blocking the login attempt
- Network/firewall issues

## Alternative Email Services

If Gmail doesn't work, you can use other services:

### SendGrid
```javascript
// In server.js, replace nodemailer config with:
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

### AWS SES
```javascript
// Use nodemailer with AWS SES transport
const transporter = nodemailer.createTransport({
    SES: new AWS.SES({
        apiVersion: '2010-12-01',
        region: 'us-east-1'
    })
});
```

## Security Notes

- Never commit your `.env` file to git
- Never share your App Password
- Rotate passwords regularly
- Use environment variables in production (Vercel, Heroku, etc.)

