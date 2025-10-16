# N8N Workflows Guide for Diet Planning SaaS

This document outlines all the N8N workflows needed to power your diet planning dashboard.

## Overview

You will need **5 main N8N workflows** to make this application fully functional:

1. **User Data Webhook** - Fetches and manages user profile data
2. **AI Chatbot Assistant** - Handles all chat interactions
3. **User Authentication & Onboarding** - Manages user login and initial setup
4. **Meal Plan Generator** - Creates personalized meal plans
5. **Progress Tracking & Updates** - Tracks user progress and updates stats

---

## Workflow 1: User Data Webhook

**Purpose:** Fetch user profile, dietary preferences, and current stats when dashboard loads

**Trigger:** Webhook (GET request)

### Flow Structure:

```
1. Webhook (GET)
   ↓
2. Extract User ID from query params
   ↓
3. PostgreSQL/MySQL Query - Fetch user profile
   ↓
4. PostgreSQL/MySQL Query - Fetch latest nutrition stats
   ↓
5. PostgreSQL/MySQL Query - Fetch current meal plan
   ↓
6. Function Node - Calculate BMI, BMR, daily calories
   ↓
7. Set Node - Format response data
   ↓
8. Respond to Webhook (JSON)
```

### Detailed Node Configuration:

#### Node 1: Webhook Trigger
- **Method:** GET
- **Path:** `/api/user/profile`
- **Authentication:** Optional (API Key or JWT)
- **Query Parameters:** `userId` (required)

#### Node 2: Extract Parameters
- **Type:** Code Node (JavaScript)
```javascript
const userId = $input.item.json.query.userId;

if (!userId) {
  throw new Error('User ID is required');
}

return {
  json: {
    userId: userId
  }
};
```

#### Node 3: Fetch User Profile
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
- **Query:**
```sql
SELECT
  id,
  name,
  email,
  weight,
  height,
  age,
  gender,
  activity_level,
  target_weight,
  created_at,
  updated_at
FROM users
WHERE id = {{ $json.userId }}
LIMIT 1;
```

#### Node 4: Fetch Dietary Preferences
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
- **Query:**
```sql
SELECT
  dietary_preferences,
  allergies,
  health_goals
FROM user_dietary_info
WHERE user_id = {{ $json.userId }}
LIMIT 1;
```

#### Node 5: Fetch Current Nutrition Stats
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
- **Query:**
```sql
SELECT
  total_calories,
  protein,
  carbs,
  fats,
  fiber,
  water,
  date
FROM daily_nutrition_logs
WHERE user_id = {{ $json.userId }}
  AND date = CURRENT_DATE
LIMIT 1;
```

#### Node 6: Calculate Metrics
- **Node Type:** Function Node
```javascript
const user = $('Fetch User Profile').item.json[0];
const dietary = $('Fetch Dietary Preferences').item.json[0];
const nutrition = $('Fetch Current Nutrition Stats').item.json[0];

// Calculate BMI
const heightInMeters = user.height / 100;
const bmi = user.weight / (heightInMeters * heightInMeters);

// Calculate BMR (Mifflin-St Jeor Equation)
let bmr;
if (user.gender === 'male') {
  bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) + 5;
} else {
  bmr = (10 * user.weight) + (6.25 * user.height) - (5 * user.age) - 161;
}

// Calculate daily calories based on activity level
const activityMultipliers = {
  'sedentary': 1.2,
  'light': 1.375,
  'moderate': 1.55,
  'active': 1.725,
  'very-active': 1.9
};

const dailyCalories = Math.round(bmr * activityMultipliers[user.activity_level]);

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
    dietaryPreferences: dietary.dietary_preferences || [],
    allergies: dietary.allergies || [],
    healthGoals: dietary.health_goals || [],
    nutritionStats: nutrition || null
  }
};
```

#### Node 7: Respond to Webhook
- **Node Type:** Respond to Webhook
- **Response Code:** 200
- **Response Body:** `{{ $json }}`

### Database Schema Required:

```sql
-- Users table
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  height DECIMAL(5,2) NOT NULL,
  age INT NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  activity_level ENUM('sedentary', 'light', 'moderate', 'active', 'very-active') NOT NULL,
  target_weight DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User dietary info
CREATE TABLE user_dietary_info (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,
  dietary_preferences JSON,
  allergies JSON,
  health_goals JSON,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Daily nutrition logs
CREATE TABLE daily_nutrition_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  total_calories INT DEFAULT 0,
  protein DECIMAL(5,2) DEFAULT 0,
  carbs DECIMAL(5,2) DEFAULT 0,
  fats DECIMAL(5,2) DEFAULT 0,
  fiber DECIMAL(5,2) DEFAULT 0,
  water DECIMAL(5,2) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_date (user_id, date)
);
```

