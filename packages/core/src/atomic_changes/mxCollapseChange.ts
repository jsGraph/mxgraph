import mxCell from '../view/cell/mxCell';
import mxGraphModel from '../view/graph/mxGraphModel';

import type { UndoableChange } from '../types';

/**
 * Class: mxCollapseChange
 *
 * Action to change a cell's collapsed state in a model.
 *
 * Constructor: mxCollapseChange
 *
 * Constructs a change of a collapsed state in the
 * specified model.
 */
class mxCollapseChange implements UndoableChange {
  model: mxGraphModel;
  cell: mxCell;
  collapsed: boolean;
  previous: boolean;

  constructor(model: mxGraphModel, cell: mxCell, collapsed: boolean) {
    this.model = model;
    this.cell = cell;
    this.collapsed = collapsed;
    this.previous = collapsed;
  }

  /**
   * Function: execute
   *
   * Changes the collapsed state of {@link cell}` to {@link previous}` using
   * <mxGraphModel.collapsedStateForCellChanged>.
   */
  execute() {
    this.collapsed = this.previous;
    this.previous = this.model.collapsedStateForCellChanged(
      this.cell,
      this.previous
    );
  }
}

export default mxCollapseChange;
