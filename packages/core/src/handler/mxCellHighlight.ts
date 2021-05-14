/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import {
  DEFAULT_VALID_COLOR,
  DIALECT_SVG,
  HIGHLIGHT_OPACITY,
  HIGHLIGHT_STROKEWIDTH,
} from '../util/mxConstants';
import mxEvent from '../util/event/mxEvent';
import mxRectangle from '../util/datatypes/mxRectangle';
import mxCellState from '../view/cell/mxCellState';
import mxGraph from '../view/graph/mxGraph';
import mxShape from '../shape/mxShape';
import { ColorValue } from '../types';

/**
 * A helper class to highlight cells. Here is an example for a given cell.
 *
 * @example
 * ```javascript
 * var highlight = new mxCellHighlight(graph, '#ff0000', 2);
 * highlight.highlight(graph.view.getState(cell)));
 * ```
 */
class mxCellHighlight {
  constructor(
    graph: mxGraph,
    highlightColor: ColorValue = DEFAULT_VALID_COLOR,
    strokeWidth = HIGHLIGHT_STROKEWIDTH,
    dashed = false
  ) {
    this.graph = graph;
    this.highlightColor = highlightColor;
    this.strokeWidth = strokeWidth;
    this.dashed = dashed;
    this.opacity = HIGHLIGHT_OPACITY;

    // Updates the marker if the graph changes
    this.repaintHandler = () => {
      // Updates reference to state
      if (this.state != null) {
        // @ts-ignore
        const tmp = this.graph.view.getState(this.state.cell);

        if (tmp == null) {
          this.hide();
        } else {
          this.state = tmp;
          this.repaint();
        }
      }
    };

    this.graph.getView().addListener(mxEvent.SCALE, this.repaintHandler);
    this.graph.getView().addListener(mxEvent.TRANSLATE, this.repaintHandler);
    this.graph
      .getView()
      .addListener(mxEvent.SCALE_AND_TRANSLATE, this.repaintHandler);
    this.graph.getModel().addListener(mxEvent.CHANGE, this.repaintHandler);

    // Hides the marker if the current root changes
    this.resetHandler = () => {
      this.hide();
    };

    this.graph.getView().addListener(mxEvent.DOWN, this.resetHandler);
    this.graph.getView().addListener(mxEvent.UP, this.resetHandler);
  }

  // TODO: Document me!!
  highlightColor: ColorValue = null;

  strokeWidth: number = 0;

  dashed = false;

  opacity = 100;

  repaintHandler: Function | null = null;

  shape: mxShape | null = null;

  /**
   * Specifies if the highlights should appear on top of everything else in the overlay pane.
   * @default false
   */
  keepOnTop = false;

  /**
   * Reference to the enclosing {@link mxGraph}.
   * @default true
   */
  graph: mxGraph;

  /**
   * Reference to the {@link mxCellState}.
   * @default null
   */
  state: mxCellState | null = null;

  /**
   * Specifies the spacing between the highlight for vertices and the vertex.
   * @default 2
   */
  spacing = 2;

  /**
   * Holds the handler that automatically invokes reset if the highlight should be hidden.
   * @default null
   */
  resetHandler: Function | null = null;

  /**
   * Sets the color of the rectangle used to highlight drop targets.
   *
   * @param {string} color - String that represents the new highlight color.
   */
  setHighlightColor(color: ColorValue) {
    this.highlightColor = color;

    if (this.shape) {
      this.shape.stroke = color;
    }
  }

  /**
   * Creates and returns the highlight shape for the given state.
   */
  drawHighlight() {
    this.shape = this.createShape();
    this.repaint();

    const node = this.shape?.node;
    if (
      !this.keepOnTop &&
      this.shape.node?.parentNode?.firstChild !== this.shape.node
    ) {
      this.shape.node.parentNode.insertBefore(
        this.shape.node,
        this.shape.node.parentNode.firstChild
      );
    }
  }

  /**
   * Creates and returns the highlight shape for the given state.
   */
  createShape() {
    const shape = <mxShape>(
      this.graph.cellRenderer.createShape(<mxCellState>this.state)
    );

    shape.svgStrokeTolerance = (<mxGraph>this.graph).tolerance;
    shape.points = (<mxCellState>this.state).absolutePoints;
    shape.apply(<mxCellState>this.state);
    shape.stroke = this.highlightColor;
    shape.opacity = this.opacity;
    shape.isDashed = this.dashed;
    shape.isShadow = false;

    shape.dialect = DIALECT_SVG;
    shape.init((<mxGraph>this.graph).getView().getOverlayPane());
    mxEvent.redirectMouseEvents(shape.node, this.graph, this.state);

    if ((<mxGraph>this.graph).dialect !== DIALECT_SVG) {
      shape.pointerEvents = false;
    } else {
      shape.svgPointerEvents = 'stroke';
    }

    return shape;
  }

  /**
   * Updates the highlight after a change of the model or view.
   */
  // getStrokeWidth(state: mxCellState): number;
  getStrokeWidth(state: mxCellState | null = null): number | null {
    return this.strokeWidth;
  }

  /**
   * Updates the highlight after a change of the model or view.
   */
  // repaint(): void;
  repaint(): void {
    if (this.state != null && this.shape != null) {
      this.shape.scale = this.state.view.scale;

      // @ts-ignore
      if (this.graph.model.isEdge(this.state.cell)) {
        this.shape.strokewidth = this.getStrokeWidth();
        this.shape.points = this.state.absolutePoints;
        this.shape.outline = false;
      } else {
        this.shape.bounds = new mxRectangle(
          this.state.x - this.spacing,
          this.state.y - this.spacing,
          this.state.width + 2 * this.spacing,
          this.state.height + 2 * this.spacing
        );
        this.shape.rotation = Number(this.state.style.rotation || '0');
        this.shape.strokewidth =
          <number>this.getStrokeWidth() / this.state.view.scale;
        this.shape.outline = true;
      }

      // Uses cursor from shape in highlight
      if (this.state.shape != null) {
        this.shape.setCursor(this.state.shape.getCursor());
      }

      this.shape.redraw();
    }
  }

  /**
   * Resets the state of the cell marker.
   */
  // hide(): void;
  hide(): void {
    this.highlight(null);
  }

  /**
   * Marks the <markedState> and fires a <mark> event.
   */
  // highlight(state: mxCellState): void;
  highlight(state: mxCellState | null = null): void {
    if (this.state !== state) {
      if (this.shape != null) {
        this.shape.destroy();
        this.shape = null;
      }

      this.state = state;
      if (this.state != null) {
        this.drawHighlight();
      }
    }
  }

  /**
   * Returns true if this highlight is at the given position.
   */
  // isHighlightAt(x: number, y: number): boolean;
  isHighlightAt(x: number, y: number): boolean {
    let hit = false;
    if (this.shape != null && document.elementFromPoint != null) {
      let elt: (Node & ParentNode) | null = document.elementFromPoint(x, y);

      while (elt != null) {
        if (elt === this.shape.node) {
          hit = true;
          break;
        }
        elt = elt.parentNode;
      }
    }
    return hit;
  }

  /**
   * Destroys the handler and all its resources and DOM nodes.
   */
  // destroy(): void;
  destroy(): void {
    const graph = <mxGraph>this.graph;
    graph.getView().removeListener(this.resetHandler);
    graph.getView().removeListener(this.repaintHandler);
    graph.getModel().removeListener(this.repaintHandler);

    if (this.shape != null) {
      this.shape.destroy();
      this.shape = null;
    }
  }
}

export default mxCellHighlight;
