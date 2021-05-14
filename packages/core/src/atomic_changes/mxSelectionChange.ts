import mxEventObject from '../util/event/mxEventObject';
import mxResources from '../util/mxResources';
import mxLog from '../util/gui/mxLog';
import mxEvent from '../util/event/mxEvent';
import mxGraphSelectionModel from '../view/graph/mxGraphSelectionModel';
import mxCell from '../view/cell/mxCell';

import type { UndoableChange } from '../types';

/**
 * @class mxSelectionChange
 * Action to change the current root in a view.
 */
class mxSelectionChange implements UndoableChange {
  selectionModel: mxGraphSelectionModel;
  added: mxCell[];
  removed: mxCell[];

  constructor(
    selectionModel: mxGraphSelectionModel,
    added: mxCell[] = [],
    removed: mxCell[] = []
  ) {
    this.selectionModel = selectionModel;
    this.added = added.slice();
    this.removed = removed.slice();
  }

  /**
   * Changes the current root of the view.
   */
  execute() {
    const t0: any = mxLog.enter('mxSelectionChange.execute');

    window.status =
      mxResources.get(this.selectionModel.updatingSelectionResource) ||
      this.selectionModel.updatingSelectionResource;

    for (const removed of this.removed) {
      this.selectionModel.cellRemoved(removed);
    }

    for (const added of this.added) {
      this.selectionModel.cellAdded(added);
    }

    [this.added, this.removed] = [this.removed, this.added];

    window.status =
      mxResources.get(this.selectionModel.doneResource) ||
      this.selectionModel.doneResource;
    mxLog.leave('mxSelectionChange.execute', t0);

    this.selectionModel.fireEvent(
      new mxEventObject(
        mxEvent.CHANGE,
        'added',
        this.added,
        'removed',
        this.removed
      )
    );
  }
}

export default mxSelectionChange;
