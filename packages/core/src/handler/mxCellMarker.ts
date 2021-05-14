/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxEventSource from '../util/event/mxEventSource';
import {
  DEFAULT_HOTSPOT,
  DEFAULT_INVALID_COLOR,
  DEFAULT_VALID_COLOR,
  MAX_HOTSPOT_SIZE,
  MIN_HOTSPOT_SIZE,
} from '../util/mxConstants';
import mxCellHighlight from './mxCellHighlight';
import mxEventObject from '../util/event/mxEventObject';
import mxEvent from '../util/event/mxEvent';
import mxUtils from '../util/mxUtils';
import mxGraph from '../view/graph/mxGraph';
import { ColorValue } from '../types';
import mxCellState from '../view/cell/mxCellState';
import mxMouseEvent from '../util/event/mxMouseEvent';
import mxCell from '../view/cell/mxCell';

/**
 * Class: mxCellMarker
 *
 * A helper class to process mouse locations and highlight cells.
 *
 * Helper class to highlight cells. To add a cell marker to an existing graph
 * for highlighting all cells, the following code is used:
 *
 * (code)
 * let marker = new mxCellMarker(graph);
 * graph.addMouseListener({
 *   mouseDown: ()=> {},
 *   mouseMove: (sender, me)=>
 *   {
 *     marker.process(me);
 *   },
 *   mouseUp: ()=> {}
 * });
 * (end)
 *
 * Event: mxEvent.MARK
 *
 * Fires after a cell has been marked or unmarked. The <code>state</code>
 * property contains the marked <mxCellState> or null if no state is marked.
 *
 * Constructor: mxCellMarker
 *
 * Constructs a new cell marker.
 *
 * Parameters:
 *
 * graph - Reference to the enclosing <mxGraph>.
 * validColor - Optional marker color for valid states. Default is
 * <mxConstants.DEFAULT_VALID_COLOR>.
 * invalidColor - Optional marker color for invalid states. Default is
 * <mxConstants.DEFAULT_INVALID_COLOR>.
 * hotspot - Portion of the width and hight where a state intersects a
 * given coordinate pair. A value of 0 means always highlight. Default is
 * <mxConstants.DEFAULT_HOTSPOT>.
 */
class mxCellMarker extends mxEventSource {
  constructor(
    graph: mxGraph,
    validColor: ColorValue = DEFAULT_VALID_COLOR,
    invalidColor: ColorValue = DEFAULT_INVALID_COLOR,
    hotspot: number = DEFAULT_HOTSPOT
  ) {
    super();

    this.graph = graph;
    this.validColor = validColor;
    this.invalidColor = invalidColor;
    this.hotspot = hotspot;
    this.highlight = new mxCellHighlight(graph);
  }

  /**
   * Variable: graph
   *
   * Reference to the enclosing <mxGraph>.
   */
  graph: mxGraph;

  /**
   * Variable: enabled
   *
   * Specifies if the marker is enabled. Default is true.
   */
  enabled = true;

  /**
   * Variable: hotspot
   *
   * Specifies the portion of the width and height that should trigger
   * a highlight. The area around the center of the cell to be marked is used
   * as the hotspot. Possible values are between 0 and 1. Default is
   * mxConstants.DEFAULT_HOTSPOT.
   */
  hotspot = DEFAULT_HOTSPOT;

  /**
   * Variable: hotspotEnabled
   *
   * Specifies if the hotspot is enabled. Default is false.
   */
  hotspotEnabled = false;

  /**
   * Variable: validColor
   *
   * Holds the valid marker color.
   */
  validColor: ColorValue;

  /**
   * Variable: invalidColor
   *
   * Holds the invalid marker color.
   */
  invalidColor: ColorValue;

  /**
   * Variable: currentColor
   *
   * Holds the current marker color.
   */
  currentColor: ColorValue | null = null;

  /**
   * Variable: validState
   *
   * Holds the marked <mxCellState> if it is valid.
   */
  validState: mxCellState | null = null;

  /**
   * Variable: markedState
   *
   * Holds the marked <mxCellState>.
   */
  markedState: mxCellState | null = null;

  highlight: mxCellHighlight;

  /**
   * Function: setEnabled
   *
   * Enables or disables event handling. This implementation
   * updates <enabled>.
   *
   * Parameters:
   *
   * enabled - Boolean that specifies the new enabled state.
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * Function: isEnabled
   *
   * Returns true if events are handled. This implementation
   * returns <enabled>.
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Function: setHotspot
   *
   * Sets the <hotspot>.
   */
  setHotspot(hotspot: number) {
    this.hotspot = hotspot;
  }

  /**
   * Function: getHotspot
   *
   * Returns the <hotspot>.
   */
  getHotspot() {
    return this.hotspot;
  }

  /**
   * Function: setHotspotEnabled
   *
   * Specifies whether the hotspot should be used in <intersects>.
   */
  setHotspotEnabled(enabled: boolean) {
    this.hotspotEnabled = enabled;
  }

  /**
   * Function: isHotspotEnabled
   *
   * Returns true if hotspot is used in <intersects>.
   */
  isHotspotEnabled() {
    return this.hotspotEnabled;
  }

  /**
   * Function: hasValidState
   *
   * Returns true if <validState> is not null.
   */
  hasValidState() {
    return !!this.validState;
  }

