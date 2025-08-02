import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './Log.css';
import { getGenderedVerb, getPossessivePronoun } from './utils/russianGrammar';
import { getShipName } from './utils/translations';

function getShipDescr(ship, currentPlayer) {
  const possessivePronoun = getPossessivePronoun(ship.type, ship.player, currentPlayer);
  const shipName = getShipName(ship.type);
  return (
    <span>
      {possessivePronoun}{' '}
      <span className="ship-pill">
        {shipName}
        {getShipIcon(ship.type)}
      </span>
    </span>
  );
}

function getShipIcon(shipType) {
  if (!shipType || shipType === 'Unknown') return null;
  return (
    <img
      src={`/figures/${shipType}.png`}
      alt={shipType}
      className="log-ship-icon"
      style={{
        width: '24px',
        height: '24px',
        marginLeft: '6px',
        verticalAlign: 'middle',
        display: 'inline-block',
      }}
    />
  );
}

const LogEvent = ({ event, player, highlight, highlightLastMove }) => {
  const { t } = useTranslation();

  const handleMobileClick = () => {
    // Always highlight this entry when clicked on mobile
    highlight(getHighlight());
  };

  const isMobileDevice = () => {
    return navigator.maxTouchPoints > 0;
  };

  const getHighlight = () => {
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

  const renderText = () => {
    switch (event.type) {
      case 'move':
        // For move events, we need to determine ship type from context
        // Since we don't have ship type in move events, we'll use a generic approach
        return (
          <span>
            {getPossessivePronoun('Unknown', event.player, player)} {t('log.ship')}{' '}
            {getGenderedVerb('Unknown', 'shipMoved')}
          </span>
        );
      case 'shoot':
        return (
          <span>
            {getShipDescr(event.ship, player)}{' '}
            {getGenderedVerb(event.ship.type, event.area ? 'madeAreaShot' : 'madeShot')}
          </span>
        );
      case 'attack':
        // For attack events, we need to determine ship type from context
        return (
          <span>
            {getPossessivePronoun('Unknown', event.player, player)} {t('log.ship')}{' '}
            {getGenderedVerb('Unknown', 'shipAttacked')}
          </span>
        );
      case 'die':
        return (
          <span>
            {getShipDescr(event.ship, player)} {getGenderedVerb(event.ship.type, 'wasDestroyed')}
          </span>
        );
      case 'explode':
        return (
          <span>
            {getShipDescr(event.ship, player)} {getGenderedVerb(event.ship.type, 'exploded')}
          </span>
        );
      case 'response':
        return (
          <span>
            <b>
              {getPossessivePronoun('Unknown', event.player, player)} {t('log.blockDeclaredPrefix')}{' '}
              <span className="ship-pill">
                {event.size}&nbsp;x&nbsp;{getShipName(event.ship_type)}
                {getShipIcon(event.ship_type)}
              </span>
            </b>
          </span>
        );
      default:
        return <span>{t('log.unknownEvent')}</span>;
    }
  };

  const isCurrentPlayer = event.player === player;

  return (
    <div
      className={`log-event-container ${isCurrentPlayer ? 'current-player' : 'opponent-player'}`}
      onMouseEnter={_e => {
        // Only highlight on hover for desktop
        if (!isMobileDevice()) {
          highlight(getHighlight());
        }
      }}
      onMouseLeave={_e => {
        if (!isMobileDevice()) {
          highlightLastMove();
        }
      }}
      onClick={_e => {
        // Only handle clicks on mobile
        if (isMobileDevice()) {
          handleMobileClick();
        }
      }}
    >
      <div className={`log-event-bubble ${isCurrentPlayer ? 'current-player' : 'opponent-player'}`}>
        {renderText()}
      </div>
    </div>
  );
};

export const Log = ({ events, player, highlight }) => {
  const { t } = useTranslation();
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

  // Utility function to get highlight for an event
  const getHighlightForEvent = event => {
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

  // Auto-highlight last move when mouse is not over log
  const highlightLastMove = () => {
    const lastEvent = events[events.length - 1];
    if (!lastEvent) {
      return;
    }
    const lastMoveHighlight = getHighlightForEvent(lastEvent);
    if (lastMoveHighlight.length > 0) {
      highlight(lastMoveHighlight);
    }
  };

  useEffect(highlightLastMove, [events, highlight]);

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
          <div className="log-empty-state">{t('log.noEventsYet')}</div>
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
