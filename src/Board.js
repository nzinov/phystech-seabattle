import deepcopy from 'deepcopy';
import React from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getBlocks, getModeAction, takeMove, dist, InitialShips } from './Game.js';
import { Log } from './Log.js';
import { stageDescr, shipInfo } from './Texts.js'
import { Tooltip } from 'react-tooltip';

const CellStyle = {
	border: '1px solid #555',
	margin: 0,
	width: 'min(6.5vh, 5vw)',
	height: 'min(6.5vh, 5vw)',
	lineHeight: '50px',
	textAlign: 'center',
	backgroundSize: 'contain',
	overflow: 'hidden',
};

const Square = (props) => {
	const click = () => {
		if (['Unknown', 'Sinking'].includes(props.figure?.type) && !props.G.attackFrom) {
			props.moves.Label(props.coord, prompt('Enter label'));
		}
	}

	const [{ canDrag, isDragging }, dragRef] = useDrag(() => ({
		type: 'square',
		item: { coord: props.coord, figure: props.figure },
		canDrag: () => {
			let action = getModeAction(props.G, props.ctx, props.player, props.mode, props.coord);
			return action && action.canFrom(props.G, props.player, props.coord);
		},
		collect: (monitor) => ({
			canDrag: monitor.canDrag(),
			isDragging: monitor.isDragging(),
		}),
	}), [props.G, props.ctx, props.player, props.mode, props.coord, props.figure]);

	const [{ canDrop }, dropRef] = useDrop(() => ({
		accept: 'square',
		drop: (item) => {
			takeMove(props.G, props.ctx, props.moves, props.mode, item.coord, props.coord);
		},
		canDrop: (item) => {
			let action = getModeAction(props.G, props.ctx, props.player, props.mode, item.coord);
			if (!action) {
				return false;
			}
			return action.can(props.G, props.player, item.coord, props.coord);
		},
		collect: (monitor) => ({
			canDrop: monitor.canDrop(),
		}),
	}), [props.G, props.ctx, props.player, props.mode, props.moves, props.coord]);

	let color = 'white';
	if (isDragging) {
		color = '#AAAAFF';
	}
	if (canDrop) {
		color = '#CCFFCC';
	}
	if (canDrag) {
		color = '#EEFFEE';
	}
	if (props.G.attackFrom && dist(props.G.attackFrom, props.coord) == 0) {
		color = '#BBAAFF';
	}
	if (props.G.attackTo && dist(props.G.attackTo, props.coord) == 0) {
		color = '#FFAABB';
	}
	if (props.highlightedBlock && props.highlightedBlock.coords.some(el => dist(el, props.coord) == 0)) {
		color = '#CCFFCC';
	}
	for (let pair of (props.highlight || [])) {
		if (dist(props.coord, pair[0]) == 0) {
			color = pair[1];
		}
	}
	let cellStyle = deepcopy(CellStyle);
	cellStyle.backgroundColor = color;
	let label = undefined;
	if (props.figure) {
		cellStyle.backgroundImage = "url("+process.env.PUBLIC_URL+"figures/"+props.figure.type+".png)";
		if (props.figure.label) {
			let labelStyle = {
				width: '70%',
				height: '70%',
				backgroundColor: '#F0F0FF'
			}
			label = <img style={labelStyle} src={process.env.PUBLIC_URL+"figures/"+props.figure.label+".png"}/>;
		}
	}

	const combinedRef = (el) => {
		dragRef(el);
		dropRef(el);
	};

	return (
		<td ref={combinedRef}>
			<div 
				data-tooltip-id="ship-tooltip"
				data-tooltip-content={shipInfo?.[props.figure?.type]} 
				onClick={click} 
				style={cellStyle} 
				onMouseEnter={props.hover} 
				onMouseLeave={props.leave}
			>
				{label}
			</div>
		</td>
	);
};

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
		if (!this.state.trace) {
			return;
		}
		let coords = this.state.hoveredCoords;
		if (coords === undefined) {
			return;
		}
		let trace = [];
		let count = 0;
		for (let i = this.props.G.log.length - 1; i >= 0; i--) {
			let event = this.props.G.log[i];
			if (event.type == 'move' && dist(coords, event.from) == 0) {
				return;
			}
			if (event.type == 'move' && dist(coords, event.to) == 0) {
				let fade = count * 25;
				trace.push([coords, 'rgb(' + fade + ', ' + (255 - fade) + ', 50)']);
				coords = event.from;
				count++;
				if (count == 10) {
					break;
				}
			}
		}
		if (count > 0) {
			let fade = count * 25;
			trace.push([coords, 'rgb(' + fade + ', ' + (255 - fade) + ', 50)']);
		};
		this.setState({highlight: trace});
	};

	CalcRemainingShips = () => {
		let my_remaining = {};
		for (const [ship, _] of InitialShips) {
			my_remaining[ship] = 0;
		}
		for (let i = 0; i < 14; ++i) {
			for (let j = 0; j < 14; ++j) {
				let ship =  this.props.G.cells[i][j];
				if (ship?.player == this.props.playerID) {
					++my_remaining[ship.type];
				}
			}
		}
		let other_remaining = {};
		for (const [ship, count] of InitialShips) {
			other_remaining[ship] = count;
		}
		for (let event of this.props.G.log) {
			if (event.type == "die" && event.ship.player != this.props.playerID) {
				--other_remaining[event.ship.type];
			}
		}
		return [my_remaining, other_remaining];
	}

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
			this.setState({trace: true});
			this.HighlightTrace();
			return;
		}
		if (event.key == 'Shift') {
			this.setState({showRemaining: true});
			return;
		}
		if (event.code.startsWith('Key')) {
			this.setState({mode: event.code.slice(3).toLowerCase()});
		}
		event.preventDefault();
	}

	handleKeyUp = (event) => {
		this.setState({mode: undefined, tooltip: false, highlight: [], trace: false, showRemaining: false});
		event.preventDefault();
	}

	hoverBlock = (event, block) => {
		this.setState({highlightedBlock: block});
	}

	leaveBlock = (event) => {
		this.setState({highlightedBlock: undefined});
	}

	hoverSquare = (event, coords) => {
		this.setState({hoveredCoords: coords});
		this.HighlightTrace();
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
        // Wait for game state to initialize
        if (!this.props.G || !this.props.G.cells) {
            return <div>Loading game...</div>;
        }
        
        let tbody = [];
        for (let i = 0; i < 14; i++) {
            let cells = [];
            for (let j = 0; j < 14; j++) {
                cells.push(
                    <Square
					 key={`${i}-${j}`}
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
            tbody.push(<tr key={i}>{cells}</tr>);
        }

		let remaining_tbody = [];
		if (this.state.showRemaining) {
			let [my_remaining, other_remaining] = this.CalcRemainingShips();
			let AddShips = (ships, row, color) => {
				for (const [ship, count] of Object.entries(ships)) {
					let style={
						...CellStyle,
						width: '4vw',
						height: '4vw',
						backgroundColor: count ? color : '#FFFFFF',
						backgroundImage: "url("+process.env.PUBLIC_URL+"figures/"+ship+".png)",
					}
					let fontStyle = {
						color: 'black',
						position: 'relative',
						fontSize: '3vw',
						textShadow: "#FFFFFF 0px 0px 20px",
					}
					row.push(<td key={ship}><div style={style}><span style={fontStyle}><b>{count}</b></span></div></td>);
				}
			};
			let row = [<td key="you">You</td>];
			AddShips(my_remaining, row, '#AAFFAA');
			remaining_tbody.push(<tr key="my">{row}</tr>);
			row = [<td key="enemy">Enemy</td>];
			AddShips(other_remaining, row, '#FFAAAA');
			remaining_tbody.push(<tr key="other">{row}</tr>);
		}


		let remainingStyle = {
			position: "absolute",
			top: "20px",
			tableLayout: "fixed",
			color: "black",
		};

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
			<Tooltip 
				id="ship-tooltip" 
				isOpen={this.state.tooltip}
				place="right"
				style={{
					maxWidth: '300px',
					width: 'max-content',
					whiteSpace: 'normal',
					wordWrap: 'break-word',
					lineHeight: '1.4'
				}}
				render={({ content }) => (
					content ? <div dangerouslySetInnerHTML={{ __html: content }} /> : null
				)}
			/>
			<div style={outStyle}>
			<table id="remaining" style={remainingStyle}><tbody>{remaining_tbody}</tbody></table>
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
					<button key={i} style={{padding: '5px', margin: '2px'}} idx={i} onMouseEnter={(e) => this.hoverBlock(e, block)} onMouseLeave={this.leaveBlock} onClick={(e) => this.clickBlock(e, block)}>{block.size} x {block.type}</button>
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