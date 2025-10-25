import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ChatPage() {
  const location = useLocation();
  
  // Set the initial input state ONLY from the query
  const [input, setInput] = useState(location.state?.query || '');
  
  // We'll set messages in a useEffect to handle the initial context
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const query = location.state?.query;
    const radii = location.state?.radii;

    if (query || radii) {
      let initialMessage = `Starting search for "${query || 'your location'}" with these settings:`;
      
      if (radii) {
        // Build a string from the radii object
        const radiiSummary = Object.entries(radii)
          .map(([key, value]) => `${key}: ${value} mi`)
          .join(', ');
        initialMessage += `\nRadii: [${radiiSummary}]`;
      }

      // Add this summary as the first message from the "assistant"
      setMessages([
        { 
          role: 'assistant', 
          content: initialMessage 
        }
      ]);
    }
  }, [location.state]); // This effect runs once when the page loads

  const handleUserMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Placeholder for OpenAI API call
    try {
      const fakeResponse = `You said: "${input}"`;
      setMessages([...newMessages, { role: 'assistant', content: fakeResponse }]);
    } catch (err) {
      console.error('API Error:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleUserMessage();
  };

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-semibold mb-4">ChatBot</h1>
      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((msg, index) => (
          <div
            key={index}
            // Use whitespace-pre-wrap to respect newlines in the initial message
            className={`p-2 rounded-lg w-fit max-w-xl whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-blue-200 self-end ml-auto' : 'bg-gray-200'
            }`}
          >
            {msg.content}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          className="flex-1 p-2 border rounded-l-md"
          type="text"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-r-md"
          onClick={handleUserMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
}