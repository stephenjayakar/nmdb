import React, { useState, useEffect } from "react";
import "./App.css";
import MessagePage from "./MessagePage";
import AnalyticsPage from "./AnalyticsPage";

function App() {
  const [token, setToken] = useState("");
  const [inputValue, setInputValue] = useState("");
  // Lifted state for view (“stephen” or “nadia”)
  const [currentView, setCurrentView] = useState("stephen");
  // Lifted state for whether to show the analytics vs messages
  const [showAnalytics, setShowAnalytics] = useState(false);

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

  const toggleView = () => {
    setCurrentView((prev) => (prev === "stephen" ? "nadia" : "stephen"));
  };

  const toggleAnalytics = () => {
    setShowAnalytics((prev) => !prev);
  };

  return token ? (
    <div className="App">
      <button
        onClick={clearLocalStorage}
        className="button button-secondary logout-button"
      >
        Logout
      </button>
      <div className="d-flex justify-content-end mb-3" style={{ gap: "10px" }}>
        <button onClick={toggleAnalytics} className="button">
          {showAnalytics ? "View Messages" : "View Analytics"}
        </button>
        {/* Only show the view toggle button when in messages view */}
        {!showAnalytics && (
          <button onClick={toggleView} className="button button-outline">
            Switch to {currentView === "stephen" ? "Nadia" : "Stephen"} View
          </button>
        )}
      </div>
      {/* Render AnalyticsPage or MessagePage based on toggle */}
      {showAnalytics ? (
        <AnalyticsPage token={token} />
      ) : (
        <MessagePage token={token} currentView={currentView} />
      )}
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
