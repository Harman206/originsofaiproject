# Simplified Setup Guide - No Complex SQL Required!

## The Problem with the Previous Approach
The original guide required you to:
- Set up a MySQL/PostgreSQL database server
- Write complex SQL queries
- Manage database connections
- Handle authentication manually

**This is way too complicated for getting started!**

---

## Simple Approach: Use Supabase + N8N

### What is Supabase?
Supabase is like "Firebase but open source" - it gives you:
- Database (PostgreSQL) with a nice GUI
- Auto-generated REST APIs (no coding!)
- Built-in authentication
- Real-time features
- Free tier (perfect for testing)

---

## Step-by-Step Setup (30 Minutes)

### Phase 1: Set Up Supabase (10 minutes)

#### 1. Create Supabase Account
- Go to https://supabase.com
- Sign up (free)
- Click "New Project"
- Choose a name: `diet-planning-saas`
- Set a strong database password (save it!)
- Select a region close to you

#### 2. Create Tables Using GUI (No SQL!)

**Table 1: Users**
1. Go to "Table Editor" in sidebar
2. Click "Create a new table"
3. Name: `users`
4. Add columns:
   - `id` (uuid, primary key) - Auto-created
   - `name` (text)
   - `email` (text, unique)
   - `weight` (numeric)
   - `height` (numeric)
   - `age` (int8)
   - `gender` (text)
   - `activity_level` (text)
   - `target_weight` (numeric)
   - `created_at` (timestamp) - Auto-created

**Table 2: User Dietary Info**
1. Create new table: `user_dietary_info`
2. Add columns:
   - `id` (uuid, primary key)
   - `user_id` (uuid) - Foreign key to users.id
   - `dietary_preferences` (jsonb)
   - `allergies` (jsonb)
   - `health_goals` (jsonb)

**Table 3: Chat History**
1. Create new table: `chat_history`
2. Add columns:
   - `id` (uuid, primary key)
   - `user_id` (uuid)
   - `role` (text)
   - `message` (text)
   - `timestamp` (timestamp)

**Table 4: Meal Plans**
1. Create new table: `meal_plans`
2. Add columns:
   - `id` (uuid, primary key)
   - `user_id` (uuid)
   - `date` (date)
   - `meal_type` (text)
   - `foods` (jsonb)
   - `calories` (int8)
   - `protein` (numeric)
   - `carbs` (numeric)
   - `fats` (numeric)

