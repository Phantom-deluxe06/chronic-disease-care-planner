/**
 * Home Page Component
 * Dashboard with care plan cards and task tracking
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [carePlan, setCarePlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completedTasks, setCompletedTasks] = useState(new Set());

    useEffect(() => {
        // Check authentication
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!token || !storedUser) {
            navigate('/login');
            return;
        }

        setUser(JSON.parse(storedUser));
        fetchCarePlan(token);
    }, [navigate]);

    const fetchCarePlan = async (token) => {
        try {
            const response = await fetch('http://127.0.0.1:8000/care-plan', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                    return;
                }
                throw new Error('Failed to fetch care plan');
            }

            const data = await response.json();
            setCarePlan(data);
        } catch (err) {
            console.error('Error fetching care plan:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleTask = (taskIndex) => {
        setCompletedTasks(prev => {
            const newSet = new Set(prev);
            if (newSet.has(taskIndex)) {
                newSet.delete(taskIndex);
            } else {
                newSet.add(taskIndex);
            }
            return newSet;
        });
    };

    const getCategoryColor = (category) => {
        const colors = {
            medication: '#ef4444',
            exercise: '#22c55e',
            monitoring: '#3b82f6',
            diet: '#f59e0b',
            wellness: '#8b5cf6',
        };
        return colors[category] || '#6b7280';
    };

    const getPriorityBadge = (priority) => {
        const badges = {
            high: { label: 'High', class: 'priority-high' },
            medium: { label: 'Med', class: 'priority-medium' },
            low: { label: 'Low', class: 'priority-low' },
        };
        return badges[priority] || badges.medium;
    };

    const completedCount = completedTasks.size;
    const totalTasks = carePlan?.tasks?.length || 0;
    const pendingCount = totalTasks - completedCount;
    const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    if (loading) {
        return (
            <div className="dashboard-layout">
                <Sidebar user={user} />
                <main className="dashboard-main">
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading your care plan...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="dashboard-layout">
            <Sidebar user={user} />

            <main className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-content">
                        <h1>Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
                        <p className="header-date">{formatDate(new Date())}</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-icon" title="Notifications">🔔</button>
                        <button className="btn-icon" title="Quick Add">➕</button>
                    </div>
                </header>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card progress-card">
                        <div className="stat-content">
                            <h3>Today's Progress</h3>
                            <div className="progress-circle">
                                <svg viewBox="0 0 36 36">
                                    <path
                                        className="progress-bg"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path
                                        className="progress-fill"
                                        strokeDasharray={`${progressPercent}, 100`}
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                </svg>
                                <span className="progress-text">{progressPercent}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="stat-card completed-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-details">
                            <span className="stat-number">{completedCount}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                    </div>

                    <div className="stat-card pending-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-details">
                            <span className="stat-number">{pendingCount}</span>
                            <span className="stat-label">Pending</span>
                        </div>
                    </div>

                    <div className="stat-card conditions-card">
                        <div className="stat-icon">💊</div>
                        <div className="stat-details">
                            <span className="stat-number">{carePlan?.diseases?.length || 0}</span>
                            <span className="stat-label">Conditions</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="content-grid">
                    {/* Tasks Column */}
                    <div className="tasks-column">
                        <div className="section-header">
                            <h2>Today's Care Plan</h2>
                            <span className="task-count">{totalTasks} tasks</span>
                        </div>

                        <div className="tasks-list">
                            {carePlan?.tasks?.map((task, index) => (
                                <div
                                    key={index}
                                    className={`task-item ${completedTasks.has(index) ? 'completed' : ''}`}
                                    onClick={() => toggleTask(index)}
                                >
                                    <div className="task-checkbox">
                                        {completedTasks.has(index) ? '✓' : ''}
                                    </div>
                                    <div className="task-content">
                                        <div className="task-time">{task.time}</div>
                                        <div className="task-name">{task.task}</div>
                                        <div className="task-meta">
                                            <span
                                                className="task-category"
                                                style={{ backgroundColor: getCategoryColor(task.category) }}
                                            >
                                                {task.category}
                                            </span>
                                            <span className={`task-priority ${getPriorityBadge(task.priority).class}`}>
                                                {getPriorityBadge(task.priority).label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Column */}
                    <div className="info-column">
                        {/* Health Tips */}
                        <div className="info-card tips-card">
                            <h3>💡 Health Tips</h3>
                            <ul className="tips-list">
                                {carePlan?.tips?.map((tip, index) => (
                                    <li key={index}>{tip}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Conditions */}
                        <div className="info-card conditions-card">
                            <h3>🩺 Your Conditions</h3>
                            <div className="conditions-list">
                                {carePlan?.diseases?.map((disease, index) => (
                                    <span key={index} className="condition-badge">
                                        {formatDiseaseName(disease)}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="info-card actions-card">
                            <h3>⚡ Quick Actions</h3>
                            <div className="quick-actions">
                                <button className="quick-action-btn">
                                    <span>📝</span> Log Reading
                                </button>
                                <button className="quick-action-btn">
                                    <span>📞</span> Call Doctor
                                </button>
                                <button className="quick-action-btn">
                                    <span>💊</span> Refill Meds
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Helper functions
function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDiseaseName(disease) {
    const names = {
        diabetes: 'Diabetes',
        heart_disease: 'Heart Disease',
        hypertension: 'Hypertension'
    };
    return names[disease] || disease;
}

export default Home;
