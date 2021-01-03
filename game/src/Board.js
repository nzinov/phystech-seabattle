import React from 'react';
import { DndProvider, DragSource, DropTarget } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getActions, takeMove } from './Game';

const squareSource = {
	beginDrag(props) {
		return {x: props.x, y: props.y, figure: props.figure};
	},
	
	canDrag(props, monitor) {
		return getActions(props.G, props.ctx, props.player, [props.x, props.y]).length > 0;
	}
};

const squareTarget = {
	drop(props, monitor, component) {
        takeMove(props.G, props.ctx, props.moves, [monitor.getItem().x, monitor.getItem().y], [props.x, props.y]);
	},

	canDrop(props, monitor, component) {
		let actions = getActions(props.G, props.ctx, props.player, [monitor.getItem().x, monitor.getItem().y]);
		if (actions.length == 0) {
			return false;
		}
		return actions[0].can(props.G, props.player, [monitor.getItem().x, monitor.getItem().y], [props.x, props.y])
	}
};

class Square extends React.Component {
	render() {
		let color = 'white';
		if (this.props.isDragging) {
			color = '#AAAAFF';
		}
		if (this.props.canDrop) {
			color = 'green';
		}
		if (this.props.canDrag) {
			color = '#EEFFEE';
		}
		let cellStyle = {
			border: '1px solid #555',
			width: '6vh',
			height: '6vh',
			lineHeight: '50px',
			textAlign: 'center',
			backgroundSize: 'contain',
			backgroundColor: color
		};
		if (this.props.figure) {
			cellStyle.backgroundImage = "url("+process.env.PUBLIC_URL+"figures/"+this.props.figure.type+".png)";
		}
		return this.props.connectDropTarget(this.props.connectDragSource(<td style={cellStyle}></td>));
	}
};

Square = DropTarget("square", squareTarget, (connect, monitor) => ({connectDropTarget: connect.dropTarget(), canDrop: monitor.canDrop()}))(
			DragSource("square", squareSource, (connect, monitor) => ({ connectDragSource: connect.dragSource(), canDrag: monitor.canDrag(), isDragging: monitor.isDragging()}))(Square)
		 );

class Board extends React.Component {
    render() {
        let tbody = [];
        for (let i = 0; i < 14; i++) {
            let cells = [];
            for (let j = 0; j < 14; j++) {
                cells.push(
                    <Square x={i} y={j} figure={this.props.G.cells[i][j]} player={this.props.playerID} G={this.props.G} ctx={this.props.ctx} moves={this.props.moves}></Square>
                );
            }
            tbody.push(<tr>{cells}</tr>);
        }

        return (
			<DndProvider backend={HTML5Backend}>
            <div>
            <table id="board">
            <tbody>{tbody}</tbody>
            </table>
            </div>
			</DndProvider>
        );
    }
}

export default Board;
