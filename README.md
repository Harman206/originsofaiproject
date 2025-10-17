# Origins of AI - Nutrition Assistant

A comprehensive AI-powered nutrition assistant built with React, TypeScript, and Vite. This application helps users track their diet, get personalized meal plans, and interact with an AI chatbot for nutrition advice.

## Features

- **AI Nutrition Chatbot**: Interactive chat interface powered by n8n webhooks
- **Personalized Meal Plans**: Custom meal plans based on dietary preferences and goals
- **Nutrition Tracking**: Track calories, macros, and nutritional intake
- **User Profile Management**: Manage health goals, allergies, and dietary preferences
- **Dietary Information**: View comprehensive dietary guidelines and restrictions

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Backend Integration**: n8n webhooks for AI chat and data management

## Local Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- n8n instance with configured webhooks (optional for testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Harman206/originsofaiproject.git
   cd originsofaiproject
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your n8n webhook URLs:
   ```env
   # User data webhook - fetches user profile and diet information
   VITE_N8N_USER_DATA_WEBHOOK=https://your-n8n-instance.app.n8n.cloud/webhook/user-data

   # Chatbot webhook - handles AI chat interactions
   VITE_N8N_CHATBOT_WEBHOOK=https://your-n8n-instance.app.n8n.cloud/webhook/your-webhook-id
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Vercel Deployment Setup

### Important: Environment Variables Configuration

**DO NOT commit your `.env` file to GitHub!** It contains sensitive webhook URLs and should remain private.

### Step-by-Step Deployment

1. **Push your code to GitHub** (without the `.env` file)
   ```bash
   git add .
   git commit -m "Update project configuration"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Click "Deploy" (deployment will initially fail without environment variables)

3. **Configure Environment Variables in Vercel**

   After deployment, you need to add your environment variables:

   - Go to your project in Vercel Dashboard
   - Navigate to: **Settings** → **Environment Variables**
   - Add the following variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `VITE_N8N_USER_DATA_WEBHOOK` | `https://your-n8n-instance.app.n8n.cloud/webhook/user-data` | Production, Preview, Development |
   | `VITE_N8N_CHATBOT_WEBHOOK` | `https://your-n8n-instance.app.n8n.cloud/webhook/your-webhook-id` | Production, Preview, Development |

   **Important Notes:**
   - Replace the URLs with your actual n8n webhook URLs
   - Make sure to select all three environments (Production, Preview, Development)
   - Click "Save" after adding each variable

4. **Redeploy the application**

   After adding environment variables:
   - Go to **Deployments** tab
   - Click the three dots (···) on the latest deployment
   - Select "Redeploy"
   - OR make a new commit to trigger automatic redeployment:
     ```bash
     git commit --allow-empty -m "Trigger Vercel redeploy with env vars"
     git push origin main
     ```

5. **Verify the deployment**
   - Open your deployed application URL
   - Open browser console (F12)
   - Check for environment variable logs
   - Test the chatbot functionality

### Troubleshooting Vercel Deployment

**Issue: Chatbot not responding**
- Solution: Check that environment variables are set in Vercel dashboard
- Verify n8n webhook URLs are correct and active
- Check browser console for error messages

**Issue: Environment variables not loading**
- Solution: Ensure variable names start with `VITE_` prefix (required by Vite)
- Redeploy after adding environment variables
- Clear browser cache and hard refresh

**Issue: CORS errors**
- Solution: Configure your n8n workflow to allow requests from your Vercel domain
- Add proper CORS headers in n8n response

## n8n Workflow Setup

For the AI chatbot to work, you need to set up n8n workflows:

### Required n8n Workflows

1. **User Data Webhook** (`/webhook/user-data`)
   - Returns user profile, dietary preferences, and health goals
   - Used to populate user information in the app

2. **Chatbot Webhook** (`/webhook/your-webhook-id`)
   - Receives user messages and returns AI-generated responses
   - Integrates with OpenAI or other LLM providers
   - Should return response in format: `{ "message": "AI response text" }`

### n8n Workflow Configuration

Your chatbot workflow should:
1. Receive POST request with user message
2. Process the message with context (user profile, diet preferences)
3. Send to AI model (OpenAI, etc.)
4. Return formatted response

See `N8N_WORKFLOWS_GUIDE.md` for detailed n8n setup instructions.

## Project Structure

```
src/
├── components/          # React components
│   ├── ChatBot.tsx     # AI chatbot interface
│   ├── UserProfile.tsx # User profile display
│   ├── MealPlan.tsx    # Meal planning component
│   ├── NutritionOverview.tsx
│   └── DietaryInfo.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   └── mockData.ts     # Mock data and webhook functions
├── styles/             # CSS styles
│   └── index.css
└── main.tsx            # Application entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_N8N_USER_DATA_WEBHOOK` | n8n webhook URL for fetching user data | Yes |
| `VITE_N8N_CHATBOT_WEBHOOK` | n8n webhook URL for AI chat functionality | Yes |

**Note**: All environment variables must be prefixed with `VITE_` to be accessible in the frontend.

## Mock Data Mode

If n8n webhooks are not configured, the app will automatically fall back to mock data mode with:
- Sample user profile
- Pre-defined meal plans
- Simulated chatbot responses

This allows you to test the UI without setting up n8n workflows.

## Security Notes

- Never commit `.env` files to version control
- Keep your n8n webhook URLs private
- Use Vercel's environment variables for production secrets
- The `.env.production` file contains only placeholder values for documentation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues or questions:
- Create an issue in the GitHub repository
- Check `SIMPLE_SETUP_GUIDE.md` for quick start instructions
- Review `N8N_WORKFLOWS_GUIDE.md` for n8n integration details
