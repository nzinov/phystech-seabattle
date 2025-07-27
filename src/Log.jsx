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
          padding: '8px 12px',
          margin: '4px 0',
          background: '#f5f5f5',
          borderRadius: 'var(--border-radius)',
          border: '1px solid #e0e0e0',
          cursor: 'pointer',
          transition: 'var(--transition)',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
        }}
        onMouseEnter={e => {
          this.props.highlight(this.getHighlight());
          e.currentTarget.style.background = 'var(--cell-hover)';
          e.currentTarget.style.boxShadow = 'var(--shadow-light)';
        }}
        onMouseLeave={e => {
          this.props.highlight([]);
          e.currentTarget.style.background = '#f5f5f5';
          e.currentTarget.style.boxShadow = 'none';
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
  background: '#ffffff',
  borderRadius: 'var(--border-radius)',
  padding: '12px',
  margin: '16px 0',
  border: '1px solid #e0e0e0',
  boxShadow: 'var(--shadow-light)',
};

export class Log extends React.Component {
  render() {
    return (
      <div>
        <h3
          style={{
            margin: '0 0 8px 0',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          🕰️ Battle Log
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
