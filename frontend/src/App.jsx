import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import MessagePage from "./MessagePage";

import { useQuery, useConvex } from "convex/react";
import { api } from "./convex/_generated/api";

const EmptyState = ({ searchActive }) => (
  <div className="empty-state">
    {searchActive ? (
      <p>No messages found matching your search criteria.</p>
    ) : (
      <p>Select a date or search for messages to begin.</p>
    )}
  </div>
);

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
    if (inputValue.trim()) {
      setToken(inputValue);
      localStorage.setItem("token", inputValue);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      submitToken();
    }
  };

  const clearLocalStorage = () => {
    localStorage.removeItem("token");
    setToken("");
    setInputValue("");
  };

  return token ? (
    <div className="App">
      <button
        onClick={clearLocalStorage}
        className="button button-secondary logout-button"
      >
        Logout
      </button>
      <MessagePage token={token} />
    </div>
  ) : (
    <div className="auth-container">
      <h1 className="auth-title">Message Archive</h1>
      <div className="auth-form">
        <input
          type="text"
          placeholder="Enter your access token"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          onClick={submitToken}
          className="button"
          disabled={!inputValue.trim()}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default App;