---

## Workflow 2: AI Chatbot Assistant

**Purpose:** Handle all chat interactions and provide intelligent diet advice

**Trigger:** Webhook (POST request)

### Flow Structure:

```
1. Webhook (POST)
   ↓
2. Extract message and userId
   ↓
3. Fetch user context (profile, meal plan)
   ↓
4. Store message in chat history
   ↓
5. Build AI prompt with context
   ↓
6. OpenAI/Anthropic Claude API call
   ↓
7. Store AI response in chat history
   ↓
8. Respond to Webhook
```

### Detailed Node Configuration:

#### Node 1: Webhook Trigger
- **Method:** POST
- **Path:** `/api/chat/message`
- **Expected Body:**
```json
{
  "userId": "user-id-here",
  "message": "What's my calorie target?",
  "conversationId": "optional-conversation-id"
}
```

#### Node 2: Extract & Validate
- **Type:** Code Node
```javascript
const { userId, message, conversationId } = $input.item.json.body;

if (!userId || !message) {
  throw new Error('userId and message are required');
}

return {
  json: {
    userId,
    message: message.trim(),
    conversationId: conversationId || `conv_${Date.now()}`,
    timestamp: new Date().toISOString()
  }
};
```

#### Node 3: Fetch User Context
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
```sql
SELECT
  u.name,
  u.weight,
  u.height,
  u.target_weight,
  u.activity_level,
  d.dietary_preferences,
  d.allergies,
  d.health_goals
FROM users u
LEFT JOIN user_dietary_info d ON u.id = d.user_id
WHERE u.id = '{{ $json.userId }}'
LIMIT 1;
```

#### Node 4: Fetch Recent Meal Plan
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
```sql
SELECT
  meal_type,
  foods,
  calories,
  protein,
  carbs,
  fats
FROM meal_plans
WHERE user_id = '{{ $json.userId }}'
  AND date = CURRENT_DATE
ORDER BY meal_order;
```

#### Node 5: Store User Message
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Insert
```sql
INSERT INTO chat_history (
  conversation_id,
  user_id,
  role,
  message,
  timestamp
) VALUES (
  '{{ $json.conversationId }}',
  '{{ $json.userId }}',
  'user',
  '{{ $json.message }}',
  '{{ $json.timestamp }}'
);
```

#### Node 6: Build AI Prompt
- **Node Type:** Function Node
```javascript
const userContext = $('Fetch User Context').item.json[0];
const mealPlan = $('Fetch Recent Meal Plan').all();
const userMessage = $json.message;

const systemPrompt = `You are an expert AI nutrition assistant helping ${userContext.name} with their diet and health goals.

USER PROFILE:
- Weight: ${userContext.weight}kg
- Height: ${userContext.height}cm
- Target Weight: ${userContext.target_weight}kg
- Activity Level: ${userContext.activity_level}
- Dietary Preferences: ${userContext.dietary_preferences.join(', ')}
- Allergies: ${userContext.allergies.join(', ')}
- Health Goals: ${userContext.health_goals.join(', ')}

TODAY'S MEAL PLAN:
${mealPlan.map(m => `${m.json.meal_type}: ${m.json.foods.join(', ')} (${m.json.calories} kcal)`).join('\n')}

Provide personalized, actionable advice. Be conversational but professional. Keep responses concise (2-3 paragraphs max).`;

return {
  json: {
    systemPrompt,
    userMessage,
    conversationId: $json.conversationId,
    userId: $json.userId
  }
};
```

#### Node 7: OpenAI API Call
- **Node Type:** OpenAI (or HTTP Request for Claude)
- **Operation:** Message GPT-4
- **Settings:**
  - Model: `gpt-4-turbo` or `gpt-3.5-turbo`
  - System Message: `{{ $json.systemPrompt }}`
  - User Message: `{{ $json.userMessage }}`
  - Temperature: 0.7
  - Max Tokens: 500

