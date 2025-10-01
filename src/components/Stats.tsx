const stats = [
  { name: 'Books Available', value: '500+' },
  { name: 'Languages Supported', value: '99+' },
  { name: 'Active Translators', value: '1,200+' },
  { name: 'Completed Projects', value: '5,000+' },
]

export function Stats() {
  return (
    <div className="bg-primary-600">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Trusted by thousands of users worldwide
          </h2>
          <p className="mt-3 text-xl text-primary-200 sm:mt-4">
            Join our growing community of translators, requesters, and readers.
          </p>
        </div>
        <dl className="mt-10 text-center grid grid-cols-2 gap-8 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="flex flex-col">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-primary-200">
                {stat.name}
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
