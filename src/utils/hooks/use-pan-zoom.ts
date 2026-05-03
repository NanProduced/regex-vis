import { useRef, useState, useCallback, useEffect } from 'react'
import { useEvent } from 'react-use'

const MIN_SCALE = 0.25
const MAX_SCALE = 2.0
const SCALE_STEP = 0.1

export interface PanZoomState {
  scale: number
  panX: number
  panY: number
}

export interface PanZoomActions {
  zoomIn: () => void
  zoomOut: () => void
  reset: () => void
  fitToView: (contentWidth: number, contentHeight: number, viewWidth: number, viewHeight: number) => void
  setScale: (scale: number) => void
  setPan: (x: number, y: number) => void
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function usePanZoom(initialScale: number = 1.0): [PanZoomState, PanZoomActions, React.RefObject<SVGSVGElement | null>] {
  const [state, setState] = useState<PanZoomState>({
    scale: initialScale,
    panX: 0,
    panY: 0,
  })
  
  const svgRef = useRef<SVGSVGElement | null>(null)
  const isPanning = useRef(false)
  const lastMousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const stateRef = useRef(state)
  
  stateRef.current = state

  const setScale = useCallback((scale: number) => {
    setState(prev => ({
      ...prev,
      scale: clamp(scale, MIN_SCALE, MAX_SCALE),
    }))
  }, [])

  const setPan = useCallback((x: number, y: number) => {
    setState(prev => ({
      ...prev,
      panX: x,
      panY: y,
    }))
  }, [])

  const zoomIn = useCallback(() => {
    setState(prev => ({
      ...prev,
      scale: clamp(prev.scale + SCALE_STEP, MIN_SCALE, MAX_SCALE),
    }))
  }, [])

  const zoomOut = useCallback(() => {
    setState(prev => ({
      ...prev,
      scale: clamp(prev.scale - SCALE_STEP, MIN_SCALE, MAX_SCALE),
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      scale: 1.0,
      panX: 0,
      panY: 0,
    })
  }, [])

  const fitToView = useCallback((contentWidth: number, contentHeight: number, viewWidth: number, viewHeight: number) => {
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
    
    setState({
      scale,
      panX,
      panY,
    })
  }, [reset])

  const handleWheel = useCallback((e: WheelEvent) => {
    const svg = svgRef.current
    if (!svg) return
    
    e.preventDefault()
    
    const rect = svg.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    
    const currentState = stateRef.current
    const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP
    const newScale = clamp(currentState.scale + delta, MIN_SCALE, MAX_SCALE)
    
    if (newScale === currentState.scale) return
    
    const scaleChange = newScale / currentState.scale
    const newPanX = mouseX - (mouseX - currentState.panX) * scaleChange
    const newPanY = mouseY - (mouseY - currentState.panY) * scaleChange
    
    setState({
      scale: newScale,
      panX: newPanX,
      panY: newPanY,
    })
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const target = e.target as Element
    if (target.closest('rect, foreignObject, g')) {
      return
    }
    
    isPanning.current = true
    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isPanning.current) return
    
    const dx = e.clientX - lastMousePos.current.x
    const dy = e.clientY - lastMousePos.current.y
    
    lastMousePos.current = { x: e.clientX, y: e.clientY }
    
    setState(prev => ({
      ...prev,
      panX: prev.panX + dx,
      panY: prev.panY + dy,
    }))
  }, [])

  const handleMouseUp = useCallback(() => {
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

  useEvent('mousemove', handleMouseMove)
  useEvent('mouseup', handleMouseUp)

  const actions: PanZoomActions = {
    zoomIn,
    zoomOut,
    reset,
    fitToView,
    setScale,
    setPan,
  }

  return [state, actions, svgRef]
}
