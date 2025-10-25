import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ChatPage from "./pages/ChatPage";
import SearchHeatmapPage from "./pages/SearchHeatmapPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/search" element={<SearchHeatmapPage />} />
      </Routes>
    </Router>
  );
}