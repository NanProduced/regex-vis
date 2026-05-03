import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Check as CheckIcon, Trash as TrashIcon, X as XIcon, Info as InfoIcon } from '@phosphor-icons/react'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type CaptureGroup = {
  index: number
  value: string
  start: number
  end: number
  name?: string
}

type MatchResult = {
  matchIndex: number
  fullMatch: string
  start: number
  end: number
  groups: CaptureGroup[]
}

type Props = {
  value: string
  regExp: RegExp | null
  onChange: (value: string) => void
  onRemove: () => void
}

const MATCH_TIMEOUT = 1000
const MAX_INPUT_LENGTH = 10000
const MAX_MATCHES = 100
const TRUNCATE_LENGTH = 50
const DANGEROUS_PATTERN_INPUT_LIMIT = 30

const matchColors = [
  'bg-blue-100 dark:bg-blue-900/40',
  'bg-green-100 dark:bg-green-900/40',
  'bg-yellow-100 dark:bg-yellow-900/40',
  'bg-pink-100 dark:bg-pink-900/40',
  'bg-purple-100 dark:bg-purple-900/40',
]

function truncateText(text: string, maxLength: number = TRUNCATE_LENGTH): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

function hasNestedQuantifiers(source: string): boolean {
  const quantifiers = ['+', '*', '?', '{']
  let depth = 0
  let inCharClass = false
  let escaped = false
  
  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    
    if (escaped) {
      escaped = false
      continue
    }
    
    if (char === '\\') {
      escaped = true
      continue
    }
    
    if (char === '[') {
      inCharClass = true
      continue
    }
    
    if (char === ']' && inCharClass) {
      inCharClass = false
      continue
    }
    
    if (inCharClass) continue
    
    if (char === '(') {
      depth++
      continue
    }
    
    if (char === ')') {
      if (i + 1 < source.length && quantifiers.includes(source[i + 1])) {
        return true
      }
      depth--
      continue
    }
  }
  
  return false
}

function hasCatastrophicBacktrackingPotential(regex: RegExp): { dangerous: boolean; reason: string } {
  const source = regex.source
  
  if (hasNestedQuantifiers(source)) {
    return { 
      dangerous: true, 
      reason: 'Nested quantifiers detected (e.g., (a+)+) which may cause exponential backtracking' 
    }
  }
  
  const dangerousPatterns = [
    { pattern: /\([^)]*\+[^)]*\+\)/, name: 'nested + quantifiers' },
    { pattern: /\([^)]*\*[^)]*\*\)/, name: 'nested * quantifiers' },
    { pattern: /\([^)]*\+[^)]*\*\)/, name: 'mixed + and * quantifiers' },
    { pattern: /\([^)]*\*[^)]*\+\)/, name: 'mixed * and + quantifiers' },
    { pattern: /\(\?\:.*\+.*\+\)/, name: 'nested + in non-capturing group' },
    { pattern: /\(\?\:.*\*.*\*\)/, name: 'nested * in non-capturing group' },
    { pattern: /\(\?=.*\+.*\+\)/, name: 'nested + in lookahead' },
    { pattern: /\(\?=.*\*.*\*\)/, name: 'nested * in lookahead' },
    { pattern: /\(\?!.*\+.*\+\)/, name: 'nested + in negative lookahead' },
    { pattern: /\(\?!.*\*.*\*\)/, name: 'nested * in negative lookahead' },
  ]
  
  for (const dp of dangerousPatterns) {
    if (dp.pattern.test(source)) {
      return { dangerous: true, reason: `Pattern contains ${dp.name}` }
    }
  }
  
  return { dangerous: false, reason: '' }
}

