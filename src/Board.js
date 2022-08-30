import React from 'react';
import { DndProvider, DragSource, DropTarget } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getBlocks, getModeAction, takeMove, dist } from './Game';
import { Log } from './Log';
import { stageDescr, shipInfo } from './Texts'
import ReactTooltip from 'react-tooltip';

const squareSource = {
	beginDrag(props) {
		return {coord: props.coord, figure: props.figure};
	},

	canDrag(props, monitor) {
		let action = getModeAction(props.G, props.ctx, props.player, props.mode, props.coord);
		return action && action.canFrom(props.G, props.player, props.coord);
	}
};

const squareTarget = {
	drop(props, monitor, component) {
        takeMove(props.G, props.ctx, props.moves, props.mode, monitor.getItem().coord, props.coord);
	},

	canDrop(props, monitor, component) {
		let action = getModeAction(props.G, props.ctx, props.player, props.mode, monitor.getItem().coord);
		if (!action) {
			return false;
		}
		return action.can(props.G, props.player, monitor.getItem().coord, props.coord);
	}
};

class Square extends React.Component {
	click = () => {
		if (['Unknown', 'Sinking'].includes(this.props.figure?.type && !this.props.G.attackFrom)) {
			this.props.moves.Label(this.props.coord, prompt('Enter label'));
		}
	}

	render() {
		let color = 'white';
		if (this.props.isDragging) {
			color = '#AAAAFF';
		}
		if (this.props.canDrop) {
			color = '#CCFFCC';
		}
		if (this.props.canDrag) {
			color = '#EEFFEE';
		}
		if (this.props.G.attackFrom && dist(this.props.G.attackFrom, this.props.coord) == 0) {
			color = '#BBAAFF';
		}
		if (this.props.G.attackTo && dist(this.props.G.attackTo, this.props.coord) == 0) {
			color = '#FFAABB';
		}
		if (this.props.highlightedBlock && this.props.highlightedBlock.coords.some(el => dist(el, this.props.coord) == 0)) {
			color = '#CCFFCC';
		}
		for (let pair of (this.props.highlight || [])) {
			if (dist(this.props.coord, pair[0]) == 0) {
				color = pair[1];
			}
		}
		let cellStyle = {
			border: '1px solid #555',
			margin: 0,
			width: 'min(6.5vh, 5vw)',
			height: 'min(6.5vh, 5vw)',
			lineHeight: '50px',
			textAlign: 'center',
			backgroundSize: 'contain',
			backgroundColor: color,
		};
		let label = undefined;
		if (this.props.figure) {
			cellStyle.backgroundImage = "url("+process.env.PUBLIC_URL+"figures/"+this.props.figure.type+".png)";
			if (this.props.figure.label) {
				let labelStyle = {
					width: '70%',
					height: '70%',
					backgroundColor: '#F0F0FF'
				}
				label = <img style={labelStyle} src={process.env.PUBLIC_URL+"figures/"+this.props.figure.label+".png"}/>;
			}
		}

		return this.props.connectDropTarget(this.props.connectDragSource(<td data-tip={shipInfo?.[this.props.figure?.type]} onClick={this.click} style={cellStyle} onMouseEnter={this.props.hover} onMouseLeave={this.props.leave}>{label}</td>));
	}
};

Square = DropTarget("square", squareTarget, (connect, monitor) => ({connectDropTarget: connect.dropTarget(), canDrop: monitor.canDrop()}))(
			DragSource("square", squareSource, (connect, monitor) => ({ connectDragSource: connect.dragSource(), canDrag: monitor.canDrag(), isDragging: monitor.isDragging(), preview: connect.dragPreview()}))(Square)
		 );

class Board extends React.Component {
	constructor(props) {
		super(props);
		this.state = {mode: undefined};
    }

	Ready = () => {
		this.props.moves.Ready();
	}

	Skip = () => {
		this.props.moves.Skip();
	}

	HighlightTrace = () => {
		let coords = this.state.hoveredCoords;
		console.log(coords);
		if (coords === undefined) {
			return;
		}
		let trace = [];
		let count = 0;
		for (let i = this.props.G.log.length - 1; i >= 0; i--) {
			let event = this.props.G.log[i];
			if (event.type == 'move' && dist(coords, event.to) == 0) {
				coords = event.from;
				let fade = count * 51;
				//fade to string
				trace.push([coords, 'rgb(' + fade + ', 255, ' + fade + ')']);
				count++;
				if (count == 5) {
					break;
				}
			}
		}
		this.setState({highlight: trace});
	};

