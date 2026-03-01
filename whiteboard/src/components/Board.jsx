import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";

export default function Board() {

  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [elements, setElements] = useState([]);

  // ===== JOIN ROOM =====
  const joinRoom = () => {
    const id = prompt("Enter Room ID");
    if (!id) return;

    setRoomId(id);
    socket.emit("join-room", id);
  };

  useEffect(() => {
    joinRoom();
  }, []);

  // ===== CANVAS SETUP =====
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;

    ctxRef.current = ctx;
  }, []);

  // ===== LOAD BOARD FROM DB =====
  useEffect(() => {

    socket.on("load-board", (serverElements) => {
      setElements(serverElements);
      redraw(serverElements);
    });

    socket.on("draw", (element) => {
      drawElement(element);
      setElements(prev => [...prev, element]);
    });

    socket.on("erase", (id) => {
      const updated = elements.filter(el => el.id !== id);
      setElements(updated);
      redraw(updated);
    });

    socket.on("undo", (id) => {
      const updated = elements.filter(el => el.id !== id);
      setElements(updated);
      redraw(updated);
    });

    socket.on("redo", (element) => {
      drawElement(element);
      setElements(prev => [...prev, element]);
    });

    return () => {
      socket.off("load-board");
      socket.off("draw");
      socket.off("erase");
      socket.off("undo");
      socket.off("redo");
    };

  }, [elements]);


  // ===== DRAW HELPERS =====

  const getCoordinates = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();

    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    const { x, y } = getCoordinates(e);

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setDrawing(true);
  };

  const finishDrawing = () => {
    ctxRef.current.closePath();
    setDrawing(false);
  };

  const draw = (e) => {
    if (!drawing) return;
    e.preventDefault();

    const { x, y } = getCoordinates(e);

    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();

    const element = {
      id: Date.now(),
      x,
      y,
    };

    // SEND TO SERVER
    socket.emit("draw", {
      roomId,
      element
    });

    setElements(prev => [...prev, element]);
  };

  const drawElement = (element) => {
    ctxRef.current.lineTo(element.x, element.y);
    ctxRef.current.stroke();
  };

  const redraw = (elements) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    elements.forEach(el => {
      ctx.lineTo(el.x, el.y);
      ctx.stroke();
    });
  };

  return (
    <canvas
      ref={canvasRef}
      style={{ background: "white" }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={finishDrawing}
      onMouseLeave={finishDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={finishDrawing}
    />
  );
}