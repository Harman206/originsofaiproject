# Vercel Deployment Guide - Environment Variables Setup

This guide will help you properly configure environment variables in Vercel so your Origins of AI nutrition assistant works correctly in production.

## Why Environment Variables are Needed

Your application uses n8n webhooks to power the AI chatbot. These webhook URLs are:
- Sensitive information that shouldn't be publicly visible
- Different for each environment (development, staging, production)
- Required for the chatbot to respond to user messages

## Problem: Missing Environment Variables

If you deployed to Vercel without configuring environment variables, you'll see:
- Chatbot not responding to messages
- Console errors about undefined webhook URLs
- Application falling back to mock data

## Solution: Configure Environment Variables in Vercel

### Step 1: Access Your Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (originsofaiproject)
3. You should see your deployed application

### Step 2: Navigate to Environment Variables Settings

1. Click on the **Settings** tab at the top
2. In the left sidebar, click **Environment Variables**
3. You'll see a form to add new environment variables

### Step 3: Add Required Environment Variables

Add the following two environment variables:

#### Variable 1: VITE_N8N_USER_DATA_WEBHOOK

- **Key**: `VITE_N8N_USER_DATA_WEBHOOK`
- **Value**: Your n8n user data webhook URL
  ```
  https://harmanextab.app.n8n.cloud/webhook/user-data
  ```
- **Environments**: Select all three checkboxes:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

Click **Save**

#### Variable 2: VITE_N8N_CHATBOT_WEBHOOK

- **Key**: `VITE_N8N_CHATBOT_WEBHOOK`
- **Value**: Your n8n chatbot webhook URL
  ```
  https://harmanextab.app.n8n.cloud/webhook/fad1b6f0-6e14-423d-94bd-a3ae16fefb15
  ```
- **Environments**: Select all three checkboxes:
  - ✅ Production
  - ✅ Preview
  - ✅ Development

Click **Save**

### Step 4: Redeploy Your Application

Environment variables are only applied to new deployments. You need to trigger a redeploy:

#### Option A: Redeploy from Vercel Dashboard

1. Go to the **Deployments** tab
2. Find your latest deployment
3. Click the three dots menu (···) on the right
4. Select **Redeploy**
5. Confirm the redeploy action

#### Option B: Trigger Redeploy via Git Push

```bash
# From your project directory
git commit --allow-empty -m "Trigger Vercel redeploy with environment variables"
git push origin main
```

Vercel will automatically detect the push and redeploy with the new environment variables.

### Step 5: Verify the Deployment

1. Wait for the deployment to complete (usually 1-2 minutes)
2. Open your deployed application URL
3. Open the browser console (F12 → Console tab)
4. Look for the environment variable debug logs:
   ```
   === ChatBot Environment Debug ===
   VITE_N8N_CHATBOT_WEBHOOK: https://harmanextab.app.n8n.cloud/webhook/...
   VITE_N8N_USER_DATA_WEBHOOK: https://harmanextab.app.n8n.cloud/webhook/...
   ```
5. Test the chatbot by sending a message
6. If configured correctly, you should receive AI-generated responses

## Troubleshooting

### Issue: Environment Variables Not Showing in Console

**Symptoms:**
- Console shows `undefined` for webhook URLs
- Chatbot uses mock responses instead of AI

**Solutions:**
1. Double-check that environment variable names are **exactly** correct:
   - Must start with `VITE_` prefix (required by Vite)
   - Must match the names in the code exactly
2. Ensure you selected all three environments when adding the variables
3. Make sure you redeployed after adding the variables
4. Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Issue: Chatbot Still Not Responding

**Symptoms:**
- Environment variables are visible in console
- But chatbot doesn't respond or shows errors

**Solutions:**
1. Verify your n8n workflows are active:
   - Go to your n8n instance
   - Check that the workflows are activated (toggle is ON)
   - Test the webhook URLs directly using curl or Postman
2. Check n8n workflow configuration:
   - Ensure the "Respond to Webhook" node is present
   - Verify the response format includes a "message" field
3. Check browser console for CORS errors:
   - Your n8n workflow may need to add CORS headers
   - Add a "Set" node to include proper CORS headers

### Issue: CORS Errors

**Symptoms:**
```
Access to fetch at 'https://harmanextab.app.n8n.cloud/...' from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

**Solutions:**
1. In your n8n workflow, add a "Set Response Headers" node before the final response
2. Set these headers:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: POST, GET, OPTIONS
   Access-Control-Allow-Headers: Content-Type
   ```

### Issue: Different Webhooks for Different Environments

If you want to use different webhook URLs for production vs. preview deployments:

1. Add the same variable name multiple times with different values
2. For each addition, select only the specific environment:
   - First time: Select only "Production" → Add production webhook URL
   - Second time: Select only "Preview" → Add staging webhook URL
   - Third time: Select only "Development" → Add development webhook URL

## Testing Your Setup

### Quick Test Checklist

- [ ] Deploy completes successfully
- [ ] Open deployed URL in browser
- [ ] Open browser console (F12)
- [ ] See environment variables logged correctly
- [ ] Send a test message in the chatbot
- [ ] Receive AI-generated response (not mock data)
- [ ] No errors in console

### Test Commands

Test your webhook URLs directly from command line:

```bash
# Test chatbot webhook
curl -X POST https://harmanextab.app.n8n.cloud/webhook/fad1b6f0-6e14-423d-94bd-a3ae16fefb15 \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, test message"}'

# Test user data webhook
curl https://harmanextab.app.n8n.cloud/webhook/user-data
```

If these return valid responses, your webhooks are working correctly.

## Security Best Practices

1. **Never commit `.env` files to git**
   - The `.gitignore` file already excludes `.env`
   - Only commit `.env.example` with placeholder values

2. **Keep webhook URLs private**
   - Don't share them publicly
   - Don't include them in screenshots or documentation
   - Use Vercel's environment variables for all deployments

3. **Use different webhooks for different environments**
   - Production webhooks for production deployment
   - Test webhooks for preview/development

4. **Regularly rotate webhook URLs**
   - If a webhook URL is exposed, create a new one in n8n
   - Update the environment variable in Vercel
   - Redeploy

## Additional Resources

- [Vercel Environment Variables Documentation](https://vercel.com/docs/projects/environment-variables)
- [Vite Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [n8n Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

## Need Help?

If you're still experiencing issues:
1. Check the main `README.md` for general setup instructions
2. Review `N8N_WORKFLOWS_GUIDE.md` for n8n-specific configuration
3. Create an issue in the GitHub repository with:
   - Description of the problem
   - Console error messages (remove sensitive URLs)
   - Steps you've already tried
