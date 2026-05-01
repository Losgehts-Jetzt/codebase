import { useRef, useEffect, useCallback } from 'react'

interface DrawingCanvasProps {
  /** Increment to clear the canvas without remounting */
  clearSignal: number
  /** Applied to the wrapper div — controls visual size, border, background */
  className?: string
}

export function DrawingCanvas({ clearSignal, className }: DrawingCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  // Scale backing store to DPR — observe the WRAPPER div, not the canvas,
  // so setting canvas.width/height never triggers a feedback loop.
  useEffect(() => {
    const wrapper = wrapperRef.current
    const canvas = canvasRef.current
    if (!wrapper || !canvas) return

    const sync = () => {
      const { width, height } = wrapper.getBoundingClientRect()
      if (width === 0 || height === 0) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext('2d')
      ctx?.scale(dpr, dpr)
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(wrapper)
    return () => ro.disconnect()
  }, [])

  // Clear on demand
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }, [clearSignal])

  // Pointer position relative to canvas in CSS pixels
  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    canvasRef.current!.setPointerCapture(e.pointerId)
    drawing.current = true
    lastPos.current = getPos(e)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!drawing.current || !lastPos.current) return
    e.preventDefault()
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.lineWidth = e.pointerType === 'pen' ? 2.5 : 5
    ctx.strokeStyle = '#1e1b4b'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
    lastPos.current = pos
  }, [])

  const onPointerUp = useCallback(() => {
    drawing.current = false
    lastPos.current = null
  }, [])

  return (
    // Wrapper owns the visual dimensions — canvas fills it absolutely
    <div ref={wrapperRef} className={`relative ${className ?? ''}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  )
}