	handleKeyDown = (event) => {
		if (event.key == ' ') {
			this.Skip();
			return;
		};
		if (event.key == 'Alt') {
			this.setState({tooltip: true});
			return;
		}
		if (event.key == 'Control') {
			this.HighlightTrace();
			return;
		}
		if (event.code.startsWith('Key')) {
			this.setState({mode: event.code.slice(3).toLowerCase()});
		}
		event.preventDefault();
	}

	handleKeyUp = (event) => {
		this.setState({mode: undefined, tooltip: false, highlight: []});
		event.preventDefault();
	}

	hoverBlock = (event, block) => {
		this.setState({highlightedBlock: block});
	}

	leaveBlock = (event) => {
		this.setState({highlightedBlock: undefined});
	}

	hoverSquare = (event, coords) => {
		console.log("hover");
		this.setState({hoveredCoords: coords});
	}

	leaveSquare = (event) => {
		this.setState({hoveredCoords: undefined, highlight: []});
	}

	clickBlock = (event, block) => {
		this.setState({highlightedBlock: undefined});
		let stage = this.props.ctx.activePlayers && this.props.ctx.activePlayers[this.props.playerID];
		if (stage == 'attackBlock') {
			this.props.moves.AttackBlock(block);
		}
		if (stage == 'responseBlock') {
			this.props.moves.ResponseBlock(block);
		}
	}

	highlight = (highlight) => {
		this.setState({highlight: highlight});
	}

	componentDidMount(){
		document.addEventListener("keydown", this.handleKeyDown);
		document.addEventListener("keyup", this.handleKeyUp);
	}

	componentWillUnmount() {
		document.removeEventListener("keydown", this.handleKeyDown);
		document.removeEventListener("keyup", this.handleKeyUp);
	}

    render() {
        let tbody = [];
        for (let i = 0; i < 14; i++) {
            let cells = [];
            for (let j = 0; j < 14; j++) {
                cells.push(
                    <Square
					 coord={[i, j]}
					 figure={this.props.G.cells[i][j]}
					 mode={this.state.mode}
					 player={this.props.playerID}
					 G={this.props.G}
					 ctx={this.props.ctx}
					 moves={this.props.moves}
					 highlightedBlock={this.state.highlightedBlock}
					 hover={(e) => this.hoverSquare(e, [i, j])}
					 leave={this.leaveSquare}
					 highlight={this.state.highlight}></Square>
                );
            }
            tbody.push(<tr>{cells}</tr>);
        }

		let sidebarStyle = {
			padding: '10px',
			backgroundColor: '#FFEEEE',
			width: 'min(300px, 25vw)',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'flex-start',
			alignItems: 'flex-start',
			height: '99vh',
			margin: 0
		};

		let outStyle = {
			display: 'flex',
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			height: '99vh',
			margin: 0,
		};

		let blocksStyle = {
			display: 'flex',
			flexDirection: 'row',
			flexWrap: 'wrap',
		};

		let stage = this.props.ctx.activePlayers && this.props.ctx.activePlayers[this.props.playerID];
		let blocks = [];
		if (stage == 'attackBlock') {
			blocks = getBlocks(this.props.G, this.props.playerID, this.props.G.attackFrom);
		}
		if (stage == 'responseBlock') {
			blocks = getBlocks(this.props.G, this.props.playerID, this.props.G.attackTo);
		}

        return (
			<DndProvider backend={HTML5Backend}>
			<ReactTooltip disable={!this.state.tooltip} html={true}/>
			<div style={outStyle}>
            <table id="board">
            <tbody>{tbody}</tbody>
            </table>
			<div style={sidebarStyle}>
				{this.props.ctx?.gameover && <h1>{this.props.ctx.gameover.winner === undefined ? 'Draw' : (this.props.ctx.gameover.winner == this.props.playerID ? 'You win!' : 'You loose…')}</h1>}
				{!stage && <h2>Wait</h2>}
				{stage && <h2>{stageDescr[stage]}</h2>}
				{stage == 'place' && <button onClick={this.Ready}>Finish placement</button>}
				<div style={blocksStyle}>
				{blocks && blocks.map((block, i) =>
					<button style={{padding: '5px', margin: '2px'}} idx={i} onMouseEnter={(e) => this.hoverBlock(e, block)} onMouseLeave={this.leaveBlock} onClick={(e) => this.clickBlock(e, block)}>{block.size} x {block.type}</button>
				)}
				</div>
				<Log events={this.props.G.log} player={this.props.playerID} highlight={this.highlight} />
			</div>
</div>
			</DndProvider>
        );
    }
}

export default Board;
