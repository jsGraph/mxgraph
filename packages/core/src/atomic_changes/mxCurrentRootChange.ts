import mxGraphView from '../view/graph/mxGraphView';
import mxEventObject from '../util/event/mxEventObject';
import mxPoint from '../util/datatypes/mxPoint';
import mxCell from '../view/cell/mxCell';
import mxEvent from '../util/event/mxEvent';

import type { UndoableChange } from '../types';

/**
 * Class: mxCurrentRootChange
 *
 * Action to change the current root in a view.
 */
class mxCurrentRootChange implements UndoableChange {
  view: mxGraphView;
  root: mxCell | null;
  previous: mxCell | null;
  isUp: boolean;

  constructor(view: mxGraphView, root: mxCell | null) {
    this.view = view;
    this.root = root;
    this.previous = root;
    this.isUp = root === null;

    if (!this.isUp) {
      let tmp = this.view.currentRoot;

      while (tmp) {
        if (tmp === root) {
          this.isUp = true;
          break;
        }
        tmp = tmp.getParent();
      }
    }
  }

  /**
   * Changes the current root of the view.
   */
  execute() {
    const tmp = this.view.currentRoot;
    this.view.currentRoot = this.previous;
    this.previous = tmp;

    const translate = this.view.graph.getTranslateForRoot(
      this.view.currentRoot
    );

    if (translate) {
      this.view.translate = new mxPoint(-translate.x, -translate.y);
    }

    if (this.isUp) {
      this.view.clear(this.view.currentRoot, true, true);
      this.view.validate(null);
    } else {
      this.view.refresh();
    }

    const name = this.isUp ? mxEvent.UP : mxEvent.DOWN;

    this.view.fireEvent(
      new mxEventObject(
        name,
        'root',
        this.view.currentRoot,
        'previous',
        this.previous
      )
    );

    this.isUp = !this.isUp;
  }
}

export default mxCurrentRootChange;