function TestItem({ value, regExp, onChange, onRemove }: Props) {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [warningMessage, setWarningMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<number | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const executeMatchWithLimit = useCallback((
    regex: RegExp, 
    input: string, 
    timeLimit: number
  ): { results: MatchResult[], timedOut: boolean, error: boolean } => {
    const results: MatchResult[] = []
    const hasGlobalFlag = regex.global
    const workingRegex = new RegExp(regex.source, regex.flags)
    let matchIndex = 0
    let lastIndex = 0
    const inputLength = input.length
    
    const startTime = performance.now()
    let iterationCount = 0
    const maxIterations = 10000

    try {
      while (true) {
        iterationCount++
        
        if (iterationCount > maxIterations) {
          return { results, timedOut: true, error: false }
        }
        
        const elapsed = performance.now() - startTime
        if (elapsed > timeLimit) {
          return { results, timedOut: true, error: false }
        }

        workingRegex.lastIndex = lastIndex
        const match = workingRegex.exec(input)

        if (!match) break

        const fullMatch = match[0]
        const matchStart = match.index
        const matchEnd = matchStart + fullMatch.length

        const groups: CaptureGroup[] = []
        for (let i = 1; i < match.length; i++) {
          if (match[i] !== undefined) {
            const groupValue = match[i]
            let groupStart = -1
            
            if (groupValue.length > 0) {
              groupStart = input.indexOf(groupValue, Math.max(0, matchStart))
              if (groupStart === -1 || groupStart > matchEnd) {
                groupStart = matchStart
              }
            } else {
              groupStart = matchStart
            }
            
            const groupEnd = groupStart + groupValue.length
            
            let groupName: string | undefined
            if (match.groups) {
              for (const [name, val] of Object.entries(match.groups)) {
                if (val === groupValue) {
                  groupName = name
                  break
                }
              }
            }

            groups.push({
              index: i,
              value: groupValue,
              start: groupStart,
              end: groupEnd,
              name: groupName,
            })
          }
        }

        results.push({
          matchIndex,
          fullMatch,
          start: matchStart,
          end: matchEnd,
          groups,
        })

        matchIndex++

        if (matchIndex > MAX_MATCHES) break

        if (!hasGlobalFlag) break

        if (matchEnd === lastIndex) {
          if (lastIndex >= inputLength) break
          lastIndex++
        } else {
          lastIndex = matchEnd
        }
      }

      return { results, timedOut: false, error: false }
    } catch (err) {
      return { results: [], timedOut: false, error: true }
    }
  }, [])

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (!regExp || !value) {
      setMatches([])
      setIsTimedOut(false)
      setIsError(false)
      setIsProcessing(false)
      setWarningMessage(null)
      return
    }

    setIsTimedOut(false)
    setIsError(false)
    setIsProcessing(true)
    setWarningMessage(null)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const timerId = window.setTimeout(() => {
      abortController.abort()
    }, MATCH_TIMEOUT + 500)
    timeoutRef.current = timerId

    const processMatch = () => {
      if (!isMountedRef.current || abortController.signal.aborted) {
        setIsProcessing(false)
        return
      }

      const inputLength = value.length
      let effectiveTimeLimit = MATCH_TIMEOUT

      if (inputLength > MAX_INPUT_LENGTH) {
        setIsTimedOut(true)
        setIsError(false)
        setMatches([])
        setWarningMessage(`Input too long (${inputLength} chars). Maximum allowed: ${MAX_INPUT_LENGTH}`)
        setIsProcessing(false)
        return
      }

      const backtrackingCheck = hasCatastrophicBacktrackingPotential(regExp)
      
      if (backtrackingCheck.dangerous) {
        if (inputLength > DANGEROUS_PATTERN_INPUT_LIMIT) {
          setIsTimedOut(false)
          setIsError(false)
          setMatches([])
          setWarningMessage(
            `⚠️ Dangerous regex pattern detected: ${backtrackingCheck.reason}. ` +
            `Input limited to ${DANGEROUS_PATTERN_INPUT_LIMIT} characters to prevent browser freeze. ` +
            `Current input: ${inputLength} characters.`
          )
          setIsProcessing(false)
          return
        }
        
        effectiveTimeLimit = Math.min(50, MATCH_TIMEOUT)
        setWarningMessage(
          `⚠️ Warning: ${backtrackingCheck.reason}. ` +
          `Execution limited to ${effectiveTimeLimit}ms.`
        )
      }

      if (inputLength > 1000) {
        effectiveTimeLimit = Math.min(effectiveTimeLimit, 500)
      }

      const startTime = performance.now()
      
      try {
        const { results, timedOut, error } = executeMatchWithLimit(
          regExp, 
          value, 
          effectiveTimeLimit
        )

        if (!isMountedRef.current || abortController.signal.aborted) {
          setIsProcessing(false)
          return
        }

        const elapsed = performance.now() - startTime
        
        if (timedOut) {
          setIsTimedOut(true)
          setIsError(false)
          setMatches([])
          if (!backtrackingCheck.dangerous) {
            setWarningMessage(`Matching timed out after ${Math.round(elapsed)}ms. The regex may be too complex.`)
          }
        } else if (error) {
          setIsTimedOut(false)
          setIsError(true)
          setMatches([])
        } else {
          setIsTimedOut(false)
          setIsError(false)
          setMatches(results)
        }
      } catch (err) {
        if (isMountedRef.current && !abortController.signal.aborted) {
          setIsError(true)
          setMatches([])
        }
      } finally {
        if (isMountedRef.current) {
          setIsProcessing(false)
        }
      }
    }

    const startDelay = window.setTimeout(processMatch, 50)

    return () => {
      clearTimeout(startDelay)
      clearTimeout(timerId)
      abortController.abort()
    }
  }, [value, regExp, executeMatchWithLimit])

  const isPass = matches.length > 0

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
  }

  const renderHighlightedText = () => {
    if (!value || matches.length === 0) {
      return <span>{value || ''}</span>
    }

    const elements: React.ReactNode[] = []
    let currentPosition = 0

    const sortedMatches = [...matches].sort((a, b) => a.start - b.start)

    for (let i = 0; i < sortedMatches.length; i++) {
      const match = sortedMatches[i]
      const colorClass = matchColors[i % matchColors.length]

      if (currentPosition < match.start) {
        elements.push(
          <span key={`text-${currentPosition}`}>
            {value.slice(currentPosition, match.start)}
          </span>
        )
      }

      const matchElements: React.ReactNode[] = []
      let matchCurrentPos = match.start

      const sortedGroups = [...match.groups].sort((a, b) => a.start - b.start)

      for (let j = 0; j < sortedGroups.length; j++) {
        const group = sortedGroups[j]
        const effectiveStart = Math.max(group.start, match.start)
        const effectiveEnd = Math.min(group.end, match.end)

        if (effectiveStart >= effectiveEnd) continue

        if (matchCurrentPos < effectiveStart) {
          matchElements.push(
            <span key={`match-${i}-text-${matchCurrentPos}`}>
              {value.slice(matchCurrentPos, effectiveStart)}
            </span>
          )
        }

        const groupText = value.slice(effectiveStart, effectiveEnd)
        const tooltipContent = group.name 
          ? `Group ${group.index}: "${group.name}" = "${groupText}"`
          : `Group ${group.index} = "${groupText}"`

        matchElements.push(
          <TooltipProvider key={`match-${i}-group-${j}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="border-b-2 border-dashed border-purple-500 dark:border-purple-400 cursor-help">
                  {groupText}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )

        matchCurrentPos = effectiveEnd
      }

      if (matchCurrentPos < match.end) {
        matchElements.push(
          <span key={`match-${i}-text-end`}>
            {value.slice(matchCurrentPos, match.end)}
          </span>
        )
      }

      const matchTooltipContent = `Match ${i + 1}: "${match.fullMatch}" (positions ${match.start}-${match.end})`

      elements.push(
        <TooltipProvider key={`match-${i}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={`${colorClass} rounded px-0.5`}>
                {matchElements}
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs break-words">{matchTooltipContent}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )

      currentPosition = match.end
    }

    if (currentPosition < value.length) {
      elements.push(
        <span key="text-end">
          {value.slice(currentPosition)}
        </span>
      )
    }

    return <>{elements}</>
  }

  const renderStats = () => {
    if (matches.length === 0) return null

    return (
      <div className="mt-2 p-3 bg-muted rounded-md text-xs overflow-hidden">
        <div className="font-semibold mb-2 flex items-center gap-1">
          <InfoIcon className="h-3 w-3 flex-shrink-0" />
          <span>Match Statistics</span>
        </div>
        <div className="mb-1">
          <span className="text-muted-foreground">Matches: </span>
          <span className="font-medium">{matches.length}</span>
        </div>
        
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {matches.map((match, idx) => (
            <div key={idx} className="pt-2 border-t border-border">
              <div className="font-medium text-xs mb-1 flex items-center gap-1 min-w-0">
                <span className="flex-shrink-0">Match {idx + 1}: </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-mono truncate min-w-0 cursor-help">
                        "{truncateText(match.fullMatch)}"
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs break-all font-mono text-xs">
                        "{match.fullMatch}"
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Positions: {match.start}-{match.end}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <span className="text-muted-foreground flex-shrink-0">
                  ({match.start}-{match.end})
                </span>
              </div>
              
              {match.groups.length > 0 && (
                <div className="pl-2 space-y-1 mt-1">
                  {match.groups.map((group, gIdx) => (
                    <div key={gIdx} className="text-xs flex items-start gap-1 min-w-0">
                      <span className="text-muted-foreground flex-shrink-0">
                        {group.name ? `Group ${group.index} (${group.name}): ` : `Group ${group.index}: `}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="font-mono truncate min-w-0 cursor-help">
                              "{truncateText(group.value)}"
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs break-all font-mono text-xs">
                              "{group.value}"
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Positions: {group.start}-{group.end}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="text-muted-foreground flex-shrink-0">
                        ({group.start}-{group.end})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="focus-within:outline-none focus-within:ring-1 focus-within:ring-ring rounded-md">
      <Textarea
        defaultValue={value}
        onChange={onChange}
        className="rounded-b-none font-mono"
        onKeyDown={onKeyDown}
        placeholder="Enter test string..."
      />
      
      {warningMessage && (
        <div className="border border-t-0 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-sm">
          <span className="text-yellow-800 dark:text-yellow-200 break-words">
            {warningMessage}
          </span>
        </div>
      )}
      
      {value && !warningMessage && (
        <div className="border border-t-0 px-3 py-2 bg-muted font-mono text-sm whitespace-pre-wrap break-all min-h-[40px]">
          {isProcessing ? (
            <span className="text-muted-foreground">Processing...</span>
          ) : isTimedOut ? (
            <span className="text-destructive">
              ⚠️ Matching timed out. The regex may be too complex or the input too long.
            </span>
          ) : isError ? (
            <span className="text-destructive">
              ⚠️ Error occurred during matching.
            </span>
          ) : (
            renderHighlightedText()
          )}
        </div>
      )}
      
      {!isProcessing && renderStats()}
      
      <div className="border border-t-0 rounded-b-md flex justify-between items-center pl-4 bg-muted">
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <span className="text-xs text-muted-foreground">Processing...</span>
          ) : isPass ? (
            <>
              <CheckIcon className="h-4 w-4 fill-green-700 dark:fill-green-500" />
              <span className="text-xs text-green-700 dark:text-green-500">
                {matches.length} match{matches.length !== 1 ? 'es' : ''}
              </span>
            </>
          ) : (
            <>
              <XIcon className="h-4 w-4 fill-red-700 dark:fill-red-500" />
              <span className="text-xs text-red-700 dark:text-red-500">No match</span>
            </>
          )}
        </div>
        <TrashIcon 
          className="h-4 w-4 p-2 box-content cursor-pointer fill-foreground/80" 
          onClick={onRemove} 
        />
      </div>
    </div>
  )
}

export default TestItem