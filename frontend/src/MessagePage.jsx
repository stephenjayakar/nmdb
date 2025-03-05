import { useState, useEffect, useRef } from "react";
import Timeline from "./Timeline";
import { useQuery, useConvex } from "convex/react";
import { api } from "./convex/_generated/api";
import { Button, Spinner } from "react-bootstrap";
import SearchBarDatePicker from "./SearchBarDatePicker";

// A helper for formatting timestamps.
const formatTimestamp = (timestamp) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return timestamp;
  }
};

const MessagePage = ({ token, currentView }) => {
  const convex = useConvex();
  const [messages, setMessages] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);

  const timelineBounds = useQuery(api.messages.timelineBounds, { token });
  const initialMessages = useQuery(api.messages.getInitialMessages, { token });

  // When the initial messages load, store them.
  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Set up the infinite scroll observer.
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !isLoadingMore && messages.length > 0) {
          setIsLoadingMore(true);
          await loadNewer();
          setIsLoadingMore(false);
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    return () => observer.disconnect();
  }, [messages, isLoadingMore]);

  const loadOlder = async () => {
    const minTS = messages[0].timestamp;
    const olderMessages = await convex.query(api.messages.getMessagesAroundDate, {
      token,
      direction: "before",
      timestamp: minTS,
    });
    setMessages([...olderMessages, ...messages]);
  };

  const loadNewer = async () => {
    const maxTS = messages[messages.length - 1].timestamp;
    const newerMessages = await convex.query(api.messages.getMessagesAroundDate, {
      token,
      direction: "after",
      timestamp: maxTS,
    });
    setMessages([...messages, ...newerMessages]);
  };

  const reloadWithTimestamp = async (ts) => {
    const newMessages = await convex.query(api.messages.reloadMessages, {
      token,
      timestamp: ts,
    });
    setMessages(newMessages);
  };

  const handleSearch = async (query) => {
    const newMessages = await convex.query(api.messages.fasterSearch, {
      token,
      searchTerm: query,
    });
    setMessages(newMessages);
  };

  const handleDateChange = (date) => {
    reloadWithTimestamp(date);
  };

  return (
    <div className="container">
      <SearchBarDatePicker
        onSearch={handleSearch}
        onDateChange={handleDateChange}
      />
      {!messages || messages.length === 0 ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          <Button variant="primary" onClick={loadOlder} className="mb-3">
            Load more
          </Button>
          <MessageList
            messages={messages}
            onTimestampClick={reloadWithTimestamp}
            currentView={currentView}
          />
          <div ref={observerRef} style={{ height: "20px" }}>
            {isLoadingMore && (
              <div className="text-center">
                <Spinner animation="border" size="sm" />
              </div>
            )}
          </div>
        </>
      )}
      {timelineBounds && (
        <Timeline
          minDate={timelineBounds[0]}
          maxDate={timelineBounds[1]}
          onDateSelect={(date) => reloadWithTimestamp(date.toISOString())}
        />
      )}
    </div>
  );
};

const MessageList = ({ messages, onTimestampClick, currentView }) => {
  if (!messages.length) return null;

  // Converts any links in the text into clickable links.
  const makeLinksClickable = (text, isSender) => {
    const linkColor = isSender ? "#ffffff" : "#007bff";
    const linkStyle = `color: ${linkColor}; text-decoration: underline;`;
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|])/gi;
    return text.replace(urlPattern, (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer" style="${linkStyle}">${url}</a>`
    );
  };

  const senderStyle = {
    backgroundColor: "#007aff",
    color: "white",
    borderRadius: "20px",
    padding: "10px 15px",
    minWidth: "200px",
    maxWidth: "80%",
    margin: "5px 0",
  };

  const receiverStyle = {
    backgroundColor: "#e5e5ea",
    color: "black",
    borderRadius: "20px",
    padding: "10px 15px",
    minWidth: "200px",
    maxWidth: "80%",
    margin: "5px 0",
  };

  return (
    <div className="d-flex flex-column">
      {messages.map((msg) => {
        const isSender = msg.sender.toLowerCase() === currentView;
        const bubbleStyle = isSender ? senderStyle : receiverStyle;
        return (
          <div
            key={msg.id}
            className="d-flex mb-2"
            style={{
              width: "100%",
              justifyContent: isSender ? "flex-end" : "flex-start",
            }}
          >
            <div style={bubbleStyle}>
              <div
                dangerouslySetInnerHTML={{
                  __html: makeLinksClickable(msg.message, isSender),
                }}
              />
              <div className="text-end mt-1" style={{ fontSize: "0.8em" }}>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onTimestampClick(msg.timestamp);
                  }}
                  style={{
                    color: isSender ? "rgba(255,255,255,0.8)" : "gray",
                    textDecoration: "none",
                  }}
                >
                  {formatTimestamp(msg.timestamp)}
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MessagePage;
