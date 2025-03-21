import { useState, useEffect, useRef } from "react";
import Timeline from "./Timeline";
import { useQuery, useConvex, useMutation } from "convex/react";
import { api } from "./convex/_generated/api";
import { Button, Spinner } from "react-bootstrap";
import SearchBarDatePicker from "./SearchBarDatePicker";

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
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isFavoritesMode, setIsFavoritesMode] = useState(false);
  const observerRef = useRef(null);
  const searchBarRef = useRef(null);

  const timelineBounds = useQuery(api.messages.timelineBounds, { token });
  const initialMessages = useQuery(api.messages.getInitialMessages, { token });
  const favoriteMessages = useQuery(api.favorites.getFavoriteMessages, { token });
  const favorites = useQuery(api.favorites.getFavorites, { token }) ?? [];
  const setFavoriteMutation = useMutation(api.favorites.setFavorite);

  useEffect(() => {
    if (isFavoritesMode && favoriteMessages) {
      setMessages(favoriteMessages);
    } else if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages, favoriteMessages, isFavoritesMode]);

  useEffect(() => {
    if (isSearchActive || isFavoritesMode) return; // Do not set up the scroll observer when searching or in favorites mode

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
  }, [messages, isLoadingMore, isSearchActive, isFavoritesMode]);

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

  // When reloading by timestamp (from date selection or message click), we also want to clear the search.
  const reloadWithTimestamp = async (ts) => {
    // If a date is clicked or timestamp is selected, clear the search bar and exit favorites mode
    if (searchBarRef.current) {
      searchBarRef.current.clearSearch();
    }
    setIsSearchActive(false);
    setIsFavoritesMode(false);
    const newMessages = await convex.query(api.messages.reloadMessages, {
      token,
      timestamp: ts,
    });
    setMessages(newMessages);
  };

  const handleSearch = async (query) => {
    setIsSearchActive(true);
    const newMessages = await convex.query(api.messages.fasterSearch, {
      token,
      searchTerm: query,
    });
    setMessages(newMessages);
  };

  const handleDateChange = (date) => {
    // Clear any active search and update messages by date.
    setIsSearchActive(false);
    reloadWithTimestamp(date);
  };

  const setFavorite = (messageID, isFavorite) => {
    setFavoriteMutation({ token, messageID, isFavorite });
  }

  return (
    <div className="container">
      {!isFavoritesMode && (
        <SearchBarDatePicker
          ref={searchBarRef}
          onSearch={handleSearch}
          onDateChange={handleDateChange}
        />
      )}
      {!messages ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center my-5">
          {isFavoritesMode ? (
            <div>
              <p className="mb-3">No favorite messages yet. Click the star on any message to add it to favorites!</p>
              <Button 
                variant="warning"
                onClick={() => setIsFavoritesMode(false)}
              >
                ★ Show All Messages
              </Button>
            </div>
          ) : (
            <p>No messages found.</p>
          )}
        </div>
      ) : (
        <>
          {/* Only render the buttons if not searching and not in favorites mode */}
          {!isSearchActive && !isFavoritesMode && (
            <div className="d-flex gap-2 mb-3">
              <Button variant="primary" onClick={loadOlder}>
                Load more
              </Button>
              <Button 
                variant="outline-warning"
                onClick={() => setIsFavoritesMode(true)}
              >
                ★ Show Favorites
              </Button>
            </div>
          )}
          {/* Show "Show All Messages" button when in favorites mode */}
          {isFavoritesMode && (
            <div className="d-flex gap-2 mb-3">
              <Button 
                variant="warning"
                onClick={() => setIsFavoritesMode(false)}
              >
                ★ Show All Messages
              </Button>
            </div>
          )}
          <MessageList
            messages={messages}
            onTimestampClick={reloadWithTimestamp}
            currentView={currentView}
            favorites={favorites}
            setFavorite={setFavorite}
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
      {timelineBounds && !isFavoritesMode && (
        <Timeline
          minDate={timelineBounds[0]}
          maxDate={timelineBounds[1]}
          onDateSelect={(date) => reloadWithTimestamp(date.toISOString())}
        />
      )}
    </div>
  );
};

const MessageList = ({ messages, onTimestampClick, currentView, favorites, setFavorite }) => {
  if (!messages.length) return null;

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
  };

  const receiverStyle = {
    backgroundColor: "#e5e5ea",
    color: "black",
    borderRadius: "20px",
    padding: "10px 15px",
    minWidth: "200px",
    maxWidth: "80%",
  };

  return (
    <div className="d-flex flex-column">
      {messages.map((msg) => {
        const isSender = msg.sender.toLowerCase() === currentView;
        const bubbleStyle = isSender ? senderStyle : receiverStyle;
        const isFavorite = favorites.includes(msg.id);
        return (
          <div
            key={msg._id}
            className="d-flex mb-2"
            style={{
              width: "100%",
              justifyContent: isSender ? "flex-end" : "flex-start",
            }}
          >
            <div style={bubbleStyle}>
              <div className="d-flex justify-content-between align-items-start">
                <div
                  dangerouslySetInnerHTML={{
                    __html: makeLinksClickable(msg.message, isSender),
                  }}
                />
                <button
                  onClick={() => setFavorite(msg.id, !isFavorite)}
                  className="btn btn-link p-0 ms-2"
                  style={{
                    color: isFavorite ? '#FFD700' : (isSender ? 'white' : 'gray'),
                    textDecoration: 'none',
                    fontSize: '1.2em'
                  }}
                >
                  {isFavorite ? '★' : '☆'}
                </button>
              </div>
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
