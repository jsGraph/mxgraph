import mxCell from '../view/cell/mxCell';
import mxGraphModel from '../view/graph/mxGraphModel';

import type { UndoableChange } from '../types';

/**
 * Action to change the root in a model.
 *
 * Constructor: mxRootChange
 *
 * Constructs a change of the root in the
 * specified model.
 *
 * @class mxRootChange
 */
class mxRootChange implements UndoableChange {
  model: mxGraphModel;
  root: mxCell | null;
  previous: mxCell | null;

  constructor(model: mxGraphModel, root: mxCell | null) {
    this.model = model;
    this.root = root;
    this.previous = root;
  }

  /**
   * Carries out a change of the root using
   * <mxGraphModel.rootChanged>.
   */
  execute() {
    this.root = this.previous;
    this.previous = this.model.rootChanged(this.previous);
  }
}

export default mxRootChange;
