import { useBoardStore } from "../store/useBoardStore";

export default function Toolbar() {
  const setTool = useBoardStore((s) => s.setTool);

  const btn = {
    width: 48,
    height: 48,
    borderRadius: 14,
    border: "none",
    background: "#2c2c2c",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "fixed",
        left: 20,
        top: "50%",
        transform: "translateY(-50%)",
        background: "#1b1b1b",
        padding: 12,
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 9999,
        boxShadow: "0 0 25px rgba(0,0,0,0.45)",
      }}
    >
      <button style={btn} onClick={() => setTool("pencil")}>✏️</button>
      <button style={btn} onClick={() => setTool("rectangle")}>▭</button>
      <button style={btn} onClick={() => setTool("circle")}>◯</button>
      <button style={btn} onClick={() => setTool("eraser")}>🧽</button>
    </div>
  );
}