  /**
   * Function: getValidState
   *
   * Returns the <validState>.
   */
  getValidState() {
    return this.validState;
  }

  /**
   * Function: getMarkedState
   *
   * Returns the <markedState>.
   */
  getMarkedState() {
    return this.markedState;
  }

  /**
   * Function: reset
   *
   * Resets the state of the cell marker.
   */
  reset() {
    this.validState = null;

    if (this.markedState) {
      this.markedState = null;
      this.unmark();
    }
  }

  /**
   * Function: process
   *
   * Processes the given event and cell and marks the state returned by
   * <getState> with the color returned by <getMarkerColor>. If the
   * markerColor is not null, then the state is stored in <markedState>. If
   * <isValidState> returns true, then the state is stored in <validState>
   * regardless of the marker color. The state is returned regardless of the
   * marker color and valid state.
   */
  process(me: mxMouseEvent) {
    let state = null;

    if (this.isEnabled()) {
      state = this.getState(me);
      this.setCurrentState(state, me);
    }

    return state;
  }

  /**
   * Function: setCurrentState
   *
   * Sets and marks the current valid state.
   */
  setCurrentState(
    state: mxCellState,
    me: mxMouseEvent,
    color: ColorValue = null
  ) {
    const isValid = state ? this.isValidState(state) : false;
    color = color ?? this.getMarkerColor(me.getEvent(), state, isValid);

    if (isValid) {
      this.validState = state;
    } else {
      this.validState = null;
    }

    if (state !== this.markedState || color !== this.currentColor) {
      this.currentColor = color;

      if (state && this.currentColor) {
        this.markedState = state;
        this.mark();
      } else if (this.markedState) {
        this.markedState = null;
        this.unmark();
      }
    }
  }

  /**
   * Function: markCell
   *
   * Marks the given cell using the given color, or <validColor> if no color is specified.
   */
  markCell(cell: mxCell, color: ColorValue) {
    const state = this.graph.getView().getState(cell);

    if (state) {
      this.currentColor = color ?? this.validColor;
      this.markedState = state;
      this.mark();
    }
  }

  /**
   * Function: mark
   *
   * Marks the <markedState> and fires a <mark> event.
   */
  mark() {
    this.highlight.setHighlightColor(this.currentColor);
    this.highlight.highlight(this.markedState);
    this.fireEvent(new mxEventObject(mxEvent.MARK, 'state', this.markedState));
  }

  /**
   * Function: unmark
   *
   * Hides the marker and fires a <mark> event.
   */
  // unmark(): void;
  unmark() {
    this.mark();
  }

  /**
   * Function: isValidState
   *
   * Returns true if the given <mxCellState> is a valid state. If this
   * returns true, then the state is stored in <validState>. The return value
   * of this method is used as the argument for <getMarkerColor>.
   */
  // isValidState(state: mxCellState): boolean;
  isValidState(state) {
    return true;
  }

  /**
   * Function: getMarkerColor
   *
   * Returns the valid- or invalidColor depending on the value of isValid.
   * The given <mxCellState> is ignored by this implementation.
   */
  // getMarkerColor(evt: Event, state: mxCellState, isValid: boolean): string;
  getMarkerColor(evt, state, isValid) {
    return isValid ? this.validColor : this.invalidColor;
  }

  /**
   * Function: getState
   *
   * Uses <getCell>, <getStateToMark> and <intersects> to return the
   * <mxCellState> for the given <mxMouseEvent>.
   */
  // getState(me: mxMouseEvent): mxCellState;
  getState(me) {
    const view = this.graph.getView();
    const cell = this.getCell(me);
    const state = this.getStateToMark(view.getState(cell));

    return state != null && this.intersects(state, me) ? state : null;
  }

  /**
   * Function: getCell
   *
   * Returns the <mxCell> for the given event and cell. This returns the
   * given cell.
   */
  // getCell(me: mxMouseEvent): mxCell;
  getCell(me) {
    return me.getCell();
  }

  /**
   * Function: getStateToMark
   *
   * Returns the <mxCellState> to be marked for the given <mxCellState> under
   * the mouse. This returns the given state.
   */
  // getStateToMark(state: mxCellState): mxCellState;
  getStateToMark(state) {
    return state;
  }

  /**
   * Function: intersects
   *
   * Returns true if the given coordinate pair intersects the given state.
   * This returns true if the <hotspot> is 0 or the coordinates are inside
   * the hotspot for the given cell state.
   */
  // intersects(state: mxCellState, me: mxMouseEvent): boolean;
  intersects(state, me) {
    if (this.hotspotEnabled) {
      return mxUtils.intersectsHotspot(
        state,
        me.getGraphX(),
        me.getGraphY(),
        this.hotspot,
        MIN_HOTSPOT_SIZE,
        MAX_HOTSPOT_SIZE
      );
    }

    return true;
  }

  /**
   * Function: destroy
   *
   * Destroys the handler and all its resources and DOM nodes.
   */
  // destroy(): void;
  destroy() {
    this.graph.getView().removeListener(this.resetHandler);
    this.graph.getModel().removeListener(this.resetHandler);
    this.highlight.destroy();
  }
}

export default mxCellMarker;
