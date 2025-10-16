import React from 'react';
import { UserProfile } from '../types';
import { Salad, AlertCircle, Flame } from 'lucide-react';

interface DietaryInfoProps {
  user: UserProfile;
}

const DietaryInfo: React.FC<DietaryInfoProps> = ({ user }) => {
  return (
    <div className="card card-hover">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Dietary Information</h3>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Salad className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-2">Dietary Preferences</p>
            <div className="flex flex-wrap gap-2">
              {user.dietaryPreferences.map((pref, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full font-medium"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-2">Allergies</p>
            <div className="flex flex-wrap gap-2">
              {user.allergies.map((allergy, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-50 text-red-700 text-sm rounded-full font-medium"
                >
                  {allergy}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Flame className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-2">Daily Calorie Target</p>
            <p className="text-3xl font-bold text-gray-900">{user.dailyCalories}</p>
            <p className="text-sm text-gray-500 mt-1">Based on BMR: {user.bmr} kcal</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DietaryInfo;