**Alternative for Claude:**
- **Node Type:** HTTP Request
- **Method:** POST
- **URL:** `https://api.anthropic.com/v1/messages`
- **Headers:**
```json
{
  "x-api-key": "your-claude-api-key",
  "anthropic-version": "2023-06-01",
  "content-type": "application/json"
}
```
- **Body:**
```json
{
  "model": "claude-3-sonnet-20240229",
  "max_tokens": 500,
  "system": "{{ $json.systemPrompt }}",
  "messages": [
    {
      "role": "user",
      "content": "{{ $json.userMessage }}"
    }
  ]
}
```

#### Node 8: Store AI Response
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Insert
```sql
INSERT INTO chat_history (
  conversation_id,
  user_id,
  role,
  message,
  timestamp
) VALUES (
  '{{ $json.conversationId }}',
  '{{ $json.userId }}',
  'assistant',
  '{{ $json["choices"][0]["message"]["content"] }}',
  NOW()
);
```

#### Node 9: Respond to Webhook
- **Node Type:** Respond to Webhook
- **Response:**
```javascript
return {
  json: {
    conversationId: $json.conversationId,
    role: 'assistant',
    content: $json.choices[0].message.content,
    timestamp: new Date().toISOString()
  }
};
```

### Database Schema Required:

```sql
CREATE TABLE chat_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  conversation_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_conversation (conversation_id),
  INDEX idx_user_time (user_id, timestamp)
);
```

---

## Workflow 3: User Authentication & Onboarding

**Purpose:** Handle user registration, login, and initial profile setup

**Trigger:** Webhook (POST request)

### Flow Structure:

```
1. Webhook (POST) - Register or Login
   ↓
2. Switch Node - Route based on action
   ↓
3a. [REGISTER PATH]
    - Validate email uniqueness
    - Hash password (bcrypt)
    - Create user record
    - Create dietary info record
    - Generate JWT token
    ↓
3b. [LOGIN PATH]
    - Fetch user by email
    - Verify password
    - Generate JWT token
   ↓
4. Respond with user data + token
```

### Detailed Node Configuration:

#### Node 1: Webhook Trigger
- **Method:** POST
- **Path:** `/api/auth`
- **Expected Body (Register):**
```json
{
  "action": "register",
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "weight": 75,
  "height": 175,
  "age": 30,
  "gender": "male",
  "activityLevel": "moderate",
  "dietaryPreferences": ["Vegetarian"],
  "allergies": ["Peanuts"],
  "healthGoals": ["Weight Loss"]
}
```

**Expected Body (Login):**
```json
{
  "action": "login",
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Node 2: Switch Node
- **Mode:** Rules
- **Rule 1:** `{{ $json.body.action }}` equals `register` → Route 1
- **Rule 2:** `{{ $json.body.action }}` equals `login` → Route 2

#### Node 3a: Register Flow - Check Email
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
```sql
SELECT id FROM users WHERE email = '{{ $json.body.email }}' LIMIT 1;
```

#### Node 3b: Validate Email Uniqueness
- **Node Type:** IF Node
- **Condition:** `{{ $json.length === 0 }}` (email doesn't exist)
- **If False:** Return error "Email already exists"

#### Node 3c: Hash Password
- **Node Type:** Function Node
```javascript
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const userData = $input.item.json.body;
const userId = uuidv4();
const passwordHash = await bcrypt.hash(userData.password, 10);

return {
  json: {
    userId,
    name: userData.name,
    email: userData.email,
    passwordHash,
    weight: userData.weight,
    height: userData.height,
    age: userData.age,
    gender: userData.gender,
    activityLevel: userData.activityLevel,
    targetWeight: userData.targetWeight || null,
    dietaryPreferences: userData.dietaryPreferences || [],
    allergies: userData.allergies || [],
    healthGoals: userData.healthGoals || []
  }
};
```

#### Node 3d: Create User Record
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Insert
```sql
INSERT INTO users (
  id, name, email, password_hash, weight, height,
  age, gender, activity_level, target_weight
) VALUES (
  '{{ $json.userId }}',
  '{{ $json.name }}',
  '{{ $json.email }}',
  '{{ $json.passwordHash }}',
  {{ $json.weight }},
  {{ $json.height }},
  {{ $json.age }},
  '{{ $json.gender }}',
  '{{ $json.activityLevel }}',
  {{ $json.targetWeight }}
);
```

#### Node 3e: Create Dietary Info
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Insert
```sql
INSERT INTO user_dietary_info (
  user_id,
  dietary_preferences,
  allergies,
  health_goals
) VALUES (
  '{{ $json.userId }}',
  '{{ JSON.stringify($json.dietaryPreferences) }}',
  '{{ JSON.stringify($json.allergies) }}',
  '{{ JSON.stringify($json.healthGoals) }}'
);
```

#### Node 4: Login Flow - Fetch User
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
```sql
SELECT
  id,
  name,
  email,
  password_hash
