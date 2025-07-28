import React from 'react';
import { useDragLayer } from 'react-dnd';
import './CustomDrag.css';

function getItemStyles(initialOffset, currentOffset) {
  if (!initialOffset || !currentOffset) {
    return {
      display: 'none',
    };
  }
  let { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform,
  };
}
export const CustomDragLayer = _props => {
  const { itemType, isDragging, initialOffset, currentOffset } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging(),
  }));
  function renderItem() {
    switch (itemType) {
      case 'square':
        return <div>dragging</div>;
      default:
        return null;
    }
  }
  if (!isDragging) {
    return null;
  }
  return (
    <div className="custom-drag-layer">
      <div
        className={`custom-drag-item ${!initialOffset || !currentOffset ? '' : 'visible'}`}
        style={getItemStyles(initialOffset, currentOffset)}
      >
        {renderItem()}
      </div>
    </div>
  );
};
