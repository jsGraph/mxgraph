import mxCell from '../view/cell/mxCell';
import mxGraphModel from '../view/graph/mxGraphModel';

import type { UndoableChange } from '../types';

/**
 * Action to change a terminal in a model.
 *
 * Constructor: mxTerminalChange
 *
 * Constructs a change of a terminal in the
 * specified model.
 */
class mxTerminalChange implements UndoableChange {
  model: mxGraphModel;
  cell: mxCell;
  terminal: mxCell | null;
  previous: mxCell | null;
  source: boolean;

  constructor(
    model: mxGraphModel,
    cell: mxCell,
    terminal: mxCell | null,
    source: boolean
  ) {
    this.model = model;
    this.cell = cell;
    this.terminal = terminal;
    this.previous = terminal;
    this.source = source;
  }

  /**
   * Changes the terminal of {@link cell}` to {@link previous}` using
   * <mxGraphModel.terminalForCellChanged>.
   */
  execute() {
    this.terminal = this.previous;
    this.previous = this.model.terminalForCellChanged(
      this.cell,
      this.previous,
      this.source
    );
  }
}

export default mxTerminalChange;
