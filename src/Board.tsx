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
  pendingMove?: boolean;
  onMoveStart?: () => void;
  stage?: string;
}

const CellStyle: React.CSSProperties = {
  border: '1px solid var(--border-light)',
  margin: '0',
  width: 'min(6.5vh, 5vw)',
  height: 'min(6.5vh, 5vw)',
  lineHeight: '50px',
  textAlign: 'center',
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',
  overflow: 'hidden',
  borderRadius: 'var(--border-radius-sm)',
  transition:
    'background-color 0.05s ease, border-color 0.05s ease, box-shadow 0.05s ease, transform 0.05s ease',
  cursor: 'pointer',
  position: 'relative',
  backdropFilter: 'blur(8px)',
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
      item: () => ({ coord: props.coord, figure: props.figure }),
      canDrag: () => {
        // Explicitly depend on mode for immediate updates
        const currentMode = props.mode || '';
        let action = getModeAction(props.G, props.ctx, props.player, currentMode, props.coord);
        return action && action.canFrom(props.G, parseInt(props.player), props.coord);
      },
      collect: monitor => ({
        canDrag: monitor.canDrag(),
        isDragging: monitor.isDragging(),
      }),
    }),
    [props.G, props.ctx, props.player, props.mode, props.coord, props.figure, props.pendingMove]
  );

  const [{ canDrop, isOver, dragItem }, dropRef] = useDrop(
    () => ({
      accept: 'square',
      drop: (item: DragItem) => {
        if (props.onMoveStart) {
          props.onMoveStart();
        }
        takeMove(props.G, props.ctx, props.moves, props.mode || '', item.coord, props.coord);
      },
      canDrop: (item: DragItem) => {
        // Explicitly depend on mode for immediate updates
        const currentMode = props.mode || '';
        let action = getModeAction(props.G, props.ctx, props.player, currentMode, item.coord);
        if (!action) {
          return false;
        }
        return action.can(props.G, parseInt(props.player), item.coord, props.coord);
      },
      collect: monitor => ({
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver(),
        dragItem: monitor.getItem(),
      }),
    }),
    [props.G, props.ctx, props.player, props.mode, props.moves, props.coord, props.pendingMove]
  );

  let backgroundColor = 'var(--cell-default)';
  let borderColor = 'var(--border-light)';
  let elevation = 0;
  let transform = 'scale(1)';

  // During placement phase, set light green background for player's side and disable all drag/drop effects
  if (props.stage === 'place') {
    const playerNum = parseInt(props.playerID);
    const [row] = props.coord;
    const isPlayerSide =
      (playerNum === 0 && row >= 0 && row <= 4) || (playerNum === 1 && row >= 9 && row <= 13);

    if (isPlayerSide) {
      backgroundColor = 'rgba(34, 197, 94, 0.15)'; // Light green background
    }
    // No drag/drop effects during placement phase
  } else {
    // Normal drag/drop behavior for non-placement phases
    if (isDragging) {
      backgroundColor = 'var(--accent-primary)';
      borderColor = 'var(--accent-primary)';
      elevation = 3;
      transform = 'scale(0.95)';
    }
    if (canDrop && isOver && dragItem) {
      // Get the drag item action type for active drop zone highlighting - action background color
      let action = getModeAction(
        props.G,
        props.ctx,
        props.player,
        props.mode || '',
        dragItem.coord
      );
      if (action) {
        switch (action.key) {
          case 'a': // Attack
            backgroundColor = 'var(--action-attack-bg)';
            borderColor = 'var(--action-attack-border)';
            break;
          case 's': // Shoot
            backgroundColor = 'var(--action-shoot-bg)';
            borderColor = 'var(--action-shoot-border)';
            break;
          case 'e': // Explode
            backgroundColor = 'var(--action-explode-bg)';
            borderColor = 'var(--action-explode-border)';
            break;
          case 'r': // Rocket/Area
            backgroundColor = 'var(--action-rocket-bg)';
            borderColor = 'var(--action-rocket-border)';
            break;
          case 'm': // Move
          default:
            backgroundColor = 'var(--action-move-bg)';
            borderColor = 'var(--action-move-border)';
            break;
        }
      } else {
        backgroundColor = 'var(--cell-active)';
        borderColor = 'var(--cell-active)';
      }
      elevation = 2;
      transform = 'scale(1.02)';
    } else if (canDrop && dragItem) {
      // Get the drag item action type for subtle drop zone highlighting - always grey background with action border
      let action = getModeAction(
        props.G,
        props.ctx,
        props.player,
        props.mode || '',
        dragItem.coord
      );
      backgroundColor = 'var(--cell-hover)';
      if (action) {
        switch (action.key) {
          case 'a': // Attack
            borderColor = 'var(--action-attack-border)';
            break;
          case 's': // Shoot
            borderColor = 'var(--action-shoot-border)';
            break;
          case 'e': // Explode
            borderColor = 'var(--action-explode-border)';
            break;
          case 'r': // Rocket/Area
            borderColor = 'var(--action-rocket-border)';
            break;
          case 'm': // Move
          default:
            borderColor = 'var(--action-move-border)';
            break;
        }
      } else {
        borderColor = 'var(--cell-active)';
      }
      elevation = 1;
    } else if (canDrop) {
      // Fallback for canDrop without dragItem
      backgroundColor = 'var(--cell-hover)';
      borderColor = 'var(--cell-active)';
      elevation = 1;
    }
  }

  // Apply additional highlights only if NOT in placement phase
  if (props.stage !== 'place') {
    if (canDrag && !isDragging && !props.pendingMove) {
      // Get action type and set color accordingly
      let action = getModeAction(props.G, props.ctx, props.player, props.mode || '', props.coord);
      if (action) {
        switch (action.key) {
          case 'a': // Attack
            backgroundColor = 'var(--action-attack-bg)';
            borderColor = 'var(--action-attack-border)';
            break;
          case 's': // Shoot
            backgroundColor = 'var(--action-shoot-bg)';
            borderColor = 'var(--action-shoot-border)';
            break;
          case 'e': // Explode
            backgroundColor = 'var(--action-explode-bg)';
            borderColor = 'var(--action-explode-border)';
            break;
          case 'r': // Rocket/Area
            backgroundColor = 'var(--action-rocket-bg)';
            borderColor = 'var(--action-rocket-border)';
            break;
          case 'm': // Move
          default:
            backgroundColor = 'var(--action-move-bg)';
            borderColor = 'var(--accent-primary)';
            break;
        }
      } else {
        backgroundColor = 'var(--action-move-bg)';
        borderColor = 'var(--accent-primary)';
      }
      elevation = 1;
    }
    if (props.G.attackFrom && dist(props.G.attackFrom, props.coord) == 0) {
      backgroundColor = 'var(--cell-defend)';
      borderColor = 'var(--cell-defend)';
      elevation = 2;
    }
    if (props.G.attackTo && dist(props.G.attackTo, props.coord) == 0) {
      backgroundColor = 'var(--cell-attack)';
      borderColor = 'var(--cell-attack)';
      elevation = 2;
    }
    if (
      props.highlightedBlock &&
      props.highlightedBlock.coords.some((el: any) => dist(el, props.coord) == 0)
    ) {
      backgroundColor = 'var(--cell-active)';
      borderColor = 'var(--cell-active)';
    }
    for (let pair of props.highlight || []) {
      if (dist(props.coord, pair[0]) == 0) {
        backgroundColor = pair[1];
      }
    }
  }

  let cellStyle = deepcopy(CellStyle);
  cellStyle.backgroundColor = backgroundColor;
  cellStyle.borderColor = borderColor;
  cellStyle.transform = transform;
  if (elevation === 1) {
    cellStyle.boxShadow = 'var(--shadow-sm)';
  } else if (elevation === 2) {
    cellStyle.boxShadow = 'var(--shadow-md)';
  } else if (elevation === 3) {
    cellStyle.boxShadow = 'var(--shadow-lg)';
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
  pendingMove?: boolean;
  lastMoveTimestamp?: number;
}

