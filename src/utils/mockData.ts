import { UserProfile, DietPlan, NutritionStats } from '../types';

// Mock user profile data (simulating N8N webhook response)
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

// Mock daily nutrition stats
export const mockNutritionStats: NutritionStats = {
  totalCalories: 1650,
  protein: 95,
  carbs: 180,
  fats: 55,
  fiber: 28,
  water: 2.1,
};

// Mock diet plan
export const mockDietPlan: DietPlan[] = [
  {
    mealType: 'Breakfast',
    foods: ['Oatmeal with berries', 'Greek yogurt', 'Green tea'],
    calories: 420,
    protein: 18,
    carbs: 62,
    fats: 12,
  },
  {
    mealType: 'Lunch',
    foods: ['Quinoa salad', 'Grilled tofu', 'Steamed vegetables', 'Olive oil dressing'],
    calories: 580,
    protein: 28,
    carbs: 68,
    fats: 22,
  },
  {
    mealType: 'Snack',
    foods: ['Apple slices', 'Almond butter', 'Herbal tea'],
    calories: 220,
    protein: 6,
    carbs: 28,
    fats: 10,
  },
  {
    mealType: 'Dinner',
    foods: ['Lentil curry', 'Brown rice', 'Spinach salad', 'Mango lassi'],
    calories: 620,
    protein: 26,
    carbs: 88,
    fats: 18,
  },
];

// Function to simulate N8N webhook data fetching
export const fetchUserDataFromWebhook = async (): Promise<UserProfile> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockUserProfile;
};

// N8N Webhook URL for chatbot - loaded from environment variable
const CHATBOT_WEBHOOK_URL = import.meta.env.VITE_N8N_CHATBOT_WEBHOOK;

// Function to get the webhook URL (with proxy in development)
export const getWebhookUrl = (originalUrl: string): string => {
  // In development, use proxy to avoid CORS issues
  if (import.meta.env.DEV && originalUrl) {
    try {
      const url = new URL(originalUrl);
      // Replace the base URL (origin) with the proxy path
      return originalUrl.replace(url.origin, '/api/n8n');
    } catch (error) {
      console.error('Invalid webhook URL:', error);
      return originalUrl; // Return original URL if parsing fails
    }
  }
  return originalUrl;
};

