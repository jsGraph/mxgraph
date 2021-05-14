/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxPoint from '../../util/datatypes/mxPoint';
import mxRectangle from '../../util/datatypes/mxRectangle';
import mxDictionary from '../../util/datatypes/mxDictionary';
import mxEventSource from '../../util/event/mxEventSource';
import mxEventObject from '../../util/event/mxEventObject';
import mxRectangleShape from '../../shape/node/mxRectangleShape';
import {
  ALIGN_BOTTOM,
  ALIGN_CENTER,
  ALIGN_LEFT,
  ALIGN_MIDDLE,
  ALIGN_RIGHT,
  ALIGN_TOP,
} from '../../util/mxConstants';
import mxClient from '../../mxClient';
import mxEvent from '../../util/event/mxEvent';
import {
  convertPoint,
  getCurrentStyle,
  getOffset,
  getRotatedPoint,
  getValue,
  ptSegDistSq,
  relativeCcw,
  toRadians,
} from '../../util/mxUtils';
import mxLog from '../../util/gui/mxLog';
import mxResources from '../../util/mxResources';
import mxCellState from '../cell/mxCellState';
import mxUndoableEdit from '../../util/undo/mxUndoableEdit';
import mxImageShape from '../../shape/node/mxImageShape';
import mxMouseEvent from '../../util/event/mxMouseEvent';
import mxStyleRegistry from '../../util/datatypes/style/mxStyleRegistry';
import mxGraph from './mxGraph';
import mxCell from '../cell/mxCell';
import mxImage from '../../util/image/mxImage';
import mxCurrentRootChange from '../../atomic_changes/mxCurrentRootChange';
import mxGraphModel from './mxGraphModel';
import mxShape from '../../shape/mxShape';
import mxGeometry from '../../util/datatypes/mxGeometry';
import mxConnectionConstraint from '../connection/mxConnectionConstraint';
import mxPopupMenuHandler from '../../handler/mxPopupMenuHandler';
import {
  getClientX,
  getClientY,
  getSource,
  isConsumed,
} from '../../util/mxEventUtils';
import { clone } from '../../util/mxCloneUtils';

/**
 * @class mxGraphView
 * @extends {mxEventSource}
 *
 * Extends {@link mxEventSource} to implement a view for a graph. This class is in
 * charge of computing the absolute coordinates for the relative child
 * geometries, the points for perimeters and edge styles and keeping them
 * cached in {@link mxCellStates} for faster retrieval. The states are updated
 * whenever the model or the view state (translate, scale) changes. The scale
 * and translate are honoured in the bounds.
 *
 * #### Event: mxEvent.UNDO
 *
 * Fires after the root was changed in {@link setCurrentRoot}. The `edit`
 * property contains the {@link mxUndoableEdit} which contains the
 * {@link mxCurrentRootChange}.
 *
 * #### Event: mxEvent.SCALE_AND_TRANSLATE
 *
 * Fires after the scale and translate have been changed in {@link scaleAndTranslate}.
 * The `scale`, `previousScale`, `translate`
 * and `previousTranslate` properties contain the new and previous
 * scale and translate, respectively.
 *
 * #### Event: mxEvent.SCALE
 *
 * Fires after the scale was changed in {@link setScale}. The `scale` and
 * `previousScale` properties contain the new and previous scale.
 *
 * #### Event: mxEvent.TRANSLATE
 *
 * Fires after the translate was changed in {@link setTranslate}. The
 * `translate` and `previousTranslate` properties contain
 * the new and previous value for translate.
 *
 * #### Event: mxEvent.DOWN and mxEvent.UP
 *
 * Fire if the current root is changed by executing an {@link mxCurrentRootChange}.
 * The event name depends on the location of the root in the cell hierarchy
 * with respect to the current root. The `root` and
 * `previous` properties contain the new and previous root,
 * respectively.
 */
class mxGraphView extends mxEventSource {
  constructor(graph: mxGraph) {
    super();

    this.graph = graph;
  }

  // TODO: Document me!
  backgroundImage: mxImageShape | null = null;

  backgroundPageShape: mxShape | null = null;

  EMPTY_POINT = new mxPoint();

  canvas: SVGElement | null = null;

  backgroundPane: SVGElement | null = null;

  drawPane: SVGElement | null = null;

  overlayPane: SVGElement | null = null;

  decoratorPane: SVGElement | null = null;

  /**
   * Specifies the resource key for the status message after a long operation.
   * If the resource for this key does not exist then the value is used as
   * the status message. Default is 'done'.
   */
  doneResource = mxClient.language !== 'none' ? 'done' : '';

  /**
   * Specifies the resource key for the status message while the document is
   * being updated. If the resource for this key does not exist then the
   * value is used as the status message. Default is 'updatingDocument'.
   */
  updatingDocumentResource =
    mxClient.language !== 'none' ? 'updatingDocument' : '';

  /**
   * Specifies if string values in cell styles should be evaluated using
   * {@link eval}. This will only be used if the string values can't be mapped
   * to objects using {@link mxStyleRegistry}. Default is false. NOTE: Enabling this
   * switch carries a possible security risk.
   */
  allowEval = false;

  /**
   * Specifies if a gesture should be captured when it goes outside of the
   * graph container. Default is true.
   */
  captureDocumentGesture = true;

  /**
   * Specifies if shapes should be created, updated and destroyed using the
   * methods of {@link mxCellRenderer} in {@link graph}. Default is true.
   */
  rendering = true;

  /**
   * Reference to the enclosing {@link mxGraph}.
   */
  graph: mxGraph;

  /**
   * {@link mxCell} that acts as the root of the displayed cell hierarchy.
   */
  currentRoot: mxCell | null = null;

  graphBounds = new mxRectangle();

  scale = 1;

  /**
   * {@link mxPoint} that specifies the current translation. Default is a new
   * empty {@link mxPoint}.
   */
  translate = new mxPoint();

  states = new mxDictionary<mxCellState>();

  /**
   * Specifies if the style should be updated in each validation step. If this
   * is false then the style is only updated if the state is created or if the
   * style of the cell was changed. Default is false.
   */
  updateStyle = false;

  /**
   * During validation, this contains the last DOM node that was processed.
   */
  lastNode: HTMLElement | SVGElement | null = null;

  /**
   * During validation, this contains the last HTML DOM node that was processed.
   */
  lastHtmlNode: HTMLElement | SVGElement | null = null;

  /**
   * During validation, this contains the last edge's DOM node that was processed.
   */
  lastForegroundNode: HTMLElement | SVGElement | null = null;

  /**
   * During validation, this contains the last edge HTML DOM node that was processed.
   */
  lastForegroundHtmlNode: HTMLElement | SVGElement | null = null;

  /**
   * Returns {@link graphBounds}.
   */
  getGraphBounds() {
    return this.graphBounds;
  }

  /**
   * Sets {@link graphBounds}.
   */
  setGraphBounds(value: mxRectangle) {
    this.graphBounds = value;
  }

  /**
   * Returns the {@link scale}.
   */
  getScale() {
    return this.scale;
  }

  /**
   * Sets the scale and fires a {@link scale} event before calling {@link revalidate} followed
   * by {@link mxGraph.sizeDidChange}.
   *
   * @param value Decimal value that specifies the new scale (1 is 100%).
   */
  setScale(value: number) {
    const previousScale: number = this.scale;
    if (previousScale !== value) {
      this.scale = value;
      if (this.isEventsEnabled()) {
        this.viewStateChanged();
      }
    }
    this.fireEvent(
      new mxEventObject(
        mxEvent.SCALE,
        'scale',
        value,
        'previousScale',
        previousScale
      )
    );
  }

  /**
   * Returns the {@link translate}.
   */
  getTranslate() {
    return this.translate;
  }

  /**
   * Sets the translation and fires a {@link translate} event before calling
   * {@link revalidate} followed by {@link mxGraph.sizeDidChange}. The translation is the
   * negative of the origin.
   *
   * @param dx X-coordinate of the translation.
   * @param dy Y-coordinate of the translation.
   */
  setTranslate(dx: number, dy: number) {
    const previousTranslate = new mxPoint(this.translate.x, this.translate.y);

    if (this.translate.x !== dx || this.translate.y !== dy) {
      this.translate.x = dx;
      this.translate.y = dy;

      if (this.isEventsEnabled()) {
        this.viewStateChanged();
      }
    }

    this.fireEvent(
      new mxEventObject(
        mxEvent.TRANSLATE,
        'translate',
        this.translate,
        'previousTranslate',
        previousTranslate
      )
    );
  }

  isRendering() {
    return this.rendering;
  }

  setRendering(value: boolean) {
    this.rendering = value;
  }

  isAllowEval() {
    return this.allowEval;
  }

  setAllowEval(value: boolean) {
    this.allowEval = value;
  }

  /**
   * Returns {@link states}.
   */
  // getStates(): mxDictionary<mxCellState>;
  getStates() {
    return this.states;
  }

  /**
   * Sets {@link states}.
   */
  // setStates(value: mxDictionary<mxCellState>): void;
  setStates(value: mxDictionary): void {
    this.states = value;
  }

  /**
   * Returns the DOM node that contains the background-, draw- and
   * overlay- and decoratorpanes.
   */
  // getCanvas(): SVGElement;
  getCanvas(): SVGElement | null {
    return this.canvas;
  }

