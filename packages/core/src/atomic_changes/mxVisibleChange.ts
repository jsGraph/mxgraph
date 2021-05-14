import mxCell from '../view/cell/mxCell';
import mxGraphModel from '../view/graph/mxGraphModel';

import type { UndoableChange } from '../types';

/**
 * Class: mxVisibleChange
 *
 * Action to change a cell's visible state in a model.
 *
 * Constructor: mxVisibleChange
 *
 * Constructs a change of a visible state in the
 * specified model.
 */
class mxVisibleChange implements UndoableChange {
  model: mxGraphModel;
  cell: mxCell;
  visible: boolean;
  previous: boolean;

  constructor(model: mxGraphModel, cell: mxCell, visible: boolean) {
    this.model = model;
    this.cell = cell;
    this.visible = visible;
    this.previous = visible;
  }

  /**
   * Function: execute
   *
   * Changes the visible state of {@link cell}` to {@link previous}` using
   * <mxGraphModel.visibleStateForCellChanged>.
   */
  execute() {
    this.visible = this.previous;
    this.previous = this.model.visibleStateForCellChanged(
      this.cell,
      this.previous
    );
  }
}

export default mxVisibleChange;
