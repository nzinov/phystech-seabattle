import React from 'react';

function getShipDescr(ship, player) {
    return (ship.player == player ? "your " : "opponent's ") + ship.type;
}

class LogEvent extends React.Component {
    getHighlight = () => {
        let event = this.props.event;
        let hl = [[event.from, '#88AA88'], [event.to, '#669966']];
        switch (event.type) {
            case 'move': return hl;
            case 'shoot': return hl;
            case 'attack': return hl;
            case 'die': return [[event.from, '#BB8888']];
            case 'explode': return [[event.from, '#BB8888']];
            case 'response': return [];
        }
    }

	renderText = () => {
        let event = this.props.event;
        switch (event.type) {
            case 'move': return <span>ship moved</span>;
            case 'shoot': return <span>{getShipDescr(event.ship, this.props.player)} made a {event.area && 'area '} shot</span>;
            case 'attack': return <span>ship attacked</span>;
            case 'die': return <span>{getShipDescr(event.ship, this.props.player)} was destroyed</span>;
            case 'explode': return <span>{getShipDescr(event.ship, this.props.player)} exploded</span>;
            case 'response': return <span><b>{event.size} x {event.ship_type} block was declared</b></span>;
        }
    }
    
    render() {
        return <p onMouseEnter={(e) => this.props.highlight(this.getHighlight())} onMouseLeave={(e) => this.props.highlight([])}>{this.renderText()}</p>
    }
}

export class Log extends React.Component {
	render() {
        let style = {
            width: '100%',
            height: '100%',
            overflow: 'auto'
        };
        return <div style={style}>{
            this.props.events.map(event => <LogEvent event={event} player={this.props.player} highlight={this.props.highlight}/>)
        }</div>
    }
}