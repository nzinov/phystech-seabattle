import React, { useEffect, useRef, useState } from 'react';
import './Log.css';

function getSide(player, currentPlayer) {
  return player == currentPlayer ? 'your' : "opponent's";
}

function getShipDescr(ship, currentPlayer) {
  return getSide(ship.player, currentPlayer) + ' ' + ship.type;
}

class LogEvent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mobileHighlightActive: false,
    };
  }

  handleMobileClick = () => {
    const newState = !this.state.mobileHighlightActive;

    if (newState) {
      // Show highlight
      this.props.highlight(this.getHighlight());
      this.setState({ mobileHighlightActive: true });
    } else {
      this.props.highlightLastMove();
      this.setState({ mobileHighlightActive: false });
    }
  };

  isMobileDevice = () => {
    return navigator.maxTouchPoints > 0;
  };

  getHighlight = () => {
    let event = this.props.event;
    // Use purple shades to match arrow colors
    let hl = [
      [event.from, 'rgba(147, 51, 234, 0.4)'], // Light purple for origin
      [event.to, 'rgba(147, 51, 234, 0.6)'], // Darker purple for destination
    ];
    switch (event.type) {
      case 'move':
        return hl;
      case 'shoot':
        return hl;
      case 'attack':
        return hl;
      case 'die':
        return [[event.from, 'rgba(239, 68, 68, 0.5)']];
      case 'explode':
        return [[event.to, 'rgba(239, 68, 68, 0.5)']];
      case 'response':
        return [];
      default:
        return [];
    }
  };

  renderText = () => {
    let event = this.props.event;
    switch (event.type) {
      case 'move':
        return <span>{getSide(event.player, this.props.player)} ship moved</span>;
      case 'shoot':
        return (
          <span>
            {getShipDescr(event.ship, this.props.player)} made a {event.area && 'area '} shot
          </span>
        );
      case 'attack':
        return <span>{getSide(event.player, this.props.player)} ship attacked</span>;
      case 'die':
        return <span>{getShipDescr(event.ship, this.props.player)} was destroyed</span>;
      case 'explode':
        return <span>{getShipDescr(event.ship, this.props.player)} exploded</span>;
      case 'response':
        return (
          <span>
            <b>
              {event.size} x {event.ship_type} block was declared
            </b>
          </span>
        );
      default:
        return <span>unknown event</span>;
    }
  };

  render() {
    const event = this.props.event;
    const isCurrentPlayer = event.player === this.props.player;

    return (
      <div
        className={`log-event-container ${isCurrentPlayer ? 'current-player' : 'opponent-player'}`}
        onMouseEnter={_e => {
          // Only highlight on hover for desktop
          if (!this.isMobileDevice()) {
            this.props.highlight(this.getHighlight());
          }
        }}
        onMouseLeave={_e => {
          if (!this.isMobileDevice()) {
            this.props.highlightLastMove();
          }
        }}
        onClick={_e => {
          // Only handle clicks on mobile
          if (this.isMobileDevice()) {
            this.handleMobileClick();
          }
        }}
      >
        <div
          className={`log-event-bubble ${isCurrentPlayer ? 'current-player' : 'opponent-player'}`}
        >
          {this.renderText()}
        </div>
      </div>
    );
  }
}

export const Log = ({ events, player, highlight }) => {
  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showTopArrow, setShowTopArrow] = useState(false);
  const [showBottomArrow, setShowBottomArrow] = useState(false);
  const prevEventsLength = useRef(events.length);
  const isAutoScrolling = useRef(false);
  const hasInitiallyScrolled = useRef(false);

  const checkScrollPosition = () => {
    if (!scrollRef.current || isAutoScrolling.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 5; // 5px tolerance

    setIsAtBottom(atBottom);
    setShowTopArrow(scrollTop > 5);
    setShowBottomArrow(!atBottom && scrollHeight > clientHeight);
  };

  useEffect(() => {
    // Auto-scroll to bottom when new events are added and user is at bottom
    if (events.length > prevEventsLength.current && isAtBottom && scrollRef.current) {
      isAutoScrolling.current = true;
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      // Wait for auto-scroll to complete before checking position
      setTimeout(() => {
        isAutoScrolling.current = false;
        checkScrollPosition();
      }, 150);
    } else {
      // Check scroll position after content changes (but not during auto-scroll)
      setTimeout(checkScrollPosition, 0);
    }
    prevEventsLength.current = events.length;
  }, [events, isAtBottom]);

  useEffect(() => {
    // Scroll to bottom on initial mount
    const scrollToBottomOnMount = () => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        setIsAtBottom(true);
        setTimeout(checkScrollPosition, 100);
      }
    };

    // Use requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      setTimeout(scrollToBottomOnMount, 50);
    });
  }, []);

  useEffect(() => {
    // Scroll to bottom on initial load when events first become available
    if (scrollRef.current && events.length > 0 && !hasInitiallyScrolled.current) {
      // Use requestAnimationFrame to ensure content is rendered
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          setIsAtBottom(true);
          hasInitiallyScrolled.current = true;
          setTimeout(checkScrollPosition, 100);
        }
      });
    }
  }, [events.length]);

  // Additional effect to ensure scroll on mount when events are already present
  useEffect(() => {
    if (scrollRef.current && events.length > 0 && !hasInitiallyScrolled.current) {
      // Multiple attempts to ensure we scroll to bottom
      const scrollToBottom = () => {
        if (scrollRef.current && !hasInitiallyScrolled.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          setIsAtBottom(true);
          hasInitiallyScrolled.current = true;
          setTimeout(checkScrollPosition, 100);
        }
      };

      // Try immediately
      scrollToBottom();

      // Try again after a short delay
      setTimeout(scrollToBottom, 100);

      // Try once more after content has had time to render
      requestAnimationFrame(() => {
        setTimeout(scrollToBottom, 200);
      });
    }
  }, [events.length]);

  // Auto-highlight last move when mouse is not over log
  const highlightLastMove = () => {
    const lastEvent = events[events.length - 1];
    // Create LogEvent instance to get highlight for the last event
    const logEventInstance = new LogEvent({ event: lastEvent });
    const lastMoveHighlight = logEventInstance.getHighlight();
    if (lastMoveHighlight.length > 0) {
      highlight(lastMoveHighlight);
    }
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  return (
    <div className="log-container">
      {showTopArrow && (
        <div onClick={scrollToTop} className="log-scroll-arrow top">
          ↑
        </div>
      )}

      <div ref={scrollRef} className="log-scroll-container" onScroll={checkScrollPosition}>
        {events.length === 0 ? (
          <div className="log-empty-state">No events yet...</div>
        ) : (
          events.map((event, index) => (
            <LogEvent
              key={index}
              event={event}
              player={player}
              highlight={highlight}
              highlightLastMove={highlightLastMove}
            />
          ))
        )}
      </div>

      {showBottomArrow && (
        <div onClick={scrollToBottom} className="log-scroll-arrow bottom">
          ↓
        </div>
      )}
    </div>
  );
};
