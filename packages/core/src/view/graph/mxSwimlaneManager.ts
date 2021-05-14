/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxEventSource from '../../util/event/mxEventSource';
import { getValue } from '../../util/mxUtils';
import mxEvent from '../../util/event/mxEvent';
import mxRectangle from '../../util/datatypes/mxRectangle';
import mxGraph from './mxGraph';
import mxEventObject from '../../util/event/mxEventObject';
import mxCell from '../cell/mxCell';
import mxGeometry from '../../util/datatypes/mxGeometry';

/**
 * @class mxSwimlaneManager
 * @extends mxEventSource
 *
 * Manager for swimlanes and nested swimlanes that sets the size of newly added
 * swimlanes to that of their siblings, and propagates changes to the size of a
 * swimlane to its siblings, if {@link siblings} is true, and its ancestors, if
 * {@link bubbling} is true.
 */
class mxSwimlaneManager extends mxEventSource {
  constructor(
    graph: mxGraph,
    horizontal: boolean = true,
    addEnabled: boolean = true,
    resizeEnabled: boolean = true
  ) {
    super();

    this.horizontal = horizontal;
    this.addEnabled = addEnabled;
    this.resizeEnabled = resizeEnabled;

    this.addHandler = (sender: any, evt: mxEventObject) => {
      if (this.isEnabled() && this.isAddEnabled()) {
        this.cellsAdded(evt.getProperty('cells'));
      }
    };

    this.resizeHandler = (sender: any, evt: mxEventObject) => {
      if (this.isEnabled() && this.isResizeEnabled()) {
        this.cellsResized(evt.getProperty('cells'));
      }
    };

    this.setGraph(graph);
  }

  /**
   * Reference to the enclosing {@link mxGraph}.
   */
  // graph: mxGraph;
  graph: mxGraph | null = null;

  /**
   * Specifies if event handling is enabled.
   * @default true
   */
  // enabled: boolean;
  enabled: boolean = true;

  /**
   * Specifies the orientation of the swimlanes.
   * @default true
   */
  // horizontal: boolean;
  horizontal: boolean = true;

  /**
   * Specifies if newly added cells should be resized to match the size of their
   * existing siblings.
   * @default true
   */
  // addEnabled: boolean;
  addEnabled: boolean = true;

  /**
   * Specifies if resizing of swimlanes should be handled.
   * @default true
   */
  // resizeEnabled: boolean;
  resizeEnabled: boolean = true;

  /**
   * Holds the function that handles the move event.
   */
  // addHandler: Function;
  addHandler: Function | null = null;

  /**
   * Holds the function that handles the move event.
   */
  // resizeHandler: Function;
  resizeHandler: Function | null = null;

  /**
   * Returns true if events are handled. This implementation
   * returns {@link enabled}.
   */
  // isEnabled(): boolean;
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enables or disables event handling. This implementation
   * updates {@link enabled}.
   *
   * @param enabled Boolean that specifies the new enabled state.
   */
  // setEnabled(value: boolean): void;
  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  /**
   * Returns {@link horizontal}.
   */
  // isHorizontal(): boolean;
  isHorizontal(): boolean {
    return this.horizontal;
  }

  /**
   * Sets {@link horizontal}.
   */
  // setHorizontal(value: boolean): void;
  setHorizontal(value: boolean): void {
    this.horizontal = value;
  }

  /**
   * Returns {@link addEnabled}.
   */
  // isAddEnabled(): boolean;
  isAddEnabled(): boolean {
    return this.addEnabled;
  }

  /**
   * Sets {@link addEnabled}.
   */
  // setAddEnabled(value: boolean): void;
  setAddEnabled(value: boolean): void {
    this.addEnabled = value;
  }

  /**
   * Returns {@link resizeEnabled}.
   */
  // isResizeEnabled(): boolean;
  isResizeEnabled(): boolean {
    return this.resizeEnabled;
  }

  /**
   * Sets {@link resizeEnabled}.
   */
  // setResizeEnabled(value: boolean): void;
  setResizeEnabled(value: boolean): void {
    this.resizeEnabled = value;
  }

  /**
   * Returns the graph that this manager operates on.
   */
  // getGraph(): mxGraph;
  getGraph(): mxGraph | null {
    return this.graph;
  }

  /**
   * Sets the graph that the manager operates on.
   */
  // setGraph(graph: mxGraph): void;
  setGraph(graph: mxGraph | null): void {
    if (this.graph != null) {
      this.graph.removeListener(this.addHandler);
      this.graph.removeListener(this.resizeHandler);
    }

    this.graph = graph;

    if (this.graph != null) {
      this.graph.addListener(mxEvent.ADD_CELLS, this.addHandler);
      this.graph.addListener(mxEvent.CELLS_RESIZED, this.resizeHandler);
    }
  }

  /**
   * Returns true if the given swimlane should be ignored.
   */
  // isSwimlaneIgnored(swimlane: mxCell): boolean;
  isSwimlaneIgnored(swimlane: mxCell): boolean {
    return !(<mxGraph>this.getGraph()).isSwimlane(swimlane);
  }