  /**
   * Returns the DOM node that represents the background layer.
   */
  // getBackgroundPane(): Element;
  getBackgroundPane(): SVGElement | null {
    return this.backgroundPane;
  }

  /**
   * Returns the DOM node that represents the main drawing layer.
   */
  // getDrawPane(): Element;
  getDrawPane(): SVGElement | null {
    return this.drawPane;
  }

  /**
   * Returns the DOM node that represents the layer above the drawing layer.
   */
  // getOverlayPane(): Element;
  getOverlayPane(): SVGElement | null {
    return this.overlayPane;
  }

  /**
   * Returns the DOM node that represents the topmost drawing layer.
   */
  // getDecoratorPane(): Element;
  getDecoratorPane(): SVGElement | null {
    return this.decoratorPane;
  }

  /**
   * Returns the union of all {@link mxCellStates} for the given array of {@link mxCell}.
   *
   * @param cells Array of {@link mxCell} whose bounds should be returned.
   */
  // getBounds(cells: mxCell[]): mxRectangle;
  getBounds(cells: mxCell[]): mxRectangle | null {
    let result = null;

    if (cells != null && cells.length > 0) {
      for (let i = 0; i < cells.length; i += 1) {
        if (cells[i].isVertex() || cells[i].isEdge()) {
          const state = this.getState(cells[i]);

          if (state != null) {
            if (result == null) {
              result = mxRectangle.fromRectangle(state);
            } else {
              result.add(state);
            }
          }
        }
      }
    }
    return result;
  }

  /**
   * Sets and returns the current root and fires an {@link undo} event before
   * calling {@link mxGraph.sizeDidChange}.
   *
   * @param root {@link mxCell} that specifies the root of the displayed cell hierarchy.
   */
  // setCurrentRoot(root: mxCell): mxCell;
  setCurrentRoot(root: mxCell | null): mxCell | null {
    if (this.currentRoot != root) {
      const change = new mxCurrentRootChange(this, <mxCell>root);
      change.execute();

      const edit = new mxUndoableEdit(this, true);
      edit.add(change);

      this.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', edit));
      (<mxGraph>this.graph).sizeDidChange();

      this.currentRoot = root;
    }
    return root;
  }

  /**
   * Sets the scale and translation and fires a {@link scale} and {@link translate} event
   * before calling {@link revalidate} followed by {@link mxGraph.sizeDidChange}.
   *
   * @param scale Decimal value that specifies the new scale (1 is 100%).
   * @param dx X-coordinate of the translation.
   * @param dy Y-coordinate of the translation.
   */
  // scaleAndTranslate(scale: number, dx: number, dy: number): void;
  scaleAndTranslate(scale: number, dx: number, dy: number): void {
    const previousScale = this.scale;
    const previousTranslate = new mxPoint(this.translate.x, this.translate.y);

    if (
      this.scale != scale ||
      this.translate.x != dx ||
      this.translate.y != dy
    ) {
      this.scale = scale;

      this.translate.x = dx;
      this.translate.y = dy;

      if (this.isEventsEnabled()) {
        this.viewStateChanged();
      }
    }

    this.fireEvent(
      new mxEventObject(
        mxEvent.SCALE_AND_TRANSLATE,
        'scale',
        scale,
        'previousScale',
        previousScale,
        'translate',
        this.translate,
        'previousTranslate',
        previousTranslate
      )
    );
  }

  /**
   * Invoked after {@link scale} and/or {@link translate} has changed.
   */
  // viewStateChanged(): void;
  viewStateChanged() {
    this.revalidate();
    (<mxGraph>this.graph).sizeDidChange();
  }

  /**
   * Clears the view if {@link currentRoot} is not null and revalidates.
   */
  // refresh(): void;
  refresh() {
    if (this.currentRoot != null) {
      this.clear();
    }
    this.revalidate();
  }

  /**
   * Revalidates the complete view with all cell states.
   */
  // revalidate(): void;
  revalidate() {
    this.invalidate();
    this.validate();
  }

  /**
   * Removes the state of the given cell and all descendants if the given
   * cell is not the current root.
   *
   * @param cell Optional {@link mxCell} for which the state should be removed. Default
   * is the root of the model.
   * @param force Boolean indicating if the current root should be ignored for
   * recursion.
   */
  // clear(cell: mxCell, force?: boolean, recurse?: boolean): void;
  clear(cell?: mxCell | null, force: boolean = false, recurse: boolean = true) {
    if (!cell) {
      cell = this.graph.getModel().getRoot();
    }

    if (cell) {
      this.removeState(cell);

      if (recurse && (force || cell !== this.currentRoot)) {
        const childCount: number = cell.getChildCount();

        for (let i = 0; i < childCount; i += 1) {
          this.clear(cell.getChildAt(i), force);
        }
      } else {
        this.invalidate(cell);
      }
    }
  }

  /**
   * Invalidates the state of the given cell, all its descendants and
   * connected edges.
   *
   * @param cell Optional {@link mxCell} to be invalidated. Default is the root of the
   * model.
   */
  // invalidate(cell: mxCell, recurse: boolean, includeEdges: boolean): void;
  invalidate(
    cell: mxCell | null = null,
    recurse: boolean = true,
    includeEdges: boolean = true
  ) {
    const model: mxGraphModel = (<mxGraph>this.graph).getModel();
    const state: mxCellState = <mxCellState>this.getState(cell);

    cell = <mxCell>(cell || model.getRoot());

    if (state != null) {
      state.invalid = true;
    }

    // Avoids infinite loops for invalid graphs
    if (!cell.invalidating) {
      cell.invalidating = true;

      // Recursively invalidates all descendants
      if (recurse) {
        const childCount = cell.getChildCount();

        for (let i = 0; i < childCount; i += 1) {
          const child = cell.getChildAt(i);
          this.invalidate(child, recurse, includeEdges);
        }
      }

      // Propagates invalidation to all connected edges
      if (includeEdges) {
        const edgeCount = cell.getEdgeCount();

        for (let i = 0; i < edgeCount; i += 1) {
          this.invalidate(cell.getEdgeAt(i), recurse, includeEdges);
        }
      }

      cell.invalidating = false;
    }
  }

  /**
   * Calls {@link validateCell} and {@link validateCellState} and updates the {@link graphBounds}
   * using {@link getBoundingBox}. Finally the background is validated using
   * {@link validateBackground}.
   *
   * @param cell Optional {@link mxCell} to be used as the root of the validation.
   * Default is {@link currentRoot} or the root of the model.
   */
  // validate(cell?: mxCell): void;
  validate(cell: mxCell | null = null) {
    const t0 = mxLog.enter('mxGraphView.validate');
    window.status =
      mxResources.get(this.updatingDocumentResource) ||
      this.updatingDocumentResource;

    this.resetValidationState();

    const graphBounds = this.getBoundingBox(
      this.validateCellState(
        <mxCell>(
          this.validateCell(
            <mxCell>(
              (cell ||
                (this.currentRoot != null
                  ? this.currentRoot
                  : (<mxGraph>this.graph).getModel().getRoot()))
            )
          )
        )
      )
    );

    this.setGraphBounds(
      graphBounds != null ? graphBounds : this.getEmptyBounds()
    );
    this.validateBackground();

    this.resetValidationState();

    window.status = mxResources.get(this.doneResource) || this.doneResource;
    mxLog.leave('mxGraphView.validate', t0);
  }

  /**
   * Returns the bounds for an empty graph. This returns a rectangle at
   * {@link translate} with the size of 0 x 0.
   */
  // getEmptyBounds(): mxRectangle;
  getEmptyBounds() {
    return new mxRectangle(
      this.translate.x * this.scale,
      this.translate.y * this.scale
    );
  }

  /**
   * Returns the bounding box of the shape and the label for the given
   * {@link mxCellState} and its children if recurse is true.
   *
   * @param state {@link mxCellState} whose bounding box should be returned.
   * @param recurse Optional boolean indicating if the children should be included.
   * Default is true.
   */
  // getBoundingBox(state: mxCellState, recurse: boolean): mxRectangle;
  getBoundingBox(
    state: mxCellState | null = null,
    recurse: boolean = true
  ): mxRectangle | null {
    let bbox = null;

    if (state != null) {
      if (state.shape != null && state.shape.boundingBox != null) {
        bbox = state.shape.boundingBox.clone();
      }

      // Adds label bounding box to graph bounds
      if (state.text != null && state.text.boundingBox != null) {
        if (bbox != null) {
          bbox.add(state.text.boundingBox);
        } else {
          bbox = state.text.boundingBox.clone();
        }
      }

      if (recurse) {
        const model = (<mxGraph>this.graph).getModel();
        const childCount = state.cell.getChildCount();

        for (let i = 0; i < childCount; i += 1) {
          const bounds = this.getBoundingBox(
            this.getState(state.cell.getChildAt(i))
          );

          if (bounds != null) {
            if (bbox == null) {
              bbox = bounds;
            } else {
              bbox.add(bounds);
            }
          }
        }
      }
    }
    return bbox;
  }

