import React, { useState } from "react"
import Paint, { Tool } from "./Paint"

const App = () => {
  const [color, setColor] = useState("black")
  const [lineWidth, setLineWidth] = useState(10)
  const [tool, setTool] = useState(Tool.stroke)
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
        dataBlob={historyIndex !== -1 ? history[historyIndex] : null}
        onDrawing={pushToHistory}
        onDoneRerendering={() => setShouldRenderFromBlob(false)}
        shouldRenderFromBlob={shouldRenderFromBlob}
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
        value={tool}
        onChange={handleToolChange}
      >
        <option value={Tool.stroke}>Stroke</option>
        <option value={Tool.eraser}>Eraser</option>
      </select>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </>
  )
}

export default App
