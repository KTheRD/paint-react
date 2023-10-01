import React, { useRef, useState } from "react"
import Paint, { PaintHandle, Shape, Tool } from "./Paint"

const App = () => {
  const [color, setColor] = useState("#000000") //flood fill expects hexadecimal
  const [lineWidth, setLineWidth] = useState(10)
  const [tool, setTool] = useState(Tool.stroke)
  const [shape, setShape] = useState<Shape>()
  const [history, setHistory] = useState<Blob[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  const paintRef = useRef<PaintHandle>(null)

  const handleColorInput = (e: React.FormEvent<HTMLInputElement>) => {
    setColor(e.currentTarget.value)
  }
  const handleLineWidthInput = (e: React.FormEvent<HTMLInputElement>) => {
    setLineWidth(Number(e.currentTarget.value))
  }
  const handleToolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.currentTarget.value in Shape) {
      setTool(Tool.shape)
      setShape(e.currentTarget.value as Shape)
      return
    }
    setTool(e.currentTarget.value as Tool)
  }

  const pushToHistory = (blob: Blob) => {
    setHistory(history => history.slice(0, historyIndex + 1).concat([blob]))
    setHistoryIndex((historyIndex) => historyIndex + 1)
    return history.push(blob)
  }

  const undo = () => {
    if (historyIndex === -1) return
    setHistoryIndex(historyIndex => historyIndex - 1)
    paintRef.current!.drawBlob(history[historyIndex - 1])
  }

  const redo = () => {
    if (history.length === 0 || historyIndex >= history.length - 1) return;
    setHistoryIndex(historyIndex => historyIndex + 1)
    paintRef.current!.drawBlob(history[historyIndex + 1])
  }

  return (
    <>
      <Paint
        height={500}
        width={500}
        lineWidth={lineWidth}
        color={color}
        tool={tool}
        {...(tool === Tool.shape && {
          shape: shape
        })}
        onDrawing={pushToHistory}
        ref={paintRef}
      />

      <input
        type="color"
        value={color}
        onInput={handleColorInput}
      />

      <input
        type="range"
        min={1}
        max={30}
        value={lineWidth}
        onInput={handleLineWidthInput}
      />

      <select
        value={tool === Tool.shape ? shape : tool}
        onChange={handleToolChange}
      >
        <option value={Tool.stroke}>Stroke</option>
        <option value={Tool.eraser}>Eraser</option>
        <option value={Tool.flood}>Flood fill</option>
        <optgroup label="Shapes">
          <option value={Shape.rect}>Rectangle</option>
          <option value={Shape.ellipse}>Ellipse</option>
        </optgroup>
      </select>

      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </>
  )
}

export default App
