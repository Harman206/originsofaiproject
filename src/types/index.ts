export interface UserProfile {
  id: string;
  name: string;
  email: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  dietaryPreferences: string[];
  allergies: string[];
  healthGoals: string[];
  targetWeight?: number;
  bmi?: number;
  bmr?: number;
  dailyCalories?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface DietPlan {
  mealType: string;
  foods: string[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface NutritionStats {
  totalCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  water: number;
}
