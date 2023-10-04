import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react"

export enum Tool {
  stroke = "stroke",
  eraser = "eraser",
  shape = "shape",
  flood = "flood"
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

interface Color {
  r: number,
  g: number,
  b: number,
  a: number
}

const hexToRGBA = (color: string) => ({
  r: parseInt(color[1] + color[2], 16),
  g: parseInt(color[3] + color[4], 16),
  b: parseInt(color[5] + color[6], 16),
  a: 255
})

const getColorAtPixel = (
  data: Uint8ClampedArray,
  width: number,
  { x, y }: Point
) => ({
  r: data[4 * (width * y + x) + 0],
  g: data[4 * (width * y + x) + 1],
  b: data[4 * (width * y + x) + 2],
  a: data[4 * (width * y + x) + 3]
})

const setColorAtPixel = (
  data: Uint8ClampedArray,
  width: number,
  { x, y }: Point,
  { r, g, b, a }: Color
) => {
  data[4 * (width * y + x) + 0] = r & 0xff
  data[4 * (width * y + x) + 1] = g & 0xff
  data[4 * (width * y + x) + 2] = b & 0xff
  data[4 * (width * y + x) + 3] = a & 0xff
}

const COLOR_THRESHOLD = 0;
const areColorsMatching = (
  { r: r1, g: g1, b: b1, a: a1 }: Color,
  { r: r2, g: g2, b: b2, a: a2 }: Color
) =>
  Math.abs(r1 - r2) <= COLOR_THRESHOLD &&
  Math.abs(g1 - g2) <= COLOR_THRESHOLD &&
  Math.abs(b1 - b2) <= COLOR_THRESHOLD &&
  Math.abs(a1 - a2) <= COLOR_THRESHOLD

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
    height: canvasHeight,
    width: canvasWidth,
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
      contextRef.current!.fillRect(0, 0, canvasHeight, canvasWidth)
    }

    useEffect(() => {
      contextRef.current = canvasRef.current!.getContext("2d")
      contextRef.current!.lineCap = "round"
      contextRef.current!.lineJoin = "round"
      contextRef.current!.imageSmoothingEnabled = false
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
        Math.floor(e.nativeEvent.offsetX),
        Math.floor(e.nativeEvent.offsetY)
      )
      setIsDrawing(true)
    }

    const endDrawing = () => {
      contextRef.current!.closePath()
      setIsDrawing(false)
    }

    const draw = (e: React.PointerEvent) => {
      contextRef.current!.lineTo(
        Math.floor(e.nativeEvent.offsetX),
        Math.floor(e.nativeEvent.offsetY)
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
        x: Math.floor(e.nativeEvent.offsetX),
        y: Math.floor(e.nativeEvent.offsetY),
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
      shapeCanvasContextRef.current!.clearRect(0, 0, canvasWidth, canvasHeight)
      shapeCanvasContextRef.current!.strokeStyle = color
      switch (shape) {
        case Shape.rect:
          shapeCanvasContextRef.current!.strokeRect(
            shapeOrigin!.x,
            shapeOrigin!.y,
            Math.floor(e.nativeEvent.offsetX) - shapeOrigin!.x,
            Math.floor(e.nativeEvent.offsetY) - shapeOrigin!.y
          )
          break
        case Shape.ellipse:
          shapeCanvasContextRef.current!.beginPath()
          shapeCanvasContextRef.current!.ellipse(
            shapeOrigin!.x + ((Math.floor(e.nativeEvent.offsetX) - shapeOrigin!.x) / 2),
            shapeOrigin!.y + ((Math.floor(e.nativeEvent.offsetY) - shapeOrigin!.y) / 2),
            Math.abs((Math.floor(e.nativeEvent.offsetX) - shapeOrigin!.x) / 2),
            Math.abs((Math.floor(e.nativeEvent.offsetY) - shapeOrigin!.y) / 2),
            0,
            0,
            2 * Math.PI
          )
          shapeCanvasContextRef.current!.stroke()
      }
      setShapeSize({
        x: Math.floor(e.nativeEvent.offsetX) - shapeOrigin!.x,
        y: Math.floor(e.nativeEvent.offsetY) - shapeOrigin!.y
      })
    }


    const floodFill = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const imageData = contextRef.current!.getImageData(
        0,
        0,
        canvasWidth,
        canvasHeight
      )
      const data = imageData.data
      const baseColor = getColorAtPixel(
        data,
        canvasWidth,
        {
          x: Math.floor(e.nativeEvent.offsetX),
          y: Math.floor(e.nativeEvent.offsetY),
        }
      )

      const targetColor = hexToRGBA(color)

      if (areColorsMatching(targetColor, baseColor)) return

      const stack = [{
        x: Math.floor(e.nativeEvent.offsetX),
        y: Math.floor(e.nativeEvent.offsetY),
      }]

      while (stack.length > 0) {
        let contigousLeft = false
        let contigousRight = false

        const currentPixel = stack.pop()!

        for (;
          currentPixel.y >= 0 &&
          areColorsMatching(
            baseColor,
            getColorAtPixel(
              data,
              canvasWidth,
              currentPixel
            )
          );
          currentPixel.y--
        ) { }

        currentPixel.y++

        for (;
          currentPixel.y < canvasHeight &&
          areColorsMatching(
            getColorAtPixel(
              data,
              canvasWidth,
              currentPixel
            ),
            baseColor
          );
          currentPixel.y++
        ) {

          setColorAtPixel(
            data,
            canvasWidth,
            currentPixel,
            targetColor
          )

          if (
            currentPixel.x - 1 >= 0 &&
            areColorsMatching(
              baseColor,
              getColorAtPixel(
                data,
                canvasWidth,
                {
                  ...currentPixel,
                  x: currentPixel.x - 1,
                }
              )
            )
          ) {
            if (!contigousLeft) {
              contigousLeft = true
              stack.push({
                ...currentPixel,
                x: currentPixel.x - 1,
              })
            }
          } else contigousLeft = false


          if (
            currentPixel.x + 1 < canvasWidth &&
            areColorsMatching(
              baseColor,
              getColorAtPixel(
                data,
                canvasWidth,
                {
                  ...currentPixel,
                  x: currentPixel.x + 1,
                }
              )
            )
          ) {
            if (!contigousRight) {
              contigousRight = true
              stack.push({
                ...currentPixel,
                x: currentPixel.x + 1,
              })
            }
          } else contigousRight = false

        }
      }
      contextRef.current!.putImageData(imageData, 0, 0)
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
      width: `${canvasWidth}px`,
      height: `${canvasHeight}px`,
      padding: 0,
      borderWidth: `${BORDERS}px`,
      position: "relative"
    }}>
      <canvas
        style={{
          ...CANVAS_STYLE,
          zIndex: 0
        }}
        width={`${canvasWidth}px`}
        height={`${canvasHeight}px`}

        ref={canvasRef}

        onPointerDown={(e) => {
          switch (tool) {
            case Tool.stroke:
              return startDrawing(e, color)
            case Tool.eraser:
              return startDrawing(e, "white")
            case Tool.shape:
              return startShape(e)
            case Tool.flood:
              return floodFill(e)
          }
        }}
        onPointerUp={() => {
          if (tool === Tool.stroke || tool === Tool.eraser) endDrawing()
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
          width={`${canvasWidth}px`}
          height={`${canvasHeight}px`}

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
