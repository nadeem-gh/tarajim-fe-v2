'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfiles } from '@/lib/api';

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
  // Role-specific fields
  years_experience?: number;
  hourly_rate_dollars?: number;
  availability_status?: string;
  is_verified?: boolean;
  average_rating?: number;
  total_reviews?: number;
  completed_translations_count?: number;
  total_spent_dollars?: number;
  total_requests_made?: number;
  total_content_read?: number;
}

export default function ProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [languagesFilter, setLanguagesFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, [roleFilter, locationFilter, languagesFilter, availableOnly]);

  async function loadProfiles() {
    try {
      setLoading(true);
      const params: any = {};
      if (roleFilter) params.role = roleFilter;
      if (locationFilter) params.location = locationFilter;
      if (languagesFilter) params.languages = languagesFilter;
      if (availableOnly) params.available_only = true;
      
      const data = await getProfiles(params) as any;
      setProfiles(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }

  const handleProfileClick = (username: string) => {
    router.push(`/profiles/${username}`);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'translator': return 'bg-blue-100 text-blue-800';
      case 'requester': return 'bg-green-100 text-green-800';
      case 'reader': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityBadge = (profile: Profile) => {
    if (profile.role !== 'translator' || !profile.availability_status) return null;
    
    const colors = {
      available: 'bg-green-100 text-green-800',
      busy: 'bg-yellow-100 text-yellow-800',
      unavailable: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[profile.availability_status as keyof typeof colors]}`}>
        {profile.availability_status.charAt(0).toUpperCase() + profile.availability_status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Profiles</h1>
          <p className="text-gray-600">Discover translators, requesters, and readers on the platform</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select 
                value={roleFilter} 
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="translator">Translators</option>
                <option value="requester">Requesters</option>
                <option value="reader">Readers</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder="Enter location"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
              <input
                type="text"
                value={languagesFilter}
                onChange={(e) => setLanguagesFilter(e.target.value)}
                placeholder="e.g., English, Spanish"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {roleFilter === 'translator' && (
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={availableOnly}
                    onChange={(e) => setAvailableOnly(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Available only</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {profiles.map((profile) => (
            <div 
              key={profile.id}
              onClick={() => handleProfileClick(profile.user.username)}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  {profile.profile_picture ? (
                    <img 
                      src={profile.profile_picture} 
                      alt={profile.user.username}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-600">
                        {profile.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">{profile.user.username}</h3>
                      {profile.is_verified && (
                        <span className="text-blue-600">✓</span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(profile.role)}`}>
                      {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                    </span>
                    {getAvailabilityBadge(profile)}
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{profile.bio}</p>
                )}
                
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                  {profile.location && <span>📍 {profile.location}</span>}
                  {profile.languages && <span>🗣️ {profile.languages}</span>}
                </div>
                
                {/* Role-specific stats */}
                <div className="text-sm text-gray-600">
                  {profile.role === 'translator' && (
                    <div className="flex justify-between">
                      <span>{profile.completed_translations_count || 0} completed</span>
                      {profile.average_rating && (
                        <span>⭐ {profile.average_rating.toFixed(1)} ({profile.total_reviews || 0})</span>
                      )}
                    </div>
                  )}
                  
                  {profile.role === 'requester' && (
                    <div className="flex justify-between">
                      <span>{profile.total_requests_made || 0} requests</span>
                      <span>${profile.total_spent_dollars?.toFixed(2) || '0.00'} spent</span>
                    </div>
                  )}
                  
                  {profile.role === 'reader' && (
                    <div className="flex justify-between">
                      <span>{profile.total_content_read || 0} pages read</span>
                      <span>📚 Reader</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {profiles.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No profiles found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
