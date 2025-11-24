"use client"
import { ChevronRight, ArrowRight } from "lucide-react"

interface TestimonialProps {
  name: string
  role: string
  company: string
  quote: string
  onNext?: () => void
}

export function TestimonialCard({ name, role, company, quote, onNext }: TestimonialProps) {
  return (
    <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white p-8 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {role} at {company}
          </p>
        </div>
      </div>
      <p className="text-lg mb-6">{quote}</p>
      <div className="flex gap-2">
        <button
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
          aria-label="Previous testimonial"
        >
          <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
        <button
          className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors"
          onClick={onNext}
          aria-label="Next testimonial"
        >
          <ArrowRight className="h-4 w-4 text-white" />
        </button>
      </div>
    </div>
  )
}