  /**
   * Returns true if the given cell is horizontal. If the given cell is not a
   * swimlane, then the global orientation is returned.
   */
  // isCellHorizontal(cell: mxCell): boolean;
  isCellHorizontal(cell: mxCell): boolean {
    if ((<mxGraph>this.graph).isSwimlane(cell)) {
      const style = (<mxGraph>this.graph).getCellStyle(cell);
      return getValue(style, 'horizontal', 1) == 1;
    }
    return !this.isHorizontal();
  }

  /**
   * Called if any cells have been added.
   *
   * @param cell Array of {@link mxCell} that have been added.
   */
  // cellsAdded(cells: Array<mxCell>): void;
  cellsAdded(cells: mxCell[]): void {
    if (cells != null) {
      const model = (<mxGraph>this.graph).getModel();

      model.beginUpdate();
      try {
        for (const cell of cells) {
          if (!this.isSwimlaneIgnored(cell)) {
            this.swimlaneAdded(cell);
          }
        }
      } finally {
        model.endUpdate();
      }
    }
  }

  /**
   * Updates the size of the given swimlane to match that of any existing
   * siblings swimlanes.
   *
   * @param swimlane {@link mxCell} that represents the new swimlane.
   */
  // swimlaneAdded(swimlane: mxCell): void;
  swimlaneAdded(swimlane: mxCell): void {
    const parent = <mxCell>swimlane.getParent();
    const childCount = parent.getChildCount();
    let geo = null;

    // Finds the first valid sibling swimlane as reference
    for (let i = 0; i < childCount; i += 1) {
      const child = <mxCell>parent.getChildAt(i);

      if (child !== swimlane && !this.isSwimlaneIgnored(child)) {
        geo = child.getGeometry();
        if (geo != null) {
          break;
        }
      }
    }

    // Applies the size of the refernece to the newly added swimlane
    if (geo != null) {
      const parentHorizontal =
        parent != null ? this.isCellHorizontal(parent) : this.horizontal;
      this.resizeSwimlane(swimlane, geo.width, geo.height, parentHorizontal);
    }
  }

  /**
   * Called if any cells have been resizes. Calls {@link swimlaneResized} for all
   * swimlanes where {@link isSwimlaneIgnored} returns false.
   *
   * @param cells Array of {@link mxCell} whose size was changed.
   */
  // cellsResized(cells: Array<mxCell>): void;
  cellsResized(cells: mxCell[] | null): void {
    if (cells != null) {
      const model = (<mxGraph>this.getGraph()).getModel();

      model.beginUpdate();
      try {
        // Finds the top-level swimlanes and adds offsets
        for (const cell of cells) {
          if (!this.isSwimlaneIgnored(cell)) {
            const geo = cell.getGeometry();

            if (geo != null) {
              const size = new mxRectangle(0, 0, geo.width, geo.height);
              let top = cell;
              let current = top;

              while (current != null) {
                top = current;
                current = <mxCell>current.getParent();
                const tmp = (<mxGraph>this.graph).isSwimlane(current)
                  ? (<mxGraph>this.graph).getStartSize(current)
                  : new mxRectangle();
                size.width += tmp.width;
                size.height += tmp.height;
              }

              const parentHorizontal =
                current != null
                  ? this.isCellHorizontal(current)
                  : this.horizontal;
              this.resizeSwimlane(
                top,
                size.width,
                size.height,
                parentHorizontal
              );
            }
          }
        }
      } finally {
        model.endUpdate();
      }
    }
  }

  /**
   * Called from {@link cellsResized} for all swimlanes that are not ignored to update
   * the size of the siblings and the size of the parent swimlanes, recursively,
   * if {@link bubbling} is true.
   *
   * @param swimlane {@link mxCell} whose size has changed.
   */
  // resizeSwimlane(swimlane: mxCell, w: number, h: number, parentHorizontal: boolean): void;
  resizeSwimlane(
    swimlane: mxCell,
    w: number,
    h: number,
    parentHorizontal: boolean
  ): void {
    const model = (<mxGraph>this.graph).getModel();

    model.beginUpdate();
    try {
      const horizontal = this.isCellHorizontal(swimlane);

      if (!this.isSwimlaneIgnored(swimlane)) {
        let geo = <mxGeometry>swimlane.getGeometry();

        if (geo != null) {
          if (
            (parentHorizontal && geo.height !== h) ||
            (!parentHorizontal && geo.width !== w)
          ) {
            geo = geo.clone();

            if (parentHorizontal) {
              geo.height = h;
            } else {
              geo.width = w;
            }

            model.setGeometry(swimlane, geo);
          }
        }
      }

      const tmp = (<mxGraph>this.graph).isSwimlane(swimlane)
        ? (<mxGraph>this.graph).getStartSize(swimlane)
        : new mxRectangle();
      w -= tmp.width;
      h -= tmp.height;

      const childCount = swimlane.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const child = <mxCell>swimlane.getChildAt(i);
        this.resizeSwimlane(child, w, h, horizontal);
      }
    } finally {
      model.endUpdate();
    }
  }

  /**
   * Removes all handlers from the {@link graph} and deletes the reference to it.
   */
  // destroy(): void;
  destroy(): void {
    this.setGraph(null);
  }
}

export default mxSwimlaneManager;
