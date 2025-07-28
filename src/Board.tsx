import type { Ctx } from 'boardgame.io';
import React from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Tooltip } from 'react-tooltip';
import './Board.css';
import {
  DefaultGameConfig,
  dist,
  getBlocks,
  getModeAction,
  getPlacementZone,
  playerAdjacent,
  takeMove,
} from './game';
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
  highlight: any[];
  traceHighlight: any[];
  pendingMove?: boolean;
  onMoveStart?: () => void;
  stage?: string;
}

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

  let cellClasses = ['board-cell'];

  // During placement phase, set light green background for player's side and disable all drag/drop effects
  if (props.stage === 'place') {
    const playerNum = parseInt(props.playerID);
    const [row] = props.coord;
    const config = props.G.config || DefaultGameConfig;
    const [low, high] = getPlacementZone(config, playerNum);
    const isPlayerSide = row >= low && row < high;

    if (isPlayerSide) {
      cellClasses.push('board-cell-placement-zone');
    }
    if (canDrop && isOver && dragItem) {
      cellClasses.push('board-cell-drop-active');
      borderColor = 'var(--cell-active)';
    }
    // No drag/drop effects during placement phase
  } else {
    // Normal drag/drop behavior for non-placement phases
    if (isDragging) {
      cellClasses.push('board-cell-dragging');
      elevation = 3;
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
      cellClasses.push('board-cell-drop-active');
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
    } else if (canDrop && dragItem) {
      // Get the drag item action type for subtle drop zone highlighting - always grey background with action border
      let action = getModeAction(
        props.G,
        props.ctx,
        props.player,
        props.mode || '',
        dragItem.coord
      );
      cellClasses.push('board-cell-drop-hover');
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
    for (let pair of [...props.highlight, ...props.traceHighlight]) {
      if (dist(props.coord, pair[0]) == 0) {
        backgroundColor = pair[1];
      }
    }
    if (props.G.attackFrom && dist(props.G.attackFrom, props.coord) == 0) {
      cellClasses.push('board-cell-attack-from');
      elevation = 2;
    }
    if (props.G.attackTo && dist(props.G.attackTo, props.coord) == 0) {
      cellClasses.push('board-cell-attack-to');
      elevation = 2;
    }
    if (
      props.highlightedBlock &&
      props.highlightedBlock.coords.some((el: any) => dist(el, props.coord) == 0)
    ) {
      elevation = 3;
      backgroundColor = 'var(--cell-active)';
      borderColor = 'var(--cell-active)';
    }
  }

  let cellStyle: React.CSSProperties = {};
  if (!props.ctx.gameover) {
    if (backgroundColor !== 'var(--cell-default)') {
      cellStyle.backgroundColor = backgroundColor;
    }
    if (borderColor !== 'var(--border-light)') {
      cellStyle.borderColor = borderColor;
    }
    if (transform !== 'scale(1)') {
      cellStyle.transform = transform;
    }
    if (elevation === 1) {
      cellStyle.boxShadow = 'var(--shadow-sm)';
    } else if (elevation === 2) {
      cellStyle.boxShadow = 'var(--shadow-md)';
    } else if (elevation === 3) {
      cellStyle.boxShadow = 'var(--shadow-lg)';
    }
  }
  let label = undefined;
  if (props.figure) {
    cellStyle.backgroundImage = 'url(/figures/' + props.figure.type + '.png)';
    if (props.figure.label) {
      label = (
        <img
          className="board-cell-ship-label"
          src={'/figures/' + props.figure.label + '.png'}
          alt=""
        />
      );
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
        className={cellClasses.join(' ')}
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
  inviteLink?: string;
}

interface BoardState {
  mode: string | undefined;
  trace?: boolean;
  hoveredCoords?: any;
  highlight: any[];
  traceHighlight: any[];
  traceArrows?: any[];
  logArrows?: any[];
  blockArrows?: any[];
  tooltip?: boolean;
  showRemaining?: boolean;
  highlightedBlock?: any;
  pendingMove?: boolean;
  lastMoveTimestamp?: number;
  linkCopied?: boolean;
  readyConfirmPending?: boolean;
}

class Board extends React.Component<BoardPropsLocal, BoardState> {
  constructor(props: BoardPropsLocal) {
    super(props);
    this.state = {
      mode: undefined,
      pendingMove: false,
      highlight: [],
      traceHighlight: [],
      traceArrows: [],
      logArrows: [],
      blockArrows: [],
      linkCopied: false,
      readyConfirmPending: false,
    };
  }

  Ready = () => {
    if (!this.state.readyConfirmPending) {
      // First click - show confirmation state
      this.setState({ readyConfirmPending: true });
      // Auto-reset after 5 seconds if no second click
      setTimeout(() => {
        this.setState({ readyConfirmPending: false });
      }, 5000);
    } else {
      // Second click - actually ready up
      this.props.moves.Ready();
      this.setState({ readyConfirmPending: false });
    }
  };

  Skip = () => {
    this.props.moves.Skip();
  };

  copyInviteLink = async () => {
    if (this.props.inviteLink) {
      try {
        await navigator.clipboard.writeText(this.props.inviteLink);
        this.setState({ linkCopied: true });
        // Reset after 2 seconds
        setTimeout(() => {
          this.setState({ linkCopied: false });
        }, 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
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
    let traceArrows = [];
    let count = 0;
    let moveSequence = []; // Store the full sequence of positions

    // First, collect all positions in the movement sequence
    moveSequence.push(coords);
    let currentCoords = coords;

    for (let i = this.props.G.log.length - 1; i >= 0; i--) {
      let event = this.props.G.log[i];
      if (event.type == 'move' && dist(currentCoords, event.from) == 0) {
        return;
      }
      if (event.type == 'move' && dist(currentCoords, event.to) == 0) {
        currentCoords = event.from;
        moveSequence.push(currentCoords);
        count++;
        if (count == 10) {
          break;
        }
      }
    }

    // Now create highlights and arrows for the sequence
    for (let i = 0; i < moveSequence.length; i++) {
      // Create a nice gradient from bright cyan to deep purple
      let alpha = Math.max(0.3, 1 - i * 0.08);
      let hue = 180 + i * 15; // Cyan to purple gradient
      let saturation = Math.max(40, 70 - i * 3);
      let lightness = Math.max(35, 55 - i * 2);
      let color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;

      trace.push([moveSequence[i], color]);

      // Add arrow from this position to the next (showing direction towards current position)
      if (i < moveSequence.length - 1) {
        traceArrows.push({
          from: moveSequence[i + 1], // From older position
          to: moveSequence[i], // To newer position (towards current)
          opacity: alpha,
        });
      }
    }

    this.setState({ traceHighlight: trace, traceArrows });
  };

  CalcRemainingShips = () => {
    const initialShips = this.props.G.config?.initialShips || DefaultGameConfig.initialShips;
    const fieldSize = this.props.G.config?.fieldSize || DefaultGameConfig.fieldSize;

    let my_remaining: Record<string, number> = {};
    for (const [ship] of initialShips) {
      my_remaining[ship] = 0;
    }
    for (let i = 0; i < fieldSize; ++i) {
      for (let j = 0; j < fieldSize; ++j) {
        let ship = this.props.G.cells[i][j];
        if (ship?.player == parseInt(this.props.playerID)) {
          ++my_remaining[ship.type];
        }
      }
    }
    let other_remaining: Record<string, number> = {};
    for (const [ship, count] of initialShips) {
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
      traceHighlight: [],
      traceArrows: [],
      trace: false,
      showRemaining: false,
    });
    // Don't clear blockArrows on key up - they should persist during block declaration
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
    this.setState({ hoveredCoords: undefined });
    // Don't clear blockArrows on square leave - they should persist during block declaration
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
    // Check if this highlight represents a move event and add arrow
    let logArrows = [];
    if (highlight && highlight.length >= 2) {
      const from = highlight.find((h: any) => h[1] === 'rgba(147, 51, 234, 0.4)')?.[0];
      const to = highlight.find((h: any) => h[1] === 'rgba(147, 51, 234, 0.6)')?.[0];
      if (from && to) {
        logArrows.push({
          from: from,
          to: to,
          opacity: 0.9,
        });
      }
    }
    this.setState({ highlight: highlight, logArrows });
  };

  renderArrows = () => {
    const allArrows = [
      ...(this.state.traceArrows || []),
      ...(this.state.logArrows || []),
      ...(this.state.blockArrows || []),
    ];
    if (allArrows.length === 0) {
      return null;
    }

    const boardSize = this.props.G.config?.fieldSize || 14;

    return (
      <svg className="board-arrows-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient
            id="blockArrowGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="rgb(168, 85, 247)" stopOpacity="0.9" />
          </linearGradient>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5.5" refY="2" orient="auto">
            <polygon
              points="0 0, 6 2, 0 4"
              fill="rgba(147, 51, 234, 0.9)"
              stroke="rgba(147, 51, 234, 1)"
              strokeWidth="0.3"
            />
          </marker>
          <marker
            id="bigarrowhead"
            markerWidth="6.5"
            markerHeight="4.5"
            refX="6"
            refY="2.25"
            orient="auto"
          >
            <defs>
              <linearGradient id="arrowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(59, 130, 246, 0.9)" />
                <stop offset="100%" stopColor="rgba(168, 85, 247, 0.9)" />
              </linearGradient>
            </defs>
            <polygon
              points="0 0, 6.5 2.25, 0 4.5"
              fill="rgb(99, 102, 241)"
              stroke="rgb(79, 70, 229)"
              strokeWidth="0.2"
            />
          </marker>
        </defs>
        {allArrows.map((arrow, index) => {
          const fromX = (arrow.from[1] + 0.5) * (100 / boardSize);
          const fromY = (arrow.from[0] + 0.5) * (100 / boardSize);
          const toX = (arrow.to[1] + 0.5) * (100 / boardSize);
          const toY = (arrow.to[0] + 0.5) * (100 / boardSize);

          const isBigArrow = arrow.type === 'block';
          const strokeColor = isBigArrow
            ? 'rgb(99, 102, 241)'
            : `rgba(147, 51, 234, ${Math.max(0.7, arrow.opacity)})`;
          const strokeWidth = isBigArrow ? '0.8' : '0.5';
          const markerEnd = isBigArrow ? 'url(#bigarrowhead)' : 'url(#arrowhead)';

          return (
            <line
              key={`arrow-${index}`}
              x1={fromX}
              y1={fromY}
              x2={toX}
              y2={toY}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              markerEnd={markerEnd}
              style={{
                filter: isBigArrow
                  ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.4)) drop-shadow(0 3px 12px rgba(0, 0, 0, 0.25))'
                  : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                animation: isBigArrow ? 'blockArrowGlow 3s ease-in-out infinite' : 'none',
              }}
            />
          );
        })}
      </svg>
    );
  };

  updateBlockArrows = () => {
    let blockArrows = [];

    // Show block arrow for both players when attack is happening
    if (this.props.G.attackFrom && this.props.G.attackTo) {
      blockArrows.push({
        from: this.props.G.attackFrom,
        to: this.props.G.attackTo,
        opacity: 1.0,
        type: 'block',
      });
    }

    this.setState({ blockArrows });
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
    this.updateBlockArrows();
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

    // Update block arrows when attackFrom/attackTo change
    const currentStage = this.props.ctx.activePlayers?.[this.props.playerID];
    const prevStage = prevProps.ctx.activePlayers?.[this.props.playerID];
    const attackFromChanged = prevProps.G?.attackFrom !== this.props.G?.attackFrom;
    const attackToChanged = prevProps.G?.attackTo !== this.props.G?.attackTo;

    if (attackFromChanged || attackToChanged || currentStage !== prevStage) {
      this.updateBlockArrows();
    }

    // Check if we just entered a block declaration stage
    if (
      currentStage !== prevStage &&
      (currentStage === 'attackBlock' || currentStage === 'responseBlock')
    ) {
      if (currentStage === 'attackBlock') {
        if (!playerAdjacent(this.props.G, parseInt(this.props.playerID), this.props.G.attackFrom)) {
          setTimeout(
            () =>
              this.props.moves.AttackBlock(
                getBlocks(this.props.G, parseInt(this.props.playerID), this.props.G.attackFrom)[0]
              ),
            100
          );
        }
      } else if (currentStage === 'responseBlock') {
        if (!playerAdjacent(this.props.G, parseInt(this.props.playerID), this.props.G.attackTo)) {
          setTimeout(
            () =>
              this.props.moves.ResponseBlock(
                getBlocks(this.props.G, parseInt(this.props.playerID), this.props.G.attackTo)[0]
              ),
            100
          );
        }
      }
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

    const fieldSize = this.props.G.config?.fieldSize || 14;
    const cellSizeScaleFactor = 14 / fieldSize; // Scale relative to original 14x14

    let tbody = [];
    for (let i = 0; i < fieldSize; i++) {
      let cells = [];
      for (let j = 0; j < fieldSize; j++) {
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
            traceHighlight={this.state.traceHighlight}
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

      // Header row
      remaining_tbody.push(
        <tr key="header">
          <td colSpan={Object.keys(my_remaining).length + 1} className="board-remaining-header">
            🚢 Fleet Status
          </td>
        </tr>
      );

      // Ship icons row
      let shipIconRow = [
        <td key="ship-label" className="board-remaining-label board-remaining-label-cell">
          Ships
        </td>,
      ];
      for (const [ship] of Object.entries(my_remaining) as [string, number][]) {
        shipIconRow.push(
          <td key={`icon-${ship}`} className="board-remaining-ship-cell">
            <div
              className="board-remaining-ship-icon"
              style={{
                backgroundImage: `url(/figures/${ship}.png)`,
              }}
            />
          </td>
        );
      }
      remaining_tbody.push(<tr key="ship-icons">{shipIconRow}</tr>);

      // Your numbers row
      let yourRow = [
        <td key="you-label" className="board-remaining-label your">
          You
        </td>,
      ];
      for (const [ship, count] of Object.entries(my_remaining) as [string, number][]) {
        yourRow.push(
          <td key={`you-${ship}`} className="board-remaining-ship-cell">
            <div className={`board-remaining-number your ${count > 0 ? 'active' : 'inactive'}`}>
              {count}
            </div>
          </td>
        );
      }
      remaining_tbody.push(<tr key="your-counts">{yourRow}</tr>);

      // Enemy numbers row
      let enemyRow = [
        <td key="enemy-label" className="board-remaining-label enemy">
          Enemy
        </td>,
      ];
      for (const [ship, count] of Object.entries(other_remaining) as [string, number][]) {
        enemyRow.push(
          <td key={`enemy-${ship}`} className="board-remaining-ship-cell">
            <div className={`board-remaining-number enemy ${count > 0 ? 'active' : 'inactive'}`}>
              {count}
            </div>
          </td>
        );
      }
      remaining_tbody.push(<tr key="enemy-counts">{enemyRow}</tr>);

      // Add bottom padding row
      remaining_tbody.push(
        <tr key="bottom-padding">
          <td
            colSpan={Object.keys(my_remaining).length + 1}
            className="board-remaining-padding-cell"
          ></td>
        </tr>
      );
    }

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
          className="board-tooltip"
          render={({ content }) =>
            content ? <div dangerouslySetInnerHTML={{ __html: content }} /> : null
          }
        />
        <div
          className="board-container"
          style={
            {
              '--board-size': fieldSize,
              '--cell-scale-factor': cellSizeScaleFactor,
            } as React.CSSProperties
          }
        >
          <div className="flip-screen-prompt">
            <div className="flip-screen-icon">📱</div>
            <h2 className="flip-screen-title">Please Rotate Your Device</h2>
            <p className="flip-screen-text">
              This game is designed for landscape orientation. Please rotate your device
              horizontally for the best experience.
            </p>
          </div>
          {this.state.showRemaining && (
            <table id="remaining" className="board-remaining-overlay">
              <tbody>{remaining_tbody}</tbody>
            </table>
          )}
          <div className="board-main-container">
            <div className="board-pattern-overlay" />
            <div className="board-inner-container">
              <table id="board" className="board-table">
                <tbody>{tbody}</tbody>
              </table>
              {this.renderArrows()}
            </div>
          </div>
          <div className="board-sidebar">
            {this.props.ctx?.gameover && (
              <div
                className={`board-game-over ${
                  this.props.ctx.gameover.winner === undefined
                    ? 'draw'
                    : this.props.ctx.gameover.winner == parseInt(this.props.playerID)
                      ? 'victory'
                      : 'defeat'
                }`}
              >
                <div className="board-game-over-pattern" />
                <h1 className="board-game-over-title">
                  {this.props.ctx.gameover.winner === undefined
                    ? '🤝 Draw'
                    : this.props.ctx.gameover.winner == parseInt(this.props.playerID)
                      ? '🎉 Victory!'
                      : '💥 Defeat'}
                </h1>
              </div>
            )}
            {!this.props.ctx?.gameover && (
              <div className="board-status-container">
                <div className={`board-status-shimmer ${stage ? 'active' : ''}`} />
                <h2 className="board-status-title">
                  {!stage ? '⏳ Waiting...' : `${stageDescr[stage as keyof typeof stageDescr]}`}
                </h2>
              </div>
            )}
            {stage == 'place' && (
              <button
                onClick={this.Ready}
                className={`board-ready-button ${this.state.readyConfirmPending ? 'confirm' : 'normal'}`}
              >
                <span className="board-ready-button-text">
                  {this.state.readyConfirmPending ? '🎯 Confirm Ready?' : '✅ Ready to Battle'}
                </span>
              </button>
            )}
            {this.props.inviteLink && stage === 'place' && this.props.playerID === '0' && (
              <button
                onClick={this.copyInviteLink}
                className={`board-invite-button ${this.state.linkCopied ? 'copied' : 'normal'}`}
              >
                <span className="board-invite-button-text">
                  {this.state.linkCopied ? '✅ Link Copied!' : '🔗 Copy Invite Link'}
                </span>
              </button>
            )}
            <div className="board-blocks-container">
              {blocks &&
                blocks.map((block, i) => (
                  <button
                    key={i}
                    className="board-block-button"
                    onMouseEnter={e => {
                      this.hoverBlock(e, block);
                    }}
                    onMouseLeave={e => {
                      this.leaveBlock(e);
                    }}
                    onClick={e => this.clickBlock(e, block)}
                  >
                    {/* Ship Icon */}
                    <img
                      src={`/figures/${block.type}.png`}
                      alt={block.type}
                      className="board-block-ship-icon"
                    />

                    {/* Size Badge */}
                    <span className="board-block-size-badge">{block.size}</span>
                  </button>
                ))}
            </div>
            <div className="board-log-section">
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
