import React from 'react';
import { DietPlan } from '../types';
import { UtensilsCrossed, Flame } from 'lucide-react';

interface MealPlanProps {
  meals: DietPlan[];
}

const MealPlan: React.FC<MealPlanProps> = ({ meals }) => {
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <div className="card card-hover">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Today's Meal Plan</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="font-medium">{totalCalories} kcal total</span>
        </div>
      </div>

      <div className="space-y-4">
        {meals.map((meal, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary-600" />
                <h4 className="font-semibold text-gray-900">{meal.mealType}</h4>
              </div>
              <span className="text-sm font-medium text-gray-600">{meal.calories} kcal</span>
            </div>

            <ul className="space-y-1 mb-3">
              {meal.foods.map((food, foodIndex) => (
                <li key={foodIndex} className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
                  {food}
                </li>
              ))}
            </ul>

            <div className="flex gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Protein: {meal.protein}g
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Carbs: {meal.carbs}g
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Fats: {meal.fats}g
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MealPlan;
