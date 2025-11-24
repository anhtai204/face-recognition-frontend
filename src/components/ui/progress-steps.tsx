import type React from "react"
import { cn } from "@/lib/utils"

interface ProgressStepsProps {
  currentStep: number
  steps: {
    icon: React.ReactNode
    label: string
  }[]
}

export function ProgressSteps({ currentStep, steps }: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-between w-full mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className="relative flex flex-col items-center">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                currentStep >= index
                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800",
              )}
            >
              {step.icon}
            </div>
            <span className="text-xs mt-2 absolute -bottom-6 text-gray-600 dark:text-gray-400">{step.label}</span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute w-[calc(10rem-2rem)] h-[2px] top-5 left-10 -z-10 transition-colors",
                  currentStep > index ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-700",
                )}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

