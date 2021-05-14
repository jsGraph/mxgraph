import mxCell from '../view/cell/mxCell';
import mxGraphModel from '../view/graph/mxGraphModel';

import type { UndoableChange } from '../types';

/**
 * Action to change a cell's style in a model.
 *
 * @class mxStyleChange
 */
class mxStyleChange implements UndoableChange {
  model: mxGraphModel;
  cell: mxCell;
  style: string | null;
  previous: string | null;

  constructor(model: mxGraphModel, cell: mxCell, style: string | null) {
    this.model = model;
    this.cell = cell;
    this.style = style;
    this.previous = style;
  }

  /**
   * Function: execute
   *
   * Changes the style of {@link cell}` to {@link previous}` using
   * <mxGraphModel.styleForCellChanged>.
   */
  execute() {
    this.style = this.previous;
    this.previous = this.model.styleForCellChanged(this.cell, this.previous);
  }
}

export default mxStyleChange;