#### 3. Get Your Supabase API Keys
1. Go to Settings → API
2. Copy these (you'll need them):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon/Public Key**: `eyJhbGc...` (long string)

---

### Phase 2: Set Up N8N (10 minutes)

#### Option A: Use N8N Cloud (Easiest)
1. Go to https://n8n.io
2. Sign up for free trial
3. No installation needed!

#### Option B: Use N8N Desktop (Run locally)
```bash
npx n8n
```
Then open http://localhost:5678

---

### Phase 3: Create Simplified N8N Workflows (10 minutes)

You only need **2 workflows** to start (not 5!):

---

## Workflow 1: Fetch User Data (Simple!)

### What it does:
Gets user profile and meal plan when dashboard loads

### N8N Nodes:

```
1. Webhook (GET)
   ↓
2. HTTP Request to Supabase (Get User)
   ↓
3. HTTP Request to Supabase (Get Meal Plan)
   ↓
4. Code Node (Format Response)
   ↓
5. Respond to Webhook
```

### Node-by-Node Setup:

**Node 1: Webhook**
- Drag "Webhook" node
- Method: GET
- Path: `/api/user/profile`
- Respond: "Using Respond to Webhook"

**Node 2: HTTP Request - Get User**
- Drag "HTTP Request" node
- Method: GET
- URL: `{{your-supabase-url}}/rest/v1/users?id=eq.{{$json.query.userId}}&select=*`
- Authentication: Generic Credential Type
  - Add Header: `apikey` = `your-supabase-anon-key`
  - Add Header: `Authorization` = `Bearer your-supabase-anon-key`

**Node 3: HTTP Request - Get Dietary Info**
- Method: GET
- URL: `{{your-supabase-url}}/rest/v1/user_dietary_info?user_id=eq.{{$json.query.userId}}&select=*`
- Same authentication as Node 2

**Node 4: HTTP Request - Get Meal Plan**
- Method: GET
- URL: `{{your-supabase-url}}/rest/v1/meal_plans?user_id=eq.{{$json.query.userId}}&date=eq.{{$now.format('YYYY-MM-DD')}}&select=*`
- Same authentication

**Node 5: Code Node - Format Data**
```javascript
const user = $('HTTP Request').item.json[0];
const dietary = $('HTTP Request1').item.json[0];
const meals = $('HTTP Request2').all();

// Calculate BMI
const heightInMeters = user.height / 100;
const bmi = user.weight / (heightInMeters * heightInMeters);

// Calculate BMR (simplified)
let bmr = 0;
if (user.gender === 'male') {
  bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5;
} else {
  bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;
}

const activityMultipliers = {
  'sedentary': 1.2,
  'light': 1.375,
  'moderate': 1.55,
  'active': 1.725,
  'very-active': 1.9
};

const dailyCalories = Math.round(bmr * (activityMultipliers[user.activity_level] || 1.5));

return {
  json: {
    id: user.id,
    name: user.name,
    email: user.email,
    weight: user.weight,
    height: user.height,
    age: user.age,
    gender: user.gender,
    activityLevel: user.activity_level,
    targetWeight: user.target_weight,
    bmi: parseFloat(bmi.toFixed(1)),
    bmr: Math.round(bmr),
    dailyCalories: dailyCalories,
    dietaryPreferences: dietary?.dietary_preferences || [],
    allergies: dietary?.allergies || [],
    healthGoals: dietary?.health_goals || [],
    mealPlan: meals.map(m => m.json)
  }
};
```

**Node 6: Respond to Webhook**
- Drag "Respond to Webhook" node
- Status Code: 200
- Body: `{{ $json }}`

**Save the workflow!** Copy the webhook URL (you'll need this for frontend)

---

## Workflow 2: AI Chatbot (Simple!)

### N8N Nodes:

```
1. Webhook (POST)
   ↓
2. HTTP Request to Supabase (Get User Context)
   ↓
3. OpenAI (Chat GPT-4)
   ↓
4. HTTP Request to Supabase (Save Message)
   ↓
5. Respond to Webhook
```

### Node-by-Node Setup:

**Node 1: Webhook**
- Method: POST
- Path: `/api/chat/message`
- Respond: "Using Respond to Webhook"

**Node 2: HTTP Request - Get User Context**
- Method: GET
- URL: `{{your-supabase-url}}/rest/v1/users?id=eq.{{$json.body.userId}}&select=*`
- Headers: Same as before

**Node 3: OpenAI Node**
- Search for "OpenAI" in nodes
- Add OpenAI credentials (your OpenAI API key)
- Resource: "Message a Model"
- Model: gpt-4-turbo or gpt-3.5-turbo
- Messages:
  - System: "You are a helpful nutrition assistant. User info: {{$json[0]}}"
  - User: "{{$('Webhook').item.json.body.message}}"

**Node 4: HTTP Request - Save Chat**
- Method: POST
- URL: `{{your-supabase-url}}/rest/v1/chat_history`
- Headers: Same + `Content-Type: application/json`
- Body:
```json
{
  "user_id": "{{$('Webhook').item.json.body.userId}}",
  "role": "assistant",
  "message": "{{$json.choices[0].message.content}}",
  "timestamp": "{{$now}}"
}
```

**Node 5: Respond to Webhook**
- Status Code: 200
- Body:
```json
{
  "role": "assistant",
  "content": "{{$('OpenAI').item.json.choices[0].message.content}}",
  "timestamp": "{{$now}}"
}
```

**Save the workflow!** Copy the webhook URL.

---

## Phase 4: Connect Frontend to N8N (5 minutes)

Update your frontend file: `src/utils/mockData.ts`

Replace the entire file with:

```typescript
import { UserProfile, DietPlan, NutritionStats } from '../types';

// Your N8N webhook URLs (from above)
const USER_DATA_WEBHOOK = 'https://your-n8n-instance.com/webhook/api/user/profile';
const CHATBOT_WEBHOOK = 'https://your-n8n-instance.com/webhook/api/chat/message';

// For now, use a test user ID
const TEST_USER_ID = 'test-user-123';

export const fetchUserDataFromWebhook = async (): Promise<UserProfile> => {
  try {
    const response = await fetch(`${USER_DATA_WEBHOOK}?userId=${TEST_USER_ID}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    // Return mock data as fallback
    return mockUserProfile;
  }
};

