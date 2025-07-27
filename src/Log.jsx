import React, { useEffect, useRef, useState } from 'react';

function getShipDescr(ship, player) {
  return (ship.player == player ? 'your ' : "opponent's ") + ship.type;
}

class LogEvent extends React.Component {
  getHighlight = () => {
    let event = this.props.event;
    let hl = [
      [event.from, '#88AA88'],
      [event.to, '#669966'],
    ];
    switch (event.type) {
      case 'move':
        return hl;
      case 'shoot':
        return hl;
      case 'attack':
        return hl;
      case 'die':
        return [[event.from, '#BB8888']];
      case 'explode':
        return [[event.from, '#BB8888']];
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
        return <span>ship moved</span>;
      case 'shoot':
        return (
          <span>
            {getShipDescr(event.ship, this.props.player)} made a {event.area && 'area '} shot
          </span>
        );
      case 'attack':
        return <span>ship attacked</span>;
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
    return (
      <div
        style={{
          padding: '8px 0',
          margin: '0',
          cursor: 'pointer',
          transition: 'all 0.03s ease',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          lineHeight: '1.5',
          borderLeft: '3px solid transparent',
        }}
        onMouseEnter={e => {
          this.props.highlight(this.getHighlight());
          e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
          e.currentTarget.style.borderLeftColor = 'var(--accent-primary)';
          e.currentTarget.style.transition = 'all 0.03s ease';
        }}
        onMouseLeave={e => {
          this.props.highlight([]);
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderLeftColor = 'transparent';
          e.currentTarget.style.transition = 'all 0.03s ease';
        }}
      >
        {this.renderText()}
      </div>
    );
  }
}

const style = {
  width: '100%',
  height: '100%',
  overflowY: 'auto',
  padding: '0',
  margin: '0',
  minHeight: 0,
  flex: 1,
  scrollBehavior: 'smooth',
  borderTop: '1px solid var(--border-light)',
  borderBottom: '1px solid var(--border-light)',
};

export const Log = ({ events, player, highlight }) => {
  const scrollRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showTopArrow, setShowTopArrow] = useState(false);
  const [showBottomArrow, setShowBottomArrow] = useState(false);
  const prevEventsLength = useRef(events.length);
  const isAutoScrolling = useRef(false);

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
    // Check scroll position after initial setup
    setTimeout(checkScrollPosition, 100);
  }, []);

  useEffect(() => {
    // Scroll to bottom on initial load when events first become available
    if (scrollRef.current && events.length > 0 && prevEventsLength.current === 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      setTimeout(checkScrollPosition, 100);
    }
  }, [events.length]);

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
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showTopArrow && (
        <div
          onClick={scrollToTop}
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            cursor: 'pointer',
            background: 'var(--accent-primary)',
            color: 'white',
            borderRadius: '0 0 8px 8px',
            padding: '4px 12px',
            fontSize: '12px',
            boxShadow: 'var(--shadow-md)',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--accent-secondary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--accent-primary)';
          }}
        >
          ↑
        </div>
      )}

      <div
        ref={scrollRef}
        style={{
          ...style,
          position: 'relative',
        }}
        onScroll={checkScrollPosition}
      >
        {events.length === 0 ? (
          <div
            style={{
              color: 'var(--text-secondary)',
              fontStyle: 'italic',
              textAlign: 'left',
              padding: '8px 0',
              fontSize: '0.875rem',
            }}
          >
            No events yet...
          </div>
        ) : (
          events.map((event, index) => (
            <LogEvent key={index} event={event} player={player} highlight={highlight} />
          ))
        )}
      </div>

      {showBottomArrow && (
        <div
          onClick={scrollToBottom}
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            cursor: 'pointer',
            background: 'var(--accent-primary)',
            color: 'white',
            borderRadius: '8px 8px 0 0',
            padding: '4px 12px',
            fontSize: '12px',
            boxShadow: 'var(--shadow-md)',
            transition: 'var(--transition-fast)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--accent-secondary)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--accent-primary)';
          }}
        >
          ↓
        </div>
      )}
    </div>
  );
};
