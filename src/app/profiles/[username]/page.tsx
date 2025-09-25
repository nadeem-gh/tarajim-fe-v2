'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPublicProfile, getProfileStats } from '@/lib/api';

interface Profile {
  id: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    date_joined: string;
  };
  role: string;
  bio: string;
  languages: string;
  profile_picture: string;
  location: string;
  website: string;
  created_at: string;
  updated_at: string;
  // Reader fields
  total_content_read: number;
  total_listening_time: number;
  favorite_genres: string;
  // Requester fields
  total_spent_dollars: number;
  total_requests_made: number;
  preferred_languages: string;
  budget_range: string;
  // Translator fields
  years_experience: number;
  hourly_rate_dollars: number;
  availability_status: string;
  is_verified: boolean;
  // Performance metrics
  average_rating: number;
  total_reviews: number;
  completed_translations_count: number;
  approved_samples_count: number;
}

interface ProfileStats {
  total_content_read: number;
  total_listening_time: number;
  favorite_genres: string[];
  total_spent_dollars: number;
  total_requests_made: number;
  average_request_value: number;
  completed_translations: number;
  approved_samples: number;
  average_rating: number;
  total_reviews: number;
  years_experience: number;
  days_since_joined: number;
  last_activity: string;
  profile_completeness: number;
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const [profileData, statsData] = await Promise.all([
          getPublicProfile(username),
          getProfileStats(username)
        ]);
        setProfile(profileData as any);
        setStats(statsData as any);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      loadProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">{error || 'This profile is not available'}</p>
        </div>
      </div>
    );
  }

  const renderRoleSpecificContent = () => {
    if (!stats) return null;

    switch (profile.role) {
      case 'reader':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Reading Activity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_content_read}</div>
                <div className="text-sm text-gray-600">Pages Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.floor(stats.total_listening_time / 60)}</div>
                <div className="text-sm text-gray-600">Hours Listened</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.days_since_joined}</div>
                <div className="text-sm text-gray-600">Days on Platform</div>
              </div>
            </div>
            {stats.favorite_genres.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Favorite Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {stats.favorite_genres.map((genre, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'requester':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Translation Investment</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${stats.total_spent_dollars.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total_requests_made}</div>
                <div className="text-sm text-gray-600">Requests Made</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${stats.average_request_value.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Avg. Request Value</div>
              </div>
            </div>
            {profile.preferred_languages && (
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Preferred Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_languages.split(',').map((lang, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {lang.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'translator':
        return (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Translation Expertise</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.completed_translations}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.approved_samples}</div>
                <div className="text-sm text-gray-600">Approved Samples</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.average_rating.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Rating ({stats.total_reviews} reviews)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.years_experience}</div>
                <div className="text-sm text-gray-600">Years Experience</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  profile.availability_status === 'available' 
                    ? 'bg-green-100 text-green-800' 
                    : profile.availability_status === 'busy'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {profile.availability_status.charAt(0).toUpperCase() + profile.availability_status.slice(1)}
                </span>
                {profile.is_verified && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                    ✓ Verified
                  </span>
                )}
              </div>
              {profile.hourly_rate_dollars && (
                <div className="text-lg font-semibold text-gray-900">
                  ${profile.hourly_rate_dollars.toFixed(2)}/hour
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start gap-6">
            {profile.profile_picture ? (
              <img 
                src={profile.profile_picture} 
                alt={profile.user.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-600">
                  {profile.user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{profile.user.username}</h1>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
              
              {profile.bio && (
                <p className="text-gray-700 mb-3">{profile.bio}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {profile.location && (
                  <span>📍 {profile.location}</span>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    🌐 Website
                  </a>
                )}
                {profile.languages && (
                  <span>🗣️ {profile.languages}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Role-specific content */}
        {renderRoleSpecificContent()}

        {/* Profile completeness */}
        {stats && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Profile Completeness</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.profile_completeness}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-600">
                {stats.profile_completeness.toFixed(0)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
