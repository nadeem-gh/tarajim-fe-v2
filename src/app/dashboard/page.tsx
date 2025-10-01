'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useQuery } from 'react-query'
import { api } from '@/lib/api'
import { 
  BookOpenIcon, 
  CurrencyDollarIcon, 
  MicrophoneIcon, 
  SpeakerWaveIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function Dashboard() {
  const { user } = useAuth()

  const { data: stats, isLoading } = useQuery('user-stats', async () => {
    const response = await api.get('/accounts/stats/')
    return response.data
  })

  const { data: recentBooks } = useQuery('recent-books', async () => {
    const response = await api.get('/books/?limit=5')
    return response.data.results
  })

  const { data: recentTranslations } = useQuery('recent-translations', async () => {
    const response = await api.get('/translations/requests/?limit=5')
    return response.data.results
  })

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Please log in to access your dashboard.</p>
      </div>
    )
  }

  const getRoleSpecificStats = () => {
    if (!stats) return []

    switch (user.role) {
      case 'reader':
        return [
          { name: 'Books Read', value: stats.total_content_read || 0, icon: BookOpenIcon },
          { name: 'Listening Time', value: `${stats.total_listening_time || 0} min`, icon: SpeakerWaveIcon },
          { name: 'Favorite Genres', value: stats.favorite_genres?.length || 0, icon: ChartBarIcon },
        ]
      case 'requester':
        return [
          { name: 'Total Spent', value: `$${stats.total_amount_spent || 0}`, icon: CurrencyDollarIcon },
          { name: 'Requests Made', value: stats.total_requests_made || 0, icon: BookOpenIcon },
          { name: 'Active Projects', value: stats.in_progress_requests || 0, icon: ClockIcon },
        ]
      case 'translator':
        return [
          { name: 'Total Earnings', value: `$${stats.total_earnings || 0}`, icon: CurrencyDollarIcon },
          { name: 'Rating', value: `${stats.rating || 0}/5`, icon: ChartBarIcon },
          { name: 'Portfolio Samples', value: stats.portfolio_samples_count || 0, icon: BookOpenIcon },
        ]
      default:
        return []
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user.first_name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here&apos;s what&apos;s happening with your {user.role} account.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {getRoleSpecificStats().map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="text-lg font-medium text-gray-900">{stat.value}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Books */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Books</h3>
            <div className="mt-5">
              {recentBooks?.map((book: any) => (
                <div key={book.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    <BookOpenIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{book.title}</p>
                      <p className="text-sm text-gray-500">{book.author}</p>
                    </div>
                  </div>
                  <Link
                    href={`/books/${book.id}`}
                    className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/books"
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                View all books →
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Translations */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Translation Requests</h3>
            <div className="mt-5">
              {recentTranslations?.map((request: any) => (
                <div key={request.id} className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
                  <div className="flex items-center">
                    <MicrophoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{request.title}</p>
                      <p className="text-sm text-gray-500">{request.book_title}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    request.status === 'open' ? 'bg-green-100 text-green-800' :
                    request.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link
                href="/translations"
                className="text-primary-600 hover:text-primary-500 text-sm font-medium"
              >
                View all translations →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user.role === 'reader' && (
            <>
              <Link
                href="/books"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                    <BookOpenIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Browse Books
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Discover and purchase translated books.
                  </p>
                </div>
              </Link>
            </>
          )}
          
          {user.role === 'requester' && (
            <>
              <Link
                href="/translations/requests/new"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                    <MicrophoneIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Create Request
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Start a new translation project.
                  </p>
                </div>
              </Link>
            </>
          )}
          
          {user.role === 'translator' && (
            <>
              <Link
                href="/translations/requests"
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow"
              >
                <div>
                  <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
                    <MicrophoneIcon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-8">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Find Work
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Browse available translation requests.
                  </p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
