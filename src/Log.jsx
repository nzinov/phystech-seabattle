import React from 'react';

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
          padding: '12px 16px',
          margin: '6px 0',
          background: 'var(--surface-2)',
          borderRadius: 'var(--border-radius-sm)',
          border: '1px solid var(--border-light)',
          cursor: 'pointer',
          transition: 'all 0.03s ease',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          lineHeight: '1.5',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          this.props.highlight(this.getHighlight());
          e.currentTarget.style.background = 'var(--accent-primary)';
          e.currentTarget.style.color = 'var(--text-light)';
          e.currentTarget.style.transform = 'translateX(2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.transition = 'all 0.03s ease';
        }}
        onMouseLeave={e => {
          this.props.highlight([]);
          e.currentTarget.style.background = 'var(--surface-2)';
          e.currentTarget.style.color = 'var(--text-primary)';
          e.currentTarget.style.transform = 'translateX(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--border-light)';
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
  maxHeight: '400px',
  overflowY: 'auto',
  background: 'var(--surface-1)',
  borderRadius: 'var(--border-radius-lg)',
  padding: '16px',
  margin: '20px 0',
  border: '1px solid var(--border-light)',
  boxShadow: 'var(--shadow-sm)',
};

export class Log extends React.Component {
  render() {
    return (
      <div>
        <h3
          style={{
            margin: '0 0 16px 0',
            color: 'var(--text-primary)',
            fontSize: '1.125rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.075em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '1.25rem' }}>🕰️</span>
          Battle Log
        </h3>
        <div style={style}>
          {this.props.events.length === 0 ? (
            <div
              style={{
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '20px',
              }}
            >
              No events yet...
            </div>
          ) : (
            this.props.events.map((event, index) => (
              <LogEvent
                key={index}
                event={event}
                player={this.props.player}
                highlight={this.props.highlight}
              />
            ))
          )}
        </div>
      </div>
    );
  }
}
