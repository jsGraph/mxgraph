import mxGeometry from '../util/datatypes/mxGeometry';
import mxCell from '../view/cell/mxCell';
import mxGraphModel from '../view/graph/mxGraphModel';

import type { UndoableChange } from '../types';

/**
 * Class: mxGeometryChange
 *
 * Action to change a cell's geometry in a model.
 *
 * Constructor: mxGeometryChange
 *
 * Constructs a change of a geometry in the
 * specified model.
 */
class mxGeometryChange implements UndoableChange {
  model: mxGraphModel;
  cell: mxCell;
  geometry: mxGeometry | null;
  previous: mxGeometry | null;

  constructor(model: mxGraphModel, cell: mxCell, geometry: mxGeometry | null) {
    this.model = model;
    this.cell = cell;
    this.geometry = geometry;
    this.previous = geometry;
  }

  /**
   * Function: execute
   *
   * Changes the geometry of {@link cell}` ro {@link previous}` using
   * <mxGraphModel.geometryForCellChanged>.
   */
  execute() {
    this.geometry = this.previous;
    this.previous = this.model.geometryForCellChanged(this.cell, this.previous);
  }
}

export default mxGeometryChange;
