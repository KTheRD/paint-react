import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

export enum Tool {
  stroke = "stroke",
  eraser = "eraser",
  shape = "shape"
}

export enum Shape {
  rect = "rect",
  ellipse = "ellipse"
}

export interface PaintHandle {
  drawBlob: (blob: Blob) => void
}

interface Point {
  x: number,
  y: number
}

interface props {
  height: number
  width: number
  color: string
  lineWidth: number
  tool: Tool
  shape?: Shape
  onDrawing: (newBlob: Blob) => void
}

const CANVAS_STYLE = {
  position: "absolute" as const,
  width: "100%",
  height: "100%",
  top: 0,
  left: 0,
  border: 0
}

const BORDERS = 3;

const Paint = forwardRef<PaintHandle, props>(
  ({
    height,
    width,
    color,
    lineWidth,
    tool,
    shape,
    onDrawing,
  }: props, ref) => {
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

    useImperativeHandle(ref, () => {
      return {
        drawBlob(dataBlob?: Blob | null) {
          if (!dataBlob) {
            clearCanvas()
            return
          }

          createImageBitmap(dataBlob!)
            .then(
              image => {
                contextRef.current!.drawImage(image, 0, 0)
              }
            )
        }
      }
    })

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


    const shapeCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const shapeCanvasContextRef = useRef<CanvasRenderingContext2D | null>(null)

    const [isDrawingShape, setIsDrawingShape] = useState(false)
    const [shapeOrigin, setShapeOrigin] = useState<Point>()
    const [shapeSize, setShapeSize] = useState<Point>()

    const startShape = (e: React.PointerEvent) => {
      setShapeOrigin({
        x: e.nativeEvent.offsetX,
        y: e.nativeEvent.offsetY,
      })
      setShapeSize({
        x: 0,
        y: 0
      })
      setIsDrawingShape(true)
    }

    useEffect(() => {
      if (!isDrawingShape) return;

      shapeCanvasContextRef.current = shapeCanvasRef.current!.getContext("2d")
      shapeCanvasContextRef.current!.lineCap = "round"
      shapeCanvasContextRef.current!.lineJoin = "round"
      shapeCanvasContextRef.current!.lineWidth = lineWidth
    }, [isDrawingShape])

    const drawShape = (e: React.PointerEvent) => {
      shapeCanvasContextRef.current!.clearRect(0, 0, width, height)
      shapeCanvasContextRef.current!.strokeStyle = color
      switch (shape) {
        case Shape.rect:
          shapeCanvasContextRef.current!.strokeRect(
            shapeOrigin!.x,
            shapeOrigin!.y,
            e.nativeEvent.offsetX - shapeOrigin!.x,
            e.nativeEvent.offsetY - shapeOrigin!.y
          )
          break
        case Shape.ellipse:
          shapeCanvasContextRef.current!.beginPath()
          shapeCanvasContextRef.current!.ellipse(
            shapeOrigin!.x + ((e.nativeEvent.offsetX - shapeOrigin!.x) / 2),
            shapeOrigin!.y + ((e.nativeEvent.offsetY - shapeOrigin!.y) / 2),
            Math.abs((e.nativeEvent.offsetX - shapeOrigin!.x) / 2),
            Math.abs((e.nativeEvent.offsetY - shapeOrigin!.y) / 2),
            0,
            0,
            2 * Math.PI
          )
          shapeCanvasContextRef.current!.stroke()
      }
      setShapeSize({
        x: e.nativeEvent.offsetX - shapeOrigin!.x,
        y: e.nativeEvent.offsetY - shapeOrigin!.y
      })
    }

    const endShape = () => {
      setIsDrawingShape(false)
      contextRef.current!.strokeStyle = color
      switch (shape!) {
        case Shape.rect:
          contextRef.current!.strokeRect(
            shapeOrigin!.x,
            shapeOrigin!.y,
            shapeSize!.x,
            shapeSize!.y
          )
          return
        case Shape.ellipse:
          contextRef.current!.beginPath()
          contextRef.current!.ellipse(
            shapeOrigin!.x + (shapeSize!.x / 2),
            shapeOrigin!.y + (shapeSize!.y / 2),
            Math.abs(shapeSize!.x / 2),
            Math.abs(shapeSize!.y / 2),
            0,
            0,
            2 * Math.PI
          )
          contextRef.current!.stroke()
          return
      }
    }

    return <div style={{
      borderStyle: "solid",
      width: `${width}px`,
      height: `${height}px`,
      padding: 0,
      borderWidth: `${BORDERS}px`,
      position: "relative"
    }}>
      <canvas
        style={{
          ...CANVAS_STYLE,
          zIndex: 0
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
            case Tool.shape:
              return startShape(e)
          }
        }}
        onPointerUp={() => {
          endDrawing()
          canvasRef.current!.toBlob((blob) => onDrawing(blob!))
        }}
        onPointerMove={(e) => isDrawing && draw(e)}
      />
      {
        isDrawingShape &&
        <canvas
          style={{
            ...CANVAS_STYLE,
            zIndex: 1
          }}
          width={`${width}px`}
          height={`${height}px`}

          ref={shapeCanvasRef}

          onPointerMove={drawShape}
          onPointerUp={() => {
            endShape()
            canvasRef.current!.toBlob((blob) => onDrawing(blob!))
          }}
        />
      }
    </div>
  }
)

export default Paint
