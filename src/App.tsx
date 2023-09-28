import React, { useState } from "react"
import Paint, { Tool } from "./Paint"

const App = () => {
  const [color, setColor] = useState("black")
  const [lineWidth, setLineWidth] = useState(10)
  const [tool, setTool] = useState(Tool.stroke)

  const handleColorInput = (e: React.FormEvent<HTMLInputElement>) => {
    setColor(e.currentTarget.value)
  }
  const handleLineWidthInput = (e: React.FormEvent<HTMLInputElement>) => {
    setLineWidth(Number(e.currentTarget.value))
  }
  const handleToolChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTool(e.currentTarget.value as Tool)
  }

  return (
    <>
      <Paint
        height={500}
        width={500}
        lineWidth={lineWidth}
        color={color}
        tool={tool}
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
    </>
  )
}

export default App
