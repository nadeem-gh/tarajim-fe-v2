import { 
  BookOpenIcon, 
  MicrophoneIcon, 
  SpeakerWaveIcon, 
  CurrencyDollarIcon,
  ShieldCheckIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Curated Book Collection',
    description: 'Access a carefully curated collection of books in EPUB format for translation projects.',
    icon: BookOpenIcon,
  },
  {
    name: 'Speech-to-Text Translation',
    description: 'Use advanced Whisper AI for speech-to-text translation with 99+ language support.',
    icon: MicrophoneIcon,
  },
  {
    name: 'Audio Reading Experience',
    description: 'Generate high-quality audio books with multiple voice options for accessibility.',
    icon: SpeakerWaveIcon,
  },
  {
    name: 'Escrow Payment System',
    description: 'Secure milestone-based payments with manual approval and escrow protection.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Quality Assurance',
    description: 'Built-in quality control with sample translations and reviewer feedback.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Global Marketplace',
    description: 'Connect with translators and requesters worldwide in a secure platform.',
    icon: GlobeAltIcon,
  },
]

export function Features() {
  return (
    <div className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need for professional translation
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Our platform combines cutting-edge AI technology with human expertise to deliver the best translation experience.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <feature.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  )
}
