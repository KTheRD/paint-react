import { useEffect, useRef, useState } from "react"

export enum Tool {
  stroke = "stroke",
  eraser = "eraser"
}

interface props {
  height: number
  width: number
  color: string
  lineWidth: number
  tool: Tool
  dataBlob: Blob | null
  shouldRenderFromBlob: boolean
  onDoneRerendering: () => void
  onDrawing: (newBlob: Blob) => void
}

const Paint = ({ height, width, color, lineWidth, tool, dataBlob, shouldRenderFromBlob, onDoneRerendering, onDrawing }: props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  const clearCanvas = () => {
    contextRef.current!.fillStyle = "white"
    contextRef.current!.fillRect(0, 0, height, width)
  }

  useEffect(() => {
    contextRef.current = canvasRef.current!.getContext("2d")
    contextRef.current!.lineCap = "round"
    contextRef.current!.lineJoin = "round"
    clearCanvas()
  }, [])

  useEffect(() => {
    contextRef.current!.lineWidth = lineWidth
  }, [lineWidth])

  useEffect(() => {
    if (!shouldRenderFromBlob) return
    if (!dataBlob) {
      clearCanvas()
      onDoneRerendering()
      return;
    }
    createImageBitmap(dataBlob!)
      .then(
        image => {
          contextRef.current!.drawImage(image, 0, 0)
          onDoneRerendering()
        }
      )
  }, [shouldRenderFromBlob])

  const [isDrawing, setIsDrawing] = useState(false)

  const startDrawing = (e: React.PointerEvent, color: string) => {
    contextRef.current!.strokeStyle = color
    contextRef.current!.beginPath();
    contextRef.current!.moveTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    )
    setIsDrawing(true)
  }

  const endDrawing = () => {
    contextRef.current!.closePath()
    setIsDrawing(false)
    canvasRef.current!.toBlob((blob) => onDrawing(blob!))
  }

  const draw = (e: React.PointerEvent) => {
    contextRef.current!.lineTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    )
    contextRef.current!.stroke()
  }



  return <canvas
    style={{
      borderStyle: "solid"
    }}
    width={`${width}px`}
    height={`${height}px`}

    ref={canvasRef}

    onPointerDown={(e) => {
      switch (tool) {
        case Tool.stroke:
          return startDrawing(e, color)
        case Tool.eraser:
          return startDrawing(e, "white")
      }
    }}
    onPointerUp={endDrawing}
    onPointerMove={(e) => isDrawing && draw(e)}
  />
}

export default Paint
