"use client"

import { useState, useRef, useEffect } from "react"
import Image, { StaticImageData } from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageSliderProps {
  images: StaticImageData[]
}

export function ImageSlider({ images }: ImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const sliderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (sliderRef.current) {
      const sliderWidth = sliderRef.current.clientWidth
      const slideWidth = sliderRef.current.querySelector("div")?.clientWidth || 0
      const gap = 16

      if (slideWidth > 0) {
        const visibleImages = Math.floor(sliderWidth / (slideWidth + gap))
        setTotalPages(Math.ceil(images.length / visibleImages))
      }
    }
  }, [images.length])

  const scrollToImage = (index: number) => {
    if (!sliderRef.current) return

    setCurrentIndex(index)

    const slideWidth = sliderRef.current.querySelector("div")?.clientWidth || 0
    const gap = 16
    if (slideWidth > 0) {
      const scrollPosition = index * (slideWidth + gap)
      sliderRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      })
    }
  }

  const nextImage = () => {
    const newIndex = currentIndex === totalPages - 1 ? 0 : currentIndex + 1
    scrollToImage(newIndex)
  }

  const prevImage = () => {
    const newIndex = currentIndex === 0 ? totalPages - 1 : currentIndex - 1
    scrollToImage(newIndex)
  }

  useEffect(() => {
    const interval = setInterval(() => {
      nextImage()
    }, 5000)

    return () => clearInterval(interval)
  }, [currentIndex]) // Thêm currentIndex để lắng nghe thay đổi

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md -ml-4"
        onClick={prevImage}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div ref={sliderRef} className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
        {images.map((src, index) => (
          <div key={index} className="flex-shrink-0 snap-center">
            <div className="w-36 h-48 md:w-44 md:h-56 overflow-hidden">
              <Image
                src={src || "/placeholder.svg"}
                alt={`Profile ${index + 1}`}
                width={180}
                height={200}
                className="rounded-xl object-cover h-full w-full"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md -mr-4"
        onClick={nextImage}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <div className="flex justify-center gap-2 mt-4">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToImage(index)}
            className={`h-2 w-2 rounded-full transition-colors ${
              index === currentIndex ? "bg-indigo-600 dark:bg-indigo-400" : "bg-gray-300 dark:bg-gray-600"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
