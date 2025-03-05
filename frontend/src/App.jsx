import React, { useState, useEffect } from "react";
import "./App.css";
import MessagePage from "./MessagePage";
import AnalyticsPage from "./AnalyticsPage";
import { Container, Row, Col, Button, Form } from "react-bootstrap";

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

  if (!token) {
    return (
      <div className="auth-container">
        <h1 className="auth-title">Message Archive</h1>
        <div className="auth-form">
          <Form.Control
            type="text"
            placeholder="Enter your access token"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <Button
            onClick={submitToken}
            disabled={!inputValue.trim()}
            className="mt-3"
          >
            Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <Container>
        {/* Menu bar with centered buttons */}
        <Row className="justify-content-center mb-3">
          <Col xs="auto" className="d-flex align-items-center">
            <Button
              variant="danger"
              onClick={clearLocalStorage}
              className="mx-2"
            >
              Logout
            </Button>
            <Button variant="info" onClick={toggleAnalytics} className="mx-2">
              {showAnalytics ? "View Messages" : "View Analytics"}
            </Button>
            {!showAnalytics && (
              <Button
                variant="outline-primary"
                onClick={toggleView}
                className="mx-2"
              >
                Switch to {currentView === "stephen" ? "Nadia" : "Stephen"} View
              </Button>
            )}
          </Col>
        </Row>

        {/* Render AnalyticsPage or MessagePage based on toggle */}
        {showAnalytics ? (
          <AnalyticsPage token={token} />
        ) : (
          <MessagePage token={token} currentView={currentView} />
        )}
      </Container>
    </div>
  );
}

export default App;