  /**
   * Creates and returns the shape used as the background page.
   *
   * @param bounds {@link mxRectangle} that represents the bounds of the shape.
   */
  // createBackgroundPageShape(bounds: mxRectangle): mxRectangleShape;
  createBackgroundPageShape(bounds: mxRectangle): mxRectangleShape {
    return new mxRectangleShape(bounds, 'white', 'black');
  }

  /**
   * Calls {@link validateBackgroundImage} and {@link validateBackgroundPage}.
   */
  // validateBackground(): void;
  validateBackground() {
    this.validateBackgroundImage();
    this.validateBackgroundPage();
  }

  /**
   * Validates the background image.
   */
  // validateBackgroundImage(): void;
  validateBackgroundImage() {
    const bg = (<mxGraph>this.graph).getBackgroundImage();

    if (bg != null) {
      if (
        this.backgroundImage == null ||
        this.backgroundImage.image !== bg.src
      ) {
        if (this.backgroundImage != null) {
          this.backgroundImage.destroy();
        }

        const bounds = new mxRectangle(0, 0, 1, 1);

        this.backgroundImage = new mxImageShape(bounds, bg.src);
        this.backgroundImage.dialect = (<mxGraph>this.graph).dialect;
        this.backgroundImage.init(this.backgroundPane);
        this.backgroundImage.redraw();
      }

      this.redrawBackgroundImage(this.backgroundImage, bg);
    } else if (this.backgroundImage != null) {
      this.backgroundImage.destroy();
      this.backgroundImage = null;
    }
  }

