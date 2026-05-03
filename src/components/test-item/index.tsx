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

const MATCH_TIMEOUT = 2000

const matchColors = [
  'bg-blue-100 dark:bg-blue-900/40',
  'bg-green-100 dark:bg-green-900/40',
  'bg-yellow-100 dark:bg-yellow-900/40',
  'bg-pink-100 dark:bg-pink-900/40',
  'bg-purple-100 dark:bg-purple-900/40',
]

function TestItem({ value, regExp, onChange, onRemove }: Props) {
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [isTimedOut, setIsTimedOut] = useState(false)
  const [isError, setIsError] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const executeMatch = useCallback((regex: RegExp, input: string): MatchResult[] => {
    const results: MatchResult[] = []
    const hasGlobalFlag = regex.global
    const workingRegex = new RegExp(regex.source, regex.flags)
    let matchIndex = 0
    let lastIndex = 0
    const inputLength = input.length

    while (true) {
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

      if (!hasGlobalFlag) break

      if (matchEnd === lastIndex) {
        if (lastIndex >= inputLength) break
        lastIndex++
      } else {
        lastIndex = matchEnd
      }

      if (matchIndex > 1000) break
    }

    return results
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
      return
    }

    setIsTimedOut(false)
    setIsError(false)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const timerId = window.setTimeout(() => {
      abortController.abort()
      setIsTimedOut(true)
      setMatches([])
    }, MATCH_TIMEOUT)
    timeoutRef.current = timerId

    try {
      const results = executeMatch(regExp, value)
      
      if (!abortController.signal.aborted) {
        clearTimeout(timerId)
        setMatches(results)
      }
    } catch (err) {
      clearTimeout(timerId)
      setIsError(true)
      setMatches([])
    }

    return () => {
      clearTimeout(timerId)
      abortController.abort()
    }
  }, [value, regExp, executeMatch])

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
              <p>{matchTooltipContent}</p>
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
      <div className="mt-2 p-3 bg-muted rounded-md text-xs">
        <div className="font-semibold mb-2 flex items-center gap-1">
          <InfoIcon className="h-3 w-3" />
          Match Statistics
        </div>
        <div className="mb-1">
          <span className="text-muted-foreground">Matches: </span>
          <span className="font-medium">{matches.length}</span>
        </div>
        
        {matches.map((match, idx) => (
          <div key={idx} className="mt-2 pt-2 border-t border-border">
            <div className="font-medium text-xs mb-1">
              Match {idx + 1}: "{match.fullMatch}" ({match.start}-{match.end})
            </div>
            {match.groups.length > 0 && (
              <div className="pl-2 space-y-1">
                {match.groups.map((group, gIdx) => (
                  <div key={gIdx} className="text-xs">
                    <span className="text-muted-foreground">
                      {group.name ? `Group ${group.index} (${group.name}): ` : `Group ${group.index}: `}
                    </span>
                    <span className="font-mono">"{group.value}"</span>
                    <span className="text-muted-foreground ml-1">
                      ({group.start}-{group.end})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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
      
      {value && (
        <div className="border border-t-0 px-3 py-2 bg-muted font-mono text-sm whitespace-pre-wrap break-all min-h-[40px]">
          {isTimedOut ? (
            <span className="text-destructive">
              ⚠️ Matching timed out after {MATCH_TIMEOUT}ms. The regex may be too complex.
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
      
      {renderStats()}
      
      <div className="border border-t-0 rounded-b-md flex justify-between items-center pl-4 bg-muted">
        <div className="flex items-center gap-2">
          {isPass ? (
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