'use client'
import React, { useRef, KeyboardEvent, ClipboardEvent } from 'react'

interface ValidationCodesProps {
  onComplete: (code: string) => void
  isLoading?: boolean
  codes: string[]
  setCodes: (codes: string[]) => void
  apiError: string
}

const ValidationCodes: React.FC<ValidationCodesProps> = ({
  onComplete,
  isLoading = false,
  codes,
  setCodes,
  apiError
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string): void => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return

    const newCodes = [...codes]
    newCodes[index] = value.slice(-1) // Only take the last digit if multiple characters are entered

    setCodes(newCodes)

    // If a digit was entered and there's a next input, focus it
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // If all codes are filled, call the onComplete callback
    if (index === 5 && value) {
      const completeCode = newCodes.join('')
      if (completeCode.length === 6) {
        onComplete(completeCode)
      }
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>): void => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!codes[index] && index > 0) {
        // If current input is empty and not first input, go to previous input
        inputRefs.current[index - 1]?.focus()
      }
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()

    // Only proceed if pasted data contains numbers only
    if (!/^\d+$/.test(pastedData)) return

    const pastedCodes = pastedData.slice(0, 6).split('')
    const newCodes = [...codes]

    pastedCodes.forEach((code, index) => {
      if (index < 6) newCodes[index] = code
    })

    setCodes(newCodes)

    // Focus the next empty input or the last input if all are filled
    const nextEmptyIndex = newCodes.findIndex((code) => !code)
    if (nextEmptyIndex === -1) {
      inputRefs.current[5]?.focus()
      onComplete(newCodes.join(''))
    } else {
      inputRefs.current[nextEmptyIndex]?.focus()
    }
  }

  return (
    <div className="flex flex-col justify-between items-center mt-4">
      <div className="flex gap-2">
        {codes.map((code, index) => (
          <input
            key={index}
            ref={(el) => {
              if (el) {
                inputRefs.current[index] = el
              }
            }}
            type="text"
            maxLength={1}
            value={code}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={isLoading}
            className="w-11 h-11 text-center border border-gray-700 rounded-md bg-[#0F1B2680] text-white text-base font-semibold focus:outline-none focus:border-blue-500 disabled:opacity-50"
            style={{
              borderColor: apiError ? '#ff0000' : '#8D8D8D20'
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default React.memo(ValidationCodes)
