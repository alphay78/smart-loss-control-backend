"use client"

import { useRef, useEffect, type KeyboardEvent } from "react"

interface PinInputProps {
  value: string[]
  onChange: (value: string[]) => void
  length?: number
  autoFocus?: boolean
  label?: string
}

export function PinInput({
  value,
  onChange,
  length = 4,
  autoFocus = false,
  label = "Enter PIN",
}: PinInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus) {
      inputRefs.current[0]?.focus()
    }
  }, [autoFocus])

  function handleChange(index: number, inputValue: string) {
    if (!/^\d*$/.test(inputValue)) return

    const newPin = [...value]
    newPin[index] = inputValue.slice(-1)
    onChange(newPin)

    if (inputValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="sr-only">{label}</span>
      <div className="flex gap-4 justify-center">
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={value[index] || ""}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className="h-16 w-16 rounded-xl border-2 border-input bg-card text-center text-2xl font-bold text-foreground focus:border-primary focus:outline-none transition-colors"
            aria-label={`PIN digit ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