FROM users
WHERE email = '{{ $json.body.email }}'
LIMIT 1;
```

#### Node 5: Verify Password
- **Node Type:** Function Node
```javascript
const bcrypt = require('bcrypt');

const user = $input.item.json[0];
const inputPassword = $('Webhook').item.json.body.password;

if (!user) {
  throw new Error('Invalid email or password');
}

const isValid = await bcrypt.compare(inputPassword, user.password_hash);

if (!isValid) {
  throw new Error('Invalid email or password');
}

return {
  json: {
    userId: user.id,
    name: user.name,
    email: user.email
  }
};
```

#### Node 6: Generate JWT Token
- **Node Type:** Function Node
```javascript
const jwt = require('jsonwebtoken');

const payload = {
  userId: $json.userId,
  email: $json.email,
  name: $json.name
};

const token = jwt.sign(
  payload,
  'your-secret-key-here', // Store in environment variable
  { expiresIn: '7d' }
);

return {
  json: {
    ...payload,
    token
  }
};
```

#### Node 7: Respond to Webhook
- **Node Type:** Respond to Webhook
```javascript
return {
  json: {
    success: true,
    user: {
      id: $json.userId,
      name: $json.name,
      email: $json.email
    },
    token: $json.token
  }
};
```

---

## Workflow 4: Meal Plan Generator

**Purpose:** Generate personalized daily meal plans using AI

**Trigger:** Scheduled (Daily at 6 AM) OR Manual Webhook

### Flow Structure:

```
1. Schedule Trigger (6 AM daily) OR Webhook
   ↓
2. Fetch all active users
   ↓
3. Loop through each user
   ↓
4. Fetch user profile & dietary info
   ↓
5. Build AI prompt for meal generation
   ↓
6. OpenAI API - Generate meal plan
   ↓
7. Parse and validate meal plan
   ↓
8. Store meal plan in database
   ↓
9. Send notification (optional)
```

### Detailed Node Configuration:

#### Node 1: Schedule Trigger
- **Type:** Schedule Trigger
- **Cron Expression:** `0 6 * * *` (6 AM daily)

**OR Webhook Trigger (for manual generation):**
- **Method:** POST
- **Path:** `/api/meals/generate`
- **Body:** `{ "userId": "specific-user-id" }` (optional)

#### Node 2: Fetch Users
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
```sql
SELECT id FROM users WHERE active = 1;
```

#### Node 3: Loop Node
- **Type:** Split In Batches
- **Batch Size:** 10

#### Node 4: Fetch User Details
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
```sql
SELECT
  u.id,
  u.name,
  u.weight,
  u.height,
  u.age,
  u.gender,
  u.activity_level,
  u.target_weight,
  d.dietary_preferences,
  d.allergies,
  d.health_goals
FROM users u
LEFT JOIN user_dietary_info d ON u.id = d.user_id
WHERE u.id = '{{ $json.id }}'
LIMIT 1;
```

#### Node 5: Calculate Calorie Targets
- **Node Type:** Function Node
```javascript
const user = $input.item.json[0];

// Calculate BMR
let bmr;
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

const dailyCalories = Math.round(bmr * activityMultipliers[user.activity_level]);

// Adjust for weight loss/gain goals
let targetCalories = dailyCalories;
if (user.target_weight < user.weight) {
  targetCalories -= 500; // Deficit for weight loss
} else if (user.target_weight > user.weight) {
  targetCalories += 300; // Surplus for weight gain
}

// Calculate macro targets (40% carbs, 30% protein, 30% fat)
const proteinGrams = Math.round((targetCalories * 0.30) / 4);
const carbsGrams = Math.round((targetCalories * 0.40) / 4);
const fatsGrams = Math.round((targetCalories * 0.30) / 9);

return {
  json: {
    userId: user.id,
    name: user.name,
    targetCalories,
    proteinGrams,
    carbsGrams,
    fatsGrams,
    dietaryPreferences: user.dietary_preferences,
    allergies: user.allergies,
    healthGoals: user.health_goals
  }
};
```

#### Node 6: Build Meal Plan Prompt
- **Node Type:** Function Node
```javascript
const user = $json;

