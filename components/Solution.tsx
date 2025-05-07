import React, {  useRef } from 'react'
  import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

interface CodeProps {
  inline?: boolean
  className?: string
  children: React.ReactNode
}

const Solution = ({solutions}: {solutions: string[]})=> {

  const solutionContainerRef = useRef<HTMLDivElement>(null)

  const components: Components = {
    code: (({ inline, className, children }: CodeProps) => {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: '1rem',
            borderRadius: '0.375rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            fontSize: '0.875rem',
            overflowX: 'auto'
          }}
          showLineNumbers
          wrapLines
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-800 px-1 py-0.5 rounded text-xs font-inter">{children}</code>
      )
    }) as Components['code'],
    p({ children }) {
      return <p className="text-white text-sm mb-2 leading-relaxed font-inter">{children}</p>
    },
    h1({ children }) {
      return <h1 className="text-white text-sm font-bold mb-3 font-inter">{children}</h1>
    },
    h2({ children }) {
      return <h2 className="text-white text-sm font-bold mb-2 font-inter">{children}</h2>
    },
    h3({ children }) {
      return <h3 className="text-white text-sm font-bold mb-2 font-inter">{children}</h3>
    },
    h4({ children }) {
      return <h4 className="text-white text-sm font-bold mb-2 font-inter">{children}</h4>
    },
    ul({ children }) {
      return (
        <ul className="text-white text-sm mb-2 list-disc list-inside space-y-1 font-inter">
          {children}
        </ul>
      )
    },
    ol({ children }) {
      return (
        <ol className="text-white text-sm mb-2 list-decimal list-inside space-y-1 font-inter">
          {children}
        </ol>
      )
    },
    li({ children }) {
      return <li className="text-white text-[13px] mb-1 font-inter">{children}</li>
    },
    pre({ children }) {
      return <pre className="mb-2 font-inter">{children}</pre>
    },
    blockquote({ children }) {
      return (
        <blockquote className="border-l-4 border-gray-600 pl-4 my-2 italic text-gray-300 font-inter">
          {children}
        </blockquote>
      )
    },
    strong({ children }) {
      return <strong className="font-bold text-white font-inter">{children}</strong>
    },
    em({ children }) {
      return <em className="italic text-gray-300 font-inter">{children}</em>
    }
  }

  // Function to process the solution text to ensure proper markdown formatting
  const processSolution = (text: string): string => {
    if (!text) return ''

    // Handle the case when there's no code to debug
    if (
      text.includes("I don't see any Python code to debug") ||
      text.includes("There doesn't appear to be any Python code to debug")
    ) {
      // Format the text with proper markdown headers and lists
      let formattedText = text

      // Add header for problem description
      if (text.includes('problem #')) {
        const problemMatch = text.match(/problem #(\d+)/)
        if (problemMatch) {
          formattedText = formattedText.replace(/problem #\d+/, `## Problem #${problemMatch[1]}`)
        }
      }

      // Format lists that start with "-"
      formattedText = formattedText.replace(/\n- (.*?)(?=\n-|\n\n|$)/g, '\n* $1')

      // Format code-like text with backticks
      formattedText = formattedText.replace(/`([^`]+)`/g, '`$1`')

      return formattedText
    }

    // Ensure proper spacing for markdown headers
    text = text.replace(/\n\*\*(.*?)\*\*/g, '\n\n**$1**')

    // Handle code blocks specifically
    if (text.includes('--\n')) {
      // Extract the code block
      const codeBlockMatch = text.match(/--\n([\s\S]*?)--\n/)
      if (codeBlockMatch && codeBlockMatch[1]) {
        const codeBlock = codeBlockMatch[1].trim()

        // Determine the language based on code content
        let language = 'plaintext'

        if (codeBlock.includes('import java.util') || codeBlock.includes('public class Solution')) {
          language = 'java'
        } else if (
          codeBlock.includes('#include <iostream>') ||
          codeBlock.includes('using namespace std')
        ) {
          language = 'cpp'
        } else if (
          codeBlock.includes('def ') ||
          codeBlock.includes('print(') ||
          codeBlock.includes('if __name__ == "__main__"') ||
          codeBlock.includes('#!/usr/bin/env python')
        ) {
          language = 'python'
        }

        // Replace the code block with proper markdown formatting
        text = text.replace(/--\n[\s\S]*?--\n/, `\n\n\`\`\`${language}\n${codeBlock}\n\`\`\`\n\n`)
      }
    }

    // Check if the text contains code blocks that need special handling
    if (text.includes('```') || text.includes('Test Case') || text.includes('Code')) {
      // If it's already in markdown format with code blocks, return as is
      if (text.includes('```')) {
        return text
      }

      // If it's a code block without markdown formatting, wrap it in code block markers
      if (text.includes('Test Case') || text.includes('Code')) {
        // Look for Python code patterns
        const pythonPatterns = [
          'def ',
          'print(',
          'if __name__ == "__main__"',
          '#!/usr/bin/env python',
          'import unittest',
          'class Test',
          'self.assertEqual'
        ]

        // Check if any Python pattern is present
        const isPython = pythonPatterns.some((pattern) => text.includes(pattern))

        if (isPython) {
          // Extract the code section
          const codeMatch = text.match(/Code\s*\n+([\s\S]*?)(?=\n\nComplexity|$)/)
          if (codeMatch && codeMatch[1]) {
            const codeBlock = codeMatch[1].trim()
            return text.replace(
              /Code\s*\n+([\s\S]*?)(?=\n\nComplexity|$)/,
              `Code\n\n\`\`\`python\n${codeBlock}\n\`\`\`\n\n`
            )
          }
        }

        // Default to plain text if language can't be determined
        return '```\n' + text + '\n```'
      }
    }

    return text
  }

  return (
    <div className="mt-8 w-[700px]">
      <div
        ref={solutionContainerRef}
        className="py-0 px-4 rounded-md bg-[#0F1B2698] bg-opacity-50 overflow-y-auto"
      >
        <div className="py-1">
          {solutions.length > 0 &&
            solutions.map((solution, index) => (
              <div
                className="prose prose-invert max-w-non py-0"
                style={{
                  marginTop: index > 0 ? '2rem' : '0rem',
                  paddingTop: index > 0 ? '2rem' : '1rem'
                }}
                key={index}
              >
                <ReactMarkdown key={index} components={components}>
                  {processSolution(solution)}
                </ReactMarkdown>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default React.memo(Solution)
