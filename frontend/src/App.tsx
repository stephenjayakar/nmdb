import React, { useState } from 'react';
import './App.css';

import { useQuery } from 'convex/react';
import { api } from './convex/_generated/api';

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
  const [searchTerm, setSearchTerm] = useState('');
  const messages = useQuery(api.messages.search, { searchTerm });

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
}

export default App;
