import type { Ctx } from 'boardgame.io';
import deepcopy from 'deepcopy';
import React from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tooltip } from 'react-tooltip';
import { dist, getBlocks, getModeAction, InitialShips, takeMove } from './Game';
import { Log } from './Log.jsx';
import { shipInfo, stageDescr } from './Texts';

interface DragItem {
  coord: [number, number];
}

interface SquareProps {
  figure?: any;
  G: any;
  moves: Record<string, (...args: any[]) => void>;
  coord: [number, number];
  playerID: string;
  player: string;
  mode?: string;
  trace?: any;
  hoveredCoords?: any;
  ctx: Ctx;
  hover?: (e: any) => void;
  leave?: (e: any) => void;
  highlightedBlock?: any;
  highlight?: any[];
}

const CellStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0',
  margin: '0',
  width: 'min(6.5vh, 5vw)',
  height: 'min(6.5vh, 5vw)',
  lineHeight: '50px',
  textAlign: 'center',
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  overflow: 'hidden',
  borderRadius: 'var(--border-radius)',
  transition: 'var(--transition)',
  cursor: 'pointer',
  position: 'relative',
};

const Square: React.FC<SquareProps> = props => {
  const click = () => {
    if (['Unknown', 'Sinking'].includes(props.figure?.type) && !props.G.attackFrom) {
      props.moves.Label(props.coord, prompt('Enter label'));
    }
  };

  const [{ canDrag, isDragging }, dragRef] = useDrag(
    () => ({
      type: 'square',
      item: { coord: props.coord, figure: props.figure },
      canDrag: () => {
        let action = getModeAction(props.G, props.ctx, props.player, props.mode || '', props.coord);
        return action && action.canFrom(props.G, parseInt(props.player), props.coord);
      },
      collect: monitor => ({
        canDrag: monitor.canDrag(),
        isDragging: monitor.isDragging(),
      }),
    }),
    [props.G, props.ctx, props.player, props.mode, props.coord, props.figure]
  );

  const [{ canDrop }, dropRef] = useDrop(
    () => ({
      accept: 'square',
      drop: (item: DragItem) => {
        takeMove(props.G, props.ctx, props.moves, props.mode || '', item.coord, props.coord);
      },
      canDrop: (item: DragItem) => {
        let action = getModeAction(props.G, props.ctx, props.player, props.mode || '', item.coord);
        if (!action) {
          return false;
        }
        return action.can(props.G, parseInt(props.player), item.coord, props.coord);
      },
      collect: monitor => ({
        canDrop: monitor.canDrop(),
      }),
    }),
    [props.G, props.ctx, props.player, props.mode, props.moves, props.coord]
  );

  let backgroundColor = 'var(--cell-default)';
  let elevation = 0;

  if (isDragging) {
    backgroundColor = 'var(--cell-defend)';
    elevation = 2;
  }
  if (canDrop) {
    backgroundColor = 'var(--cell-active)';
    elevation = 1;
  }
  if (canDrag) {
    backgroundColor = 'var(--cell-hover)';
  }
  if (props.G.attackFrom && dist(props.G.attackFrom, props.coord) == 0) {
    backgroundColor = 'var(--cell-defend)';
  }
  if (props.G.attackTo && dist(props.G.attackTo, props.coord) == 0) {
    backgroundColor = 'var(--cell-attack)';
  }
  if (
    props.highlightedBlock &&
    props.highlightedBlock.coords.some((el: any) => dist(el, props.coord) == 0)
  ) {
    backgroundColor = 'var(--cell-active)';
  }
  for (let pair of props.highlight || []) {
    if (dist(props.coord, pair[0]) == 0) {
      backgroundColor = pair[1];
    }
  }

  let cellStyle = deepcopy(CellStyle);
  cellStyle.backgroundColor = backgroundColor;
  if (elevation === 1) {
    cellStyle.boxShadow = 'var(--shadow-light)';
  } else if (elevation === 2) {
    cellStyle.boxShadow = 'var(--shadow-medium)';
  }
  let label = undefined;
  if (props.figure) {
    cellStyle.backgroundImage = 'url(/figures/' + props.figure.type + '.png)';
    if (props.figure.label) {
      let labelStyle = {
        width: '70%',
        height: '70%',
        backgroundColor: '#F0F0FF',
      };
      label = <img style={labelStyle} src={'/figures/' + props.figure.label + '.png'} alt="" />;
    }
  }

  const combinedRef = (el: any) => {
    dragRef(el);
    dropRef(el);
  };

  return (
    <td ref={combinedRef}>
      <div
        data-tooltip-id="ship-tooltip"
        data-tooltip-content={shipInfo?.[props.figure?.type as keyof typeof shipInfo]}
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

interface BoardPropsLocal {
  G: any;
  ctx: Ctx;
  moves: Record<string, (...args: any[]) => void>;
  playerID: string;
  isActive?: boolean;
  isMultiplayer?: boolean;
  isConnected?: boolean;
  credentials?: string;
  trace?: any;
  hoveredCoords?: any;
}

interface BoardState {
  mode: string | undefined;
  trace?: boolean;
  hoveredCoords?: any;
  highlight?: any[];
  tooltip?: boolean;
  showRemaining?: boolean;
  highlightedBlock?: any;
}

class Board extends React.Component<BoardPropsLocal, BoardState> {
  constructor(props: BoardPropsLocal) {
    super(props);
    this.state = { mode: undefined };
  }

  Ready = () => {
    this.props.moves.Ready();
  };

  Skip = () => {
    this.props.moves.Skip();
  };

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
    }
    this.setState({ highlight: trace });
  };

  CalcRemainingShips = () => {
    let my_remaining: Record<string, number> = {};
    for (const [ship] of InitialShips) {
      my_remaining[ship] = 0;
    }
    for (let i = 0; i < 14; ++i) {
      for (let j = 0; j < 14; ++j) {
        let ship = this.props.G.cells[i][j];
        if (ship?.player == parseInt(this.props.playerID)) {
          ++my_remaining[ship.type];
        }
      }
    }
    let other_remaining: Record<string, number> = {};
    for (const [ship, count] of InitialShips) {
      other_remaining[ship] = count as number;
    }
    for (let event of this.props.G.log) {
      if (event.type == 'die' && event.ship.player != parseInt(this.props.playerID)) {
        --other_remaining[event.ship.type];
      }
    }
    return [my_remaining, other_remaining];
  };

  handleKeyDown = (event: KeyboardEvent) => {
    if (event.key == ' ') {
      this.Skip();
      return;
    }
    if (event.key == 'Alt') {
      this.setState({ tooltip: true });
      return;
    }
    if (event.key == 'Control') {
      this.setState({ trace: true }, () => {
        this.HighlightTrace();
      });
      return;
    }
    if (event.key == 'Shift') {
      this.setState({ showRemaining: true });
      return;
    }
    if (event.code.startsWith('Key')) {
      this.setState({ mode: event.code.slice(3).toLowerCase() });
    }
    event.preventDefault();
  };

  handleKeyUp = (event: KeyboardEvent) => {
    this.setState({
      mode: undefined,
      tooltip: false,
      highlight: [],
      trace: false,
      showRemaining: false,
    });
    event.preventDefault();
  };

  hoverBlock = (_event: any, block: any) => {
    this.setState({ highlightedBlock: block });
  };

  leaveBlock = (_event: any) => {
    this.setState({ highlightedBlock: undefined });
  };

  hoverSquare = (_event: any, coords: any) => {
    this.setState({ hoveredCoords: coords }, () => {
      this.HighlightTrace();
    });
  };

  leaveSquare = (_event: any) => {
    this.setState({ hoveredCoords: undefined, highlight: [] });
  };

  clickBlock = (event: any, block: any) => {
    this.setState({ highlightedBlock: undefined });
    let stage = this.props.ctx.activePlayers?.[this.props.playerID];
    if (stage == 'attackBlock') {
      this.props.moves.AttackBlock(block);
    }
    if (stage == 'responseBlock') {
      this.props.moves.ResponseBlock(block);
    }
  };

  highlight = (highlight: any) => {
    this.setState({ highlight: highlight });
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
  }

  render() {
    // Wait for game state to initialize
    if (!this.props.G || !this.props.G.cells) {
      return <div className="loading">Loading game</div>;
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
            playerID={this.props.playerID}
            G={this.props.G}
            ctx={this.props.ctx}
            moves={this.props.moves}
            highlightedBlock={this.state.highlightedBlock}
            hover={e => this.hoverSquare(e, [i, j])}
            leave={this.leaveSquare}
            highlight={this.state.highlight}
          ></Square>
        );
      }
      tbody.push(<tr key={i}>{cells}</tr>);
    }

    let remaining_tbody = [];
    if (this.state.showRemaining) {
      let [my_remaining, other_remaining] = this.CalcRemainingShips();
      let AddShips = (ships: any, row: any, color: any) => {
        for (const [ship, count] of Object.entries(ships) as [string, number][]) {
          let style = {
            ...CellStyle,
            width: '4vw',
            height: '4vw',
            backgroundColor: count ? color : '#FFFFFF',
            backgroundImage: 'url(/figures/' + ship + '.png)',
          };
          let fontStyle: React.CSSProperties = {
            color: 'black',
            position: 'relative',
            fontSize: '3vw',
            textShadow: '#FFFFFF 0px 0px 20px',
          };
          row.push(
            <td key={ship}>
              <div style={style}>
                <span style={fontStyle}>
                  <b>{count}</b>
                </span>
              </div>
            </td>
          );
        }
      };
      let row = [<td key="you">You</td>];
      AddShips(my_remaining, row, '#AAFFAA');
      remaining_tbody.push(<tr key="my">{row}</tr>);
      row = [<td key="enemy">Enemy</td>];
      AddShips(other_remaining, row, '#FFAAAA');
      remaining_tbody.push(<tr key="other">{row}</tr>);
    }

    let remainingStyle: React.CSSProperties = {
      position: 'absolute',
      top: '20px',
      left: '20px',
      tableLayout: 'fixed',
      color: 'var(--text-primary)',
      background: '#ffffff',
      borderRadius: 'var(--border-radius)',
      padding: '16px',
      boxShadow: 'var(--shadow-medium)',
      border: '1px solid #e0e0e0',
    };

    let sidebarStyle: React.CSSProperties = {
      padding: '24px',
      background: '#ffffff',
      width: 'min(320px, 25vw)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
      height: '100vh',
      margin: 0,
      borderLeft: '1px solid #e0e0e0',
      boxShadow: 'var(--shadow-light)',
    };

    let outStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      margin: 0,
      background: '#fafafa',
      overflow: 'hidden',
    };

    let blocksStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
    };

    let stage = this.props.ctx.activePlayers?.[this.props.playerID];
    let blocks: any[] = [];
    if (stage == 'attackBlock') {
      blocks = getBlocks(this.props.G, parseInt(this.props.playerID), this.props.G.attackFrom);
    }
    if (stage == 'responseBlock') {
      blocks = getBlocks(this.props.G, parseInt(this.props.playerID), this.props.G.attackTo);
    }

    return (
      <DndProvider backend={HTML5Backend}>
        <Tooltip
          id="ship-tooltip"
          isOpen={this.state.tooltip ?? false}
          place="right"
          style={{
            maxWidth: '300px',
            width: 'max-content',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            lineHeight: '1.4',
          }}
          render={({ content }) =>
            content ? <div dangerouslySetInnerHTML={{ __html: content }} /> : null
          }
        />
        <div style={outStyle}>
          <table id="remaining" style={remainingStyle}>
            <tbody>{remaining_tbody}</tbody>
          </table>
          <div
            style={{
              padding: '16px',
              background: '#ffffff',
              borderRadius: 'var(--border-radius)',
              boxShadow: 'var(--shadow-medium)',
              border: '1px solid #e0e0e0',
            }}
          >
            <table
              id="board"
              style={{
                borderCollapse: 'separate',
                borderSpacing: '1px',
                background: 'var(--bg-board)',
                borderRadius: 'var(--border-radius)',
                padding: '8px',
              }}
            >
              <tbody>{tbody}</tbody>
            </table>
          </div>
          <div style={sidebarStyle}>
            {this.props.ctx?.gameover && (
              <div
                style={{
                  background:
                    this.props.ctx.gameover.winner == parseInt(this.props.playerID)
                      ? '#4caf50'
                      : this.props.ctx.gameover.winner === undefined
                        ? '#ff9800'
                        : '#f44336',
                  padding: '16px',
                  borderRadius: 'var(--border-radius)',
                  margin: '0 0 16px 0',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-light)',
                  color: '#ffffff',
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.5rem',
                    fontWeight: '500',
                  }}
                >
                  {this.props.ctx.gameover.winner === undefined
                    ? '🤝 Draw'
                    : this.props.ctx.gameover.winner == parseInt(this.props.playerID)
                      ? '🎉 You Win!'
                      : '💥 You Lose'}
                </h1>
              </div>
            )}
            <div
              style={{
                background: 'var(--bg-primary)',
                padding: '12px 16px',
                borderRadius: 'var(--border-radius)',
                margin: '0 0 16px 0',
                textAlign: 'center',
                boxShadow: 'var(--shadow-light)',
                color: '#ffffff',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.1rem',
                  fontWeight: '500',
                }}
              >
                {!stage ? '⏳ Waiting...' : `${stageDescr[stage as keyof typeof stageDescr]}`}
              </h2>
            </div>
            {stage == 'place' && (
              <button
                onClick={this.Ready}
                style={{
                  background: 'var(--cell-active)',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: 'var(--border-radius)',
                  color: '#ffffff',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-light)',
                  transition: 'var(--transition)',
                  marginBottom: '16px',
                  width: '100%',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'var(--shadow-light)';
                }}
              >
                ✅ Finish Placement
              </button>
            )}
            <div style={blocksStyle}>
              {blocks &&
                blocks.map((block, i) => (
                  <button
                    key={i}
                    style={{
                      padding: '8px 16px',
                      margin: '4px',
                      background: '#ffffff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 'var(--border-radius)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'var(--transition)',
                      boxShadow: 'var(--shadow-light)',
                      minWidth: '80px',
                    }}
                    onMouseEnter={e => {
                      this.hoverBlock(e, block);
                      e.currentTarget.style.background = 'var(--cell-hover)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-medium)';
                    }}
                    onMouseLeave={e => {
                      this.leaveBlock();
                      e.currentTarget.style.background = '#ffffff';
                      e.currentTarget.style.boxShadow = 'var(--shadow-light)';
                    }}
                    onClick={e => this.clickBlock(e, block)}
                  >
                    {block.size} × {block.type}
                  </button>
                ))}
            </div>
            <Log
              events={this.props.G.log}
              player={parseInt(this.props.playerID)}
              highlight={this.highlight}
            />
          </div>
        </div>
      </DndProvider>
    );
  }
}

export default Board;
