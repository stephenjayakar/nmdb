import React, { useState, useEffect } from 'react';
import './App.css';

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

function App() {
  const messages = useQuery(api.messages.get);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<any>(messages);

  useEffect(() => {
    const results = messages?.filter((msg) =>
      msg.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMessages(results);
  }, [searchTerm]);  // Correct use of searchTerm as the dependency for useEffect

  return (
    <div className="App">
      <header className="App-header">
        <input
          type="text"
          placeholder="Search Messages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <MessageList messages={filteredMessages} />
      </header>
    </div>
  );
}

export default App;
