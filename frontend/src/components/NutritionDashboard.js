/**
 * Nutrition Dashboard Component
 * MyFitnessPal-style calorie and macro tracking with charts
 */

import { useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../config/api';
import {
    PieChart, Pie, Cell, ResponsiveContainer,
    XAxis, YAxis, CartesianGrid, Tooltip,
    Line, Area, AreaChart
} from 'recharts';
import {
    FiTrendingUp, FiPieChart,
    FiCoffee, FiSun, FiMoon, FiStar
} from 'react-icons/fi';
import {
    MdRestaurant, MdLocalFireDepartment, MdGrain,
    MdEgg, MdWaterDrop
} from 'react-icons/md';

const NutritionDashboard = ({ token }) => {
    const [nutritionData, setNutritionData] = useState({
        calories: { consumed: 0, goal: 1800, burned: 0 },
        macros: {
            carbs: { consumed: 0, goal: 225 },
            protein: { consumed: 0, goal: 100 },
            fat: { consumed: 0, goal: 80 }
        },
        meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
        }
    });
    const [weeklyData, setWeeklyData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNutritionData = useCallback(async () => {
        try {
            const response = await fetch(apiUrl('/logs/food?days=7'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                processNutritionData(data.logs || []);
            } else {
                processNutritionData([]);
            }
        } catch (error) {
            console.error('Failed to fetch nutrition data:', error);
            processNutritionData([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const processNutritionData = (logs) => {
        const today = new Date().toDateString();
        let todayCalories = 0;
        let todayCarbs = 0;
        let todayProtein = 0;
        let todayFat = 0;

        const meals = {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
        };

        // Process today's meals
        logs.forEach(log => {
            const logDate = new Date(log.created_at).toDateString();
            if (logDate === today) {
                todayCalories += log.value || 0;
                // Estimate macros from calories (simplified)
                todayCarbs += (log.value * 0.5) / 4; // 50% carbs
                todayProtein += (log.value * 0.25) / 4; // 25% protein
                todayFat += (log.value * 0.25) / 9; // 25% fat

                const mealType = (log.reading_context || 'snacks').toLowerCase();
                if (meals[mealType]) {
                    meals[mealType].push({
                        name: log.notes?.split('|')[0] || 'Food item',
                        calories: log.value
                    });
                }
            }
        });

        // Process weekly data
        const weekData = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            const dayCalories = logs
                .filter(log => new Date(log.created_at).toDateString() === dateStr)
                .reduce((sum, log) => sum + (log.value || 0), 0);

            weekData.push({
                day: dayName,
                calories: dayCalories,
                goal: 1800
            });
        }

        setNutritionData({
            calories: {
                consumed: Math.round(todayCalories),
                goal: 1800,
                burned: 150 // Placeholder
            },
            macros: {
                carbs: { consumed: Math.round(todayCarbs), goal: 225 },
                protein: { consumed: Math.round(todayProtein), goal: 100 },
                fat: { consumed: Math.round(todayFat), goal: 80 }
            },
            meals
        });

        setWeeklyData(weekData);
    };

    useEffect(() => {
        fetchNutritionData();
    }, [fetchNutritionData]);

    const caloriePercentage = Math.min(100, Math.round(
        (nutritionData.calories.consumed / nutritionData.calories.goal) * 100
    ));

    const remaining = nutritionData.calories.goal - nutritionData.calories.consumed + nutritionData.calories.burned;

    // Pie chart data for calories
    const calorieChartData = [
        { name: 'Consumed', value: nutritionData.calories.consumed, color: '#10b981' },
        { name: 'Remaining', value: Math.max(0, remaining), color: '#1f2937' }
    ];

    // Macro chart data
    const macroChartData = [
        {
            name: 'Carbs',
            consumed: nutritionData.macros.carbs.consumed,
            goal: nutritionData.macros.carbs.goal,
            color: '#3b82f6',
            unit: 'g'
        },
        {
            name: 'Protein',
            consumed: nutritionData.macros.protein.consumed,
            goal: nutritionData.macros.protein.goal,
            color: '#10b981',
            unit: 'g'
        },
        {
            name: 'Fat',
            consumed: nutritionData.macros.fat.consumed,
            goal: nutritionData.macros.fat.goal,
            color: '#f59e0b',
            unit: 'g'
        }
    ];

    const getMealIcon = (mealType) => {
        switch (mealType) {
            case 'breakfast': return <FiCoffee />;
            case 'lunch': return <FiSun />;
            case 'dinner': return <FiMoon />;
            default: return <FiStar />;
        }
    };

    const getMealCalories = (mealType) => {
        return nutritionData.meals[mealType]?.reduce((sum, item) => sum + item.calories, 0) || 0;
    };

    if (loading) {
        return <div className="nutrition-loading">Loading nutrition data...</div>;
    }

    return (
        <div className="nutrition-dashboard">
            {/* Calorie Summary Card */}
            <div className="nutrition-card calorie-summary">
                <div className="card-header">
                    <MdLocalFireDepartment className="card-icon" />
                    <h3>Today's Calories</h3>
                </div>

                <div className="calorie-chart-container">
                    <div className="calorie-ring">
                        <ResponsiveContainer width={160} height={160}>
                            <PieChart>
                                <Pie
                                    data={calorieChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={75}
                                    startAngle={90}
                                    endAngle={-270}
                                    dataKey="value"
                                    strokeWidth={0}
                                >
                                    {calorieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="calorie-center">
                            <span className="calorie-number">{nutritionData.calories.consumed}</span>
                            <span className="calorie-label">kcal</span>
                        </div>
                    </div>

                    <div className="calorie-breakdown">
                        <div className="calorie-item">
                            <span className="label">Goal</span>
                            <span className="value">{nutritionData.calories.goal}</span>
                        </div>
                        <div className="calorie-item consumed">
                            <span className="label">Food</span>
                            <span className="value">-{nutritionData.calories.consumed}</span>
                        </div>
                        <div className="calorie-item burned">
                            <span className="label">Exercise</span>
                            <span className="value">+{nutritionData.calories.burned}</span>
                        </div>
                        <div className="calorie-item remaining">
                            <span className="label">Remaining</span>
                            <span className="value">{Math.max(0, remaining)}</span>
                        </div>
                    </div>
                </div>

                <div className="calorie-progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${caloriePercentage}%` }}
                    />
                </div>
                <span className="progress-text">{caloriePercentage}% of daily goal</span>
            </div>

            {/* Macros Card */}
            <div className="nutrition-card macros-card">
                <div className="card-header">
                    <FiPieChart className="card-icon" />
                    <h3>Macronutrients</h3>
                </div>

                <div className="macros-grid">
                    {macroChartData.map((macro) => {
                        const percentage = Math.min(100, Math.round((macro.consumed / macro.goal) * 100));
                        return (
                            <div key={macro.name} className="macro-item">
                                <div className="macro-header">
                                    <span className="macro-name" style={{ color: macro.color }}>
                                        {macro.name === 'Carbs' && <MdGrain />}
                                        {macro.name === 'Protein' && <MdEgg />}
                                        {macro.name === 'Fat' && <MdWaterDrop />}
                                        {macro.name}
                                    </span>
                                    <span className="macro-values">
                                        {macro.consumed}g / {macro.goal}g
                                    </span>
                                </div>
                                <div className="macro-bar">
                                    <div
                                        className="macro-fill"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: macro.color
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Weekly Trend */}
            <div className="nutrition-card weekly-trend">
                <div className="card-header">
                    <FiTrendingUp className="card-icon" />
                    <h3>Weekly Calorie Trend</h3>
                </div>

                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={weeklyData}>
                            <defs>
                                <linearGradient id="calorieGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} />
                            <YAxis stroke="#9ca3af" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1f2937',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="calories"
                                stroke="#10b981"
                                strokeWidth={2}
                                fill="url(#calorieGradient)"
                            />
                            <Line
                                type="monotone"
                                dataKey="goal"
                                stroke="#6b7280"
                                strokeDasharray="5 5"
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="trend-legend">
                    <span className="legend-item">
                        <span className="dot" style={{ backgroundColor: '#10b981' }}></span>
                        Calories
                    </span>
                    <span className="legend-item">
                        <span className="dot dashed" style={{ backgroundColor: '#6b7280' }}></span>
                        Goal
                    </span>
                </div>
            </div>

            {/* Meals Breakdown */}
            <div className="nutrition-card meals-card">
                <div className="card-header">
                    <MdRestaurant className="card-icon" />
                    <h3>Today's Meals</h3>
                </div>

                <div className="meals-list">
                    {['breakfast', 'lunch', 'dinner', 'snacks'].map((meal) => (
                        <div key={meal} className="meal-item">
                            <div className="meal-icon">
                                {getMealIcon(meal)}
                            </div>
                            <div className="meal-info">
                                <span className="meal-name">{meal.charAt(0).toUpperCase() + meal.slice(1)}</span>
                                <span className="meal-items">
                                    {nutritionData.meals[meal]?.length || 0} items logged
                                </span>
                            </div>
                            <div className="meal-calories">
                                <span className="calories-value">{getMealCalories(meal)}</span>
                                <span className="calories-unit">kcal</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NutritionDashboard;
