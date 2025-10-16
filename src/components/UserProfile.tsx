import React from 'react';
import { UserProfile as UserProfileType } from '../types';
import { User, Activity, Target, Heart } from 'lucide-react';

interface UserProfileProps {
  user: UserProfileType;
}

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <div className="card card-hover">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-primary-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Weight</p>
          <p className="text-2xl font-bold text-gray-900">{user.weight} kg</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Height</p>
          <p className="text-2xl font-bold text-gray-900">{user.height} cm</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">BMI</p>
          <p className="text-2xl font-bold text-gray-900">{user.bmi?.toFixed(1)}</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500 mb-1">Age</p>
          <p className="text-2xl font-bold text-gray-900">{user.age}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">Activity Level</p>
            <p className="text-gray-900 capitalize">{user.activityLevel.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">Target Weight</p>
            <p className="text-gray-900">{user.targetWeight} kg</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Heart className="w-5 h-5 text-primary-600 mt-1 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-700 mb-1">Health Goals</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {user.healthGoals.map((goal, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-50 text-primary-700 text-sm rounded-full font-medium"
                >
                  {goal}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
