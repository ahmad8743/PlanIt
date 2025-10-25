import { useState } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleUserMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    // Placeholder for OpenAI API call
    try {
      // For now, just echo the message
      const fakeResponse = `You said: "${input}"`;
      setMessages([...newMessages, { role: 'assistant', content: fakeResponse }]);

      // Later: replace with actual OpenAI call
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
            className={`p-2 rounded-lg w-fit max-w-xl ${
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