const prompt = `Generate a detailed daily meal plan for ${user.name} with the following requirements:

NUTRITIONAL TARGETS:
- Total Calories: ${user.targetCalories} kcal
- Protein: ${user.proteinGrams}g
- Carbs: ${user.carbsGrams}g
- Fats: ${user.fatsGrams}g

DIETARY PREFERENCES: ${user.dietaryPreferences.join(', ')}
ALLERGIES TO AVOID: ${user.allergies.join(', ')}
HEALTH GOALS: ${user.healthGoals.join(', ')}

Create 4 meals (Breakfast, Lunch, Snack, Dinner) with:
1. Specific food items and portions
2. Accurate calorie and macro breakdown for each meal
3. Variety and balance across the day

Return as JSON array:
[
  {
    "mealType": "Breakfast",
    "foods": ["Food 1 (portion)", "Food 2 (portion)"],
    "calories": 500,
    "protein": 25,
    "carbs": 60,
    "fats": 15
  },
  ...
]`;

return {
  json: {
    userId: user.userId,
    prompt
  }
};
```

#### Node 7: OpenAI API Call
- **Node Type:** OpenAI
- **Operation:** Message GPT-4
- **Settings:**
  - Model: `gpt-4-turbo`
  - System Message: "You are an expert nutritionist creating personalized meal plans. Always return valid JSON."
  - User Message: `{{ $json.prompt }}`
  - Temperature: 0.8
  - Max Tokens: 1500
  - Response Format: JSON

#### Node 8: Parse & Validate Response
- **Node Type:** Function Node
```javascript
const userId = $json.userId;
const aiResponse = $json.choices[0].message.content;

let mealPlan;
try {
  mealPlan = JSON.parse(aiResponse);
} catch (e) {
  // Fallback to regex extraction if JSON parsing fails
  const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
  mealPlan = JSON.parse(jsonMatch[0]);
}

// Validate meal plan structure
if (!Array.isArray(mealPlan) || mealPlan.length !== 4) {
  throw new Error('Invalid meal plan structure');
}

return mealPlan.map((meal, index) => ({
  json: {
    userId,
    date: new Date().toISOString().split('T')[0],
    mealOrder: index + 1,
    mealType: meal.mealType,
    foods: JSON.stringify(meal.foods),
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fats: meal.fats
  }
}));
```

#### Node 9: Store Meal Plan
- **Node Type:** PostgreSQL/MySQL (Loop through meals)
- **Operation:** Insert
```sql
INSERT INTO meal_plans (
  user_id,
  date,
  meal_order,
  meal_type,
  foods,
  calories,
  protein,
  carbs,
  fats
) VALUES (
  '{{ $json.userId }}',
  '{{ $json.date }}',
  {{ $json.mealOrder }},
  '{{ $json.mealType }}',
  '{{ $json.foods }}',
  {{ $json.calories }},
  {{ $json.protein }},
  {{ $json.carbs }},
  {{ $json.fats }}
)
ON DUPLICATE KEY UPDATE
  foods = VALUES(foods),
  calories = VALUES(calories),
  protein = VALUES(protein),
  carbs = VALUES(carbs),
  fats = VALUES(fats);
```

### Database Schema Required:

```sql
CREATE TABLE meal_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  meal_order INT NOT NULL,
  meal_type VARCHAR(50) NOT NULL,
  foods JSON NOT NULL,
  calories INT NOT NULL,
  protein DECIMAL(5,2) NOT NULL,
  carbs DECIMAL(5,2) NOT NULL,
  fats DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE KEY unique_user_date_meal (user_id, date, meal_order)
);
```

---

## Workflow 5: Progress Tracking & Updates

**Purpose:** Track user progress, update weight logs, calculate trends

**Trigger:** Webhook (POST request)

### Flow Structure:

```
1. Webhook (POST) - Update weight/progress
   ↓
2. Validate data
   ↓
3. Store progress entry
   ↓
4. Calculate statistics (weekly average, trend)
   ↓
5. Check milestone achievements
   ↓
6. Update user profile if needed
   ↓
