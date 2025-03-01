import { useState, useEffect, useRef } from "react";
import Timeline from './Timeline'
import { useQuery, useConvex } from "convex/react";
import { api } from "./convex/_generated/api";
import { Button, Spinner, Card } from "react-bootstrap";

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

const MessagePage = ({ token }) => {
  const convex = useConvex();
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef(null);

  const timelineBounds = useQuery(api.messages.timelineBounds, {
    token,
  });

  const initialMessages = useQuery(api.messages.getInitialMessages, { token });

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

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
    const olderMessages = await convex.query(
      api.messages.getMessagesAroundDate,
      {
        token,
        direction: "before",
        timestamp: minTS,
      }
    );
    setMessages([...olderMessages, ...messages]);
  };
  const loadNewer = async () => {
    const maxTS = messages[messages.length - 1].timestamp;
    const newerMessages = await convex.query(
      api.messages.getMessagesAroundDate,
      {
        token,
        direction: "after",
        timestamp: maxTS,
      }
    );
    setMessages([...messages, ...newerMessages]);
  };

  const reloadWithTimestamp = async (ts) => {
    const newMessages = await convex.query(api.messages.reloadMessages, {
      token,
      timestamp: ts,
    });
    setMessages(newMessages);
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-8">
          {!messages ? (
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
        </div>
      </div>
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

const MessageList = ({ messages, onTimestampClick }) => {
  if (!messages.length) return null;

  const makeLinksClickable = (text) => {
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[A-Z0-9+&@#\/%=~_|])/gi;
    return text.replace(urlPattern, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
  };

  return (
    <div className="message-list">
      {messages.map((msg) => {
        const isUser = msg.sender.toLowerCase() === "user";
        return (
          <Card
            key={msg.id}
            className={`mb-3 ${isUser ? "ms-4" : "me-4"}`}
            bg={isUser ? "light" : "white"}
          >
            <Card.Body>
              <Card.Title className="text-primary">{msg.sender}</Card.Title>
              <Card.Text>
                <span dangerouslySetInnerHTML={{ __html: makeLinksClickable(msg.message) }} />
              </Card.Text>
              <Card.Footer className="text-end p-0 bg-transparent border-0">
                <small className="text-muted">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      onTimestampClick(msg.timestamp);
                    }}
                  >
                    {formatTimestamp(msg.timestamp)}
                  </a>
                </small>
              </Card.Footer>
            </Card.Body>
          </Card>
        );
      })}
    </div>
  );
};

export default MessagePage;
