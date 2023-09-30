import React, { useState } from "react"
import Paint, { Shape, Tool } from "./Paint"

const App = () => {
  const [color, setColor] = useState("black")
  const [lineWidth, setLineWidth] = useState(10)
  const [tool, setTool] = useState(Tool.stroke)
  const [shape, setShape] = useState<Shape>()
  const [history, setHistory] = useState<Blob[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [shouldRenderFromBlob, setShouldRenderFromBlob] = useState(false)

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
    setShouldRenderFromBlob(true)
  }

  const redo = () => {
    if (history.length === 0 || historyIndex >= history.length - 1) return;
    setHistoryIndex(historyIndex => historyIndex + 1)
    setShouldRenderFromBlob(true)
  }

  return (
    <>
      <Paint
        height={500}
        width={500}
        lineWidth={lineWidth}
        color={color}
        tool={tool}
        {...(shouldRenderFromBlob && {
          dataBlob: (historyIndex !== -1 ? history[historyIndex] : null)
        })}
        {...(tool === Tool.shape && {
          shape: shape
        })}
        onDrawing={pushToHistory}
        onDoneRerendering={() => setShouldRenderFromBlob(false)}
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