// Function to send message to N8N chatbot webhook
export const sendChatMessage = async (message: string): Promise<string> => {
  // Debug logging
  console.log('CHATBOT_WEBHOOK_URL:', CHATBOT_WEBHOOK_URL);
  console.log('Sending message to webhook:', message);

  // Check if webhook URL is configured
  if (!CHATBOT_WEBHOOK_URL) {
    console.warn('N8N webhook URL not configured, using mock responses');
    return getMockResponse(message);
  }

  const webhookUrl = getWebhookUrl(CHATBOT_WEBHOOK_URL);
  console.log('Using webhook URL (with proxy if dev):', webhookUrl);

  try {
    // N8N webhook is configured for POST requests
    console.log('Making POST request to:', webhookUrl);

    const requestBody = {
      message: message,
      userId: mockUserProfile.id,
      userName: mockUserProfile.name,
      userEmail: mockUserProfile.email,
      dietaryPreferences: mockUserProfile.dietaryPreferences,
      allergies: mockUserProfile.allergies,
      healthGoals: mockUserProfile.healthGoals,
      dailyCalories: mockUserProfile.dailyCalories,
    };

    console.log('Request body:', requestBody);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('POST Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Webhook error response:', errorText);

      // Parse error and provide helpful message
      if (response.status === 404) {
        console.error('❌ Webhook not active. Please activate your n8n workflow!');
        throw new Error('N8N_WEBHOOK_NOT_ACTIVE');
      } else if (response.status === 500 && errorText.includes('Respond to Webhook')) {
        console.error('❌ Missing "Respond to Webhook" node in your n8n workflow!');
        throw new Error('N8N_MISSING_RESPONSE_NODE');
      }

      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    // Check content type to determine if response is JSON or text
    const contentType = response.headers.get('content-type');
    console.log('Response Content-Type:', contentType);

    // Get the raw response text first
    const rawText = await response.text();
    console.log('Raw response text:', rawText);
    console.log('Raw response length:', rawText.length);

    // Check if response is empty
    if (!rawText || rawText.trim().length === 0) {
      console.error('❌ Empty response from webhook! Your n8n workflow might be missing a "Respond to Webhook" node.');
      throw new Error('N8N_EMPTY_RESPONSE');
    }

    // If response is plain text, return it directly
    if (contentType && contentType.includes('text/plain')) {
      console.log('Webhook text response:', rawText);
      return rawText;
    }

    // Otherwise, parse as JSON
    const data = JSON.parse(rawText);
    console.log('Webhook response data:', data);
    console.log('Data type:', typeof data);
    console.log('Data keys:', Object.keys(data));

    // Try to extract the response from various possible fields (order matters - try 'message' first since that's what we configured in n8n)
    const responseText = data.message || data.response || data.content || data.text || data.output || data.result;

    // If data is an object with unknown structure, try to get the first meaningful value
    if (!responseText && typeof data === 'object') {
      // Check for numeric string keys (like '0', '1', etc.) that n8n sometimes uses
      if ('0' in data) {
        const value = data['0'];
        console.log('Found data in key "0":', value);

        // If it's an object, check if it has an 'output' field
        if (typeof value === 'object' && value !== null && 'output' in value) {
          console.log('Extracting output from nested object:', value.output);
          return value.output as string;
        }

        // If it's a string and valid, return it
        if (typeof value === 'string' && value.trim().length > 0 && value !== '{--}}') {
          console.log('Returning string from key "0"');
          return value;
        }
      }

      const values = Object.values(data).filter(v =>
        typeof v === 'string' &&
        v.trim().length > 0 &&
        v !== '{--}}' &&
        !v.startsWith('{-') // Filter out template syntax
      );
      if (values.length > 0) {
        console.log('Using first string value from response:', values[0]);
        return values[0] as string;
      }
    }

    // If we have a string response, return it
    if (responseText && typeof responseText === 'string') {
      return responseText;
    }

    // If data itself is a string, return it
    if (typeof data === 'string') {
      return data;
    }

    console.error('Could not extract response from webhook data:', data);
    return 'Sorry, I could not process your request.';
  } catch (error) {
    console.error('Error calling N8N webhook:', error);
    console.error('Falling back to mock responses');
    // Fallback to mock responses if webhook fails
    return getMockResponse(message);
  }
};

// Mock responses as fallback
function getMockResponse(message: string): string {
  if (message.toLowerCase().includes('calories')) {
    return `Based on your profile, your daily calorie target is ${mockUserProfile.dailyCalories} calories. This is calculated based on your BMR of ${mockUserProfile.bmr} and your ${mockUserProfile.activityLevel} activity level. Would you like me to adjust this based on your goals?`;
  }

  if (message.toLowerCase().includes('meal') || message.toLowerCase().includes('plan')) {
    return `I've prepared a personalized meal plan for you considering your vegetarian and gluten-free preferences. Today's plan includes oatmeal for breakfast, quinoa salad for lunch, and lentil curry for dinner. Each meal is balanced to meet your nutritional needs while avoiding peanuts and shellfish. Would you like details on any specific meal?`;
  }

  if (message.toLowerCase().includes('weight')) {
    return `Your current weight is ${mockUserProfile.weight}kg with a target of ${mockUserProfile.targetWeight}kg. Based on your current progress and activity level, you're on track to reach your goal in approximately 6-8 weeks with consistent adherence to your meal plan and exercise routine.`;
  }

  if (message.toLowerCase().includes('protein')) {
    return `For your goals and activity level, I recommend consuming 95-105g of protein daily. As a vegetarian, great sources include Greek yogurt, tofu, lentils, quinoa, and tempeh. Your current meal plan provides approximately 95g of protein per day.`;
  }

  return `I'm here to help with your diet and nutrition questions! I can provide information about your meal plans, calorie targets, macro breakdown, recipe suggestions, and progress tracking. What would you like to know more about?`;
}
