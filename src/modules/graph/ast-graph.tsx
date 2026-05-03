import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAtom, useAtomValue } from 'jotai'
import clsx from 'clsx'
import RootNodes from './root-nodes'
import Nodes from './nodes'
import type {
  NodeSize,
} from './measure'
import {
  getBoxSize,
  largerWithMinSize,
  measureSimpleNode,
} from './measure'
import { isPrimaryGraphAtom, sizeMapAtom } from '@/atom'
import type { AST } from '@/parser'
import { lrd } from '@/parser'
import {
  GRAPH_CHOICE_PADDING_HORIZONTAL,
  GRAPH_CHOICE_PADDING_VERTICAL,
  GRAPH_GROUP_NODE_PADDING_VERTICAL,
  GRAPH_NODE_MARGIN_HORIZONTAL,
  GRAPH_NODE_MARGIN_VERTICAL,
  GRAPH_PADDING_HORIZONTAL,
  GRAPH_PADDING_VERTICAL,
  GRAPH_ROOT_RADIUS,
  GRAPH_WITHOUT_ROOT_PADDING_HORIZONTAL,
  GRAPH_WITHOUT_ROOT_PADDING_VERTICAL,
} from '@/constants'

export interface PanZoomState {
  scale: number
  panX: number
  panY: number
}

export interface PanZoomActions {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fitToView: (viewWidth: number, viewHeight: number) => void
  getContentSize: () => [number, number]
}

type Props = {
  ast: AST.Regex
  onPanZoomChange?: (state: PanZoomState) => void
  panZoomRef?: React.MutableRefObject<PanZoomActions | null>
}

const MIN_SCALE = 0.25
const MAX_SCALE = 2.0
const SCALE_STEP = 0.1

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function measureNodes(nodes: AST.Node[], sizeMap: Map<AST.Node | AST.Node[], NodeSize>): [number, number] {
  let width = 0
  let height = 0
  for (const node of nodes) {
    const { box: boxSize } = sizeMap.get(node)!
    width += boxSize[0]
    height = Math.max(height, boxSize[1])
  }
  width += Math.max(nodes.length - 1, 0) * GRAPH_NODE_MARGIN_HORIZONTAL
  return largerWithMinSize([width, height])
}

function measureBranches(branches: AST.Node[][], currentSizeMap: Map<AST.Node | AST.Node[], NodeSize>, nextSizeMap: Map<AST.Node | AST.Node[], NodeSize>): [number, number] {
  let width = 0
  let height = 0
  for (const branch of branches) {
    const branchSize = currentSizeMap.has(branch)
      ? currentSizeMap.get(branch)!.box
      : measureNodes(branch, nextSizeMap)
    nextSizeMap.set(branch, { box: branchSize, content: branchSize })
    width = Math.max(width, branchSize[0])
    height += branchSize[1]
  }
  height
    += Math.max(branches.length - 1, 0) * GRAPH_NODE_MARGIN_VERTICAL
    + 2 * GRAPH_CHOICE_PADDING_VERTICAL
  width += 2 * GRAPH_CHOICE_PADDING_HORIZONTAL
  return largerWithMinSize([width, height])
}

