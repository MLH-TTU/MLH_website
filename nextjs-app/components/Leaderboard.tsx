'use client';

import { useState, useEffect } from 'react';

interface LeaderboardUser {
  id: string;
  firstName: string;
  lastName: string;
  photoURL?: string;
  points: number;
  attendedEvents: number;
}

/**
 * Leaderboard Component
 * 
 * Displays top users by points with filter options
 * - Shows top 3, 5, or 10 users
 * - Displays user photo, name, points, and events attended
 * - Podium-style display for top 3
 */
export function Leaderboard() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(3);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/leaderboard?limit=${limit}`);
        
        if (response.ok) {
          const data = await response.json();
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setShowFilter(false);
  };

  // Medal colors for top 3
  const getMedalColor = (index: number) => {
    switch (index) {
      case 0: return 'from-yellow-400 to-yellow-600'; // Gold
      case 1: return 'from-gray-300 to-gray-500'; // Silver
      case 2: return 'from-orange-400 to-orange-600'; // Bronze
      default: return 'from-gray-200 to-gray-400';
    }
  };

  const getMedalIcon = (index: number) => {
    switch (index) {
      case 0: return '🥇';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          No users on the leaderboard yet. Attend events to earn points!
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter Button - positioned relative to parent */}
      <div className="flex justify-end mb-6">
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-md"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Top {limit}
            </span>
          </button>

          {/* Filter Dropdown */}
          {showFilter && (
            <div className="absolute top-full mt-2 right-0 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden z-10">
              {[3, 5, 10].map((option) => (
                <button
                  key={option}
                  onClick={() => handleLimitChange(option)}
                  className={`block w-full px-6 py-3 text-left text-sm font-medium transition-colors ${
                    limit === option
                      ? 'bg-red-600 text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Top {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="space-y-4">{users.map((user, index) => (
          <div
            key={user.id}
            className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
              index < 3
                ? 'border-transparent shadow-lg'
                : 'border-gray-200 dark:border-gray-700 shadow-md'
            }`}
            style={
              index < 3
                ? {
                    background: `linear-gradient(135deg, ${
                      index === 0
                        ? 'rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05)'
                        : index === 1
                        ? 'rgba(209, 213, 219, 0.1), rgba(156, 163, 175, 0.05)'
                        : 'rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.05)'
                    })`,
                  }
                : undefined
            }
          >
            {/* Rank Badge */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2">
              <div
                className={`w-12 h-12 rounded-full bg-gradient-to-br ${getMedalColor(
                  index
                )} flex items-center justify-center text-white font-bold text-lg shadow-lg border-4 border-white dark:border-gray-900`}
              >
                {index < 3 ? getMedalIcon(index) : `#${index + 1}`}
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 pl-12">
              {/* User Photo */}
              <div className="flex-shrink-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.firstName}
                    className="w-16 h-16 rounded-full border-4 border-gray-200 dark:border-gray-700 object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-2xl border-4 border-gray-200 dark:border-gray-700"
                  style={{ display: user.photoURL ? 'none' : 'flex' }}
                >
                  {user.firstName[0]}
                </div>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.attendedEvents} {user.attendedEvents === 1 ? 'event' : 'events'} attended
                </p>
              </div>

              {/* Points */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {user.points}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">points</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
