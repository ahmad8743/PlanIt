import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-blue-300">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Welcome to SmartMapAI</h1>
      <p className="text-lg text-gray-700 mb-8">
        Find your ideal location — powered by AI and real-time data.
      </p>
      <button
        onClick={() => navigate("/chat")}
        className="px-6 py-3 text-lg bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Get Started
      </button>
    </div>
  );
}