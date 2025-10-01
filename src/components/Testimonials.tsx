import React from 'react'

const testimonials = [
  {
    body: 'The speech-to-text feature has revolutionized my translation workflow. I can now translate much faster while maintaining quality.',
    author: {
      name: 'Sarah Johnson',
      handle: 'sarahj',
      role: 'Professional Translator',
    },
  },
  {
    body: 'As a requester, I love the escrow system and milestone-based payments. It gives me complete control over the translation process.',
    author: {
      name: 'Michael Chen',
      handle: 'michaelc',
      role: 'Publishing House Owner',
    },
  },
  {
    body: 'The audio reading feature is amazing for accessibility. I can now enjoy translated books while commuting.',
    author: {
      name: 'Emma Rodriguez',
      handle: 'emmar',
      role: 'Book Lover',
    },
  },
]

export function Testimonials() {
  return (
    <div className="bg-white py-16 lg:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <blockquote className="mt-10">
            <div className="max-w-3xl mx-auto text-center text-2xl leading-9 font-medium text-gray-900">
              <p>
                &ldquo;The best translation platform I&apos;ve used. The combination of AI technology and human expertise is perfect.&rdquo;
              </p>
            </div>
            <footer className="mt-8">
              <div className="md:flex md:items-center md:justify-center">
                <div className="md:flex-shrink-0">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary-100">
                    <div className="h-6 w-6 bg-primary-600 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-3 text-center md:mt-0 md:ml-4 md:flex md:items-center">
                  <div className="text-base font-medium text-gray-900">David Kim</div>
                  <svg className="hidden md:block mx-1 h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="text-base font-medium text-gray-500">Verified Translator</div>
                </div>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}
