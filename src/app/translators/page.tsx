'use client';
import { useEffect, useState } from 'react';
import { getTranslatorProfiles } from '@/lib/api';
import Link from 'next/link';

export default function TranslatorsPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    language: '',
    specialization: '',
    min_rating: '',
    min_experience: '',
    available_only: false
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      setLoading(true);
      const data = await getTranslatorProfiles(filters);
      setProfiles(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(key: string, value: any) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function applyFilters() {
    loadProfiles();
  }

  if (loading) return <main className="p-6">Loading...</main>;
  if (error) return <main className="p-6 text-red-600">{error}</main>;

  return (
    <main className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Find Translators</h1>
        <div className="text-sm text-gray-600">
          {profiles.length} translators found
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Translators</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
            <input
              type="text"
              placeholder="e.g., Spanish, French"
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <input
              type="text"
              placeholder="e.g., Medical, Legal"
              value={filters.specialization}
              onChange={(e) => handleFilterChange('specialization', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
            <select
              value={filters.min_rating}
              onChange={(e) => handleFilterChange('min_rating', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Any</option>
              <option value="4">4+ stars</option>
              <option value="3">3+ stars</option>
              <option value="2">2+ stars</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience</label>
            <select
              value={filters.min_experience}
              onChange={(e) => handleFilterChange('min_experience', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Any</option>
              <option value="1">1+ years</option>
              <option value="3">3+ years</option>
              <option value="5">5+ years</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={applyFilters}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Apply Filters
            </button>
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <input
            type="checkbox"
            id="available_only"
            checked={filters.available_only}
            onChange={(e) => handleFilterChange('available_only', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="available_only" className="text-sm text-gray-700">
            Show only available translators
          </label>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Link
            key={profile.id}
            href={`/translators/${profile.user.username}`}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-lg transition-all duration-200"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {profile.user.username.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{profile.user.username}</h3>
                  {profile.is_verified && (
                    <span className="text-green-600 text-sm">✓</span>
                  )}
                </div>
                <div className="text-sm text-gray-600">{profile.location || 'Location not specified'}</div>
                <div className="text-sm text-gray-500">{profile.years_experience} years experience</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">★</span>
                  <span className="font-medium">{profile.average_rating.toFixed(1)}</span>
                  <span className="text-gray-500">({profile.total_reviews})</span>
                </div>
                <div className="text-gray-500">•</div>
                <div className="text-green-600 font-medium">{profile.completion_rate.toFixed(0)}% completion</div>
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm text-gray-700 mb-4 line-clamp-2">{profile.bio}</p>
            )}

            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium text-gray-700">Languages:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.skills?.slice(0, 3).map((skill: any) => (
                    <span key={skill.id} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {skill.language}
                    </span>
                  ))}
                  {profile.skills?.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{profile.skills.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="text-sm">
                <span className="font-medium text-gray-700">Specializations:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile.specializations?.slice(0, 2).map((spec: any) => (
                    <span key={spec.id} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {spec.category}
                    </span>
                  ))}
                  {profile.specializations?.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                      +{profile.specializations.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {profile.approved_samples} approved samples • {profile.completed_translations} completed
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                profile.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                profile.availability_status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {profile.availability_status}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No translators found</div>
          <div className="text-gray-400 text-sm">Try adjusting your filters</div>
        </div>
      )}
    </main>
  );
}
