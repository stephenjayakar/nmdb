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

const MessagePage = ({ token }: any) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [rangeQuery, setRangeQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  let messages = [];
  const searchResult = useQuery(api.messages.fasterSearch, { token, searchTerm })
  const aroundResult = useQuery(api.messages.getMessagesAroundDate, { token, timestamp: rangeQuery })
  if (!rangeQuery) {
    messages = searchResult || [];
  } else {
    messages = aroundResult || [];
  }

  const handleTimestampClick = (timestamp: string) => {
    // TODO: we could probably abstract the "one or other" part of this better.
    setSearchTerm("");
    setRangeQuery(timestamp);
    setSelectedDate(timestamp.split("T")[0]); // Set the date picker to the selected timestamp
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search Messages..."
            value={searchTerm}
            onChange={(e) => {
              setRangeQuery("");
              setSearchTerm(e.target.value);
            }}
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setRangeQuery(e.target.value);
            }}
            className="date-picker"
          />
        </div>
        <div className="message-list">
          {messages?.map((msg) => (
            <div key={msg.id} className="message">
              <div className="message-sender">{msg.sender}</div>
              <div className="message-content">{msg.message}</div>
              <div className="message-timestamp">
                <a
                  className="message-timestamp"
                  href=""
                  onClick={(e) => {
                    e.preventDefault();
                    handleTimestampClick(msg.timestamp);
                  }}
                >
                  {msg.timestamp}
                </a>
              </div>
            </div>
          ))}
        </div>
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
