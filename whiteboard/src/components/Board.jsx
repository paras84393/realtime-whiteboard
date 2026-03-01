import { Stage, Layer, Line, Rect, Circle } from "react-konva";
import { useState, useEffect, useRef } from "react";
import { useBoardStore } from "../store/useBoardStore";
import Toolbar from "./Toolbar";
import { socket } from "../socket";
import { nanoid } from "nanoid";
import { useParams } from "react-router-dom";

export default function Board() {
  const { roomId } = useParams();

  const tool = useBoardStore((s) => s.tool);
  const elements = useBoardStore((s) => s.elements);
  const addElement = useBoardStore((s) => s.addElement);
  const removeById = useBoardStore((s) => s.removeById);
  const updateCursor = useBoardStore((s) => s.updateCursor);
  const cursors = useBoardStore((s) => s.cursors);

  const undo = useBoardStore((s) => s.undo);
  const redo = useBoardStore((s) => s.redo);

  const [drawing, setDrawing] = useState(null);
  const stageRef = useRef();

  // ===== JOIN ROOM =====
  useEffect(() => {
    socket.emit("join-room", roomId);
  }, [roomId]);

  // ===== SOCKET EVENTS =====
  useEffect(() => {

    socket.on("draw", (el) => addElement(el));

    socket.on("erase", (id) => removeById(id));

    socket.on("undo", (id) => removeById(id));

    socket.on("redo", (el) => addElement(el));

    socket.on("cursor", (data) =>
      updateCursor(data.id, { x: data.x, y: data.y })
    );

    // LOAD BOARD (IMPORTANT FIX)
    socket.on("load-board", (els) => {
      useBoardStore.setState({ elements: els });
    });

    return () => {
      socket.off("draw");
      socket.off("erase");
      socket.off("undo");
      socket.off("redo");
      socket.off("cursor");
      socket.off("load-board");
    };
  }, []);

  // ===== UNDO / REDO KEYS =====
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "z") {
        const removed = undo();
        if (removed)
          socket.emit("undo", { roomId: roomId, id: removed.id });
      }

      if (e.ctrlKey && e.key === "y") {
        const restored = redo();
        if (restored)
          socket.emit("redo", { roomId: roomId, element: restored });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ===== ZOOM =====
  const handleWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const scaleBy = 1.05;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale =
      e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;

    stage.scale({ x: newScale, y: newScale });

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    stage.position(newPos);
    stage.batchDraw();
  };

  // ===== MOUSE DOWN =====
  const handleMouseDown = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    // ERASER
    if (tool === "eraser") {
      const clicked = stage.getIntersection(pos);
      if (clicked && clicked.attrs.id) {
        const id = clicked.attrs.id;
        removeById(id);
        socket.emit("erase", { roomId: roomId, id: id });
      }
      return;
    }

    if (tool === "pencil") {
      setDrawing({ type: "line", points: [pos.x, pos.y] });
    }

    if (tool === "rectangle") {
      setDrawing({ type: "rect", x: pos.x, y: pos.y, width: 0, height: 0 });
    }

    if (tool === "circle") {
      setDrawing({ type: "circle", x: pos.x, y: pos.y, radius: 0 });
    }
  };

  // ===== MOUSE MOVE =====
  const handleMouseMove = (e) => {
    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    // CURSOR BROADCAST FIX
    socket.emit("cursor", { roomId: roomId, x: pos.x, y: pos.y });

    if (!drawing) return;

    if (drawing.type === "line") {
      setDrawing({
        ...drawing,
        points: drawing.points.concat([pos.x, pos.y]),
      });
    }

    if (drawing.type === "rect") {
      setDrawing({
        ...drawing,
        width: pos.x - drawing.x,
        height: pos.y - drawing.y,
      });
    }

    if (drawing.type === "circle") {
      const dx = pos.x - drawing.x;
      const dy = pos.y - drawing.y;
      setDrawing({ ...drawing, radius: Math.sqrt(dx * dx + dy * dy) });
    }
  };

  // ===== MOUSE UP =====
  const handleMouseUp = () => {
    if (!drawing) return;

    const el = { ...drawing, id: nanoid() };

    addElement(el);

    // DRAW BROADCAST FIX (MOST IMPORTANT)
    socket.emit("draw", {
      roomId: roomId,
      element: el
    });

    setDrawing(null);
  };

  // ===== GRID =====
  const grid = [];
  for (let i = 0; i < 4000; i += 40) {
    grid.push(
      <Line key={"v" + i} points={[i, 0, i, 4000]} stroke="#dcdcdc" strokeWidth={1} />
    );
    grid.push(
      <Line key={"h" + i} points={[0, i, 4000, i]} stroke="#dcdcdc" strokeWidth={1} />
    );
  }

  return (
    <>
      <Toolbar />
<Stage
  ref={stageRef}
  width={window.innerWidth}
  height={window.innerHeight}
  onWheel={handleWheel}
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}
  onTouchStart={handleMouseDown}
  onTouchMove={handleMouseMove}
  onTouchEnd={handleMouseUp}
  style={{ background: "#fafafa" }}
>
        <Layer>

          {grid}

          {elements.map((el) => {
            if (el.type === "line")
              return (
                <Line key={el.id} id={el.id} points={el.points} stroke="black" strokeWidth={2} lineCap="round" lineJoin="round" />
              );

            if (el.type === "rect")
              return <Rect key={el.id} id={el.id} x={el.x} y={el.y} width={el.width} height={el.height} stroke="black" />;

            if (el.type === "circle")
              return <Circle key={el.id} id={el.id} x={el.x} y={el.y} radius={el.radius} stroke="black" />;

            return null;
          })}

          {Object.entries(cursors).map(([id, pos]) => (
            <Circle key={id} x={pos.x} y={pos.y} radius={4} fill="red" />
          ))}

        </Layer>
      </Stage>
    </>
  );
}