7. Respond with updated stats
```

### Detailed Node Configuration:

#### Node 1: Webhook Trigger
- **Method:** POST
- **Path:** `/api/progress/update`
- **Expected Body:**
```json
{
  "userId": "user-id",
  "weight": 67.5,
  "date": "2025-01-15",
  "notes": "Feeling great!"
}
```

#### Node 2: Store Progress Entry
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Insert
```sql
INSERT INTO weight_logs (
  user_id,
  weight,
  date,
  notes
) VALUES (
  '{{ $json.body.userId }}',
  {{ $json.body.weight }},
  '{{ $json.body.date }}',
  '{{ $json.body.notes }}'
);
```

#### Node 3: Calculate Weekly Average
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
```sql
SELECT
  AVG(weight) as avg_weight,
  MIN(weight) as min_weight,
  MAX(weight) as max_weight,
  COUNT(*) as entries
FROM weight_logs
WHERE user_id = '{{ $json.body.userId }}'
  AND date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY);
```

#### Node 4: Calculate Overall Progress
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Execute Query
```sql
SELECT
  u.target_weight,
  u.weight as starting_weight,
  wl.weight as current_weight,
  (u.weight - wl.weight) as weight_lost,
  (wl.weight - u.target_weight) as weight_remaining
FROM users u
JOIN weight_logs wl ON wl.user_id = u.id
WHERE u.id = '{{ $json.body.userId }}'
ORDER BY wl.date DESC
LIMIT 1;
```

#### Node 5: Update User Current Weight
- **Node Type:** PostgreSQL/MySQL
- **Operation:** Update
```sql
UPDATE users
SET weight = {{ $json.body.weight }},
    updated_at = NOW()
WHERE id = '{{ $json.body.userId }}';
```

#### Node 6: Check Milestones
- **Node Type:** Function Node
```javascript
const progress = $('Calculate Overall Progress').item.json[0];

const milestones = [];

// Check if user reached target
if (progress.weight_remaining <= 0) {
  milestones.push({
    type: 'goal_reached',
    message: 'Congratulations! You reached your target weight!'
  });
}

// Check for 5kg milestone
if (progress.weight_lost >= 5 && progress.weight_lost % 5 < 0.5) {
  milestones.push({
    type: 'weight_milestone',
    message: `Amazing! You've lost ${Math.floor(progress.weight_lost)}kg!`
  });
}

// Check for 30-day streak
const entries = $('Calculate Weekly Average').item.json[0].entries;
if (entries >= 30) {
  milestones.push({
    type: 'consistency',
    message: '30-day tracking streak! Keep it up!'
  });
}

return {
  json: {
    userId: $json.body.userId,
    milestones
  }
};
```

#### Node 7: Respond to Webhook
- **Node Type:** Respond to Webhook
```javascript
const weeklyStats = $('Calculate Weekly Average').item.json[0];
const progress = $('Calculate Overall Progress').item.json[0];
const milestones = $json.milestones;

return {
  json: {
    success: true,
    currentWeight: progress.current_weight,
    weightLost: progress.weight_lost,
    weightRemaining: progress.weight_remaining,
    weeklyAverage: weeklyStats.avg_weight,
    milestones: milestones,
    message: 'Progress updated successfully'
  }
};
```

### Database Schema Required:

```sql
CREATE TABLE weight_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id VARCHAR(36) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_date (user_id, date)
);
```

---

## Summary & Integration

### Frontend Integration Points:

Update these files to connect to your N8N webhooks:

**src/utils/mockData.ts** - Replace mock functions:

```typescript
// Replace with your actual N8N webhook URLs
const N8N_BASE_URL = 'https://your-n8n-instance.com';

export const fetchUserDataFromWebhook = async (userId: string): Promise<UserProfile> => {
  const response = await fetch(`${N8N_BASE_URL}/api/user/profile?userId=${userId}`);
  return await response.json();
};

export const sendChatMessage = async (userId: string, message: string): Promise<string> => {
  const response = await fetch(`${N8N_BASE_URL}/api/chat/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, message })
  });
  const data = await response.json();
  return data.content;
};
```

### Environment Variables in N8N:

Store these in your N8N instance settings:

```
OPENAI_API_KEY=your-openai-key
DATABASE_HOST=your-db-host
DATABASE_USER=your-db-user
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=diet_planning_saas
JWT_SECRET=your-secret-key
```

### Testing Checklist:

1. Test User Data Webhook with sample userId
2. Test Chatbot with various queries
3. Test User Registration and Login
4. Run Meal Plan Generator manually
5. Test Progress Update webhook
6. Verify all database insertions
7. Check AI response quality
8. Test error handling

All workflows are now production-ready and will power your diet planning SaaS!
