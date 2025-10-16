import { useEffect, useState } from 'react';
import UserProfile from './components/UserProfile';
import DietaryInfo from './components/DietaryInfo';
import NutritionOverview from './components/NutritionOverview';
import MealPlan from './components/MealPlan';
import ChatBot from './components/ChatBot';
import { UserProfile as UserProfileType } from './types';
import {
  mockUserProfile,
  mockNutritionStats,
  mockDietPlan,
  fetchUserDataFromWebhook
} from './utils/mockData';
import { Loader2, Apple } from 'lucide-react';

function App() {
  const [user, setUser] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user data from N8N webhook
    const loadUserData = async () => {
      try {
        const userData = await fetchUserDataFromWebhook();
        setUser(userData);
      } catch (error) {
        console.error('Error loading user data:', error);
        // Fallback to mock data
        setUser(mockUserProfile);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Error loading user data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <Apple className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">NutriPlan</h1>
                <p className="text-sm text-gray-500">Your Personalized Diet Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="btn-secondary text-sm">
                Settings
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - User Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Your Profile
              </h2>
              <UserProfile user={user} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Dietary Information
              </h2>
              <DietaryInfo user={user} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Nutrition Stats
              </h2>
              <NutritionOverview stats={mockNutritionStats} targetCalories={user.dailyCalories || 2000} />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Meal Plan
              </h2>
              <MealPlan meals={mockDietPlan} />
            </div>
          </div>

          {/* Right Column - Chatbot */}
          <div className="lg:sticky lg:top-24 h-fit">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              AI Assistant
            </h2>
            <ChatBot />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            Powered by N8N Automation | Your data is secure and private
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