export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    const response = await fetch(CHATBOT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: TEST_USER_ID,
        message: message
      })
    });

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error('Error sending chat message:', error);
    return "Sorry, I'm having trouble connecting right now. Please try again.";
  }
};

// Keep mock data as fallback
export const mockUserProfile: UserProfile = {
  id: '1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@example.com',
  weight: 68,
  height: 165,
  age: 28,
  gender: 'female',
  activityLevel: 'moderate',
  dietaryPreferences: ['Vegetarian', 'Gluten-Free'],
  allergies: ['Peanuts', 'Shellfish'],
  healthGoals: ['Weight Loss', 'Muscle Tone', 'Increased Energy'],
  targetWeight: 62,
  bmi: 25.0,
  bmr: 1450,
  dailyCalories: 1800,
};

// ... rest of mock data
```

---

## Phase 5: Add Test Data to Supabase (5 minutes)

In Supabase Table Editor:

**Add a test user:**
1. Go to `users` table
2. Click "Insert row"
3. Fill in:
   - id: `test-user-123`
   - name: `Test User`
   - email: `test@example.com`
   - weight: `70`
   - height: `170`
   - age: `25`
   - gender: `female`
   - activity_level: `moderate`
   - target_weight: `65`

**Add dietary info:**
1. Go to `user_dietary_info` table
2. Insert:
   - user_id: `test-user-123`
   - dietary_preferences: `["Vegetarian"]`
   - allergies: `["Peanuts"]`
   - health_goals: `["Weight Loss"]`

**Add a sample meal:**
1. Go to `meal_plans` table
2. Insert:
   - user_id: `test-user-123`
   - date: `2025-01-15` (today's date)
   - meal_type: `Breakfast`
   - foods: `["Oatmeal", "Banana"]`
   - calories: `350`
   - protein: `12`
   - carbs: `60`
   - fats: `8`

---

## Testing Your Setup

### Test Workflow 1 (User Data):
1. In N8N, click "Execute Workflow" on Workflow 1
2. Copy the webhook URL
3. Open in browser: `{webhook-url}?userId=test-user-123`
4. You should see JSON with user data!

### Test Workflow 2 (Chatbot):
1. Use a tool like Postman or curl:
```bash
curl -X POST {your-webhook-url} \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user-123","message":"What should I eat?"}'
```

### Test Frontend:
1. Your dev server should still be running at http://localhost:5173
2. The dashboard should now load real data from Supabase!
3. The chatbot should give real AI responses!

---

## What You've Achieved

✅ Database set up (no SQL knowledge needed)
✅ APIs created automatically (no backend coding)
✅ N8N workflows connecting everything
✅ AI chatbot working
✅ Frontend connected to real backend

---

## Next Steps (Optional)

Once this works, you can add:
1. **User authentication** (Supabase has built-in auth!)
2. **Meal plan generator** (another simple N8N workflow)
3. **Progress tracking** (just more HTTP requests to Supabase)
4. **Deploy to production** (Vercel for frontend, N8N cloud for workflows)

---

## Cost Breakdown (Free Tier)

- **Supabase**: Free (500MB database, 50,000 API requests/month)
- **N8N Cloud**: Free trial (20 workflows)
- **OpenAI API**: ~$0.002 per message (very cheap)
- **Frontend Hosting**: Free on Vercel/Netlify

Total cost for testing: **FREE** or ~$5/month for OpenAI

---

## Need Help?

Common issues:

**"Webhook not working"**
- Make sure workflow is activated (toggle in top right)
- Check webhook URL is correct
- Test in N8N first before frontend

**"CORS error"**
- Supabase automatically handles CORS
- N8N webhooks need CORS enabled (check workflow settings)

**"No data showing"**
- Verify test data is in Supabase tables
- Check browser console for errors
- Make sure userId matches in database

This is 10x simpler than the original approach! 🚀
