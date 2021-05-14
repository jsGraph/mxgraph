import mxCell from '../view/cell/mxCell';
import mxGraphModel from '../view/graph/mxGraphModel';

import type { UndoableChange } from '../types';

/**
 * Action to change a user object in a model.
 *
 * Constructs a change of a user object in the
 * specified model.
 *
 * @class mxValueChange
 */
class mxValueChange implements UndoableChange {
  model: mxGraphModel;
  cell: mxCell;
  value: unknown;
  previous: unknown;

  constructor(model: mxGraphModel, cell: mxCell, value: unknown) {
    this.model = model;
    this.cell = cell;
    this.value = value;
    this.previous = value;
  }

  /**
   * Changes the value of {@link cell}` to {@link previous}` using
   * <mxGraphModel.valueForCellChanged>.
   */
  execute() {
    this.value = this.previous;
    this.previous = this.model.valueForCellChanged(this.cell, this.previous);
  }
}

export default mxValueChange;
