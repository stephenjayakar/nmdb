import React, { useState, useEffect } from "react";
import "./App.css";

import { useQuery } from "convex/react";
import { api } from "./convex/_generated/api";

export interface Message {
  id: string;
  message: string;
  sender: string;
  timestamp: string;
}

interface MessageListProps {
  messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="message-list">
      {messages?.map((msg) => (
        <div key={msg.id} className="message">
          <div className="message-sender">{msg.sender}</div>
          <div className="message-content">{msg.message}</div>
          <div className="message-timestamp">{msg.timestamp}</div>
        </div>
      ))}
    </div>
  );
};

const MessagePage = ({ token }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const messages = useQuery(api.messages.fasterSearch, { token, searchTerm });

  return (
    <div className="App">
      <header className="App-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search Messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <MessageList messages={messages as Message[]} />
      </header>
    </div>
  );
};

function App() {
  const [token, setToken] = useState("");
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const submitToken = () => {
    setToken(inputValue);
    localStorage.setItem("token", inputValue);
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("token");
    setToken("");
  };

  return token ? (
    <div>
      <button onClick={clearLocalStorage}>Logout</button>
      <MessagePage token={token} />
    </div>
  ) : (
    <div>
      <input
        value={inputValue} // Controlled input
        onChange={(e) => setInputValue(e.target.value)} // Update inputValue on every keystroke
      />
      <button onClick={submitToken}>Submit</button>
    </div>
  );
}

export default App;
