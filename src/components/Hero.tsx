import Link from 'next/link'
import { ArrowRightIcon, BookOpenIcon, MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline'

export function Hero() {
  return (
    <div className="relative bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
          <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
            <div className="sm:text-center lg:text-left">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block xl:inline">Translate Books with</span>{' '}
                <span className="block text-primary-600 xl:inline">AI-Powered Precision</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                Connect with professional translators, use speech-to-text for efficient translation, 
                and enjoy audio reading experiences. The future of book translation is here.
              </p>
              <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="/register"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                  >
                    Get started
                    <ArrowRightIcon className="ml-2 -mr-1 w-5 h-5" />
                  </Link>
                </div>
                <div className="mt-3 sm:mt-0 sm:ml-3">
                  <Link
                    href="/books"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                  >
                    Browse Books
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
        <div className="h-56 w-full bg-gradient-to-r from-primary-400 to-primary-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
          <div className="grid grid-cols-2 gap-8 p-8">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <BookOpenIcon className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Curated Books</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <MicrophoneIcon className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Speech-to-Text</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <SpeakerWaveIcon className="h-8 w-8 text-white mx-auto mb-2" />
              <p className="text-white text-sm font-medium">Audio Reading</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="h-8 w-8 bg-white/30 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-white text-xs font-bold">AI</span>
              </div>
              <p className="text-white text-sm font-medium">AI Translation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