class Board extends React.Component<BoardPropsLocal, BoardState> {
  constructor(props: BoardPropsLocal) {
    super(props);
    this.state = { mode: undefined, pendingMove: false };
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

  onMoveStart = () => {
    this.setState({
      pendingMove: true,
      lastMoveTimestamp: Date.now(),
    });
  };

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
  }

  componentDidUpdate(prevProps: BoardPropsLocal) {
    // Clear pending move state when game state changes
    if (
      this.state.pendingMove &&
      (prevProps.G !== this.props.G || prevProps.ctx.turn !== this.props.ctx.turn)
    ) {
      this.setState({ pendingMove: false });
    }

    // Failsafe: clear pending state after 2 seconds
    if (
      this.state.pendingMove &&
      this.state.lastMoveTimestamp &&
      Date.now() - this.state.lastMoveTimestamp > 2000
    ) {
      this.setState({ pendingMove: false });
    }
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
            key={`${i}-${j}-${this.state.mode || 'default'}`}
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
            pendingMove={this.state.pendingMove}
            onMoveStart={this.onMoveStart}
            stage={this.props.ctx.activePlayers?.[this.props.playerID]}
          ></Square>
        );
      }
      tbody.push(<tr key={i}>{cells}</tr>);
    }

    let remaining_tbody = [];
    if (this.state.showRemaining) {
      let [my_remaining, other_remaining] = this.CalcRemainingShips();

      let headerStyle: React.CSSProperties = {
        textAlign: 'center',
        fontSize: 'min(2vh, 1.4vw)',
        fontWeight: '700',
        color: '#1e293b',
        paddingBottom: '8px',
        borderBottom: '2px solid rgba(99, 102, 241, 0.3)',
        letterSpacing: '0.025em',
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
        background:
          'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
        padding: '12px 16px 8px 16px',
        borderRadius: 'var(--border-radius-lg) var(--border-radius-lg) 0 0',
      };

      let shipIconStyle: React.CSSProperties = {
        width: 'min(3.5vh, 2.8vw)',
        height: 'min(3.5vh, 2.8vw)',
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        border: '1px solid rgba(139, 92, 246, 0.4)',
        borderRadius: 'var(--border-radius-sm)',
        backgroundColor: 'rgba(248, 250, 252, 0.9)',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
        margin: '2px',
      };

      let labelStyle: React.CSSProperties = {
        padding: '6px 8px',
        fontWeight: '600',
        fontSize: 'min(1.6vh, 1.2vw)',
        color: '#1e293b',
        textAlign: 'center',
        verticalAlign: 'middle',
        borderRadius: 'var(--border-radius-sm)',
        minWidth: '50px',
        textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
        letterSpacing: '0.025em',
        margin: '2px',
      };

      let numberCellStyle: React.CSSProperties = {
        textAlign: 'center',
        verticalAlign: 'middle',
        padding: '4px 2px',
        fontWeight: '700',
        fontSize: 'min(1.8vh, 1.4vw)',
        fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
        borderRadius: 'var(--border-radius-sm)',
        minWidth: 'min(3.5vh, 2.8vw)',
        letterSpacing: '-0.02em',
        margin: '2px',
      };

      // Header row
      remaining_tbody.push(
        <tr key="header">
          <td colSpan={Object.keys(my_remaining).length + 1} style={headerStyle}>
            🚢 Fleet Status
          </td>
        </tr>
      );

      // Ship icons row
      let shipIconRow = [
        <td key="ship-label" style={{ ...labelStyle, padding: '8px' }}>
          Ships
        </td>,
      ];
      for (const [ship] of Object.entries(my_remaining) as [string, number][]) {
        shipIconRow.push(
          <td key={`icon-${ship}`} style={{ padding: '4px' }}>
            <div
              style={{
                ...shipIconStyle,
                backgroundImage: `url(/figures/${ship}.png)`,
              }}
            />
          </td>
        );
      }
      remaining_tbody.push(<tr key="ship-icons">{shipIconRow}</tr>);

      // Your numbers row
      let yourRow = [
        <td
          key="you-label"
          style={{
            ...labelStyle,
            background:
              'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.12) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.25)',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          You
        </td>,
      ];
      for (const [ship, count] of Object.entries(my_remaining) as [string, number][]) {
        yourRow.push(
          <td key={`you-${ship}`} style={{ padding: '4px' }}>
            <div
              style={{
                ...numberCellStyle,
                color: count > 0 ? '#065f46' : '#9ca3af',
                background:
                  count > 0
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)'
                    : 'rgba(248, 250, 252, 0.6)',
                border:
                  count > 0
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(148, 163, 184, 0.4)',
                textShadow:
                  count > 0
                    ? '0 1px 2px rgba(255, 255, 255, 0.9)'
                    : '0 1px 2px rgba(255, 255, 255, 0.5)',
              }}
            >
              {count}
            </div>
          </td>
        );
      }
      remaining_tbody.push(<tr key="your-counts">{yourRow}</tr>);

      // Enemy numbers row
      let enemyRow = [
        <td
          key="enemy-label"
          style={{
            ...labelStyle,
            background:
              'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 127, 0.12) 100%)',
            border: '2px solid rgba(239, 68, 68, 0.25)',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
          }}
        >
          Enemy
        </td>,
      ];
      for (const [ship, count] of Object.entries(other_remaining) as [string, number][]) {
        enemyRow.push(
          <td key={`enemy-${ship}`} style={{ padding: '4px' }}>
            <div
              style={{
                ...numberCellStyle,
                color: count > 0 ? '#7f1d1d' : '#9ca3af',
                background:
                  count > 0
                    ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 127, 0.1) 100%)'
                    : 'rgba(248, 250, 252, 0.6)',
                border:
                  count > 0
                    ? '1px solid rgba(239, 68, 68, 0.4)'
                    : '1px solid rgba(148, 163, 184, 0.4)',
                textShadow:
                  count > 0
                    ? '0 1px 2px rgba(255, 255, 255, 0.9)'
                    : '0 1px 2px rgba(255, 255, 255, 0.5)',
              }}
            >
              {count}
            </div>
          </td>
        );
      }
      remaining_tbody.push(<tr key="enemy-counts">{enemyRow}</tr>);

      // Add bottom padding row
      remaining_tbody.push(
        <tr key="bottom-padding">
          <td colSpan={Object.keys(my_remaining).length + 1} style={{ padding: '8px 0' }}></td>
        </tr>
      );
    }

    let remainingStyle: React.CSSProperties = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      tableLayout: 'fixed',
      color: 'var(--text-primary)',
      background: 'rgba(255, 255, 255, 0.98)',
      backdropFilter: 'blur(24px)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '0',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      zIndex: 1000,
      maxWidth: '90vw',
      maxHeight: '85vh',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      animation: 'fadeInSlide 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      borderCollapse: 'separate',
      borderSpacing: '0',
      fontSize: '12px',
    };

    let sidebarStyle: React.CSSProperties = {
      padding: '32px 24px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      width: 'min(360px, 28vw)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      height: '100vh',
      margin: 0,
      borderLeft: '1px solid var(--border-light)',
      boxShadow: 'var(--shadow-xl)',
    };

    let outStyle: React.CSSProperties = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      margin: 0,
      background: 'var(--bg-primary)',
      overflow: 'hidden',
      position: 'relative',
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
          {this.state.showRemaining && (
            <table
              id="remaining"
              style={{
                ...remainingStyle,
                borderSpacing: '4px 2px',
              }}
            >
              <tbody>{remaining_tbody}</tbody>
            </table>
          )}
          <div
            style={{
              padding: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: 'var(--border-radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              border: '1px solid var(--border-light)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                right: '12px',
                bottom: '12px',
                background:
                  'linear-gradient(45deg, rgba(139, 92, 246, 0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(139, 92, 246, 0.03) 25%, transparent 25%)',
                backgroundSize: '20px 20px',
                borderRadius: 'var(--border-radius-lg)',
                pointerEvents: 'none',
              }}
            />
            <table
              id="board"
              style={{
                borderCollapse: 'separate',
                borderSpacing: '2px',
                background: 'transparent',
                borderRadius: 'var(--border-radius-lg)',
                padding: '12px',
                position: 'relative',
                zIndex: 1,
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
                      ? 'var(--cell-active)'
                      : this.props.ctx.gameover.winner === undefined
                        ? 'var(--accent-secondary)'
                        : 'var(--cell-attack)',
                  padding: '20px',
                  borderRadius: 'var(--border-radius-lg)',
                  margin: '0 0 24px 0',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-lg)',
                  color: 'var(--text-light)',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background:
                      'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.1) 75%)',
                    backgroundSize: '20px 20px',
                  }}
                />
                <h1
                  style={{
                    margin: 0,
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    position: 'relative',
                    zIndex: 1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                >
                  {this.props.ctx.gameover.winner === undefined
                    ? '🤝 Draw'
                    : this.props.ctx.gameover.winner == parseInt(this.props.playerID)
                      ? '🎉 Victory!'
                      : '💥 Defeat'}
                </h1>
              </div>
            )}
            <div
              style={{
                background: 'var(--accent-primary)',
                padding: '16px 20px',
                borderRadius: 'var(--border-radius-lg)',
                margin: '0 0 24px 0',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
                color: 'var(--text-light)',
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                  transform: 'translateX(-100%)',
                  animation: stage ? 'shimmer 2s infinite' : 'none',
                }}
              />
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  position: 'relative',
                  zIndex: 1,
                  letterSpacing: '0.025em',
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
                  padding: '16px 32px',
                  borderRadius: 'var(--border-radius-lg)',
                  color: 'var(--text-light)',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                  transition: 'var(--transition-fast)',
                  marginBottom: '24px',
                  width: '100%',
                  textTransform: 'uppercase',
                  letterSpacing: '0.075em',
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                  e.currentTarget.style.transition = 'var(--transition-fast)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.transition = 'var(--transition-fast)';
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>✅ Ready to Battle</span>
              </button>
            )}
            <div style={{ ...blocksStyle, flexShrink: 0 }}>
              {blocks &&
                blocks.map((block, i) => (
                  <button
                    key={i}
                    style={{
                      padding: '12px 20px',
                      margin: '6px',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--border-light)',
                      borderRadius: 'var(--border-radius-lg)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      boxShadow: 'var(--shadow-sm)',
                      minWidth: '100px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      this.hoverBlock(e, block);
                      e.currentTarget.style.background = 'var(--accent-primary)';
                      e.currentTarget.style.color = 'var(--text-light)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.transition = 'var(--transition-fast)';
                    }}
                    onMouseLeave={e => {
                      this.leaveBlock();
                      e.currentTarget.style.background = 'var(--surface-1)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.transition = 'var(--transition-fast)';
                    }}
                    onClick={e => this.clickBlock(e, block)}
                  >
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '500' }}>
                      {block.size} × {block.type}
                    </span>
                  </button>
                ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Log
                events={this.props.G.log}
                player={parseInt(this.props.playerID)}
                highlight={this.highlight}
              />
            </div>
          </div>
        </div>
      </DndProvider>
    );
  }
}

export default Board;
