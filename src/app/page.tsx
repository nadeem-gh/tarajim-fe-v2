import { Hero } from '@/components/Hero'
import { Features } from '@/components/Features'
import { Stats } from '@/components/Stats'
import { Testimonials } from '@/components/Testimonials'
import { CTA } from '@/components/CTA'

export default function Home() {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Stats />
      <Testimonials />
      <CTA />
    </div>
  )
}
