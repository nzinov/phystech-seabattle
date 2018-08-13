import React from 'react';
import { DragDropContext, DragSource, DropTarget } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

const squareSource = {
	beginDrag(props) {
		return {x: props.x, y: props.y, figure: props.figure};
	},
	
	canDrag(props, monitor) {
		return props.figure && props.figure.player == props.player;
	}
};

const squareTarget = {
	drop(props, monitor, component) {
        props.moves.move([monitor.getItem().x, monitor.getItem().y], [props.x, props.y])
	}
};

class Square extends React.Component {
	render() {
		let cellStyle = {
			border: '1px solid #555',
			width: '6vh',
			height: '6vh',
			lineHeight: '50px',
			textAlign: 'center',
			backgroundSize: 'contain'
		};
		if (this.props.figure) {
			cellStyle.backgroundImage = "url("+process.env.PUBLIC_URL+"figures/"+this.props.figure.type+".png)";
		}
		return this.props.connectDropTarget(this.props.connectDragSource(<td style={cellStyle}></td>));
	}
};

Square = DropTarget("square", squareTarget, (connect, monitor) => ({connectDropTarget: connect.dropTarget()}))(
			DragSource("square", squareSource, (connect, monitor) => ({ connectDragSource: connect.dragSource() }))(Square)
		 );

class Board extends React.Component {
    render() {
        let tbody = [];
        for (let i = 0; i < 14; i++) {
            let cells = [];
            for (let j = 0; j < 14; j++) {
                cells.push(
                    <Square x={i} y={j} figure={this.props.G.cells[i][j]} player={this.props.ctx.currentPlayer} G={this.props.G} moves={this.props.moves}></Square>
                );
            }
            tbody.push(<tr>{cells}</tr>);
        }

        return (
            <div>
            <table id="board">
            <tbody>{tbody}</tbody>
            </table>
            </div>
        );
    }
}

export default DragDropContext(HTML5Backend)(Board);
