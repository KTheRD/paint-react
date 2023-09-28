import { useEffect, useRef, useState } from "react"

export enum Tool {
  stroke = "stroke",
  eraser = "eraser"
}

interface props {
  height: number,
  width: number,
  color: string,
  lineWidth: number
  tool: Tool
}

const Paint = ({ height, width, color, lineWidth, tool }: props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const contextRef = useRef<CanvasRenderingContext2D | null>(null)

  useEffect(() => {
    contextRef.current = canvasRef.current!.getContext("2d")
    contextRef.current!.lineCap = "round"
    contextRef.current!.lineJoin = "round"

  }, [])

  useEffect(() => {
    contextRef.current!.lineWidth = lineWidth
  }, [lineWidth])

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
