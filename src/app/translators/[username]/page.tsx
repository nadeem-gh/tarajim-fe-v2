'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getTranslatorProfile } from '@/lib/api';
import Link from 'next/link';

export default function TranslatorProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.username) {
      loadProfile();
    }
  }, [params.username]);

  async function loadProfile() {
    try {
      setLoading(true);
      const data = await getTranslatorProfile(params.username);
      setProfile(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="p-6">Loading...</main>;
  if (error) return <main className="p-6 text-red-600">{error}</main>;
  if (!profile) return <main className="p-6">Profile not found</main>;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border p-8">
        <div className="flex items-start gap-6">
          {/* Profile Picture */}
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {profile.user?.username?.charAt(0).toUpperCase()}
          </div>
          
          {/* Basic Info */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold text-gray-900">{profile.user?.username}</h1>
              {profile.is_verified && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Verified
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                profile.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                profile.availability_status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {profile.availability_status?.charAt(0).toUpperCase() + profile.availability_status?.slice(1)}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-sm text-gray-600">Location</div>
                <div className="font-medium">{profile.location || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Experience</div>
                <div className="font-medium">{profile.years_experience} years</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Hourly Rate</div>
                <div className="font-medium">
                  {profile.hourly_rate ? `$${profile.hourly_rate}/hour` : 'Not specified'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {profile.bio && (
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
            <p className="text-gray-700">{profile.bio}</p>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <div className="text-2xl font-bold text-blue-600">{profile.average_rating.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
          <div className="text-xs text-gray-500">{profile.total_reviews} reviews</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <div className="text-2xl font-bold text-green-600">{profile.completion_rate.toFixed(0)}%</div>
          <div className="text-sm text-gray-600">Completion Rate</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <div className="text-2xl font-bold text-purple-600">{profile.approved_samples}</div>
          <div className="text-sm text-gray-600">Approved Samples</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border text-center">
          <div className="text-2xl font-bold text-orange-600">{profile.completed_translations}</div>
          <div className="text-sm text-gray-600">Completed Translations</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Languages & Skills</h3>
          <div className="space-y-3">
            {profile.skills?.map((skill: any) => (
              <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{skill.language}</div>
                  <div className="text-sm text-gray-600">{skill.proficiency_level}</div>
                </div>
                {skill.is_native && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                    Native
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Specializations Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Specializations</h3>
          <div className="space-y-3">
            {profile.specializations?.map((spec: any) => (
              <div key={spec.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">{spec.category}</div>
                {spec.subcategory && (
                  <div className="text-sm text-gray-600">{spec.subcategory}</div>
                )}
                <div className="text-xs text-gray-500">{spec.experience_years} years experience</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Portfolio Section */}
      {profile.portfolio && profile.portfolio.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Portfolio</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.portfolio.slice(0, 4).map((item: any) => (
              <div key={item.id} className="border rounded-lg p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{item.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.work_type === 'completed' ? 'bg-green-100 text-green-800' :
                    item.work_type === 'sample' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.work_type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="text-xs text-gray-500">
                  {item.source_language} → {item.target_language}
                  {item.word_count && ` • ${item.word_count} words`}
                </div>
                {item.rating && (
                  <div className="mt-2 text-sm">
                    <span className="text-yellow-500">★</span> {item.rating.toFixed(1)}/5
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      {profile.reviews && profile.reviews.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Reviews</h3>
          <div className="space-y-4">
            {profile.reviews.slice(0, 3).map((review: any) => (
              <div key={review.id} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-yellow-500">★</div>
                  <span className="font-medium">{review.rating}/5</span>
                  <span className="text-sm text-gray-500">by {review.requester_name}</span>
                </div>
                {review.comment && (
                  <p className="text-gray-700">{review.comment}</p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Quality: {review.quality_rating}/5 • 
                  Timeliness: {review.timeliness_rating}/5 • 
                  Communication: {review.communication_rating}/5
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements Section */}
      {profile.achievements && profile.achievements.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.achievements.map((achievement: any) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                  🏆
                </div>
                <div>
                  <div className="font-medium">{achievement.title}</div>
                  <div className="text-sm text-gray-600">{achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