const ASTGraph = React.memo(({ ast, onPanZoomChange, panZoomRef }: Props) => {
  const isPrimaryGraph = useAtomValue(isPrimaryGraphAtom)
  const [sizeMap, setSizeMap] = useAtom(sizeMapAtom)
  const [contentSize, setContentSize] = useState<[number, number]>([0, 0])
  const [currentAST, setCurrentAST] = useState<AST.Regex | null>(null)
  const { i18n } = useTranslation()
  const { language } = i18n
  const languageRef = useRef(language)

  const [panZoomState, setPanZoomState] = useState<PanZoomState>({
    scale: 1.0,
    panX: 0,
    panY: 0,
  })
  const panZoomStateRef = useRef(panZoomState)
  panZoomStateRef.current = panZoomState

  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const contentSizeRef = useRef<[number, number]>([0, 0])
  contentSizeRef.current = contentSize

  const sizeMapRef = useRef(sizeMap)
  const isPrimaryGraphRef = useRef(isPrimaryGraph)
  sizeMapRef.current = sizeMap
  isPrimaryGraphRef.current = isPrimaryGraph

  const paddingH = isPrimaryGraph
    ? GRAPH_PADDING_HORIZONTAL
    : GRAPH_WITHOUT_ROOT_PADDING_HORIZONTAL
  const paddingV = isPrimaryGraph
    ? GRAPH_PADDING_VERTICAL
    : GRAPH_WITHOUT_ROOT_PADDING_VERTICAL

  useEffect(() => {
    onPanZoomChange?.(panZoomState)
  }, [panZoomState, onPanZoomChange])

  const setScale = React.useCallback((scale: number) => {
    setPanZoomState(prev => ({
      ...prev,
      scale: clamp(scale, MIN_SCALE, MAX_SCALE),
    }))
  }, [])

  const setPan = React.useCallback((x: number, y: number) => {
    setPanZoomState(prev => ({
      ...prev,
      panX: x,
      panY: y,
    }))
  }, [])

  const zoomIn = React.useCallback(() => {
    setPanZoomState(prev => ({
      ...prev,
      scale: clamp(prev.scale + SCALE_STEP, MIN_SCALE, MAX_SCALE),
    }))
  }, [])

  const zoomOut = React.useCallback(() => {
    setPanZoomState(prev => ({
      ...prev,
      scale: clamp(prev.scale - SCALE_STEP, MIN_SCALE, MAX_SCALE),
    }))
  }, [])

  const reset = React.useCallback(() => {
    setPanZoomState({
      scale: 1.0,
      panX: 0,
      panY: 0,
    })
  }, [])

  const fitToView = React.useCallback((viewWidth: number, viewHeight: number) => {
    const [contentWidth, contentHeight] = contentSizeRef.current
    if (contentWidth <= 0 || contentHeight <= 0 || viewWidth <= 0 || viewHeight <= 0) {
      reset()
      return
    }

    const scaleX = viewWidth / contentWidth
    const scaleY = viewHeight / contentHeight
    const scale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, 1.0)

    const scaledWidth = contentWidth * scale
    const scaledHeight = contentHeight * scale
    const panX = (viewWidth - scaledWidth) / 2
    const panY = (viewHeight - scaledHeight) / 2

    setPanZoomState({
      scale,
      panX,
      panY,
    })
  }, [reset])

  const getContentSize = React.useCallback((): [number, number] => {
    return contentSizeRef.current
  }, [])

  React.useImperativeHandle(panZoomRef, () => ({
    zoomIn,
    zoomOut,
    reset,
    fitToView,
    getContentSize,
  }), [zoomIn, zoomOut, reset, fitToView, getContentSize])

  const handleWheel = React.useCallback((e: WheelEvent) => {
    const svg = svgRef.current
    if (!svg) return

    e.preventDefault()

    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    const currentState = panZoomStateRef.current
    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP
    const newScale = clamp(currentState.scale + delta, MIN_SCALE, MAX_SCALE)

    if (newScale === currentState.scale) return

    const scaleChange = newScale / currentState.scale
    const newPanX = mouseX - (mouseX - currentState.panX) * scaleChange
    const newPanY = mouseY - (mouseY - currentState.panY) * scaleChange

    setPanZoomState({
      scale: newScale,
      panX: newPanX,
      panY: newPanY,
    })
  }, [])

  const handleMouseDown = React.useCallback((e: MouseEvent) => {
    const target = e.target as Element
    if (target.closest('rect, foreignObject, g')) {
      return
    }

    isPanning.current = true
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isPanning.current) return

    const dx = e.clientX - lastMousePos.current.x
    const dy = e.clientY - lastMousePos.current.y

    lastMousePos.current = { x: e.clientX, y: e.clientY }

    setPanZoomState(prev => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy,
    }))
  }, [])

  const handleMouseUp = React.useCallback(() => {
    isPanning.current = false
  }, [])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    svg.addEventListener('wheel', handleWheel, { passive: false })
    svg.addEventListener('mousedown', handleMouseDown)

    return () => {
      svg.removeEventListener('wheel', handleWheel)
      svg.removeEventListener('mousedown', handleMouseDown)
    }
  }, [handleWheel, handleMouseDown])

  useEffect(() => {
    const handleMove = (e: MouseEvent) => handleMouseMove(e)
    const handleUp = () => handleMouseUp()

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [handleMouseMove, handleMouseUp])

  useEffect(() => {
    const languageChanged = languageRef.current !== language
    const currentSizeMap = languageChanged
      ? new Map<AST.Node | AST.Node[], NodeSize>()
      : sizeMapRef.current
    const nextSizeMap = new Map<AST.Node | AST.Node[], NodeSize>()

    lrd(ast, (node: AST.Node | AST.Regex) => {
      if (node.type !== 'regex' && currentSizeMap.has(node)) {
        nextSizeMap.set(node, currentSizeMap.get(node)!)
        if (node.type === 'choice') {
          const { branches } = node
          branches.forEach((branch) => {
            nextSizeMap.set(branch, currentSizeMap.get(branch)!)
          })
          return
        } else if (
          node.type === 'group'
          || node.type === 'lookAroundAssertion'
        ) {
          const { children } = node
          nextSizeMap.set(children, currentSizeMap.get(children)!)
          return
        }
        return
      }
      switch (node.type) {
        case 'regex': {
          const bodySize = measureNodes(node.body, nextSizeMap)
          nextSizeMap.set(node.body, { box: bodySize, content: bodySize })
          if (isPrimaryGraphRef.current) {
            const width
              = bodySize[0]
              + GRAPH_PADDING_HORIZONTAL * 2
              + GRAPH_ROOT_RADIUS * 4
              + GRAPH_NODE_MARGIN_HORIZONTAL * 2
            const height = bodySize[1] + GRAPH_PADDING_VERTICAL * 2
            setContentSize([width, height])
          } else {
            const width
              = bodySize[0] + GRAPH_WITHOUT_ROOT_PADDING_HORIZONTAL * 2
            const height = bodySize[1] + GRAPH_WITHOUT_ROOT_PADDING_VERTICAL * 2
            setContentSize([width, height])
          }
          break
        }
        case 'group':
        case 'lookAroundAssertion': {
          const { children } = node
          const childrenSize = currentSizeMap.has(children)
            ? currentSizeMap.get(children)!.box
            : measureNodes(children, nextSizeMap)
          nextSizeMap.set(children, {
            box: childrenSize,
            content: childrenSize,
          })
          const contentSize: [number, number] = [
            childrenSize[0] + GRAPH_NODE_MARGIN_HORIZONTAL * 2,
            childrenSize[1] + GRAPH_GROUP_NODE_PADDING_VERTICAL * 2,
          ]
          const boxSize = getBoxSize(node, contentSize)
          nextSizeMap.set(node, { box: boxSize, content: contentSize })
          break
        }
        case 'choice': {
          const branchesSize = measureBranches(
            node.branches,
            currentSizeMap,
            nextSizeMap,
          )
          nextSizeMap.set(node, { box: branchesSize, content: branchesSize })
          break
        }
        case 'character':
        case 'backReference':
        case 'boundaryAssertion': {
          const size = measureSimpleNode(node)
          nextSizeMap.set(node, size)
          break
        }
        default: {
          break
        }
      }
    })

    languageRef.current = language
    setSizeMap(nextSizeMap)
    setCurrentAST(ast)
  }, [ast, language, setSizeMap])

  const nodesX = isPrimaryGraph
    ? paddingH + GRAPH_NODE_MARGIN_HORIZONTAL + GRAPH_ROOT_RADIUS * 2
    : paddingH

  const transform = `translate(${panZoomState.panX}, ${panZoomState.panY}) scale(${panZoomState.scale})`

  return (
    <div ref={containerRef} className="w-full h-full min-h-0">
      <svg
        ref={svgRef}
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
        data-testid="graph"
        className={clsx('rounded-lg select-none [&_div]:pointer-events-none font-mono cursor-grab active:cursor-grabbing', { border: isPrimaryGraph })}
        style={{ minWidth: contentSize[0], minHeight: contentSize[1] }}
      >
        {currentAST && (
          <g transform={transform}>
            {isPrimaryGraph && (
              <RootNodes
                x={paddingH}
                width={contentSize[0] - 2 * paddingH}
                centerY={contentSize[1] / 2}
              />
            )}
            <Nodes
              x={nodesX}
              y={paddingV}
              nodes={currentAST.body}
              id={ast.id}
              index={0}
            />
          </g>
        )}
      </svg>
    </div>
  )
})
ASTGraph.displayName = 'ASTGraph'

export default ASTGraph
