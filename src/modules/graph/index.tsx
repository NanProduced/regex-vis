import React, { useRef, useState, useCallback } from 'react'
import { useSetAtom } from 'jotai'
import { ExclamationTriangleIcon, ZoomInIcon, ZoomOutIcon, ResetIcon } from '@radix-ui/react-icons'
import ASTGraph, { PanZoomState, PanZoomActions } from './ast-graph'
import type { AST } from '@/parser'
import { selectNodesByBoxAtom } from '@/atom'
import { Button } from '@/components/ui/button'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

type Props = {
  regex: string
  ast: AST.Regex
  errorMsg?: string | null
}

const Graph: React.FC<Props> = ({ ast, errorMsg = null }) => {
  const selectNodesByBox = useSetAtom(selectNodesByBoxAtom)
  const panZoomRef = useRef<PanZoomActions | null>(null)
  const [panZoomState, setPanZoomState] = useState<PanZoomState>({
    scale: 1.0,
    panX: 0,
    panY: 0,
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const handlePanZoomChange = useCallback((state: PanZoomState) => {
    setPanZoomState(state)
  }, [])

  const handleZoomIn = useCallback(() => {
    panZoomRef.current?.zoomIn()
  }, [])

  const handleZoomOut = useCallback(() => {
    panZoomRef.current?.zoomOut()
  }, [])

  const handleReset = useCallback(() => {
    panZoomRef.current?.reset()
  }, [])

  const handleFitToView = useCallback(() => {
    if (!containerRef.current || !panZoomRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    panZoomRef.current.fitToView(rect.width, rect.height)
  }, [])

  const zoomPercentage = Math.round(panZoomState.scale * 100)

  return (
    <div className="relative flex flex-col h-full w-full min-h-0">
      {!errorMsg && ast.body.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-2 py-1 bg-background/80 backdrop-blur-sm border-b">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              title="Zoom Out"
              className="h-8 w-8"
            >
              <ZoomOutIcon className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[50px] text-center">
              {zoomPercentage}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              title="Zoom In"
              className="h-8 w-8"
            >
              <ZoomInIcon className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFitToView}
              className="h-8 text-xs"
            >
              Fit to View
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReset}
              title="Reset (100%)"
              className="h-8 w-8"
            >
              <ResetIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div ref={containerRef} className="flex-1 relative overflow-hidden min-h-0">
        {errorMsg
          ? (
              <div className="flex items-center justify-center h-full p-8">
                <Alert>
                  <ExclamationTriangleIcon className="h-6 w-6" />
                  <AlertTitle className="!pl-10">Error</AlertTitle>
                  <AlertDescription className="!pl-10">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              </div>
            )
          : (
              ast.body.length > 0 && (
                <ASTGraph
                  ast={ast}
                  onPanZoomChange={handlePanZoomChange}
                  panZoomRef={panZoomRef as React.MutableRefObject<PanZoomActions>}
                />
              )
            )}
      </div>
    </div>
  )
}

export default Graph
