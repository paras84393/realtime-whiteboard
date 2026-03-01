import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Board from "./components/Board";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auto create new board */}
        <Route
          path="/"
          element={<Navigate to={`/board/${crypto.randomUUID()}`} />}
        />

        {/* Actual board */}
        <Route path="/board/:roomId" element={<Board />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;