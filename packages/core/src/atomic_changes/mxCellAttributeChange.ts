import { isNullish } from '../util/mxUtils';
import mxCell from '../view/cell/mxCell';

import type { UndoableChange } from '../types';

/**
 * Class: mxCellAttributeChange
 *
 * Action to change the attribute of a cell's user object.
 * There is no method on the graph model that uses this
 * action. To use the action, you can use the code shown
 * in the example below.
 *
 * Example:
 *
 * To change the attributeName in the cell's user object
 * to attributeValue, use the following code:
 *
 * ```javascript
 * model.beginUpdate();
 * try
 * {
 *   var edit = new mxCellAttributeChange(
 *     cell, attributeName, attributeValue);
 *   model.execute(edit);
 * }
 * finally
 * {
 *   model.endUpdate();
 * }
 * ```
 *
 * Constructor: mxCellAttributeChange
 *
 * Constructs a change of a attribute of the DOM node
 * stored as the value of the given {@link mxCell}`.
 */
class mxCellAttributeChange implements UndoableChange {
  cell: mxCell;
  attribute: string;
  value: any;
  previous: any;

  constructor(cell: mxCell, attribute: string, value: any) {
    this.cell = cell;
    this.attribute = attribute;
    this.value = value;
    this.previous = value;
  }

  /**
   * Function: execute
   *
   * Changes the attribute of the cell's user object by
   * using <mxCell.setAttribute>.
   */
  // execute(): void;
  execute() {
    const tmp = this.cell.getAttribute(this.attribute);

    if (isNullish(this.previous)) {
      this.cell.value.removeAttribute(this.attribute);
    } else {
      this.cell.setAttribute(this.attribute, this.previous);
    }

    this.previous = tmp;
  }
}

export default mxCellAttributeChange;
