import React from 'react';
import { NutritionStats } from '../types';
import { TrendingUp } from 'lucide-react';

interface NutritionOverviewProps {
  stats: NutritionStats;
  targetCalories: number;
}

const NutritionOverview: React.FC<NutritionOverviewProps> = ({ stats, targetCalories }) => {
  const caloriePercentage = (stats.totalCalories / targetCalories) * 100;

  const MacroBar: React.FC<{ label: string; value: number; color: string; target: number }> = ({
    label,
    value,
    color,
    target,
  }) => {
    const percentage = Math.min((value / target) * 100, 100);
    return (
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-600">
            {value}g / {target}g
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${color} transition-all duration-500 rounded-full`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Today's Nutrition</h3>
        <TrendingUp className="w-5 h-5 text-primary-600" />
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <p className="text-sm font-medium text-gray-700">Calories Consumed</p>
          <p className="text-sm text-gray-600">
            {stats.totalCalories} / {targetCalories} kcal
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              caloriePercentage > 100
                ? 'bg-red-500'
                : caloriePercentage > 80
                ? 'bg-yellow-500'
                : 'bg-primary-500'
            }`}
            style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">{caloriePercentage.toFixed(0)}% of daily target</p>
      </div>

      <div className="space-y-4">
        <MacroBar label="Protein" value={stats.protein} color="bg-blue-500" target={100} />
        <MacroBar label="Carbs" value={stats.carbs} color="bg-purple-500" target={200} />
        <MacroBar label="Fats" value={stats.fats} color="bg-orange-500" target={60} />
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Fiber</p>
          <p className="text-xl font-bold text-gray-900">{stats.fiber}g</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Water</p>
          <p className="text-xl font-bold text-gray-900">{stats.water}L</p>
        </div>
      </div>
    </div>
  );
};

export default NutritionOverview;