  /**
   * Validates the background page.
   */
  // validateBackgroundPage(): void;
  validateBackgroundPage(): void {
    const graph = <mxGraph>this.graph;

    if (graph.pageVisible) {
      const bounds = this.getBackgroundPageBounds();

      if (this.backgroundPageShape == null) {
        this.backgroundPageShape = this.createBackgroundPageShape(bounds);
        this.backgroundPageShape.scale = this.scale;
        this.backgroundPageShape.isShadow = true;
        this.backgroundPageShape.dialect = (<mxGraph>this.graph).dialect;
        this.backgroundPageShape.init(this.backgroundPane);
        this.backgroundPageShape.redraw();

        if (this.backgroundPageShape.node) {
          // Adds listener for double click handling on background
          if (graph.nativeDblClickEnabled) {
            mxEvent.addListener(this.backgroundPageShape.node, 'dblclick', ((
              evt: MouseEvent
            ) => {
              graph.dblClick(evt);
            }) as EventListener);
          }

          // Adds basic listeners for graph event dispatching outside of the
          // container and finishing the handling of a single gesture
          mxEvent.addGestureListeners(
            this.backgroundPageShape.node,
            (evt: Event) => {
              graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt));
            },
            (evt: Event) => {
              // Hides the tooltip if mouse is outside container
              if (
                graph.tooltipHandler != null &&
                graph.tooltipHandler.isHideOnHover()
              ) {
                graph.tooltipHandler.hide();
              }

              if (graph.isMouseDown && !isConsumed(evt)) {
                graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt));
              }
            },
            (evt: Event) => {
              graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt));
            }
          );
        }
      } else {
        this.backgroundPageShape.scale = this.scale;
        this.backgroundPageShape.bounds = bounds;
        this.backgroundPageShape.redraw();
      }
    } else if (this.backgroundPageShape != null) {
      this.backgroundPageShape.destroy();
      this.backgroundPageShape = null;
    }
  }

  /**
   * Returns the bounds for the background page.
   */
  // getBackgroundPageBounds(): mxRectangle;
  getBackgroundPageBounds(): mxRectangle {
    const fmt = (<mxGraph>this.graph).pageFormat;
    const ps = this.scale * (<mxGraph>this.graph).pageScale;

    return new mxRectangle(
      this.scale * this.translate.x,
      this.scale * this.translate.y,
      fmt.width * ps,
      fmt.height * ps
    );
  }

  /**
   * Updates the bounds and redraws the background image.
   *
   * Example:
   *
   * If the background image should not be scaled, this can be replaced with
   * the following.
   *
   * @example
   * ```javascript
   * redrawBackground(backgroundImage, bg)
   * {
   *   backgroundImage.bounds.x = this.translate.x;
   *   backgroundImage.bounds.y = this.translate.y;
   *   backgroundImage.bounds.width = bg.width;
   *   backgroundImage.bounds.height = bg.height;
   *
   *   backgroundImage.redraw();
   * };
   * ```
   *
   * @param backgroundImage {@link mxImageShape} that represents the background image.
   * @param bg {@link mxImage} that specifies the image and its dimensions.
   */
  // redrawBackgroundImage(backgroundImage: mxImageShape, bg: mxImage): void;
  redrawBackgroundImage(backgroundImage: mxImageShape, bg: mxImage): void {
    backgroundImage.scale = this.scale;
    const bounds = <mxRectangle>backgroundImage.bounds;
    bounds.x = this.scale * this.translate.x;
    bounds.y = this.scale * this.translate.y;
    bounds.width = this.scale * bg.width;
    bounds.height = this.scale * bg.height;
    backgroundImage.redraw();
  }

  /**
   * Recursively creates the cell state for the given cell if visible is true and
   * the given cell is visible. If the cell is not visible but the state exists
   * then it is removed using {@link removeState}.
   *
   * @param cell {@link mxCell} whose {@link mxCellState} should be created.
   * @param visible Optional boolean indicating if the cell should be visible. Default
   * is true.
   */
  // validateCell(cell: mxCell, visible?: boolean): void;
  validateCell(cell: mxCell, visible: boolean = true): mxCell | null {
    visible = visible && cell.isVisible();
    const state = this.getState(cell, visible);

    if (state != null && !visible) {
      this.removeState(cell);
    } else {
      const model = (<mxGraph>this.graph).getModel();
      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        this.validateCell(
          <mxCell>cell.getChildAt(i),
          visible && (!cell.isCollapsed() || cell === this.currentRoot)
        );
      }
    }
    return cell;
  }

  /**
   * Validates and repaints the {@link mxCellState} for the given {@link mxCell}.
   *
   * @param cell {@link mxCell} whose {@link mxCellState} should be validated.
   * @param recurse Optional boolean indicating if the children of the cell should be
   * validated. Default is true.
   */
  // validateCellState(cell: mxCell, recurse?: boolean): void;
  validateCellState(cell: mxCell, recurse: boolean = true): mxCellState | null {
    let state: mxCellState | null = null;

    if (cell != null) {
      state = this.getState(cell);

      if (state != null) {
        const model = (<mxGraph>this.graph).getModel();

        if (state.invalid) {
          state.invalid = false;

          if (state.style == null || state.invalidStyle) {
            state.style = (<mxGraph>this.graph).getCellStyle(
              <mxCell>state.cell
            );
            state.invalidStyle = false;
          }

          if (cell !== this.currentRoot) {
            this.validateCellState(<mxCell>cell.getParent(), false);
          }

          state.setVisibleTerminalState(
            <mxCellState>(
              this.validateCellState(
                <mxCell>this.getVisibleTerminal(cell, true),
                false
              )
            ),
            true
          );
          state.setVisibleTerminalState(
            <mxCellState>(
              this.validateCellState(
                <mxCell>this.getVisibleTerminal(cell, false),
                false
              )
            ),
            false
          );

          this.updateCellState(state);

          // Repaint happens immediately after the cell is validated
          if (cell !== this.currentRoot && !state.invalid) {
            (<mxGraph>this.graph).cellRenderer.redraw(
              state,
              false,
              this.isRendering()
            );

            // Handles changes to invertex paintbounds after update of rendering shape
            state.updateCachedBounds();
          }
        }

        if (recurse && !state.invalid) {
          // Updates order in DOM if recursively traversing
          if (state.shape != null) {
            this.stateValidated(state);
          }

          const childCount = cell.getChildCount();
          for (let i = 0; i < childCount; i += 1) {
            this.validateCellState(<mxCell>cell.getChildAt(i));
          }
        }
      }
    }
    return state;
  }

  /**
   * Updates the given {@link mxCellState}.
   *
   * @param state {@link mxCellState} to be updated.
   */
  // updateCellState(state: mxCellState): void;
  updateCellState(state: mxCellState) {
    const absoluteOffset = <mxPoint>state.absoluteOffset;
    const origin = <mxPoint>state.origin;

    absoluteOffset.x = 0;
    absoluteOffset.y = 0;
    origin.x = 0;
    origin.y = 0;
    state.length = 0;

    if (state.cell !== this.currentRoot) {
      const model = (<mxGraph>this.graph).getModel();
      const pState = <mxCellState>this.getState(state.cell.getParent());

      if (pState != null && pState.cell !== this.currentRoot) {
        origin.x += (<mxPoint>pState.origin).x;
        origin.y += (<mxPoint>pState.origin).y;
      }

      let offset = (<mxGraph>this.graph).getChildOffsetForCell(
        <mxCell>state.cell
      );

      if (offset != null) {
        origin.x += offset.x;
        origin.y += offset.y;
      }

      const geo = (<mxCell>state.cell).getGeometry();

      if (geo != null) {
        if (!state.cell.isEdge()) {
          offset = <mxPoint>(
            (geo.offset != null ? geo.offset : this.EMPTY_POINT)
          );

          if (geo.relative && pState != null) {
            if (pState.cell.isEdge()) {
              const origin = this.getPoint(pState, geo);

              if (origin != null) {
                origin.x +=
                  origin.x / this.scale -
                  (<mxPoint>pState.origin).x -
                  this.translate.x;
                origin.y +=
                  origin.y / this.scale -
                  (<mxPoint>pState.origin).y -
                  this.translate.y;
              }
            } else {
              origin.x += geo.x * <number>pState.unscaledWidth + offset.x;
              origin.y += geo.y * <number>pState.unscaledHeight + offset.y;
            }
          } else {
            absoluteOffset.x = this.scale * offset.x;
            absoluteOffset.y = this.scale * offset.y;
            origin.x += geo.x;
            origin.y += geo.y;
          }
        }

        state.x = this.scale * (this.translate.x + origin.x);
        state.y = this.scale * (this.translate.y + origin.y);
        state.width = this.scale * geo.width;
        state.unscaledWidth = geo.width;
        state.height = this.scale * geo.height;
        state.unscaledHeight = geo.height;

        if (state.cell.isVertex()) {
          this.updateVertexState(state, geo);
        }

        if (state.cell.isEdge()) {
          this.updateEdgeState(state, geo);
        }
      }
    }

    state.updateCachedBounds();
  }

  /**
   * Returns true if the children of the given cell should not be visible in the
   * view. This implementation uses {@link mxCell.isCellVisible} but it can be
   * overidden to use a separate condition.
   */
  // isCellCollapsed(cell: mxCell): boolean;
  isCellCollapsed(cell: mxCell): boolean {
    // SLATED FOR DELETION
    return cell.isCollapsed();
  }

  /**
   * Validates the given cell state.
   */
  // updateVertexState(state: mxCellState, geo: mxGeometry): void;
  updateVertexState(state: mxCellState, geo: mxGeometry) {
    const model = (<mxGraph>this.graph).getModel();
    const pState = this.getState(state.cell.getParent());

    if (geo.relative && pState != null && !pState.cell.isEdge()) {
      const alpha = toRadians(pState.style.rotation || '0');

      if (alpha !== 0) {
        const cos = Math.cos(alpha);
        const sin = Math.sin(alpha);

        const ct = new mxPoint(state.getCenterX(), state.getCenterY());
        const cx = new mxPoint(pState.getCenterX(), pState.getCenterY());
        const pt = getRotatedPoint(ct, cos, sin, cx);
        state.x = pt.x - state.width / 2;
        state.y = pt.y - state.height / 2;
      }
    }
    this.updateVertexLabelOffset(state);
  }

  /**
   * Validates the given cell state.
   */
  // updateEdgeState(state: mxCellState, geo: mxGeometry): void;
  updateEdgeState(state: mxCellState, geo: mxGeometry) {
    const source = <mxCellState>state.getVisibleTerminalState(true);
    const target = <mxCellState>state.getVisibleTerminalState(false);

    // This will remove edges with no terminals and no terminal points
    // as such edges are invalid and produce NPEs in the edge styles.
    // Also removes connected edges that have no visible terminals.
    if (
      (state.cell.getTerminal(true) != null && source == null) ||
      (source == null && geo.getTerminalPoint(true) == null) ||
      (state.cell.getTerminal(false) != null && target == null) ||
      (target == null && geo.getTerminalPoint(false) == null)
    ) {
      this.clear(state.cell, true);
    } else {
      this.updateFixedTerminalPoints(state, source, target);
      this.updatePoints(state, geo.points, source, target);
      this.updateFloatingTerminalPoints(state, source, target);

      const pts = state.absolutePoints;

      if (
        state.cell !== this.currentRoot &&
        (pts == null ||
          pts.length < 2 ||
          pts[0] == null ||
          pts[pts.length - 1] == null)
      ) {
        // This will remove edges with invalid points from the list of states in the view.
        // Happens if the one of the terminals and the corresponding terminal point is null.
        this.clear(state.cell, true);
      } else {
        this.updateEdgeBounds(state);
        this.updateEdgeLabelOffset(state);
      }
    }
  }

  /**
   * Updates the absoluteOffset of the given vertex cell state. This takes
   * into account the label position styles.
   *
   * @param state {@link mxCellState} whose absolute offset should be updated.
   */
  // updateVertexLabelOffset(state: mxCellState): void;
  updateVertexLabelOffset(state: mxCellState) {
    const h = getValue(state.style, 'labelPosition', ALIGN_CENTER);

    if (h === ALIGN_LEFT) {
      let lw = getValue(state.style, 'labelWidth', null);

      if (lw != null) {
        lw *= this.scale;
      } else {
        lw = state.width;
      }

      // @ts-ignore
      state.absoluteOffset.x -= lw;
    } else if (h === ALIGN_RIGHT) {
      // @ts-ignore
      state.absoluteOffset.x += state.width;
    } else if (h === ALIGN_CENTER) {
      const lw = getValue(state.style, 'labelWidth', null);

      if (lw != null) {
        // Aligns text block with given width inside the vertex width
        const align = getValue(state.style, 'align', ALIGN_CENTER);
        let dx = 0;

        if (align === ALIGN_CENTER) {
          dx = 0.5;
        } else if (align === ALIGN_RIGHT) {
          dx = 1;
        }

        if (dx !== 0) {
          // @ts-ignore
          state.absoluteOffset.x -= (lw * this.scale - state.width) * dx;
        }
      }
    }

    const v = getValue(state.style, 'verticalLabelPosition', ALIGN_MIDDLE);

    if (v === ALIGN_TOP) {
      // @ts-ignore
      state.absoluteOffset.y -= state.height;
    } else if (v === ALIGN_BOTTOM) {
      // @ts-ignore
      state.absoluteOffset.y += state.height;
    }
  }

  /**
   * Resets the current validation state.
   */
  // resetValidationState(): void;
  resetValidationState(): void {
    this.lastNode = null;
    this.lastHtmlNode = null;
    this.lastForegroundNode = null;
    this.lastForegroundHtmlNode = null;
  }

  /**
   * Invoked when a state has been processed in {@link validatePoints}. This is used
   * to update the order of the DOM nodes of the shape.
   *
   * @param state {@link mxCellState} that represents the cell state.
   */
  // stateValidated(state: mxCellState): void;
  stateValidated(state: mxCellState): void {
    const graph = <mxGraph>this.graph;
    const fg =
      (state.cell.isEdge() && graph.keepEdgesInForeground) ||
      (state.cell.isVertex() && graph.keepEdgesInBackground);
    const htmlNode = fg
      ? this.lastForegroundHtmlNode || this.lastHtmlNode
      : this.lastHtmlNode;
    const node = fg ? this.lastForegroundNode || this.lastNode : this.lastNode;
    const result = graph.cellRenderer.insertStateAfter(state, node, htmlNode);

    if (fg) {
      this.lastForegroundHtmlNode = result[1];
      this.lastForegroundNode = result[0];
    } else {
      this.lastHtmlNode = result[1];
      this.lastNode = result[0];
    }
  }

  /**
   * Sets the initial absolute terminal points in the given state before the edge
   * style is computed.
   *
   * @param edge {@link mxCellState} whose initial terminal points should be updated.
   * @param source {@link mxCellState} which represents the source terminal.
   * @param target {@link mxCellState} which represents the target terminal.
   */
  // updateFixedTerminalPoints(edge: mxCellState, source: mxCellState, target: mxCellState): void;
  updateFixedTerminalPoints(
    edge: mxCellState,
    source: mxCellState,
    target: mxCellState
  ): void {
    this.updateFixedTerminalPoint(
      edge,
      source,
      true,
      (<mxGraph>this.graph).getConnectionConstraint(edge, source, true)
    );
    this.updateFixedTerminalPoint(
      edge,
      target,
      false,
      (<mxGraph>this.graph).getConnectionConstraint(edge, target, false)
    );
  }

  /**
   * Function: updateFixedTerminalPoint
   *
   * Sets the fixed source or target terminal point on the given edge.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose terminal point should be updated.
   * terminal - <mxCellState> which represents the actual terminal.
   * source - Boolean that specifies if the terminal is the source.
   * constraint - <mxConnectionConstraint> that specifies the connection.
   */
  updateFixedTerminalPoint(
    edge: mxCellState,
    terminal: mxCellState,
    source: boolean,
    constraint: mxConnectionConstraint
  ) {
    edge.setAbsoluteTerminalPoint(
      <mxPoint>this.getFixedTerminalPoint(edge, terminal, source, constraint),
      source
    );
  }

  /**
   * Function: getFixedTerminalPoint
   *
   * Returns the fixed source or target terminal point for the given edge.
   *
   * Parameters:
   *
   * edge - <mxCellState> whose terminal point should be returned.
   * terminal - <mxCellState> which represents the actual terminal.
   * source - Boolean that specifies if the terminal is the source.
   * constraint - <mxConnectionConstraint> that specifies the connection.
   */
  getFixedTerminalPoint(
    edge: mxCellState,
    terminal: mxCellState,
    source: boolean,
    constraint: mxConnectionConstraint
  ): mxPoint | null {
    let pt = null;

    if (constraint != null) {
      pt = (<mxGraph>this.graph).getConnectionPoint(
        terminal,
        constraint,
        false
      ); // FIXME Rounding introduced bugs when calculating label positions -> , this.graph.isOrthogonal(edge));
    }

    if (pt == null && terminal == null) {
      const s = this.scale;
      const tr = this.translate;
      const orig = <mxPoint>edge.origin;
      const geo = <mxGeometry>(<mxCell>edge.cell).getGeometry();
      pt = geo.getTerminalPoint(source);

      if (pt != null) {
        pt = new mxPoint(
          s * (tr.x + pt.x + orig.x),
          s * (tr.y + pt.y + orig.y)
        );
      }
    }

    return pt;
  }

  /**
   * Updates the bounds of the given cell state to reflect the bounds of the stencil
   * if it has a fixed aspect and returns the previous bounds as an {@link mxRectangle} if
   * the bounds have been modified or null otherwise.
   *
   * @param edge {@link mxCellState} whose bounds should be updated.
   */
  // updateBoundsFromStencil(state: mxCellState): mxRectangle;
  updateBoundsFromStencil(state: mxCellState) {
    let previous = null;

    if (
      state != null &&
      state.shape != null &&
      state.shape.stencil != null &&
      state.shape.stencil.aspect === 'fixed'
    ) {
      previous = mxRectangle.fromRectangle(state);
      const asp = state.shape.stencil.computeAspect(
        state.style,
        state.x,
        state.y,
        state.width,
        state.height
      );
      state.setRect(
        asp.x,
        asp.y,
        state.shape.stencil.w0 * asp.width,
        state.shape.stencil.h0 * asp.height
      );
    }

    return previous;
  }

  /**
   * Updates the absolute points in the given state using the specified array
   * of {@link mxPoints} as the relative points.
   *
   * @param edge {@link mxCellState} whose absolute points should be updated.
   * @param points Array of {@link mxPoints} that constitute the relative points.
   * @param source {@link mxCellState} that represents the source terminal.
   * @param target {@link mxCellState} that represents the target terminal.
   */
  // updatePoints(edge: mxCellState, points: mxPoint[], source: mxCellState, target: mxCellState): void;
  updatePoints(
    edge: mxCellState,
    points: mxPoint[],
    source: mxCellState,
    target: mxCellState
  ) {
    if (edge != null) {
      const pts = [];
      pts.push((<mxPoint[]>edge.absolutePoints)[0]);
      const edgeStyle = this.getEdgeStyle(edge, points, source, target);

      if (edgeStyle != null) {
        const src = <mxCellState>this.getTerminalPort(edge, source, true);
        const trg = <mxCellState>this.getTerminalPort(edge, target, false);

        // Uses the stencil bounds for routing and restores after routing
        const srcBounds = this.updateBoundsFromStencil(src);
        const trgBounds = this.updateBoundsFromStencil(trg);

        edgeStyle(edge, src, trg, points, pts);

        // Restores previous bounds
        if (srcBounds != null) {
          src.setRect(
            srcBounds.x,
            srcBounds.y,
            srcBounds.width,
            srcBounds.height
          );
        }

        if (trgBounds != null) {
          trg.setRect(
            trgBounds.x,
            trgBounds.y,
            trgBounds.width,
            trgBounds.height
          );
        }
      } else if (points != null) {
        for (let i = 0; i < points.length; i += 1) {
          if (points[i] != null) {
            const pt = clone(points[i]);
            pts.push(this.transformControlPoint(edge, pt));
          }
        }
      }

      const tmp = <mxPoint[]>edge.absolutePoints;
      pts.push(tmp[tmp.length - 1]);

      edge.absolutePoints = pts;
    }
  }

  /**
   * Transforms the given control point to an absolute point.
   */
  // transformControlPoint(state: mxCellState, pt: mxPoint): mxPoint;
  transformControlPoint(
    state: mxCellState,
    pt: mxPoint,
    ignoreScale: boolean = false
  ): mxPoint | null {
    if (state != null && pt != null) {
      const orig = <mxPoint>state.origin;
      const scale = ignoreScale ? 1 : this.scale;

      return new mxPoint(
        scale * (pt.x + this.translate.x + orig.x),
        scale * (pt.y + this.translate.y + orig.y)
      );
    }
    return null;
  }

  /**
   * Returns true if the given edge should be routed with {@link mxGraph.defaultLoopStyle}
   * or the {@link mxConstants.STYLE_LOOP} defined for the given edge. This implementation
   * returns true if the given edge is a loop and does not
   */
  // isLoopStyleEnabled(edge: mxCellState, points: mxPoint[], source: mxCellState, target: mxCellState): boolean;
  isLoopStyleEnabled(
    edge: mxCellState,
    points: mxPoint[] = [],
    source: mxCellState | null = null,
    target: mxCellState | null = null
  ): boolean {
    const sc = (<mxGraph>this.graph).getConnectionConstraint(
      edge,
      source,
      true
    );
    const tc = (<mxGraph>this.graph).getConnectionConstraint(
      edge,
      target,
      false
    );

    if (
      (points == null || points.length < 2) &&
      (!getValue(edge.style, 'orthogonalLoop', false) ||
        ((sc == null || sc.point == null) && (tc == null || tc.point == null)))
    ) {
      return source != null && source === target;
    }
    return false;
  }

  /**
   * Returns the edge style function to be used to render the given edge state.
   */
  // getEdgeStyle(edge: mxCellState, points: mxPoint[], source: mxCellState, target: mxCellState): any;
  getEdgeStyle(
    edge: mxCellState,
    points: mxPoint[] = [],
    source: mxCellState | null = null,
    target: mxCellState | null = null
  ): any {
    let edgeStyle: any = this.isLoopStyleEnabled(edge, points, source, target)
      ? getValue(edge.style, 'loop', (<mxGraph>this.graph).defaultLoopStyle)
      : !getValue(edge.style, 'noEdgeStyle', false)
      ? edge.style.edge
      : null;

    // Converts string values to objects
    if (typeof edgeStyle === 'string') {
      let tmp = mxStyleRegistry.getValue(edgeStyle);
      if (tmp == null && this.isAllowEval()) {
        tmp = eval(edgeStyle);
      }
      edgeStyle = tmp;
    }

    if (typeof edgeStyle === 'function') {
      return edgeStyle;
    }
    return null;
  }

  /**
   * Updates the terminal points in the given state after the edge style was
   * computed for the edge.
   *
   * @param state {@link mxCellState} whose terminal points should be updated.
   * @param source {@link mxCellState} that represents the source terminal.
   * @param target {@link mxCellState} that represents the target terminal.
   */
  // updateFloatingTerminalPoints(state: mxCellState, source: mxCellState, target: mxCellState): void;
  updateFloatingTerminalPoints(
    state: mxCellState,
    source: mxCellState,
    target: mxCellState
  ) {
    const pts = <mxPoint[]>state.absolutePoints;
    const p0 = pts[0];
    const pe = pts[pts.length - 1];

    if (pe == null && target != null) {
      this.updateFloatingTerminalPoint(state, target, source, false);
    }

    if (p0 == null && source != null) {
      this.updateFloatingTerminalPoint(state, source, target, true);
    }
  }

  /**
   * Updates the absolute terminal point in the given state for the given
   * start and end state, where start is the source if source is true.
   *
   * @param edge {@link mxCellState} whose terminal point should be updated.
   * @param start {@link mxCellState} for the terminal on "this" side of the edge.
   * @param end {@link mxCellState} for the terminal on the other side of the edge.
   * @param source Boolean indicating if start is the source terminal state.
   */
  // updateFloatingTerminalPoint(edge: mxCellState, start: mxCellState, end: mxCellState, source: boolean): void;
  updateFloatingTerminalPoint(
    edge: mxCellState,
    start: mxCellState,
    end: mxCellState,
    source: boolean
  ) {
    edge.setAbsoluteTerminalPoint(
      <mxPoint>this.getFloatingTerminalPoint(edge, start, end, source),
      source
    );
  }

  /**
   * Returns the floating terminal point for the given edge, start and end
   * state, where start is the source if source is true.
   *
   * @param edge {@link mxCellState} whose terminal point should be returned.
   * @param start {@link mxCellState} for the terminal on "this" side of the edge.
   * @param end {@link mxCellState} for the terminal on the other side of the edge.
   * @param source Boolean indicating if start is the source terminal state.
   */
  // getFloatingTerminalPoint(edge: mxCellState, start: mxCellState, end: mxCellState, source: boolean): mxPoint;
  getFloatingTerminalPoint(
    edge: mxCellState,
    start: mxCellState,
    end: mxCellState,
    source: boolean
  ): mxPoint | null {
    start = <mxCellState>this.getTerminalPort(edge, start, source);
    let next = this.getNextPoint(edge, end, source);

    const orth = (<mxGraph>this.graph).isOrthogonal(edge);
    const alpha = toRadians(Number(start.style.rotation || '0'));
    const center = new mxPoint(start.getCenterX(), start.getCenterY());

    if (alpha !== 0) {
      const cos = Math.cos(-alpha);
      const sin = Math.sin(-alpha);
      next = getRotatedPoint(next, cos, sin, center);
    }

    let border = parseFloat(edge.style.perimeterSpacing || 0);
    border += parseFloat(
      edge.style[
        source ? 'sourcePerimeterSpacing' : 'targetPerimeterSpacing'
      ] || 0
    );
    let pt = this.getPerimeterPoint(
      start,
      <mxPoint>next,
      alpha === 0 && orth,
      border
    );

    if (alpha !== 0) {
      const cos = Math.cos(alpha);
      const sin = Math.sin(alpha);
      pt = getRotatedPoint(pt, cos, sin, center);
    }

    return pt;
  }

  /**
   * Returns an {@link mxCellState} that represents the source or target terminal or
   * port for the given edge.
   *
   * @param state {@link mxCellState} that represents the state of the edge.
   * @param terminal {@link mxCellState} that represents the terminal.
   * @param source Boolean indicating if the given terminal is the source terminal.
   */
  // getTerminalPort(state: mxCellState, terminal: mxCellState, source: boolean): mxCellState;
  getTerminalPort(
    state: mxCellState,
    terminal: mxCellState,
    source: boolean = false
  ): mxCellState | null {
    const key = source ? 'sourcePort' : 'targetPort';
    const id = getValue(state.style, key);

    if (id != null) {
      const tmp = this.getState(
        (<mxGraph>this.graph).getModel().getCell(id),
        false
      );

      // Only uses ports where a cell state exists
      if (tmp != null) {
        terminal = tmp;
      }
    }
    return terminal;
  }

  /**
   * Returns an {@link mxPoint} that defines the location of the intersection point between
   * the perimeter and the line between the center of the shape and the given point.
   *
   * @param terminal {@link mxCellState} for the source or target terminal.
   * @param next {@link mxPoint} that lies outside of the given terminal.
   * @param orthogonal Boolean that specifies if the orthogonal projection onto
   * the perimeter should be returned. If this is false then the intersection
   * of the perimeter and the line between the next and the center point is
   * returned.
   * @param border Optional border between the perimeter and the shape.
   */
  // getPerimeterPoint(terminal: mxCellState, next: mxPoint, orthogonal: boolean, border: number): mxPoint;
  getPerimeterPoint(
    terminal: mxCellState,
    next: mxPoint,
    orthogonal: boolean,
    border: number = 0
  ) {
    let point = null;

    if (terminal != null) {
      const perimeter = this.getPerimeterFunction(terminal);

      if (perimeter != null && next != null) {
        const bounds = <mxRectangle>this.getPerimeterBounds(terminal, border);

        if (bounds.width > 0 || bounds.height > 0) {
          point = new mxPoint(next.x, next.y);
          let flipH = false;
          let flipV = false;

          if (terminal.cell.isVertex()) {
            flipH = getValue(terminal.style, 'flipH', 0) == 1;
            flipV = getValue(terminal.style, 'flipV', 0) == 1;

            // Legacy support for stencilFlipH/V
            if (terminal.shape != null && terminal.shape.stencil != null) {
              flipH = getValue(terminal.style, 'stencilFlipH', 0) == 1 || flipH;
              flipV = getValue(terminal.style, 'stencilFlipV', 0) == 1 || flipV;
            }

            if (flipH) {
              point.x = 2 * bounds.getCenterX() - point.x;
            }

            if (flipV) {
              point.y = 2 * bounds.getCenterY() - point.y;
            }
          }

          point = perimeter(bounds, terminal, point, orthogonal);

          if (point != null) {
            if (flipH) {
              point.x = 2 * bounds.getCenterX() - point.x;
            }

            if (flipV) {
              point.y = 2 * bounds.getCenterY() - point.y;
            }
          }
        }
      }

      if (point == null) {
        point = this.getPoint(terminal);
      }
    }
    return point;
  }

  /**
   * Returns the x-coordinate of the center point for automatic routing.
   */
  // getRoutingCenterX(state: mxCellState): number;
  getRoutingCenterX(state: mxCellState) {
    const f =
      state.style != null ? parseFloat(state.style.routingCenterX) || 0 : 0;
    return state.getCenterX() + f * state.width;
  }

  /**
   * Returns the y-coordinate of the center point for automatic routing.
   */
  // getRoutingCenterY(state: mxCellState): number;
  getRoutingCenterY(state: mxCellState) {
    const f =
      state.style != null ? parseFloat(state.style.routingCenterY) || 0 : 0;
    return state.getCenterY() + f * state.height;
  }

  /**
   * Returns the perimeter bounds for the given terminal, edge pair as an
   * {@link mxRectangle}.
   *
   * If you have a model where each terminal has a relative child that should
   * act as the graphical endpoint for a connection from/to the terminal, then
   * this method can be replaced as follows:
   *
   * @example
   * ```javascript
   * var oldGetPerimeterBounds = getPerimeterBounds;
   * getPerimeterBounds(terminal, edge, isSource)
   * {
   *   var model = this.graph.getModel();
   *   var childCount = model.getChildCount(terminal.cell);
   *
   *   if (childCount > 0)
   *   {
   *     var child = model.getChildAt(terminal.cell, 0);
   *     var geo = model.getGeometry(child);
   *
   *     if (geo != null &&
   *         geo.relative)
   *     {
   *       var state = this.getState(child);
   *
   *       if (state != null)
   *       {
   *         terminal = state;
   *       }
   *     }
   *   }
   *
   *   return oldGetPerimeterBounds.apply(this, arguments);
   * };
   * ```
   *
   * @param {mxCellState} terminal mxCellState that represents the terminal.
   * @param {number} border Number that adds a border between the shape and the perimeter.
   */
  // getPerimeterBounds(terminal: mxCellState, border?: number): mxRectangle;
  getPerimeterBounds(
    terminal: mxCellState | null = null,
    border: number = 0
  ): mxRectangle | null {
    if (terminal != null) {
      border += parseFloat(terminal.style.perimeterSpacing || 0);
    }
    return (<mxCellState>terminal).getPerimeterBounds(border * this.scale);
  }

  /**
   * Returns the perimeter function for the given state.
   */
  // getPerimeterFunction(state: mxCellState): any;
  getPerimeterFunction(state: mxCellState): Function | null {
    let perimeter = state.style.perimeter;

    // Converts string values to objects
    if (typeof perimeter === 'string') {
      let tmp = mxStyleRegistry.getValue(perimeter);
      if (tmp == null && this.isAllowEval()) {
        tmp = eval(perimeter);
      }
      perimeter = tmp;
    }

    if (typeof perimeter === 'function') {
      return perimeter;
    }
    return null;
  }

  /**
   * Returns the nearest point in the list of absolute points or the center
   * of the opposite terminal.
   *
   * @param edge {@link mxCellState} that represents the edge.
   * @param opposite {@link mxCellState} that represents the opposite terminal.
   * @param source Boolean indicating if the next point for the source or target
   * should be returned.
   */
  // getNextPoint(edge: mxCellState, opposite: mxCellState, source: boolean): mxPoint;
  getNextPoint(
    edge: mxCellState,
    opposite: mxCellState | null,
    source: boolean = false
  ): mxPoint | null {
    const pts = edge.absolutePoints;
    let point = null;

    if (pts != null && pts.length >= 2) {
      const count = pts.length;
      point = pts[source ? Math.min(1, count - 1) : Math.max(0, count - 2)];
    }

    if (point == null && opposite != null) {
      point = new mxPoint(opposite.getCenterX(), opposite.getCenterY());
    }

    return point;
  }

  /**
   * Returns the nearest ancestor terminal that is visible. The edge appears
   * to be connected to this terminal on the display. The result of this method
   * is cached in {@link mxCellState.getVisibleTerminalState}.
   *
   * @param edge {@link mxCell} whose visible terminal should be returned.
   * @param source Boolean that specifies if the source or target terminal
   * should be returned.
   */
  // getVisibleTerminal(edge: mxCell, source: boolean): mxCell;
  getVisibleTerminal(edge: mxCell, source: boolean) {
    const model = (<mxGraph>this.graph).getModel();
    let result = edge.getTerminal(source);
    let best = result;

    while (result != null && result != this.currentRoot) {
      if ((best && !best.isVisible()) || result.isCollapsed()) {
        best = result;
      }

      result = result.getParent();
    }

    // Checks if the result is valid for the current view state
    if (
      best != null &&
      (!model.contains(best) ||
        best.getParent() === model.getRoot() ||
        best === this.currentRoot)
    ) {
      best = null;
    }

    return best;
  }

  /**
   * Updates the given state using the bounding box of t
   * he absolute points.
   * Also updates {@link mxCellState.terminalDistance}, {@link mxCellState.length} and
   * {@link mxCellState.segments}.
   *
   * @param state {@link mxCellState} whose bounds should be updated.
   */
  // updateEdgeBounds(state: mxCellState): void;
  updateEdgeBounds(state: mxCellState) {
    const points = <mxPoint[]>state.absolutePoints;
    const p0 = points[0];
    const pe = points[points.length - 1];

    if (p0.x !== pe.x || p0.y !== pe.y) {
      const dx = pe.x - p0.x;
      const dy = pe.y - p0.y;
      state.terminalDistance = Math.sqrt(dx * dx + dy * dy);
    } else {
      state.terminalDistance = 0;
    }

    let length = 0;
    const segments = [];
    let pt = p0;

    if (pt != null) {
      let minX = pt.x;
      let minY = pt.y;
      let maxX = minX;
      let maxY = minY;

      for (let i = 1; i < points.length; i += 1) {
        const tmp = points[i];

        if (tmp != null) {
          const dx = pt.x - tmp.x;
          const dy = pt.y - tmp.y;

          const segment = Math.sqrt(dx * dx + dy * dy);
          segments.push(segment);
          length += segment;

          pt = tmp;

          minX = Math.min(pt.x, minX);
          minY = Math.min(pt.y, minY);
          maxX = Math.max(pt.x, maxX);
          maxY = Math.max(pt.y, maxY);
        }
      }

      state.length = length;
      state.segments = segments;

      const markerSize = 1; // TODO: include marker size

      state.x = minX;
      state.y = minY;
      state.width = Math.max(markerSize, maxX - minX);
      state.height = Math.max(markerSize, maxY - minY);
    }
  }

  /**
   * Returns the absolute point on the edge for the given relative
   * {@link mxGeometry} as an {@link mxPoint}. The edge is represented by the given
   * {@link mxCellState}.
   *
   * @param state {@link mxCellState} that represents the state of the parent edge.
   * @param geometry {@link mxGeometry} that represents the relative location.
   */
  // getPoint(state: mxCellState, geometry: mxGeometry): mxPoint;
  getPoint(state: mxCellState, geometry: mxGeometry | null = null): mxPoint {
    let x = state.getCenterX();
    let y = state.getCenterY();

    if (state.segments != null && (geometry == null || geometry.relative)) {
      const gx = geometry != null ? geometry.x / 2 : 0;
      const pointCount = (<mxPoint[]>state.absolutePoints).length;
      const dist = Math.round((gx + 0.5) * state.length);
      let segment = state.segments[0];
      let length = 0;
      let index = 1;

      while (dist >= Math.round(length + segment) && index < pointCount - 1) {
        length += segment;
        segment = state.segments[index++];
      }

      const factor = segment === 0 ? 0 : (dist - length) / segment;
      const p0 = (<mxPoint[]>state.absolutePoints)[index - 1];
      const pe = (<mxPoint[]>state.absolutePoints)[index];

      if (p0 != null && pe != null) {
        let gy = 0;
        let offsetX = 0;
        let offsetY = 0;

        if (geometry != null) {
          gy = geometry.y;
          const { offset } = geometry;

          if (offset != null) {
            offsetX = offset.x;
            offsetY = offset.y;
          }
        }

        const dx = pe.x - p0.x;
        const dy = pe.y - p0.y;
        const nx = segment === 0 ? 0 : dy / segment;
        const ny = segment === 0 ? 0 : dx / segment;

        x = p0.x + dx * factor + (nx * gy + offsetX) * this.scale;
        y = p0.y + dy * factor - (ny * gy - offsetY) * this.scale;
      }
    } else if (geometry != null) {
      const { offset } = geometry;

      if (offset != null) {
        x += offset.x;
        y += offset.y;
      }
    }

    return new mxPoint(x, y);
  }

  /**
   * Gets the relative point that describes the given, absolute label
   * position for the given edge state.
   *
   * @param state {@link mxCellState} that represents the state of the parent edge.
   * @param x Specifies the x-coordinate of the absolute label location.
   * @param y Specifies the y-coordinate of the absolute label location.
   */
  // getRelativePoint(edgeState: mxCellState, x: number, y: number): mxPoint;
  getRelativePoint(edgeState: mxCellState, x: number, y: number) {
    const model = (<mxGraph>this.graph).getModel();
    const geometry = edgeState.cell.getGeometry();

    if (geometry != null) {
      const absolutePoints = <mxPoint[]>edgeState.absolutePoints;
      const pointCount = absolutePoints.length;

      if (geometry.relative && pointCount > 1) {
        const totalLength = edgeState.length;
        let { segments } = edgeState;
        segments = <number[]>segments;

        // Works out which line segment the point of the label is closest to
        let p0 = absolutePoints[0];
        let pe = absolutePoints[1];
        let minDist = ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y);
        let length = 0;
        let index = 0;
        let tmp = 0;

        for (let i = 2; i < pointCount; i += 1) {
          p0 = pe;
          pe = absolutePoints[i];
          const dist = ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y);
          tmp += segments[i - 2];

          if (dist <= minDist) {
            minDist = dist;
            index = i - 1;
            length = tmp;
          }
        }

        const seg = segments[index];
        p0 = absolutePoints[index];
        pe = absolutePoints[index + 1];

        const x2 = p0.x;
        const y2 = p0.y;

        const x1 = pe.x;
        const y1 = pe.y;

        let px = x;
        let py = y;

        const xSegment = x2 - x1;
        const ySegment = y2 - y1;

        px -= x1;
        py -= y1;
        let projlenSq = 0;

        px = xSegment - px;
        py = ySegment - py;
        const dotprod = px * xSegment + py * ySegment;

        if (dotprod <= 0.0) {
          projlenSq = 0;
        } else {
          projlenSq =
            (dotprod * dotprod) / (xSegment * xSegment + ySegment * ySegment);
        }

        let projlen = Math.sqrt(projlenSq);

        if (projlen > seg) {
          projlen = seg;
        }

        let yDistance = Math.sqrt(ptSegDistSq(p0.x, p0.y, pe.x, pe.y, x, y));
        const direction = relativeCcw(p0.x, p0.y, pe.x, pe.y, x, y);

        if (direction === -1) {
          yDistance = -yDistance;
        }

        // Constructs the relative point for the label
        return new mxPoint(
          ((totalLength / 2 - length - projlen) / totalLength) * -2,
          yDistance / this.scale
        );
      }
    }
    return new mxPoint();
  }

  /**
   * Updates {@link mxCellState.absoluteOffset} for the given state. The absolute
   * offset is normally used for the position of the edge label. Is is
   * calculated from the geometry as an absolute offset from the center
   * between the two endpoints if the geometry is absolute, or as the
   * relative distance between the center along the line and the absolute
   * orthogonal distance if the geometry is relative.
   *
   * @param state {@link mxCellState} whose absolute offset should be updated.
   */
  // updateEdgeLabelOffset(state: mxCellState): void;
  updateEdgeLabelOffset(state: mxCellState) {
    const points = state.absolutePoints;
    const absoluteOffset = <mxPoint>state.absoluteOffset;
    absoluteOffset.x = state.getCenterX();
    absoluteOffset.y = state.getCenterY();

    if (points != null && points.length > 0 && state.segments != null) {
      const geometry = <mxGeometry>(<mxCell>state.cell).getGeometry();

      if (geometry.relative) {
        const offset = this.getPoint(state, geometry);

        if (offset != null) {
          state.absoluteOffset = offset;
        }
      } else {
        const p0 = points[0];
        const pe = points[points.length - 1];

        if (p0 != null && pe != null) {
          const dx = pe.x - p0.x;
          const dy = pe.y - p0.y;
          let x0 = 0;
          let y0 = 0;

          const off = geometry.offset;

          if (off != null) {
            x0 = off.x;
            y0 = off.y;
          }

          const x = p0.x + dx / 2 + x0 * this.scale;
          const y = p0.y + dy / 2 + y0 * this.scale;

          absoluteOffset.x = x;
          absoluteOffset.y = y;
        }
      }
    }
  }

  /**
   * Returns the {@link mxCellState} for the given cell. If create is true, then
   * the state is created if it does not yet exist.
   *
   * @param cell {@link mxCell} for which the {@link mxCellState} should be returned.
   * @param create Optional boolean indicating if a new state should be created
   * if it does not yet exist. Default is false.
   */
  // getState(cell: mxCell, create?: boolean): mxCellState;
  getState(cell: mxCell | null = null, create: boolean = false) {
    let state: mxCellState | null = null;

    if (cell != null) {
      state = this.states.get(cell);

      if (create && (state == null || this.updateStyle) && cell.isVisible()) {
        if (state == null) {
          state = this.createState(cell);
          this.states.put(cell, state);
        } else {
          state.style = (<mxGraph>this.graph).getCellStyle(cell);
        }
      }
    }
    return state;
  }

  /**
   * Returns the {@link mxCellStates} for the given array of {@link mxCell}. The array
   * contains all states that are not null, that is, the returned array may
   * have less elements than the given array. If no argument is given, then
   * this returns {@link states}.
   */
  // getCellStates(cells: mxCell[]): mxCellState[];
  getCellStates(cells: mxCell[] | null): mxCellState[] | mxDictionary | null {
    if (cells == null) {
      return this.states;
    }

    const result: mxCellState[] = [];
    for (const cell of cells) {
      const state = this.getState(cell);
      if (state != null) {
        result.push(state);
      }
    }
    return result;
  }

  /**
   * Removes and returns the {@link mxCellState} for the given cell.
   *
   * @param cell {@link mxCell} for which the {@link mxCellState} should be removed.
   */
  // removeState(cell: mxCell): mxCellState;
  removeState(cell: mxCell): mxCellState | null {
    let state: mxCellState | null = null;

    if (cell != null) {
      state = this.states.remove(cell);

      if (state != null) {
        (<mxGraph>this.graph).cellRenderer.destroy(state);
        state.invalid = true;
        state.destroy();
      }
    }
    return state;
  }

  /**
   * Creates and returns an {@link mxCellState} for the given cell and initializes
   * it using {@link mxCellRenderer.initialize}.
   *
   * @param cell {@link mxCell} for which a new {@link mxCellState} should be created.
   */
  // createState(cell: mxCell): mxCellState;
  createState(cell: mxCell): mxCellState {
    return new mxCellState(
      this,
      cell,
      (<mxGraph>this.graph).getCellStyle(cell)
    );
  }

  /**
   * Returns true if the event origin is one of the drawing panes or
   * containers of the view.
   */
  // isContainerEvent(evt: Event): boolean;
  isContainerEvent(evt: Event | MouseEvent) {
    const source = getSource(evt);

    return (
      source === (<mxGraph>this.graph).container ||
      source.parentNode === this.backgroundPane ||
      (source.parentNode != null &&
        source.parentNode.parentNode === this.backgroundPane) ||
      // @ts-ignore
      source === this.canvas.parentNode ||
      source === this.canvas ||
      source === this.backgroundPane ||
      source === this.drawPane ||
      source === this.overlayPane ||
      source === this.decoratorPane
    );
  }

  /**
   * Returns true if the event origin is one of the scrollbars of the
   * container in IE. Such events are ignored.
   */
  // isScrollEvent(evt: Event): boolean;
  isScrollEvent(evt: MouseEvent) {
    const graph = <mxGraph>this.graph;
    const offset = getOffset(graph.container);
    const pt = new mxPoint(evt.clientX - offset.x, evt.clientY - offset.y);
    const container = <HTMLElement>graph.container;

    const outWidth = container.offsetWidth;
    const inWidth = container.clientWidth;

    if (outWidth > inWidth && pt.x > inWidth + 2 && pt.x <= outWidth) {
      return true;
    }

    const outHeight = container.offsetHeight;
    const inHeight = container.clientHeight;

    return outHeight > inHeight && pt.y > inHeight + 2 && pt.y <= outHeight;
  }

  /**
   * Initializes the graph event dispatch loop for the specified container
   * and invokes {@link create} to create the required DOM nodes for the display.
   */
  // init(): void;
  init() {
    this.installListeners();

    // Creates the DOM nodes for the respective display dialect
    const { graph } = this;
    this.createSvg();
  }

  /**
   * Installs the required listeners in the container.
   */
  // installListeners(): void;
  installListeners() {
    const graph = <mxGraph>this.graph;
    const { container } = graph;

    if (container != null) {
      // Support for touch device gestures (eg. pinch to zoom)
      // Double-tap handling is implemented in mxGraph.fireMouseEvent
      if (mxClient.IS_TOUCH) {
        mxEvent.addListener(container, 'gesturestart', ((evt: MouseEvent) => {
          graph.fireGestureEvent(evt);
          mxEvent.consume(evt);
        }) as EventListener);

        mxEvent.addListener(container, 'gesturechange', ((evt: MouseEvent) => {
          graph.fireGestureEvent(evt);
          mxEvent.consume(evt);
        }) as EventListener);

        mxEvent.addListener(container, 'gestureend', ((evt: MouseEvent) => {
          graph.fireGestureEvent(evt);
          mxEvent.consume(evt);
        }) as EventListener);
      }

      // Fires event only for one pointer per gesture
      let pointerId: number | null = null;

      // Adds basic listeners for graph event dispatching
      mxEvent.addGestureListeners(
        container,
        ((evt: MouseEvent) => {
          // Condition to avoid scrollbar events starting a rubberband selection
          if (
            this.isContainerEvent(evt) &&
            ((!mxClient.IS_GC && !mxClient.IS_SF) || !this.isScrollEvent(evt))
          ) {
            graph.fireMouseEvent(mxEvent.MOUSE_DOWN, new mxMouseEvent(evt));
            // @ts-ignore
            pointerId = evt.pointerId;
          }
        }) as EventListener,
        (evt: Event) => {
          if (
            this.isContainerEvent(evt) &&
            // @ts-ignore
            (pointerId == null || evt.pointerId === pointerId)
          ) {
            graph.fireMouseEvent(mxEvent.MOUSE_MOVE, new mxMouseEvent(evt));
          }
        },
        (evt: Event) => {
          if (this.isContainerEvent(evt)) {
            graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt));
          }

          pointerId = null;
        }
      );

      // Adds listener for double click handling on background, this does always
      // use native event handler, we assume that the DOM of the background
      // does not change during the double click
      mxEvent.addListener(container, 'dblclick', ((evt: MouseEvent) => {
        if (this.isContainerEvent(evt)) {
          graph.dblClick(evt);
        }
      }) as EventListener);

      // Workaround for touch events which started on some DOM node
      // on top of the container, in which case the cells under the
      // mouse for the move and up events are not detected.
      const getState = (evt: Event) => {
        let state = null;

        // Workaround for touch events which started on some DOM node
        // on top of the container, in which case the cells under the
        // mouse for the move and up events are not detected.
        if (mxClient.IS_TOUCH) {
          const x = getClientX(evt);
          const y = getClientY(evt);

          // Dispatches the drop event to the graph which
          // consumes and executes the source function
          const pt = convertPoint(container, x, y);
          state = (<mxGraphView>graph.view).getState(
            graph.getCellAt(pt.x, pt.y)
          );
        }

        return state;
      };

      // Adds basic listeners for graph event dispatching outside of the
      // container and finishing the handling of a single gesture
      // Implemented via graph event dispatch loop to avoid duplicate events
      // in Firefox and Chrome
      graph.addMouseListener({
        mouseDown: (sender: any, me: mxMouseEvent) => {
          (<mxPopupMenuHandler>graph.popupMenuHandler).hideMenu();
        },
        mouseMove: () => {},
        mouseUp: () => {},
      });

      this.moveHandler = (evt: Event) => {
        // Hides the tooltip if mouse is outside container
        if (
          graph.tooltipHandler != null &&
          graph.tooltipHandler.isHideOnHover()
        ) {
          graph.tooltipHandler.hide();
        }

        if (
          this.captureDocumentGesture &&
          graph.isMouseDown &&
          graph.container != null &&
          !this.isContainerEvent(evt) &&
          graph.container.style.display !== 'none' &&
          graph.container.style.visibility !== 'hidden' &&
          !isConsumed(evt)
        ) {
          graph.fireMouseEvent(
            mxEvent.MOUSE_MOVE,
            new mxMouseEvent(evt, getState(evt))
          );
        }
      };

      this.endHandler = (evt: Event) => {
        if (
          this.captureDocumentGesture &&
          graph.isMouseDown &&
          graph.container != null &&
          !this.isContainerEvent(evt) &&
          graph.container.style.display !== 'none' &&
          graph.container.style.visibility !== 'hidden'
        ) {
          graph.fireMouseEvent(mxEvent.MOUSE_UP, new mxMouseEvent(evt));
        }
      };

      mxEvent.addGestureListeners(
        document,
        null,
        this.moveHandler,
        this.endHandler
      );
    }
  }

  /**
   * Creates and returns the DOM nodes for the SVG display.
   */
  // createSvg(): Element;
  createSvg() {
    const { container } = <mxGraph>this.graph;
    const canvas = (this.canvas = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    ));

    // For background image
    this.backgroundPane = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    );
    canvas.appendChild(this.backgroundPane);

    // Adds two layers (background is early feature)
    this.drawPane = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    canvas.appendChild(this.drawPane);

    this.overlayPane = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    );
    canvas.appendChild(this.overlayPane);

    this.decoratorPane = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'g'
    );
    canvas.appendChild(this.decoratorPane);

    const root = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    root.style.left = '0px';
    root.style.top = '0px';
    root.style.width = '100%';
    root.style.height = '100%';

    // NOTE: In standards mode, the SVG must have block layout
    // in order for the container DIV to not show scrollbars.
    root.style.display = 'block';
    root.appendChild(this.canvas);

    if (container != null) {
      container.appendChild(root);
      this.updateContainerStyle(container);
    }
  }

  /**
   * Updates the style of the container after installing the SVG DOM elements.
   */
  // updateContainerStyle(container: Element): void;
  updateContainerStyle(container: HTMLElement) {
    // Workaround for offset of container
    const style = getCurrentStyle(container);

    if (style != null && style.position == 'static') {
      container.style.position = 'relative';
    }

    // Disables built-in pan and zoom in IE10 and later
    if (mxClient.IS_POINTER) {
      container.style.touchAction = 'none';
    }
  }

  /**
   * Destroys the view and all its resources.
   */
  // destroy(): void;
  destroy() {
    let root: SVGElement | null =
      this.canvas != null ? this.canvas.ownerSVGElement : null;

    if (root == null) {
      root = this.canvas;
    }

    if (root != null && root.parentNode != null) {
      this.clear(<mxCell>this.currentRoot, true);
      mxEvent.removeGestureListeners(
        document,
        null,
        this.moveHandler,
        this.endHandler
      );
      mxEvent.release(this.graph.container);
      root.parentNode.removeChild(root);

      this.moveHandler = null;
      this.endHandler = null;
      this.canvas = null;
      this.backgroundPane = null;
      this.drawPane = null;
      this.overlayPane = null;
      this.decoratorPane = null;
    }
  }

  endHandler: EventListener | null = null;
  moveHandler: EventListener | null = null;
}

export default mxGraphView;
// import('../../serialization/mxGraphViewCodec');
