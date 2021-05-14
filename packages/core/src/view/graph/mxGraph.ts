/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxImage from '../../util/image/mxImage';
import mxEventObject from '../../util/event/mxEventObject';
import mxEventSource from '../../util/event/mxEventSource';
import mxEvent from '../../util/event/mxEvent';
import mxEdgeStyle from '../../util/datatypes/style/mxEdgeStyle';
import mxRectangle from '../../util/datatypes/mxRectangle';
import mxPanningManager from '../../util/drag_pan/mxPanningManager';
import mxTooltipHandler from '../../handler/mxTooltipHandler';
import mxClient from '../../mxClient';
import mxSelectionCellsHandler from '../../handler/mxSelectionCellsHandler';
import mxConnectionHandler from '../../handler/mxConnectionHandler';
import mxGraphHandler from '../../handler/mxGraphHandler';
import mxPanningHandler from '../../handler/mxPanningHandler';
import mxPopupMenuHandler from '../../handler/mxPopupMenuHandler';
import mxGraphSelectionModel from './mxGraphSelectionModel';
import mxGraphView from './mxGraphView';
import mxCellRenderer from '../cell/mxCellRenderer';
import mxCellEditor from '../cell/mxCellEditor';
import mxCellOverlay from '../cell/mxCellOverlay';
import mxPoint from '../../util/datatypes/mxPoint';
import mxUtils from '../../util/mxUtils';
import mxConnectionConstraint from '../connection/mxConnectionConstraint';
import mxDictionary from '../../util/datatypes/mxDictionary';
import mxVertexHandler from '../../handler/mxVertexHandler';
import mxEdgeHandler from '../../handler/mxEdgeHandler';
import mxEdgeSegmentHandler from '../../handler/mxEdgeSegmentHandler';
import mxElbowEdgeHandler from '../../handler/mxElbowEdgeHandler';
import mxMouseEvent from '../../util/event/mxMouseEvent';
import mxResources from '../../util/mxResources';
import mxGeometry from '../../util/datatypes/mxGeometry';
import mxCell from '../cell/mxCell';
import mxGraphModel from './mxGraphModel';
import mxStylesheet from '../../util/datatypes/style/mxStylesheet';
import {
  ALIGN_BOTTOM,
  ALIGN_CENTER,
  ALIGN_MIDDLE,
  ALIGN_RIGHT,
  ALIGN_TOP,
  DEFAULT_FONTSIZE,
  DEFAULT_STARTSIZE,
  DIALECT_SVG,
  DIRECTION_EAST,
  DIRECTION_NORTH,
  DIRECTION_SOUTH,
  DIRECTION_WEST,
  NONE,
  PAGE_FORMAT_A4_PORTRAIT,
  SHAPE_LABEL,
  SHAPE_SWIMLANE,
} from '../../util/mxConstants';
import mxMultiplicity from '../connection/mxMultiplicity';
import mxChildChange from '../../atomic_changes/mxChildChange';
import mxGeometryChange from '../../atomic_changes/mxGeometryChange';
import mxRootChange from '../../atomic_changes/mxRootChange';
import mxStyleChange from '../../atomic_changes/mxStyleChange';
import mxTerminalChange from '../../atomic_changes/mxTerminalChange';
import mxValueChange from '../../atomic_changes/mxValueChange';
import mxPolyline from '../../shape/edge/mxPolyline';
import mxCellState from '../cell/mxCellState';
import mxImageBundle from '../../util/image/mxImageBundle';
import mxShape from '../../shape/mxShape';
import mxLabel from '../../shape/mxLabel';
import { htmlEntities } from '../../util/mxStringUtils';
import {
  getClientX,
  getClientY,
  isAltDown,
  isConsumed,
  isControlDown,
  isLeftMouseButton,
  isMetaDown,
  isMouseEvent,
  isMultiTouchEvent,
  isPenEvent,
  isPopupTrigger,
  isShiftDown,
  isTouchEvent,
} from '../../util/mxEventUtils';
import { isNode } from '../../util/mxDomUtils';

/**
 * Extends {@link mxEventSource} to implement a graph component for
 * the browser. This is the main class of the package. To activate
 * panning and connections use {@link setPanning} and {@link setConnectable}.
 * For rubberband selection you must create a new instance of
 * {@link mxRubberband}. The following listeners are added to
 * {@link mouseListeners} by default:
 *
 * - tooltipHandler: {@link mxTooltipHandler} that displays tooltips
 * - panningHandler: {@link mxPanningHandler} for panning and popup menus
 * - connectionHandler: {@link mxConnectionHandler} for creating connections
 * - graphHandler: {@link mxGraphHandler} for moving and cloning cells
 *
 * These listeners will be called in the above order if they are enabled.
 * @class mxGraph
 * @extends {mxEventSource}
 */
class mxGraph extends mxEventSource {
  constructor(
    container: HTMLElement,
    model: mxGraphModel,
    renderHint: string = DIALECT_SVG,
    stylesheet: mxStylesheet | null = null
  ) {
    super();

    // Initializes the variable in case the prototype has been
    // modified to hold some listeners (which is possible because
    // the createHandlers call is executed regardless of the
    // arguments passed into the ctor).
    this.mouseListeners = null;

    // Converts the renderHint into a dialect
    this.renderHint = renderHint;
    this.dialect = 'svg';

    // Initializes the main members that do not require a container
    this.model = model != null ? model : new mxGraphModel();
    this.multiplicities = [];
    this.imageBundles = [];
    this.cellRenderer = this.createCellRenderer();
    this.setSelectionModel(this.createSelectionModel());
    this.setStylesheet(
      stylesheet != null ? stylesheet : this.createStylesheet()
    );
    this.view = this.createGraphView();

    // Adds a graph model listener to update the view
    this.graphModelChangeListener = (sender: any, evt: mxEventObject) => {
      this.graphModelChanged(evt.getProperty('edit').changes);
    };

    this.getModel().addListener(mxEvent.CHANGE, this.graphModelChangeListener);

    // Installs basic event handlers with disabled default settings.
    this.createHandlers();

    // Initializes the display if a container was specified
    if (container != null) {
      this.init(container);
    }

    this.getView().revalidate();
  }

  /**
   * Initializes the {@link container} and creates the respective datastructures.
   *
   * @param container DOM node that will contain the graph display.
   */
  // init(container: HTMLElement): void;
  init(container: HTMLElement): void {
    this.container = container;

    // Initializes the in-place editor
    this.cellEditor = this.createCellEditor();

    // Initializes the container using the view
    this.getView().init();

    // Updates the size of the container for the current graph
    this.sizeDidChange();

    // Hides tooltips and resets tooltip timer if mouse leaves container
    mxEvent.addListener(container, 'mouseleave', ((evt: MouseEvent) => {
      if (
        this.tooltipHandler != null &&
        this.tooltipHandler.div != null &&
        this.tooltipHandler.div != evt.relatedTarget
      ) {
        this.tooltipHandler.hide();
      }
    }) as EventListener);
  }

  // TODO: Document me!
  container: HTMLElement | null = null;
  destroyed: boolean = false;
  tooltipHandler: mxTooltipHandler | null = null;
  selectionCellsHandler: mxSelectionCellsHandler | null = null;
  panningHandler: mxPanningHandler | null = null;
  popupMenuHandler: mxPopupMenuHandler | null = null;
  connectionHandler: mxConnectionHandler | null = null;
  graphHandler: mxGraphHandler | null = null;
  graphModelChangeListener: Function | null = null;
  shiftPreview1: HTMLElement | null = null;
  shiftPreview2: HTMLElement | null = null;
  panningManager: mxPanningManager | null = null;
  lastTouchEvent: mxMouseEvent | null = null;
  doubleClickCounter: number = 0;
  lastTouchCell: mxCell | null = null;
  fireDoubleClick: boolean | null = null;
  tapAndHoldThread: number | null = null;
  lastMouseX: number | null = null;
  lastMouseY: number | null = null;
  isMouseTrigger: boolean | null = null;
  ignoreMouseEvents: boolean | null = null;
  mouseMoveRedirect: EventListener | null = null;
  mouseUpRedirect: EventListener | null = null;
  lastEvent: any; // FIXME: Check if this can be more specific - DOM events or mxEventObjects!
  horizontalPageBreaks: any[] | null = null;
  verticalPageBreaks: any[] | null = null;
  paintBackground: Function | null = null;

  /**
   * Holds the mouse event listeners. See {@link fireMouseEvent}.
   */
  // mouseListeners: any[];
  mouseListeners: any[] | null = null;

  /*****************************************************************************
   * Group: Variables
   *****************************************************************************/

  /**
   * Holds the state of the mouse button.
   */
  // isMouseDown: boolean;
  isMouseDown: boolean = false;

  /**
   * Holds the {@link mxGraphModel} that contains the cells to be displayed.
   */
  // model: mxGraphModel;
  model: mxGraphModel | null = null;

  /**
   * Holds the {@link mxGraphView} that caches the {@link mxCellState}s for the cells.
   */
  // view: mxGraphView;
  view: mxGraphView;

  /**
   * Holds the {@link mxStylesheet} that defines the appearance of the cells.
   *
   * Use the following code to read a stylesheet into an existing graph.
   *
   * @example
   * ```javascript
   * var req = mxUtils.load('stylesheet.xml');
   * var root = req.getDocumentElement();
   * var dec = new mxCodec(root.ownerDocument);
   * dec.decode(root, graph.stylesheet);
   * ```
   */
  // stylesheet: mxStylesheet;
  stylesheet: mxStylesheet | null = null;

  /**
   * Holds the {@link mxGraphSelectionModel} that models the current selection.
   */
  // selectionModel: mxGraphSelectionModel;
  selectionModel: mxGraphSelectionModel | null = null;

  /**
   * Holds the {@link mxCellEditor} that is used as the in-place editing.
   */
  // cellEditor: mxCellEditor;
  cellEditor: mxCellEditor | null = null;

  /**
   * Holds the {@link mxCellRenderer} for rendering the cells in the graph.
   */
  // cellRenderer: mxCellRenderer;
  cellRenderer: mxCellRenderer;

  /**
   * An array of {@link mxMultiplicity} describing the allowed
   * connections in a graph.
   */
  // multiplicities: mxMultiplicity[];
  multiplicities: mxMultiplicity[] | null = null;

  /**
   * RenderHint as it was passed to the constructor.
   */
  // renderHint: any;
  renderHint: string | null = null;

  /**
   * Dialect to be used for drawing the graph. Possible values are all
   * constants in {@link mxConstants} with a DIALECT-prefix.
   */
  // dialect: mxDialectConstants;
  dialect: 'svg' | 'mixedHtml' | 'preferHtml' | 'strictHtml' = 'svg';

  /**
   * Specifies the grid size.
   * @default 10
   */
  // gridSize: number;
  gridSize: number = 10;

  /**
   * Specifies if the grid is enabled. This is used in {@link snap}.
   * @default true
   */
  // gridEnabled: boolean;
  gridEnabled: boolean = true;

  /**
   * Specifies if ports are enabled. This is used in {@link cellConnected} to update
   * the respective style.
   * @default true
   */
  // portsEnabled: boolean;
  portsEnabled: boolean = true;

  /**
   * Specifies if native double click events should be detected.
   * @default true
   */
  // nativeDblClickEnabled: boolean;
  nativeDblClickEnabled: boolean = true;

  /**
   * Specifies if double taps on touch-based devices should be handled as a
   * double click.
   * @default true
   */
  // doubleTapEnabled: boolean;
  doubleTapEnabled: boolean = true;

  /**
   * Specifies the timeout in milliseconds for double taps and non-native double clicks.
   * @default 500
   */
  // doubleTapTimeout: number;
  doubleTapTimeout: number = 500;

  /**
   * Specifies the tolerance in pixels for double taps and double clicks in quirks mode.
   * @default 25
   */
  // doubleTapTolerance: number;
  doubleTapTolerance: number = 25;

  /**
   * Variable: lastTouchX
   *
   * Holds the x-coordinate of the last touch event for double tap detection.
   */
  lastTouchX: number = 0;

  /**
   * Holds the x-coordinate of the last touch event for double tap detection.
   */
  // lastTouchY: number;
  lastTouchY: number = 0;

  /**
   * Holds the time of the last touch event for double click detection.
   */
  // lastTouchTime: number;
  lastTouchTime: number = 0;

  /**
   * Specifies if tap and hold should be used for starting connections on touch-based
   * devices.
   * @default true
   */
  // tapAndHoldEnabled: boolean;
  tapAndHoldEnabled: boolean = true;

  /**
   * Specifies the time in milliseconds for a tap and hold.
   * @default 500
   */
  // tapAndHoldDelay: number;
  tapAndHoldDelay: number = 500;

  /**
   * `True` if the timer for tap and hold events is running.
   */
  // tapAndHoldInProgress: boolean;
  tapAndHoldInProgress: boolean = false;

  /**
   * `True` as long as the timer is running and the touch events
   * stay within the given {@link tapAndHoldTolerance}.
   */
  // tapAndHoldValid: boolean;
  tapAndHoldValid: boolean = false;

  /**
   * Holds the x-coordinate of the initial touch event for tap and hold.
   */
  // initialTouchX: number;
  initialTouchX: number = 0;

  /**
   * Holds the y-coordinate of the initial touch event for tap and hold.
   */
  // initialTouchY: number;
  initialTouchY: number = 0;

  /**
   * Tolerance in pixels for a move to be handled as a single click.
   * @default 4
   */
  // tolerance: number;
  tolerance: number = 4;

  /**
   * Value returned by {@link getOverlap} if {@link isAllowOverlapParent} returns
   * `true` for the given cell. {@link getOverlap} is used in {@link constrainChild} if
   * {@link isConstrainChild} returns `true`. The value specifies the
   * portion of the child which is allowed to overlap the parent.
   */
  // defaultOverlap: number;
  defaultOverlap: number = 0.5;

  /**
   * Specifies the default parent to be used to insert new cells.
   * This is used in {@link getDefaultParent}.
   * @default null
   */
  // defaultParent: mxCell;
  defaultParent: mxCell | null = null;

  /**
   * Specifies the alternate edge style to be used if the main control point
   * on an edge is being double clicked.
   * @default null
   */
  // alternateEdgeStyle: string;
  alternateEdgeStyle: string | null = null;

  /**
   * Specifies the {@link mxImage} to be returned by {@link getBackgroundImage}.
   * @default null
   *
   * @example
   * ```javascript
   * var img = new mxImage('http://www.example.com/maps/examplemap.jpg', 1024, 768);
   * graph.setBackgroundImage(img);
   * graph.view.validate();
   * ```
   */
  // backgroundImage: mxImage;
  backgroundImage: mxImage | null = null;

  /**
   * Specifies if the background page should be visible.
   * Not yet implemented.
   * @default false
   */
  // pageVisible: boolean;
  pageVisible: boolean = false;

  /**
   * Specifies if a dashed line should be drawn between multiple pages.
   * If you change this value while a graph is being displayed then you
   * should call {@link sizeDidChange} to force an update of the display.
   * @default false
   */
  // pageBreaksVisible: boolean;
  pageBreaksVisible: boolean = false;

  /**
   * Specifies the color for page breaks.
   * @default gray
   */
  // pageBreakColor: string;
  pageBreakColor: string = 'gray';

  /**
   * Specifies the page breaks should be dashed.
   * @default true
   */
  // pageBreakDashed: boolean;
  pageBreakDashed: boolean = true;

  /**
   * Specifies the minimum distance in pixels for page breaks to be visible.
   * @default 20
   */
  // minPageBreakDist: number;
  minPageBreakDist: number = 20;

  /**
   * Specifies if the graph size should be rounded to the next page number in
   * {@link sizeDidChange}. This is only used if the graph container has scrollbars.
   * @default false
   */
  // preferPageSize: boolean;
  preferPageSize: boolean = false;

  /**
   * Specifies the page format for the background page.
   * This is used as the default in {@link mxPrintPreview} and for painting the background page
   * if {@link pageVisible} is `true` and the page breaks if {@link pageBreaksVisible} is `true`.
   * @default {@link mxConstants.PAGE_FORMAT_A4_PORTRAIT}
   */
  // pageFormat: mxRectangle;
  pageFormat: mxRectangle = new mxRectangle(...PAGE_FORMAT_A4_PORTRAIT);

  /**
   * Specifies the scale of the background page.
   * Not yet implemented.
   * @default 1.5
   */
  // pageScale: number;
  pageScale: number = 1.5;

  /**
   * Specifies the return value for {@link isEnabled}.
   * @default true
   */
  // enabled: boolean;
  enabled: boolean = true;

  /**
   * Specifies if {@link mxKeyHandler} should invoke {@link escape} when the escape key
   * is pressed.
   * @default true
   */
  // escapeEnabled: boolean;
  escapeEnabled: boolean = true;

  /**
   * If `true`, when editing is to be stopped by way of selection changing,
   * data in diagram changing or other means stopCellEditing is invoked, and
   * changes are saved. This is implemented in a focus handler in
   * {@link mxCellEditor}.
   * @default true
   */
  // invokesStopCellEditing: boolean;
  invokesStopCellEditing: boolean = true;

  /**
   * If `true`, pressing the enter key without pressing control or shift will stop
   * editing and accept the new value. This is used in {@link mxCellEditor} to stop
   * cell editing. Note: You can always use F2 and escape to stop editing.
   * @default false
   */
  // enterStopsCellEditing: boolean;
  enterStopsCellEditing: boolean = false;

  /**
   * Specifies if scrollbars should be used for panning in {@link panGraph} if
   * any scrollbars are available. If scrollbars are enabled in CSS, but no
   * scrollbars appear because the graph is smaller than the container size,
   * then no panning occurs if this is `true`.
   * @default true
   */
  // useScrollbarsForPanning: boolean;
  useScrollbarsForPanning: boolean = true;

  /**
   * Specifies the return value for {@link canExportCell}.
   * @default true
   */
  // exportEnabled: boolean;
  exportEnabled: boolean = true;

  /**
   * Specifies the return value for {@link canImportCell}.
   * @default true
   */
  // importEnabled: boolean;
  importEnabled: boolean = true;

  /**
   * Specifies the return value for {@link isCellLocked}.
   * @default false
   */
  // cellsLocked: boolean;
  cellsLocked: boolean = false;

  /**
   * Specifies the return value for {@link isCellCloneable}.
   * @default true
   */
  // cellsCloneable: boolean;
  cellsCloneable: boolean = true;

  /**
   * Specifies if folding (collapse and expand via an image icon in the graph
   * should be enabled).
   * @default true
   */
  // foldingEnabled: boolean;
  foldingEnabled: boolean = true;

  /**
   * Specifies the return value for {@link isCellEditable}.
   * @default true
   */
  // cellsEditable: boolean;
  cellsEditable: boolean = true;

  /**
   * Specifies the return value for {@link isCellDeletable}.
   * @default true
   */
  // cellsDeletable: boolean;
  cellsDeletable: boolean = true;

  /**
   * Specifies the return value for {@link isCellMovable}.
   * @default true
   */
  // cellsMovable: boolean;
  cellsMovable: boolean = true;

  /**
   * Specifies the return value for edges in {@link isLabelMovable}.
   * @default true
   */
  // edgeLabelsMovable: boolean;
  edgeLabelsMovable: boolean = true;

  /**
   * Specifies the return value for vertices in {@link isLabelMovable}.
   * @default false
   */
  // vertexLabelsMovable: boolean;
  vertexLabelsMovable: boolean = false;

  /**
   * Specifies the return value for {@link isDropEnabled}.
   * @default false
   */
  // dropEnabled: boolean;
  dropEnabled: boolean = false;

  /**
   * Specifies if dropping onto edges should be enabled. This is ignored if
   * {@link dropEnabled} is `false`. If enabled, it will call {@link splitEdge} to carry
   * out the drop operation.
   * @default true
   */
  // splitEnabled: boolean;
  splitEnabled: boolean = true;

  /**
   * Specifies the return value for {@link isCellsResizable}.
   * @default true
   */
  // cellsResizable: boolean;
  cellsResizable: boolean = true;

  /**
   * Specifies the return value for {@link isCellsBendable}.
   * @default true
   */
  // cellsBendable: boolean;
  cellsBendable: boolean = true;

  /**
   * Specifies the return value for {@link isCellsSelectable}.
   * @default true
   */
  // cellsSelectable: boolean;
  cellsSelectable: boolean = true;

  /**
   * Specifies the return value for {@link isCellsDisconnectable}.
   * @default true
   */
  // cellsDisconnectable: boolean;
  cellsDisconnectable: boolean = true;

  /**
   * Specifies if the graph should automatically update the cell size after an
   * edit. This is used in {@link isAutoSizeCell}.
   * @default false
   */
  // autoSizeCells: boolean;
  autoSizeCells: boolean = false;

  /**
   * Specifies if autoSize style should be applied when cells are added.
   * @default false
   */
  // autoSizeCellsOnAdd: boolean;
  autoSizeCellsOnAdd: boolean = false;

  /**
   * Specifies if the graph should automatically scroll if the mouse goes near
   * the container edge while dragging. This is only taken into account if the
   * container has scrollbars.
   *
   * If you need this to work without scrollbars then set {@link ignoreScrollbars} to
   * true. Please consult the {@link ignoreScrollbars} for details. In general, with
   * no scrollbars, the use of {@link allowAutoPanning} is recommended.
   * @default true
   */
  // autoScroll: boolean;
  autoScroll: boolean = true;

  /**
   * Specifies if the graph should automatically scroll regardless of the
   * scrollbars. This will scroll the container using positive values for
   * scroll positions (ie usually only rightwards and downwards). To avoid
   * possible conflicts with panning, set {@link translateToScrollPosition} to `true`.
   */
  // ignoreScrollbars: boolean;
  ignoreScrollbars: boolean = false;

  /**
   * Specifies if the graph should automatically convert the current scroll
   * position to a translate in the graph view when a mouseUp event is received.
   * This can be used to avoid conflicts when using {@link autoScroll} and
   * {@link ignoreScrollbars} with no scrollbars in the container.
   */
  // translateToScrollPosition: boolean;
  translateToScrollPosition: boolean = false;

  /**
   * Specifies if autoscrolling should be carried out via mxPanningManager even
   * if the container has scrollbars. This disables {@link scrollPointToVisible} and
   * uses {@link mxPanningManager} instead. If this is true then {@link autoExtend} is
   * disabled. It should only be used with a scroll buffer or when scollbars
   * are visible and scrollable in all directions.
   * @default false
   */
  // timerAutoScroll: boolean;
  timerAutoScroll: boolean = false;

  /**
   * Specifies if panning via {@link panGraph} should be allowed to implement autoscroll
   * if no scrollbars are available in {@link scrollPointToVisible}. To enable panning
   * inside the container, near the edge, set {@link mxPanningManager.border} to a
   * positive value.
   * @default false
   */
  // allowAutoPanning: boolean;
  allowAutoPanning: boolean = false;

  /**
   * Specifies if the size of the graph should be automatically extended if the
   * mouse goes near the container edge while dragging. This is only taken into
   * account if the container has scrollbars. See {@link autoScroll}.
   * @default true
   */
  // autoExtend: boolean;
  autoExtend: boolean = true;

  /**
   * {@link mxRectangle} that specifies the area in which all cells in the diagram
   * should be placed. Uses in {@link getMaximumGraphBounds}. Use a width or height of
   * `0` if you only want to give a upper, left corner.
   */
  // maximumGraphBounds: mxRectangle;
  maximumGraphBounds: mxRectangle | null = null;

  /**
   * {@link mxRectangle} that specifies the minimum size of the graph. This is ignored
   * if the graph container has no scrollbars.
   * @default null
   */
  // minimumGraphSize: mxRectangle;
  minimumGraphSize: mxRectangle | null = null;

  /**
   * {@link mxRectangle} that specifies the minimum size of the {@link container} if
   * {@link resizeContainer} is `true`.
   */
  // minimumContainerSize: mxRectangle;
  minimumContainerSize: mxRectangle | null = null;

  /**
   * {@link mxRectangle} that specifies the maximum size of the container if
   * {@link resizeContainer} is `true`.
   */
  // maximumContainerSize: mxRectangle;
  maximumContainerSize: mxRectangle | null = null;

  /**
   * Specifies if the container should be resized to the graph size when
   * the graph size has changed.
   * @default false
   */
  // resizeContainer: boolean;
  resizeContainer: boolean = false;

  /**
   * Border to be added to the bottom and right side when the container is
   * being resized after the graph has been changed.
   * @default 0
   */
  // border: number;
  border: number = 0;

  /**
   * Specifies if edges should appear in the foreground regardless of their order
   * in the model. If {@link keepEdgesInForeground} and {@link keepEdgesInBackground} are
   * both `true` then the normal order is applied.
   * @default false
   */
  // keepEdgesInForeground: boolean;
  keepEdgesInForeground: boolean = false;

  /**
   * Specifies if edges should appear in the background regardless of their order
   * in the model. If {@link keepEdgesInForeground} and {@link keepEdgesInBackground} are
   * both `true` then the normal order is applied.
   * @default false
   */
  // keepEdgesInBackground: boolean;
  keepEdgesInBackground: boolean = false;

  /**
   * Specifies if negative coordinates for vertices are allowed.
   * @default true
   */
  // allowNegativeCoordinates: boolean;
  allowNegativeCoordinates: boolean = true;

  /**
   * Specifies if a child should be constrained inside the parent bounds after a
   * move or resize of the child.
   * @default true
   */
  // constrainChildren: boolean;
  constrainChildren: boolean = true;

  /**
   * Specifies if child cells with relative geometries should be constrained
   * inside the parent bounds, if {@link constrainChildren} is `true`, and/or the
   * {@link maximumGraphBounds}.
   * @default false
   */
  // constrainRelativeChildren: boolean;
  constrainRelativeChildren: boolean = false;

  /**
   * Specifies if a parent should contain the child bounds after a resize of
   * the child. This has precedence over {@link constrainChildren}.
   * @default true
   */
  // extendParents: boolean;
  extendParents: boolean = true;

  /**
   * Specifies if parents should be extended according to the {@link extendParents}
   * switch if cells are added.
   * @default true
   */
  // extendParentsOnAdd: boolean;
  extendParentsOnAdd: boolean = true;

  /**
   * Specifies if parents should be extended according to the {@link extendParents}
   * switch if cells are added.
   * @default false (for backwards compatibility)
   */
  // extendParentsOnMove: boolean;
  extendParentsOnMove: boolean = false;

  /**
   * Specifies the return value for {@link isRecursiveResize}.
   * @default false (for backwards compatibility)
   */
  // recursiveResize: boolean;
  recursiveResize: boolean = false;

  /**
   * Specifies if the cell size should be changed to the preferred size when
   * a cell is first collapsed.
   * @default true
   */
  // collapseToPreferredSize: boolean;
  collapseToPreferredSize: boolean = true;

  /**
   * Specifies the factor used for {@link zoomIn} and {@link zoomOut}.
   * @default 1.2 (120%)
   */
  // zoomFactor: number;
  zoomFactor: number = 1.2;

  /**
   * Specifies if the viewport should automatically contain the selection cells after a zoom operation.
   * @default false
   */
  // keepSelectionVisibleOnZoom: boolean;
  keepSelectionVisibleOnZoom: boolean = false;

  /**
   * Specifies if the zoom operations should go into the center of the actual
   * diagram rather than going from top, left.
   * @default true
   */
  // centerZoom: boolean;
  centerZoom: boolean = true;

  /**
   * Specifies if the scale and translate should be reset if the root changes in
   * the model.
   * @default true
   */
  // resetViewOnRootChange: boolean;
  resetViewOnRootChange: boolean = true;

  /**
   * Specifies if edge control points should be reset after the resize of a
   * connected cell.
   * @default false
   */
  // resetEdgesOnResize: boolean;
  resetEdgesOnResize: boolean = false;

  /**
   * Specifies if edge control points should be reset after the move of a
   * connected cell.
   * @default false
   */
  // resetEdgesOnMove: boolean;
  resetEdgesOnMove: boolean = false;

  /**
   * Specifies if edge control points should be reset after the the edge has been
   * reconnected.
   * @default true
   */
  // resetEdgesOnConnect: boolean;
  resetEdgesOnConnect: boolean = true;

  /**
   * Specifies if loops (aka self-references) are allowed.
   * @default false
   */
  // allowLoops: boolean;
  allowLoops: boolean = false;

  /**
   * {@link mxEdgeStyle} to be used for loops. This is a fallback for loops if the
   * {@link mxConstants.STYLE_LOOP} is undefined.
   * @default {@link mxEdgeStyle.Loop}
   */
  // defaultLoopStyle: any;
  defaultLoopStyle = mxEdgeStyle.Loop;

  /**
   * Specifies if multiple edges in the same direction between the same pair of
   * vertices are allowed.
   * @default true
   */
  // multigraph: boolean;
  multigraph: boolean = true;

  /**
   * Specifies if edges are connectable. This overrides the connectable field in edges.
   * @default false
   */
  // connectableEdges: boolean;
  connectableEdges: boolean = false;

  /**
   * Specifies if edges with disconnected terminals are allowed in the graph.
   * @default true
   */
  // allowDanglingEdges: boolean;
  allowDanglingEdges: boolean = true;

  /**
   * Specifies if edges that are cloned should be validated and only inserted
   * if they are valid.
   * @default true
   */
  // cloneInvalidEdges: boolean;
  cloneInvalidEdges: boolean = false;

  /**
   * Specifies if edges should be disconnected from their terminals when they
   * are moved.
   * @default true
   */
  // disconnectOnMove: boolean;
  disconnectOnMove: boolean = true;

  /**
   * Specifies if labels should be visible. This is used in {@link getLabel}. Default
   * is true.
   */
  // labelsVisible: boolean;
  labelsVisible: boolean = true;

  /**
   * Specifies the return value for {@link isHtmlLabel}.
   * @default false
   */
  // htmlLabels: boolean;
  htmlLabels: boolean = false;

  /**
   * Specifies if swimlanes should be selectable via the content if the
   * mouse is released.
   * @default true
   */
  // swimlaneSelectionEnabled: boolean;
  swimlaneSelectionEnabled: boolean = true;

  /**
   * Specifies if nesting of swimlanes is allowed.
   * @default true
   */
  // swimlaneNesting: boolean;
  swimlaneNesting: boolean = true;

  /**
   * The attribute used to find the color for the indicator if the indicator
   * color is set to 'swimlane'.
   * @default {@link 'fillColor'}
   */
  // swimlaneIndicatorColorAttribute: string;
  swimlaneIndicatorColorAttribute: string = 'fillColor';

  /**
   * Holds the list of image bundles.
   */
  // imageBundles: mxImageBundle[];
  imageBundles: mxImageBundle[] = [];

  /**
   * Specifies the minimum scale to be applied in {@link fit}. Set this to `null` to allow any value.
   * @default 0.1
   */
  // minFitScale: number;
  minFitScale: number = 0.1;

  /**
   * Specifies the maximum scale to be applied in {@link fit}. Set this to `null` to allow any value.
   * @default 8
   */
  // maxFitScale: number;
  maxFitScale: number = 8;

  /**
   * Current horizontal panning value.
   * @default 0
   */
  // panDx: number;
  panDx: number = 0;

  /**
   * Current vertical panning value.
   * @default 0
   */
  // panDy: number;
  panDy: number = 0;

  /**
   * Specifies the {@link mxImage} to indicate a collapsed state.
   * Default value is mxClient.imageBasePath + '/collapsed.gif'
   */
  // collapsedImage: mxImage;
  collapsedImage: mxImage = new mxImage(
    `${mxClient.imageBasePath}/collapsed.gif`,
    9,
    9
  );

  /**
   * Specifies the {@link mxImage} to indicate a expanded state.
   * Default value is mxClient.imageBasePath + '/expanded.gif'
   */
  // expandedImage: mxImage;
  expandedImage: mxImage = new mxImage(
    `${mxClient.imageBasePath}/expanded.gif`,
    9,
    9
  );

  /**
   * Specifies the {@link mxImage} for the image to be used to display a warning
   * overlay. See {@link setCellWarning}. Default value is mxClient.imageBasePath +
   * '/warning'.  The extension for the image depends on the platform. It is
   * '.png' on the Mac and '.gif' on all other platforms.
   */
  // warningImage: mxImage;
  warningImage: mxImage = new mxImage(
    `${mxClient.imageBasePath}/warning${mxClient.IS_MAC ? '.png' : '.gif'}`,
    16,
    16
  );

  /**
   * Specifies the resource key for the error message to be displayed in
   * non-multigraphs when two vertices are already connected. If the resource
   * for this key does not exist then the value is used as the error message.
   * @default 'alreadyConnected'
   */
  // alreadyConnectedResource: string;
  alreadyConnectedResource: string =
    mxClient.language != 'none' ? 'alreadyConnected' : '';

  /**
   * Specifies the resource key for the warning message to be displayed when
   * a collapsed cell contains validation errors. If the resource for this
   * key does not exist then the value is used as the warning message.
   * @default 'containsValidationErrors'
   */
  // containsValidationErrorsResource: string;
  containsValidationErrorsResource: string =
    mxClient.language != 'none' ? 'containsValidationErrors' : '';

  /**
   * Specifies the resource key for the tooltip on the collapse/expand icon.
   * If the resource for this key does not exist then the value is used as
   * the tooltip.
   * @default 'collapse-expand'
   */
  // collapseExpandResource: string;
  collapseExpandResource: string =
    mxClient.language != 'none' ? 'collapse-expand' : '';

  // TODO: Document me!!
  batchUpdate(fn: Function): void {
    (<mxGraphModel>this.getModel()).beginUpdate();
    try {
      fn();
    } finally {
      (<mxGraphModel>this.getModel()).endUpdate();
    }
  }

  /**
   * Creates the tooltip-, panning-, connection- and graph-handler (in this
   * order). This is called in the constructor before {@link init} is called.
   */
  // createHandlers(): void;
  createHandlers(): void {
    this.tooltipHandler = this.createTooltipHandler();
    this.tooltipHandler.setEnabled(false);
    this.selectionCellsHandler = this.createSelectionCellsHandler();
    this.connectionHandler = this.createConnectionHandler();
    this.connectionHandler.setEnabled(false);
    this.graphHandler = this.createGraphHandler();
    this.panningHandler = this.createPanningHandler();
    this.panningHandler.panningEnabled = false;
    this.popupMenuHandler = this.createPopupMenuHandler();
  }

  /**
   * Creates and returns a new {@link mxTooltipHandler} to be used in this graph.
   */
  // createTooltipHandler(): mxTooltipHandler;
  createTooltipHandler(): mxTooltipHandler {
    return new mxTooltipHandler(this);
  }

  /**
   * Creates and returns a new {@link mxTooltipHandler} to be used in this graph.
   */
  // createSelectionCellsHandler: mxSelectionCellsHandler;
  createSelectionCellsHandler(): mxSelectionCellsHandler {
    return new mxSelectionCellsHandler(this);
  }

  /**
   * Creates and returns a new {@link mxConnectionHandler} to be used in this graph.
   */
  // createConnectionHandler(): mxConnectionHandler;
  createConnectionHandler(): mxConnectionHandler {
    return new mxConnectionHandler(this);
  }

  /**
   * Creates and returns a new {@link mxGraphHandler} to be used in this graph.
   */
  // createGraphHandler(): mxGraphHandler;
  createGraphHandler(): mxGraphHandler {
    return new mxGraphHandler(this);
  }

  /**
   * Creates and returns a new {@link mxPanningHandler} to be used in this graph.
   */
  // createPanningHandler(): mxPanningHandler;
  createPanningHandler(): mxPanningHandler {
    return new mxPanningHandler(this);
  }

  /**
   * Creates and returns a new {@link mxPopupMenuHandler} to be used in this graph.
   */
  // createPopupMenuHandler(): mxPopupMenuHandler;
  createPopupMenuHandler(): mxPopupMenuHandler {
    return new mxPopupMenuHandler(this);
  }

  /**
   * Creates a new {@link mxGraphSelectionModel} to be used in this graph.
   */
  // createSelectionModel(): mxGraphSelectionModel;
  createSelectionModel(): mxGraphSelectionModel {
    return new mxGraphSelectionModel(this);
  }

  /**
   * Creates a new {@link mxGraphSelectionModel} to be used in this graph.
   */
  // createStylesheet(): mxStylesheet;
  createStylesheet(): mxStylesheet {
    return new mxStylesheet();
  }

  /**
   * Creates a new {@link mxGraphView} to be used in this graph.
   */
  // createGraphView(): mxGraphView;
  createGraphView(): mxGraphView {
    return new mxGraphView(this);
  }

  /**
   * Creates a new {@link mxCellRenderer} to be used in this graph.
   */
  // createCellRenderer(): mxCellRenderer;
  createCellRenderer(): mxCellRenderer {
    return new mxCellRenderer();
  }

  /**
   * Creates a new {@link mxCellEditor} to be used in this graph.
   */
  // createCellEditor(): mxCellEditor;
  createCellEditor(): mxCellEditor {
    return new mxCellEditor(this);
  }

  /**
   * Returns the {@link mxGraphModel} that contains the cells.
   */
  // getModel(): mxGraphModel;
  getModel(): mxGraphModel {
    return <mxGraphModel>this.model;
  }

  /**
   * Returns the {@link mxGraphView} that contains the {@link mxCellStates}.
   */
  // getView(): mxGraphView;
  getView(): mxGraphView {
    return <mxGraphView>this.view;
  }

  /**
   * Returns the {@link mxStylesheet} that defines the style.
   */
  // getStylesheet(): mxStylesheet;
  getStylesheet(): mxStylesheet | null {
    return this.stylesheet;
  }

  /**
   * Sets the {@link mxStylesheet} that defines the style.
   */
  // setStylesheet(stylesheet: mxStylesheet): void;
  setStylesheet(stylesheet: mxStylesheet | null): void {
    this.stylesheet = stylesheet;
  }

  /**
   * Returns the {@link mxGraphSelectionModel} that contains the selection.
   */
  // getSelectionModel(): mxGraphSelectionModel;
  getSelectionModel(): mxGraphSelectionModel {
    return <mxGraphSelectionModel>this.selectionModel;
  }

  /**
   * Sets the {@link mxSelectionModel} that contains the selection.
   */
  // setSelectionModel(selectionModel: mxGraphSelectionModel): void;
  setSelectionModel(selectionModel: mxGraphSelectionModel): void {
    this.selectionModel = selectionModel;
  }

  /**
   * Function: getSelectionCellsForChanges
   *
   * Returns the cells to be selected for the given array of changes.
   *
   * Parameters:
   *
   * ignoreFn - Optional function that takes a change and returns true if the
   * change should be ignored.
   *
   */
  getSelectionCellsForChanges(
    changes: any[],
    ignoreFn: Function | null = null
  ): mxCell[] {
    const dict = new mxDictionary();
    const cells: mxCell[] = [];

    const addCell = (cell: mxCell) => {
      if (!dict.get(cell) && this.getModel().contains(cell)) {
        if (cell.isEdge() || cell.isVertex()) {
          dict.put(cell, true);
          cells.push(cell);
        } else {
          const childCount = cell.getChildCount();

          for (let i = 0; i < childCount; i += 1) {
            addCell(<mxCell>cell.getChildAt(i));
          }
        }
      }
    };

    for (let i = 0; i < changes.length; i += 1) {
      const change = changes[i];

      if (
        change.constructor !== mxRootChange &&
        (ignoreFn == null || !ignoreFn(change))
      ) {
        let cell = null;

        if (change instanceof mxChildChange) {
          cell = change.child;
        } else if (change.cell != null && change.cell instanceof mxCell) {
          cell = change.cell;
        }

        if (cell != null) {
          addCell(cell);
        }
      }
    }
    return cells;
  }

  /**
   * Called when the graph model changes. Invokes {@link processChange} on each
   * item of the given array to update the view accordingly.
   *
   * @param changes Array that contains the individual changes.
   */
  // graphModelChanged(changes: any[]): void;
  graphModelChanged(changes: any[]) {
    for (let i = 0; i < changes.length; i += 1) {
      this.processChange(changes[i]);
    }

    this.updateSelection();
    this.getView().validate();
    this.sizeDidChange();
  }

  /**
   * Removes selection cells that are not in the model from the selection.
   */
  // updateSelection(): void;
  updateSelection(): void {
    const cells = this.getSelectionCells();
    const removed = [];

    for (let i = 0; i < cells.length; i += 1) {
      if (!this.getModel().contains(cells[i]) || !cells[i].isVisible()) {
        removed.push(cells[i]);
      } else {
        let par = cells[i].getParent();

        while (par != null && par !== this.getView().currentRoot) {
          if (par.isCollapsed() || !par.isVisible()) {
            removed.push(cells[i]);
            break;
          }

          par = par.getParent();
        }
      }
    }
    this.removeSelectionCells(removed);
  }

  /**
   * Processes the given change and invalidates the respective cached data
   * in {@link view}. This fires a {@link root} event if the root has changed in the
   * model.
   *
   * @param {(mxRootChange|mxChildChange|mxTerminalChange|mxGeometryChange|mxValueChange|mxStyleChange)} change - Object that represents the change on the model.
   */
  // processChange(change: any): void;
  processChange(change: any): void {
    // Resets the view settings, removes all cells and clears
    // the selection if the root changes.
    if (change instanceof mxRootChange) {
      this.clearSelection();
      this.setDefaultParent(null);
      this.removeStateForCell(change.previous);

      if (this.resetViewOnRootChange) {
        this.getView().scale = 1;
        this.getView().translate.x = 0;
        this.getView().translate.y = 0;
      }

      this.fireEvent(new mxEventObject(mxEvent.ROOT));
    }

    // Adds or removes a child to the view by online invaliding
    // the minimal required portions of the cache, namely, the
    // old and new parent and the child.
    else if (change instanceof mxChildChange) {
      const newParent = change.child.getParent();
      this.getView().invalidate(change.child, true, true);

      if (!this.getModel().contains(newParent) || newParent.isCollapsed()) {
        this.getView().invalidate(change.child, true, true);
        this.removeStateForCell(change.child);

        // Handles special case of current root of view being removed
        if (this.getView().currentRoot == change.child) {
          this.home();
        }
      }

      if (newParent != change.previous) {
        // Refreshes the collapse/expand icons on the parents
        if (newParent != null) {
          this.getView().invalidate(newParent, false, false);
        }

        if (change.previous != null) {
          this.getView().invalidate(change.previous, false, false);
        }
      }
    }

    // Handles two special cases where the shape does not need to be
    // recreated from scratch, it only needs to be invalidated.
    else if (
      change instanceof mxTerminalChange ||
      change instanceof mxGeometryChange
    ) {
      // Checks if the geometry has changed to avoid unnessecary revalidation
      if (
        change instanceof mxTerminalChange ||
        (change.previous == null && change.geometry != null) ||
        (change.previous != null && !change.previous.equals(change.geometry))
      ) {
        this.getView().invalidate(change.cell);
      }
    }

    // Handles two special cases where only the shape, but no
    // descendants need to be recreated
    else if (change instanceof mxValueChange) {
      this.getView().invalidate(change.cell, false, false);
    }

    // Requires a new mxShape in JavaScript
    else if (change instanceof mxStyleChange) {
      this.getView().invalidate(change.cell, true, true);
      const state = this.getView().getState(change.cell);

      if (state != null) {
        state.invalidStyle = true;
      }
    }

    // Removes the state from the cache by default
    else if (change.cell != null && change.cell instanceof mxCell) {
      this.removeStateForCell(change.cell);
    }
  }

  /**
   * Removes all cached information for the given cell and its descendants.
   * This is called when a cell was removed from the model.
   *
   * Paramters:
   *
   * @param cell {@link mxCell} that was removed from the model.
   */
  // removeStateForCell(cell: mxCell): void;
  removeStateForCell(cell: mxCell) {
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      this.removeStateForCell(<mxCell>cell.getChildAt(i));
    }

    this.getView().invalidate(cell, false, true);
    this.getView().removeState(cell);
  }

  /*****************************************************************************
   * Group: Overlays
   *****************************************************************************/

  /**
   * Adds an {@link mxCellOverlay} for the specified cell. This method fires an
   * {@link addoverlay} event and returns the new {@link mxCellOverlay}.
   *
   * @param cell {@link mxCell} to add the overlay for.
   * @param overlay {@link mxCellOverlay} to be added for the cell.
   */
  // addCellOverlay(cell: mxCell, overlay: mxCellOverlay): mxCellOverlay;
  addCellOverlay(cell: mxCell, overlay: mxCellOverlay): mxCellOverlay {
    if (cell.overlays == null) {
      cell.overlays = [];
    }
    cell.overlays.push(overlay);

    // Immediately update the cell display if the state exists
    const state = this.getView().getState(cell);
    if (state != null) {
      this.cellRenderer.redraw(state);
    }

    this.fireEvent(
      new mxEventObject(mxEvent.ADD_OVERLAY, 'cell', cell, 'overlay', overlay)
    );
    return overlay;
  }

  /**
   * Returns the array of {@link mxCellOverlays} for the given cell or null, if
   * no overlays are defined.
   *
   * @param cell {@link mxCell} whose overlays should be returned.
   */
  // getCellOverlays(cell: mxCell): mxCellOverlay[];
  getCellOverlays(cell: mxCell) {
    return cell.overlays;
  }

  /**
   * Removes and returns the given {@link mxCellOverlay} from the given cell. This
   * method fires a {@link removeoverlay} event. If no overlay is given, then all
   * overlays are removed using {@link removeOverlays}.
   *
   * @param cell {@link mxCell} whose overlay should be removed.
   * @param overlay Optional {@link mxCellOverlay} to be removed.
   */
  // removeCellOverlay(cell: mxCell, overlay: mxCellOverlay): mxCellOverlay;
  removeCellOverlay(cell: mxCell, overlay: mxCellOverlay | null = null): any {
    if (overlay == null) {
      this.removeCellOverlays(cell);
    } else {
      const index = cell.overlays ? cell.overlays.indexOf(overlay) : -1;

      if (index >= 0) {
        (<mxCellOverlay[]>cell.overlays).splice(index, 1);

        if ((<mxCellOverlay[]>cell.overlays).length === 0) {
          cell.overlays = null;
        }

        // Immediately updates the cell display if the state exists
        const state = this.getView().getState(cell);

        if (state != null) {
          this.cellRenderer.redraw(state);
        }

        this.fireEvent(
          new mxEventObject(
            mxEvent.REMOVE_OVERLAY,
            'cell',
            cell,
            'overlay',
            overlay
          )
        );
      } else {
        overlay = null;
      }
    }

    return overlay;
  }

  /**
   * Removes all {@link mxCellOverlays} from the given cell. This method
   * fires a {@link removeoverlay} event for each {@link mxCellOverlay} and returns
   * the array of {@link mxCellOverlays} that was removed from the cell.
   *
   * @param cell {@link mxCell} whose overlays should be removed
   */
  // removeCellOverlays(cell: mxCell): mxCellOverlay[];
  removeCellOverlays(cell: mxCell): any[] {
    const { overlays } = cell;

    if (overlays != null) {
      cell.overlays = null;

      // Immediately updates the cell display if the state exists
      const state = this.getView().getState(cell);

      if (state != null) {
        this.cellRenderer.redraw(state);
      }

      for (let i = 0; i < overlays.length; i += 1) {
        this.fireEvent(
          new mxEventObject(
            mxEvent.REMOVE_OVERLAY,
            'cell',
            cell,
            'overlay',
            overlays[i]
          )
        );
      }
    }

    return <mxCellOverlay[]>overlays;
  }

  /**
   * Removes all {@link mxCellOverlays} in the graph for the given cell and all its
   * descendants. If no cell is specified then all overlays are removed from
   * the graph. This implementation uses {@link removeCellOverlays} to remove the
   * overlays from the individual cells.
   *
   * @param cell Optional {@link mxCell} that represents the root of the subtree to
   * remove the overlays from. Default is the root in the model.
   */
  // clearCellOverlays(cell: mxCell): void;
  clearCellOverlays(cell: mxCell = <mxCell>this.getModel().getRoot()): void {
    this.removeCellOverlays(<mxCell>cell);

    // Recursively removes all overlays from the children
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);
      this.clearCellOverlays(<mxCell>child); // recurse
    }
  }

  /**
   * Creates an overlay for the given cell using the warning and image or
   * {@link warningImage} and returns the new {@link mxCellOverlay}. The warning is
   * displayed as a tooltip in a red font and may contain HTML markup. If
   * the warning is null or a zero length string, then all overlays are
   * removed from the cell.
   *
   * @example
   * ```javascript
   * graph.setCellWarning(cell, '{@link b}Warning:</b>: Hello, World!');
   * ```
   *
   * @param cell {@link mxCell} whose warning should be set.
   * @param warning String that represents the warning to be displayed.
   * @param img Optional {@link mxImage} to be used for the overlay. Default is
   * {@link warningImage}.
   * @param isSelect Optional boolean indicating if a click on the overlay
   * should select the corresponding cell. Default is `false`.
   */
  // setCellWarning(cell: mxCell, warning: string, img?: mxImage, isSelect?: boolean): mxCellOverlay;
  setCellWarning(
    cell: mxCell,
    warning: string | null = null,
    img: mxImage | null = null,
    isSelect: boolean = false
  ) {
    if (warning != null && warning.length > 0) {
      img = img != null ? img : this.warningImage;

      // Creates the overlay with the image and warning
      const overlay = new mxCellOverlay(
        img,
        `<font color=red>${warning}</font>`
      );

      // Adds a handler for single mouseclicks to select the cell
      if (isSelect) {
        overlay.addListener(mxEvent.CLICK, (sender: any, evt: MouseEvent) => {
          if (this.isEnabled()) {
            this.setSelectionCell(cell);
          }
        });
      }

      // Sets and returns the overlay in the graph
      return this.addCellOverlay(cell, overlay);
    }
    this.removeCellOverlays(cell);

    return null;
  }

  /*****************************************************************************
   * Group: In-place editing
   *****************************************************************************/

  /**
   * Calls {@link startEditingAtCell} using the given cell or the first selection
   * cell.
   *
   * @param evt Optional mouse event that triggered the editing.
   */
  // startEditing(evt?: MouseEvent): void;
  startEditing(evt: MouseEvent) {
    this.startEditingAtCell(null, evt);
  }

  /**
   * Fires a {@link startEditing} event and invokes {@link mxCellEditor.startEditing}
   * on {@link editor}. After editing was started, a {@link editingStarted} event is
   * fired.
   *
   * @param cell {@link mxCell} to start the in-place editor for.
   * @param evt Optional mouse event that triggered the editing.
   */
  // startEditingAtCell(cell?: mxCell, evt?: MouseEvent): void;
  startEditingAtCell(cell: mxCell | null = null, evt: MouseEvent): void {
    if (evt == null || !isMultiTouchEvent(evt)) {
      if (cell == null) {
        cell = this.getSelectionCell();
        if (cell != null && !this.isCellEditable(cell)) {
          cell = null;
        }
      }

      if (cell != null) {
        this.fireEvent(
          new mxEventObject(mxEvent.START_EDITING, 'cell', cell, 'event', evt)
        );
        (<mxCellEditor>this.cellEditor).startEditing(cell, evt);
        this.fireEvent(
          new mxEventObject(mxEvent.EDITING_STARTED, 'cell', cell, 'event', evt)
        );
      }
    }
  }

  /**
   * Returns the initial value for in-place editing. This implementation
   * returns {@link convertValueToString} for the given cell. If this function is
   * overridden, then {@link mxGraphModel.valueForCellChanged} should take care
   * of correctly storing the actual new value inside the user object.
   *
   * @param cell {@link mxCell} for which the initial editing value should be returned.
   * @param evt Optional mouse event that triggered the editor.
   */
  // getEditingValue(cell: mxCell, evt: MouseEvent): string;
  getEditingValue(cell: mxCell, evt: MouseEvent): string | null {
    return this.convertValueToString(cell);
  }

  /**
   * Stops the current editing  and fires a {@link editingStopped} event.
   *
   * @param cancel Boolean that specifies if the current editing value
   * should be stored.
   */
  // stopEditing(cancel: boolean): void;
  stopEditing(cancel: boolean = false): void {
    (<mxCellEditor>this.cellEditor).stopEditing(cancel);
    this.fireEvent(
      new mxEventObject(mxEvent.EDITING_STOPPED, 'cancel', cancel)
    );
  }

  /**
   * Sets the label of the specified cell to the given value using
   * {@link cellLabelChanged} and fires {@link mxEvent.LABEL_CHANGED} while the
   * transaction is in progress. Returns the cell whose label was changed.
   *
   * @param cell {@link mxCell} whose label should be changed.
   * @param value New label to be assigned.
   * @param evt Optional event that triggered the change.
   */
  // labelChanged(cell: mxCell, value: any, evt?: MouseEvent): mxCell;
  labelChanged(cell: mxCell, value: any, evt: MouseEvent): mxCell {
    this.getModel().beginUpdate();
    try {
      const old = cell.value;
      this.cellLabelChanged(cell, value, this.isAutoSizeCell(cell));
      this.fireEvent(
        new mxEventObject(
          mxEvent.LABEL_CHANGED,
          'cell',
          cell,
          'value',
          value,
          'old',
          old,
          'event',
          evt
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
    return cell;
  }

  /**
   * Sets the new label for a cell. If autoSize is true then
   * {@link cellSizeUpdated} will be called.
   *
   * In the following example, the function is extended to map changes to
   * attributes in an XML node, as shown in {@link convertValueToString}.
   * Alternatively, the handling of this can be implemented as shown in
   * {@link mxGraphModel.valueForCellChanged} without the need to clone the
   * user object.
   *
   * ```javascript
   * var graphCellLabelChanged = graph.cellLabelChanged;
   * graph.cellLabelChanged = function(cell, newValue, autoSize)
   * {
   * 	// Cloned for correct undo/redo
   * 	var elt = cell.value.cloneNode(true);
   *  elt.setAttribute('label', newValue);
   *
   *  newValue = elt;
   *  graphCellLabelChanged.apply(this, arguments);
   * };
   * ```
   *
   * @param cell {@link mxCell} whose label should be changed.
   * @param value New label to be assigned.
   * @param autoSize Boolean that specifies if {@link cellSizeUpdated} should be called.
   */
  // cellLabelChanged(cell: mxCell, value: any, autoSize?: boolean): void;
  cellLabelChanged(cell: mxCell, value: any, autoSize: boolean = false): void {
    this.batchUpdate(() => {
      this.getModel().setValue(cell, value);
      if (autoSize) {
        this.cellSizeUpdated(cell, false);
      }
    });
  }

  /*****************************************************************************
   * Group: Event processing
   *****************************************************************************/

  /**
   * Processes an escape keystroke.
   *
   * @param evt Mouseevent that represents the keystroke.
   */
  // escape(evt?: MouseEvent): void;
  escape(evt: MouseEvent): void {
    this.fireEvent(new mxEventObject(mxEvent.ESCAPE, 'event', evt));
  }

  /**
   * Processes a singleclick on an optional cell and fires a {@link click} event.
   * The click event is fired initially. If the graph is enabled and the
   * event has not been consumed, then the cell is selected using
   * {@link selectCellForEvent} or the selection is cleared using
   * {@link clearSelection}. The events consumed state is set to true if the
   * corresponding {@link mxMouseEvent} has been consumed.
   *
   * To handle a click event, use the following code.
   *
   * ```javascript
   * graph.addListener(mxEvent.CLICK, function(sender, evt)
   * {
   *   var e = evt.getProperty('event'); // mouse event
   *   var cell = evt.getProperty('cell'); // cell may be null
   *
   *   if (cell != null)
   *   {
   *     // Do something useful with cell and consume the event
   *     evt.consume();
   *   }
   * });
   * ```
   *
   * @param me {@link mxMouseEvent} that represents the single click.
   */
  // click(me: mxMouseEvent): void;
  click(me: mxMouseEvent): boolean {
    const evt = me.getEvent();
    let cell = me.getCell();
    const mxe = new mxEventObject(mxEvent.CLICK, 'event', evt, 'cell', cell);

    if (me.isConsumed()) {
      mxe.consume();
    }

    this.fireEvent(mxe);

    if (this.isEnabled() && !isConsumed(evt) && !mxe.isConsumed()) {
      if (cell != null) {
        if (this.isTransparentClickEvent(evt)) {
          let active = false;

          const tmp = this.getCellAt(
            me.graphX,
            me.graphY,
            null,
            false,
            false,
            (state: mxCellState): boolean => {
              const selected = this.isCellSelected(<mxCell>state.cell);
              active = active || selected;

              return (
                !active ||
                selected ||
                (state.cell !== cell &&
                  this.getModel().isAncestor(state.cell, cell))
              );
            }
          );

          if (tmp != null) {
            cell = tmp;
          }
        }
      } else if (this.isSwimlaneSelectionEnabled()) {
        cell = this.getSwimlaneAt(me.getGraphX(), me.getGraphY());

        if (cell != null && (!this.isToggleEvent(evt) || !isAltDown(evt))) {
          let temp = cell;
          let swimlanes = [];

          while (temp != null) {
            temp = temp.getParent();
            const state = this.getView().getState(temp);

            if (this.isSwimlane(temp) && state != null) {
              swimlanes.push(temp);
            }
          }

          // Selects ancestors for selected swimlanes
          if (swimlanes.length > 0) {
            swimlanes = swimlanes.reverse();
            swimlanes.splice(0, 0, cell);
            swimlanes.push(cell);

            for (let i = 0; i < swimlanes.length - 1; i += 1) {
              if (this.isCellSelected(swimlanes[i])) {
                cell = swimlanes[this.isToggleEvent(evt) ? i : i + 1];
              }
            }
          }
        }
      }

      if (cell != null) {
        this.selectCellForEvent(cell, evt);
      } else if (!this.isToggleEvent(evt)) {
        this.clearSelection();
      }
    }
    return false;
  }

  /**
   * Returns true if any sibling of the given cell is selected.
   */
  // isSiblingSelected(cell: mxCell): boolean;
  isSiblingSelected(cell: mxCell): boolean {
    const parent = <mxCell>cell.getParent();
    const childCount = parent.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = <mxCell>parent.getChildAt(i);
      if (cell !== child && this.isCellSelected(child)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Processes a doubleclick on an optional cell and fires a {@link dblclick}
   * event. The event is fired initially. If the graph is enabled and the
   * event has not been consumed, then {@link edit} is called with the given
   * cell. The event is ignored if no cell was specified.
   *
   * Example for overriding this method.
   *
   * ```javascript
   * graph.dblClick = function(evt, cell)
   * {
   *   var mxe = new mxEventObject(mxEvent.DOUBLE_CLICK, 'event', evt, 'cell', cell);
   *   this.fireEvent(mxe);
   *
   *   if (this.isEnabled() && !mxEvent.isConsumed(evt) && !mxe.isConsumed())
   *   {
   * 	   mxUtils.alert('Hello, World!');
   *     mxe.consume();
   *   }
   * }
   * ```
   *
   * Example listener for this event.
   *
   * ```javascript
   * graph.addListener(mxEvent.DOUBLE_CLICK, function(sender, evt)
   * {
   *   var cell = evt.getProperty('cell');
   *   // do something with the cell and consume the
   *   // event to prevent in-place editing from start
   * });
   * ```
   *
   * @param evt Mouseevent that represents the doubleclick.
   * @param cell Optional {@link mxCell} under the mousepointer.
   */
  // dblClick(evt: MouseEvent, cell?: mxCell): void;
  dblClick(evt: MouseEvent, cell: mxCell | null = null): void {
    const mxe = new mxEventObject(
      mxEvent.DOUBLE_CLICK,
      'event',
      evt,
      'cell',
      cell
    );
    this.fireEvent(mxe);

    // Handles the event if it has not been consumed
    if (
      this.isEnabled() &&
      !isConsumed(evt) &&
      !mxe.isConsumed() &&
      cell != null &&
      this.isCellEditable(cell) &&
      !this.isEditing(cell)
    ) {
      this.startEditingAtCell(cell, evt);
      mxEvent.consume(evt);
    }
  }

  /**
   * Handles the {@link mxMouseEvent} by highlighting the {@link mxCellState}.
   *
   * @param me {@link mxMouseEvent} that represents the touch event.
   * @param state Optional {@link mxCellState} that is associated with the event.
   */
  // tapAndHold(me: mxMouseEvent): void;
  tapAndHold(me: mxMouseEvent): void {
    const evt = me.getEvent();
    const mxe = new mxEventObject(
      mxEvent.TAP_AND_HOLD,
      'event',
      evt,
      'cell',
      me.getCell()
    );
    const panningHandler = <mxPanningHandler>this.panningHandler;
    const connectionHandler = <mxConnectionHandler>this.connectionHandler;

    // LATER: Check if event should be consumed if me is consumed
    this.fireEvent(mxe);

    if (mxe.isConsumed()) {
      // Resets the state of the panning handler
      panningHandler.panningTrigger = false;
    }

    // Handles the event if it has not been consumed
    if (
      this.isEnabled() &&
      !isConsumed(evt) &&
      !mxe.isConsumed() &&
      connectionHandler.isEnabled()
    ) {
      const state = this.getView().getState(
        connectionHandler.marker.getCell(me)
      );

      if (state != null) {
        connectionHandler.marker.currentColor =
          connectionHandler.marker.validColor;
        connectionHandler.marker.markedState = state;
        connectionHandler.marker.mark();

        connectionHandler.first = new mxPoint(me.getGraphX(), me.getGraphY());
        connectionHandler.edgeState = connectionHandler.createEdgeState(me);
        connectionHandler.previous = state;
        connectionHandler.fireEvent(
          new mxEventObject(mxEvent.START, 'state', connectionHandler.previous)
        );
      }
    }
  }

  /**
   * Scrolls the graph to the given point, extending the graph container if
   * specified.
   */
  // scrollPointToVisible(x: number, y: number, extend?: boolean, border?: number): void;
  scrollPointToVisible(
    x: number,
    y: number,
    extend: boolean,
    border: number = 20
  ): void {
    if (
      !this.timerAutoScroll &&
      (this.ignoreScrollbars || mxUtils.hasScrollbars(this.container))
    ) {
      const c = <HTMLElement>this.container;

      if (
        x >= c.scrollLeft &&
        y >= c.scrollTop &&
        x <= c.scrollLeft + c.clientWidth &&
        y <= c.scrollTop + c.clientHeight
      ) {
        let dx = c.scrollLeft + c.clientWidth - x;

        if (dx < border) {
          const old = c.scrollLeft;
          c.scrollLeft += border - dx;

          // Automatically extends the canvas size to the bottom, right
          // if the event is outside of the canvas and the edge of the
          // canvas has been reached. Notes: Needs fix for IE.
          if (extend && old === c.scrollLeft) {
            // @ts-ignore
            const root = this.getView().getDrawPane().ownerSVGElement;
            const width = c.scrollWidth + border - dx;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            // @ts-ignore
            root.style.width = `${width}px`;

            c.scrollLeft += border - dx;
          }
        } else {
          dx = x - c.scrollLeft;

          if (dx < border) {
            c.scrollLeft -= border - dx;
          }
        }

        let dy = c.scrollTop + c.clientHeight - y;

        if (dy < border) {
          const old = c.scrollTop;
          c.scrollTop += border - dy;

          if (old == c.scrollTop && extend) {
            // @ts-ignore
            const root = this.getView().getDrawPane().ownerSVGElement;
            const height = c.scrollHeight + border - dy;

            // Updates the clipping region. This is an expensive
            // operation that should not be executed too often.
            // @ts-ignore
            root.style.height = `${height}px`;

            c.scrollTop += border - dy;
          }
        } else {
          dy = y - c.scrollTop;

          if (dy < border) {
            c.scrollTop -= border - dy;
          }
        }
      }
    } else if (
      this.allowAutoPanning &&
      !(<mxPanningHandler>this.panningHandler).isActive()
    ) {
      if (this.panningManager == null) {
        this.panningManager = this.createPanningManager();
      }
      this.panningManager.panTo(x + this.panDx, y + this.panDy);
    }
  }

  /**
   * Creates and returns an {@link mxPanningManager}.
   */
  // createPanningManager(): mxPanningManager;
  createPanningManager(): mxPanningManager {
    return new mxPanningManager(this);
  }

  /**
   * Returns the size of the border and padding on all four sides of the
   * container. The left, top, right and bottom borders are stored in the x, y,
   * width and height of the returned {@link mxRectangle}, respectively.
   */
  // getBorderSizes(): mxRectangle;
  getBorderSizes(): mxRectangle {
    const css = <CSSStyleDeclaration>mxUtils.getCurrentStyle(this.container);

    return new mxRectangle(
      mxUtils.parseCssNumber(css.paddingLeft) +
        (css.borderLeftStyle != 'none'
          ? mxUtils.parseCssNumber(css.borderLeftWidth)
          : 0),
      mxUtils.parseCssNumber(css.paddingTop) +
        (css.borderTopStyle != 'none'
          ? mxUtils.parseCssNumber(css.borderTopWidth)
          : 0),
      mxUtils.parseCssNumber(css.paddingRight) +
        (css.borderRightStyle != 'none'
          ? mxUtils.parseCssNumber(css.borderRightWidth)
          : 0),
      mxUtils.parseCssNumber(css.paddingBottom) +
        (css.borderBottomStyle != 'none'
          ? mxUtils.parseCssNumber(css.borderBottomWidth)
          : 0)
    );
  }

  /**
   * Returns the preferred size of the background page if {@link preferPageSize} is true.
   */
  // getPreferredPageSize(bounds: mxRectangle, width: number, height: number): mxRectangle;
  getPreferredPageSize(
    bounds: mxRectangle,
    width: number,
    height: number
  ): mxRectangle {
    const { scale } = this.view;
    const tr = this.getView().translate;
    const fmt = this.pageFormat;
    const ps = this.pageScale;
    const page = new mxRectangle(
      0,
      0,
      Math.ceil(fmt.width * ps),
      Math.ceil(fmt.height * ps)
    );

    const hCount = this.pageBreaksVisible ? Math.ceil(width / page.width) : 1;
    const vCount = this.pageBreaksVisible ? Math.ceil(height / page.height) : 1;

    return new mxRectangle(
      0,
      0,
      hCount * page.width + 2 + tr.x,
      vCount * page.height + 2 + tr.y
    );
  }

  /**
   * Function: fit
   *
   * Scales the graph such that the complete diagram fits into <container> and
   * returns the current scale in the view. To fit an initial graph prior to
   * rendering, set <mxGraphView.rendering> to false prior to changing the model
   * and execute the following after changing the model.
   *
   * (code)
   * graph.fit();
   * graph.view.rendering = true;
   * graph.refresh();
   * (end)
   *
   * To fit and center the graph, the following code can be used.
   *
   * (code)
   * let margin = 2;
   * let max = 3;
   *
   * let bounds = graph.getGraphBounds();
   * let cw = graph.container.clientWidth - margin;
   * let ch = graph.container.clientHeight - margin;
   * let w = bounds.width / graph.view.scale;
   * let h = bounds.height / graph.view.scale;
   * let s = Math.min(max, Math.min(cw / w, ch / h));
   *
   * graph.view.scaleAndTranslate(s,
   *   (margin + cw - w * s) / (2 * s) - bounds.x / graph.view.scale,
   *   (margin + ch - h * s) / (2 * s) - bounds.y / graph.view.scale);
   * (end)
   *
   * Parameters:
   *
   * border - Optional number that specifies the border. Default is <border>.
   * keepOrigin - Optional boolean that specifies if the translate should be
   * changed. Default is false.
   * margin - Optional margin in pixels. Default is 0.
   * enabled - Optional boolean that specifies if the scale should be set or
   * just returned. Default is true.
   * ignoreWidth - Optional boolean that specifies if the width should be
   * ignored. Default is false.
   * ignoreHeight - Optional boolean that specifies if the height should be
   * ignored. Default is false.
   * maxHeight - Optional maximum height.
   */
  fit(
    border: number = this.getBorder(),
    keepOrigin: boolean = false,
    margin: number = 0,
    enabled: boolean = true,
    ignoreWidth: boolean = false,
    ignoreHeight: boolean = false,
    maxHeight: number | null = null
  ): number {
    if (this.container != null) {
      // Adds spacing and border from css
      const cssBorder = this.getBorderSizes();
      let w1: number =
        this.container.offsetWidth - cssBorder.x - cssBorder.width - 1;
      let h1: number =
        maxHeight != null
          ? maxHeight
          : this.container.offsetHeight - cssBorder.y - cssBorder.height - 1;
      let bounds = this.getView().getGraphBounds();

      if (bounds.width > 0 && bounds.height > 0) {
        if (keepOrigin && bounds.x != null && bounds.y != null) {
          bounds = bounds.clone();
          bounds.width += bounds.x;
          bounds.height += bounds.y;
          bounds.x = 0;
          bounds.y = 0;
        }

        // LATER: Use unscaled bounding boxes to fix rounding errors
        const s = this.getView().scale;
        let w2 = bounds.width / s;
        let h2 = bounds.height / s;

        // Fits to the size of the background image if required
        if (this.backgroundImage != null) {
          w2 = Math.max(w2, this.backgroundImage.width - bounds.x / s);
          h2 = Math.max(h2, this.backgroundImage.height - bounds.y / s);
        }

        const b: number = (keepOrigin ? border : 2 * border) + margin + 1;

        w1 -= b;
        h1 -= b;

        let s2 = ignoreWidth
          ? h1 / h2
          : ignoreHeight
          ? w1 / w2
          : Math.min(w1 / w2, h1 / h2);

        if (this.minFitScale != null) {
          s2 = Math.max(s2, this.minFitScale);
        }

        if (this.maxFitScale != null) {
          s2 = Math.min(s2, this.maxFitScale);
        }

        if (enabled) {
          if (!keepOrigin) {
            if (!mxUtils.hasScrollbars(this.container)) {
              const x0 =
                bounds.x != null
                  ? Math.floor(
                      this.getView().translate.x -
                        bounds.x / s +
                        border / s2 +
                        margin / 2
                    )
                  : border;
              const y0 =
                bounds.y != null
                  ? Math.floor(
                      this.getView().translate.y -
                        bounds.y / s +
                        border / s2 +
                        margin / 2
                    )
                  : border;

              this.getView().scaleAndTranslate(s2, x0, y0);
            } else {
              this.getView().setScale(s2);
              const b2 = this.getGraphBounds();

              if (b2.x != null) {
                this.container.scrollLeft = b2.x;
              }

              if (b2.y != null) {
                this.container.scrollTop = b2.y;
              }
            }
          } else if (this.getView().scale != s2) {
            this.getView().setScale(s2);
          }
        } else {
          return s2;
        }
      }
    }
    return this.getView().scale;
  }

  /**
   * Called when the size of the graph has changed. This implementation fires
   * a {@link size} event after updating the clipping region of the SVG element in
   * SVG-bases browsers.
   */
  // sizeDidChange(): void;
  sizeDidChange(): void {
    const bounds = this.getGraphBounds();

    if (this.container != null) {
      const border = this.getBorder();

      let width = Math.max(0, bounds.x) + bounds.width + 2 * border;
      let height = Math.max(0, bounds.y) + bounds.height + 2 * border;

      if (this.minimumContainerSize != null) {
        width = Math.max(width, this.minimumContainerSize.width);
        height = Math.max(height, this.minimumContainerSize.height);
      }

      if (this.resizeContainer) {
        this.doResizeContainer(width, height);
      }

      if (this.preferPageSize || this.pageVisible) {
        const size = this.getPreferredPageSize(
          bounds,
          Math.max(1, width),
          Math.max(1, height)
        );

        if (size != null) {
          width = size.width * this.getView().scale;
          height = size.height * this.getView().scale;
        }
      }

      if (this.minimumGraphSize != null) {
        width = Math.max(
          width,
          this.minimumGraphSize.width * this.getView().scale
        );
        height = Math.max(
          height,
          this.minimumGraphSize.height * this.getView().scale
        );
      }

      width = Math.ceil(width);
      height = Math.ceil(height);

      // @ts-ignore
      const root = this.getView().getDrawPane().ownerSVGElement;

      if (root != null) {
        root.style.minWidth = `${Math.max(1, width)}px`;
        root.style.minHeight = `${Math.max(1, height)}px`;
        root.style.width = '100%';
        root.style.height = '100%';
      }

      this.updatePageBreaks(this.pageBreaksVisible, width, height);
    }
    this.fireEvent(new mxEventObject(mxEvent.SIZE, 'bounds', bounds));
  }

  /**
   * Resizes the container for the given graph width and height.
   */
  // doResizeContainer(width: number, height: number): void;
  doResizeContainer(width: number, height: number): void {
    if (this.maximumContainerSize != null) {
      width = Math.min(this.maximumContainerSize.width, width);
      height = Math.min(this.maximumContainerSize.height, height);
    }
    const container = <HTMLElement>this.container;
    container.style.width = `${Math.ceil(width)}px`;
    container.style.height = `${Math.ceil(height)}px`;
  }

  /**
   * Invokes from {@link sizeDidChange} to redraw the page breaks.
   *
   * @param visible Boolean that specifies if page breaks should be shown.
   * @param width Specifies the width of the container in pixels.
   * @param height Specifies the height of the container in pixels.
   */
  // updatePageBreaks(visible: boolean, width: number, height: number): void;
  updatePageBreaks(visible: boolean, width: number, height: number) {
    const { scale } = this.view;
    const tr = this.getView().translate;
    const fmt = this.pageFormat;
    const ps = scale * this.pageScale;
    const bounds = new mxRectangle(0, 0, fmt.width * ps, fmt.height * ps);

    const gb = mxRectangle.fromRectangle(this.getGraphBounds());
    gb.width = Math.max(1, gb.width);
    gb.height = Math.max(1, gb.height);

    bounds.x =
      Math.floor((gb.x - tr.x * scale) / bounds.width) * bounds.width +
      tr.x * scale;
    bounds.y =
      Math.floor((gb.y - tr.y * scale) / bounds.height) * bounds.height +
      tr.y * scale;

    gb.width =
      Math.ceil((gb.width + (gb.x - bounds.x)) / bounds.width) * bounds.width;
    gb.height =
      Math.ceil((gb.height + (gb.y - bounds.y)) / bounds.height) *
      bounds.height;

    // Does not show page breaks if the scale is too small
    visible =
      visible && Math.min(bounds.width, bounds.height) > this.minPageBreakDist;

    const horizontalCount = visible
      ? Math.ceil(gb.height / bounds.height) + 1
      : 0;
    const verticalCount = visible ? Math.ceil(gb.width / bounds.width) + 1 : 0;
    const right = (verticalCount - 1) * bounds.width;
    const bottom = (horizontalCount - 1) * bounds.height;

    if (this.horizontalPageBreaks == null && horizontalCount > 0) {
      this.horizontalPageBreaks = [];
    }

    if (this.verticalPageBreaks == null && verticalCount > 0) {
      this.verticalPageBreaks = [];
    }

    const drawPageBreaks = (breaks: any) => {
      if (breaks != null) {
        const count =
          breaks === this.horizontalPageBreaks
            ? horizontalCount
            : verticalCount;

        for (let i = 0; i <= count; i += 1) {
          const pts =
            breaks === this.horizontalPageBreaks
              ? [
                  new mxPoint(
                    Math.round(bounds.x),
                    Math.round(bounds.y + i * bounds.height)
                  ),
                  new mxPoint(
                    Math.round(bounds.x + right),
                    Math.round(bounds.y + i * bounds.height)
                  ),
                ]
              : [
                  new mxPoint(
                    Math.round(bounds.x + i * bounds.width),
                    Math.round(bounds.y)
                  ),
                  new mxPoint(
                    Math.round(bounds.x + i * bounds.width),
                    Math.round(bounds.y + bottom)
                  ),
                ];

          if (breaks[i] != null) {
            breaks[i].points = pts;
            breaks[i].redraw();
          } else {
            const pageBreak = new mxPolyline(pts, this.pageBreakColor);
            pageBreak.dialect = this.dialect;
            pageBreak.pointerEvents = false;
            pageBreak.isDashed = this.pageBreakDashed;
            pageBreak.init(this.getView().backgroundPane);
            pageBreak.redraw();

            breaks[i] = pageBreak;
          }
        }

        for (let i = count; i < breaks.length; i += 1) {
          breaks[i].destroy();
        }

        breaks.splice(count, breaks.length - count);
      }
    };

    drawPageBreaks(this.horizontalPageBreaks);
    drawPageBreaks(this.verticalPageBreaks);
  }

  /*****************************************************************************
   * Group: Cell styles
   *****************************************************************************/

  /**
   * Returns the style for the given cell from the cell state, if one exists,
   * or using {@link getCellStyle}.
   *
   * @param cell {@link mxCell} whose style should be returned as an array.
   * @param ignoreState Optional boolean that specifies if the cell state should be ignored.
   */
  // getCurrentCellStyle(cell: mxCell, ignoreState?: boolean): StyleMap;
  getCurrentCellStyle(cell: mxCell, ignoreState: boolean = false): any {
    const state = ignoreState ? null : this.getView().getState(cell);
    return state != null ? state.style : this.getCellStyle(cell);
  }

  /**
   * Returns an array of key, value pairs representing the cell style for the
   * given cell. If no string is defined in the model that specifies the
   * style, then the default style for the cell is returned or an empty object,
   * if no style can be found. Note: You should try and get the cell state
   * for the given cell and use the cached style in the state before using
   * this method.
   *
   * @param cell {@link mxCell} whose style should be returned as an array.
   */
  // getCellStyle(cell: mxCell): StyleMap;
  getCellStyle(cell: mxCell): any {
    const stylename = cell.getStyle();
    let style = null;
    const stylesheet = <mxStylesheet>this.stylesheet;

    // Gets the default style for the cell
    if (cell.isEdge()) {
      style = stylesheet.getDefaultEdgeStyle();
    } else {
      style = stylesheet.getDefaultVertexStyle();
    }

    // Resolves the stylename using the above as the default
    if (stylename != null) {
      style = this.postProcessCellStyle(
        stylesheet.getCellStyle(stylename, style)
      );
    }

    // Returns a non-null value if no style can be found
    if (style == null) {
      style = {};
    }
    return style;
  }

  /**
   * Tries to resolve the value for the image style in the image bundles and
   * turns short data URIs as defined in mxImageBundle to data URIs as
   * defined in RFC 2397 of the IETF.
   */
  // postProcessCellStyle(style: StyleMap): StyleMap;
  postProcessCellStyle(style: any): any {
    if (style != null) {
      const key = style.image;
      let image = this.getImageFromBundles(key);

      if (image != null) {
        style.image = image;
      } else {
        image = key;
      }

      // Converts short data uris to normal data uris
      if (image != null && image.substring(0, 11) === 'data:image/') {
        if (image.substring(0, 20) === 'data:image/svg+xml,<') {
          // Required for FF and IE11
          image =
            image.substring(0, 19) + encodeURIComponent(image.substring(19));
        } else if (image.substring(0, 22) !== 'data:image/svg+xml,%3C') {
          const comma = image.indexOf(',');

          // Adds base64 encoding prefix if needed
          if (
            comma > 0 &&
            image.substring(comma - 7, comma + 1) !== ';base64,'
          ) {
            image = `${image.substring(0, comma)};base64,${image.substring(
              comma + 1
            )}`;
          }
        }

        style.image = image;
      }
    }
    return style;
  }

  /**
   * Sets the style of the specified cells. If no cells are given, then the
   * selection cells are changed.
   *
   * @param style String representing the new style of the cells.
   * @param cells Optional array of {@link mxCell} to set the style for. Default is the
   * selection cells.
   */
  // setCellStyle(style: string, cells?: mxCell[]): void;
  setCellStyle(style: any, cells: mxCell[] | null = this.getSelectionCells()) {
    if (cells != null) {
      this.getModel().beginUpdate();
      try {
        for (let i = 0; i < cells.length; i += 1) {
          this.getModel().setStyle(cells[i], style);
        }
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Toggles the boolean value for the given key in the style of the given cell
   * and returns the new value as 0 or 1. If no cell is specified then the
   * selection cell is used.
   *
   * Parameter:
   *
   * @param key String representing the key for the boolean value to be toggled.
   * @param defaultValue Optional boolean default value if no value is defined.
   * Default is `false`.
   * @param cell Optional {@link mxCell} whose style should be modified. Default is
   * the selection cell.
   */
  // toggleCellStyle(key: string, defaultValue?: boolean, cell?: mxCell): any;
  toggleCellStyle(
    key: string,
    defaultValue: boolean = false,
    cell: mxCell | null = this.getSelectionCell()
  ) {
    return this.toggleCellStyles(key, defaultValue, [cell]);
  }

  /**
   * Toggles the boolean value for the given key in the style of the given cells
   * and returns the new value as 0 or 1. If no cells are specified, then the
   * selection cells are used. For example, this can be used to toggle
   * {@link 'rounded'} or any other style with a boolean value.
   *
   * Parameter:
   *
   * @param key String representing the key for the boolean value to be toggled.
   * @param defaultValue Optional boolean default value if no value is defined.
   * Default is `false`.
   * @param cells Optional array of {@link mxCell} whose styles should be modified.
   * Default is the selection cells.
   */
  // toggleCellStyles(key: string, defaultValue?: boolean, cells?: mxCell[]): any;
  toggleCellStyles(
    key: string,
    defaultValue: boolean = false,
    cells: (mxCell | null)[] = this.getSelectionCells()
  ) {
    let value = null;

    if (cells != null && cells.length > 0) {
      const style = this.getCurrentCellStyle(<mxCell>cells[0]);
      value = mxUtils.getValue(style, key, defaultValue) ? 0 : 1;
      this.setCellStyles(key, value, cells);
    }
    return value;
  }

  /**
   * Sets the key to value in the styles of the given cells. This will modify
   * the existing cell styles in-place and override any existing assignment
   * for the given key. If no cells are specified, then the selection cells
   * are changed. If no value is specified, then the respective key is
   * removed from the styles.
   *
   * @param key String representing the key to be assigned.
   * @param value String representing the new value for the key.
   * @param cells Optional array of {@link mxCell} to change the style for. Default is
   * the selection cells.
   */
  // setCellStyles(key: string, value: any, cells?: mxCell[]): void;
  setCellStyles(
    key: string,
    value: string | number | null = null,
    cells: (mxCell | null)[] = this.getSelectionCells()
  ) {
    mxUtils.setCellStyles(this.model, cells, key, value);
  }

  /**
   * Toggles the given bit for the given key in the styles of the specified
   * cells.
   *
   * @param key String representing the key to toggle the flag in.
   * @param flag Integer that represents the bit to be toggled.
   * @param cells Optional array of {@link mxCell} to change the style for. Default is
   * the selection cells.
   */
  // toggleCellStyleFlags(key: string, flag: number, cells?: mxCell[]): void;
  toggleCellStyleFlags(
    key: string,
    flag: number,
    cells: mxCell[] = this.getSelectionCells()
  ) {
    this.setCellStyleFlags(key, flag, null, cells);
  }

  /**
   * Sets or toggles the given bit for the given key in the styles of the
   * specified cells.
   *
   * @param key String representing the key to toggle the flag in.
   * @param flag Integer that represents the bit to be toggled.
   * @param value Boolean value to be used or null if the value should be toggled.
   * @param cells Optional array of {@link mxCell} to change the style for. Default is
   * the selection cells.
   */
  // setCellStyleFlags(key: string, flag: number, value: boolean, cells?: mxCell[]): void;
  setCellStyleFlags(
    key: string,
    flag: number,
    value: boolean | null = null,
    cells: mxCell[] = this.getSelectionCells()
  ) {
    if (cells != null && cells.length > 0) {
      if (value == null) {
        const style = this.getCurrentCellStyle(cells[0]);
        const current = parseInt(style[key] || 0);
        value = !((current & flag) === flag);
      }
      mxUtils.setCellStyleFlags(this.model, cells, key, flag, value);
    }
  }

  /*****************************************************************************
   * Group: Cell alignment and orientation
   *****************************************************************************/

  /**
   * Aligns the given cells vertically or horizontally according to the given
   * alignment using the optional parameter as the coordinate.
   *
   * @param align Specifies the alignment. Possible values are all constants in
   * mxConstants with an ALIGN prefix.
   * @param cells Array of {@link mxCell} to be aligned.
   * @param param Optional coordinate for the alignment.
   */
  // alignCells(align: string, cells: mxCell[], param?: any): mxCell[];
  alignCells(align: string, cells: mxCell[], param: number | null = null) {
    if (cells == null) {
      cells = this.getSelectionCells();
    }

    if (cells != null && cells.length > 1) {
      // Finds the required coordinate for the alignment
      if (param == null) {
        for (let i = 0; i < cells.length; i += 1) {
          const state = this.getView().getState(cells[i]);

          if (state != null && !cells[i].isEdge()) {
            if (param == null) {
              if (align === ALIGN_CENTER) {
                param = state.x + state.width / 2;
                break;
              } else if (align === ALIGN_RIGHT) {
                param = state.x + state.width;
              } else if (align === ALIGN_TOP) {
                param = state.y;
              } else if (align === ALIGN_MIDDLE) {
                param = state.y + state.height / 2;
                break;
              } else if (align === ALIGN_BOTTOM) {
                param = state.y + state.height;
              } else {
                param = state.x;
              }
            } else if (align === ALIGN_RIGHT) {
              param = Math.max(param, state.x + state.width);
            } else if (align === ALIGN_TOP) {
              param = Math.min(param, state.y);
            } else if (align === ALIGN_BOTTOM) {
              param = Math.max(param, state.y + state.height);
            } else {
              param = Math.min(param, state.x);
            }
          }
        }
      }

      // Aligns the cells to the coordinate
      if (param != null) {
        const s = this.getView().scale;

        this.getModel().beginUpdate();
        try {
          for (let i = 0; i < cells.length; i += 1) {
            const state = this.getView().getState(cells[i]);

            if (state != null) {
              let geo = cells[i].getGeometry();

              if (geo != null && !cells[i].isEdge()) {
                geo = <mxGeometry>geo.clone();

                if (align === ALIGN_CENTER) {
                  geo.x += (param - state.x - state.width / 2) / s;
                } else if (align === ALIGN_RIGHT) {
                  geo.x += (param - state.x - state.width) / s;
                } else if (align === ALIGN_TOP) {
                  geo.y += (param - state.y) / s;
                } else if (align === ALIGN_MIDDLE) {
                  geo.y += (param - state.y - state.height / 2) / s;
                } else if (align === ALIGN_BOTTOM) {
                  geo.y += (param - state.y - state.height) / s;
                } else {
                  geo.x += (param - state.x) / s;
                }

                this.resizeCell(cells[i], geo);
              }
            }
          }

          this.fireEvent(
            new mxEventObject(
              mxEvent.ALIGN_CELLS,
              'align',
              align,
              'cells',
              cells
            )
          );
        } finally {
          this.getModel().endUpdate();
        }
      }
    }

    return cells;
  }

  /**
   * Toggles the style of the given edge between null (or empty) and
   * {@link alternateEdgeStyle}. This method fires {@link mxEvent.FLIP_EDGE} while the
   * transaction is in progress. Returns the edge that was flipped.
   *
   * Here is an example that overrides this implementation to invert the
   * value of {@link 'elbow'} without removing any existing styles.
   *
   * ```javascript
   * graph.flipEdge = function(edge)
   * {
   *   if (edge != null)
   *   {
   *     var style = this.getCurrentCellStyle(edge);
   *     var elbow = mxUtils.getValue(style, 'elbow',
   *         mxConstants.ELBOW_HORIZONTAL);
   *     var value = (elbow == mxConstants.ELBOW_HORIZONTAL) ?
   *         mxConstants.ELBOW_VERTICAL : mxConstants.ELBOW_HORIZONTAL;
   *     this.setCellStyles('elbow', value, [edge]);
   *   }
   * };
   * ```
   *
   * @param edge {@link mxCell} whose style should be changed.
   */
  // flipEdge(edge: mxCell): mxCell;
  flipEdge(edge: mxCell): mxCell {
    if (edge != null && this.alternateEdgeStyle != null) {
      this.getModel().beginUpdate();
      try {
        const style = edge.getStyle();

        if (style == null || style.length === 0) {
          this.getModel().setStyle(edge, this.alternateEdgeStyle);
        } else {
          this.getModel().setStyle(edge, null);
        }

        // Removes all existing control points
        this.resetEdge(edge);
        this.fireEvent(new mxEventObject(mxEvent.FLIP_EDGE, 'edge', edge));
      } finally {
        this.getModel().endUpdate();
      }
    }
    return edge;
  }

  /**
   * Adds the specified {@link mxImageBundle}.
   */
  // addImageBundle(bundle: mxImageBundle): void;
  addImageBundle(bundle: mxImageBundle): void {
    this.imageBundles.push(bundle);
  }

  /**
   * Removes the specified {@link mxImageBundle}.
   */
  // removeImageBundle(bundle: mxImageBundle): void;
  removeImageBundle(bundle: mxImageBundle) {
    const tmp = [];
    for (let i = 0; i < this.imageBundles.length; i += 1) {
      if (this.imageBundles[i] !== bundle) {
        tmp.push(this.imageBundles[i]);
      }
    }
    this.imageBundles = tmp;
  }

  /**
   * Searches all {@link imageBundles} for the specified key and returns the value
   * for the first match or null if the key is not found.
   */
  // getImageFromBundles(key: string): string;
  getImageFromBundles(key: string) {
    if (key != null) {
      for (let i = 0; i < this.imageBundles.length; i += 1) {
        const image = this.imageBundles[i].getImage(key);
        if (image != null) {
          return image;
        }
      }
    }
    return null;
  }

  /*****************************************************************************
   * Group: Order
   *****************************************************************************/

  /**
   * Moves the given cells to the front or back. The change is carried out
   * using {@link cellsOrdered}. This method fires {@link mxEvent.ORDER_CELLS} while the
   * transaction is in progress.
   *
   * @param back Boolean that specifies if the cells should be moved to back.
   * @param cells Array of {@link mxCell} to move to the background. If null is
   * specified then the selection cells are used.
   */
  // orderCells(back: boolean, cells?: mxCell[]): mxCell[];
  orderCells(
    back: boolean = false,
    cells: mxCell[] = this.getSelectionCells()
  ): mxCell[] {
    if (cells == null) {
      cells = mxUtils.sortCells(this.getSelectionCells(), true);
    }

    this.getModel().beginUpdate();
    try {
      this.cellsOrdered(cells, back);
      this.fireEvent(
        new mxEventObject(mxEvent.ORDER_CELLS, 'back', back, 'cells', cells)
      );
    } finally {
      this.getModel().endUpdate();
    }
    return cells;
  }

  /**
   * Moves the given cells to the front or back. This method fires
   * {@link mxEvent.CELLS_ORDERED} while the transaction is in progress.
   *
   * @param cells Array of {@link mxCell} whose order should be changed.
   * @param back Boolean that specifies if the cells should be moved to back.
   */
  // cellsOrdered(cells: mxCell[], back?: boolean): void;
  cellsOrdered(cells: mxCell[], back: boolean = false) {
    if (cells != null) {
      this.getModel().beginUpdate();
      try {
        for (let i = 0; i < cells.length; i += 1) {
          const parent = cells[i].getParent();

          if (back) {
            this.getModel().add(parent, cells[i], i);
          } else {
            this.getModel().add(
              parent,
              cells[i],
              parent ? parent.getChildCount() - 1 : 0
            );
          }
        }

        this.fireEvent(
          new mxEventObject(mxEvent.CELLS_ORDERED, 'back', back, 'cells', cells)
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /*****************************************************************************
   * Group: Grouping
   *****************************************************************************/

  /**
   * Adds the cells into the given group. The change is carried out using
   * {@link cellsAdded}, {@link cellsMoved} and {@link cellsResized}. This method fires
   * {@link mxEvent.GROUP_CELLS} while the transaction is in progress. Returns the
   * new group. A group is only created if there is at least one entry in the
   * given array of cells.
   *
   * @param group {@link mxCell} that represents the target group. If `null` is specified
   * then a new group is created using {@link createGroupCell}.
   * @param border Optional integer that specifies the border between the child
   * area and the group bounds. Default is `0`.
   * @param cells Optional array of {@link mxCell} to be grouped. If `null` is specified
   * then the selection cells are used.
   */
  // groupCells(group: mxCell | null, border?: number, cells?: mxCell[]): mxCell;
  groupCells(
    group: mxCell,
    border: number = 0,
    cells: mxCell[] = mxUtils.sortCells(this.getSelectionCells(), true)
  ) {
    cells = this.getCellsForGroup(cells);

    if (group == null) {
      group = this.createGroupCell(cells);
    }

    const bounds = this.getBoundsForGroup(group, cells, border);

    if (cells.length > 1 && bounds != null) {
      // Uses parent of group or previous parent of first child
      let parent = group.getParent();

      if (parent == null) {
        parent = <mxCell>cells[0].getParent();
      }

      this.getModel().beginUpdate();
      try {
        // Checks if the group has a geometry and
        // creates one if one does not exist
        if (group.getGeometry() == null) {
          this.getModel().setGeometry(group, new mxGeometry());
        }

        // Adds the group into the parent
        let index = parent.getChildCount();
        this.cellsAdded(
          [group],
          parent,
          index,
          null,
          null,
          false,
          false,
          false
        );

        // Adds the children into the group and moves
        index = group.getChildCount();
        this.cellsAdded(cells, group, index, null, null, false, false, false);
        this.cellsMoved(cells, -bounds.x, -bounds.y, false, false, false);

        // Resizes the group
        this.cellsResized([group], [bounds], false);

        this.fireEvent(
          new mxEventObject(
            mxEvent.GROUP_CELLS,
            'group',
            group,
            'border',
            border,
            'cells',
            cells
          )
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
    return group;
  }

  /**
   * Returns the cells with the same parent as the first cell
   * in the given array.
   */
  // getCellsForGroup(cells: mxCell[]): mxCell[];
  getCellsForGroup(cells: mxCell[]) {
    const result = [];
    if (cells != null && cells.length > 0) {
      const parent = cells[0].getParent();
      result.push(cells[0]);

      // Filters selection cells with the same parent
      for (let i = 1; i < cells.length; i += 1) {
        if (cells[i].getParent() === parent) {
          result.push(cells[i]);
        }
      }
    }
    return result;
  }

  /**
   * Returns the bounds to be used for the given group and children.
   */
  // getBoundsForGroup(group: mxCell, children: mxCell[], border?: number): mxRectangle;
  getBoundsForGroup(group: mxCell, children: mxCell[], border: number | null) {
    const result = this.getBoundingBoxFromGeometry(children, true);

    if (result != null) {
      if (this.isSwimlane(group)) {
        const size = this.getStartSize(group);

        result.x -= size.width;
        result.y -= size.height;
        result.width += size.width;
        result.height += size.height;
      }

      // Adds the border
      if (border != null) {
        result.x -= border;
        result.y -= border;
        result.width += 2 * border;
        result.height += 2 * border;
      }
    }

    return result;
  }

  /**
   * Hook for creating the group cell to hold the given array of {@link mxCell} if
   * no group cell was given to the {@link group} function.
   *
   * The following code can be used to set the style of new group cells.
   *
   * ```javascript
   * var graphCreateGroupCell = graph.createGroupCell;
   * graph.createGroupCell = function(cells)
   * {
   *   var group = graphCreateGroupCell.apply(this, arguments);
   *   group.setStyle('group');
   *
   *   return group;
   * };
   */
  // createGroupCell(cells: mxCell[]): mxCell;
  createGroupCell(cells: mxCell[]) {
    const group = new mxCell('');
    group.setVertex(true);
    group.setConnectable(false);

    return group;
  }

  /**
   * Ungroups the given cells by moving the children the children to their
   * parents parent and removing the empty groups. Returns the children that
   * have been removed from the groups.
   *
   * @param cells Array of cells to be ungrouped. If null is specified then the
   * selection cells are used.
   */
  // ungroupCells(cells: mxCell[]): mxCell[];
  ungroupCells(cells: mxCell[]) {
    let result: mxCell[] = [];

    if (cells == null) {
      cells = this.getCellsForUngroup();
    }

    if (cells != null && cells.length > 0) {
      this.getModel().beginUpdate();
      try {
        for (let i = 0; i < cells.length; i += 1) {
          let children = cells[i].getChildren();

          if (children != null && children.length > 0) {
            children = children.slice();
            const parent = <mxCell>cells[i].getParent();
            const index = parent.getChildCount();

            this.cellsAdded(children, parent, index, null, null, true);
            result = result.concat(children);

            // Fix relative child cells
            for (let j = 0; j < children.length; j++) {
              const state = this.getView().getState(children[j]);
              let geo = children[j].getGeometry();

              if (state != null && geo != null && geo.relative) {
                geo = <mxGeometry>geo.clone();
                geo.x = (<mxPoint>state.origin).x;
                geo.y = (<mxPoint>state.origin).y;
                geo.relative = false;

                this.getModel().setGeometry(children[j], geo);
              }
            }
          }
        }

        this.removeCellsAfterUngroup(cells);
        this.fireEvent(
          new mxEventObject(mxEvent.UNGROUP_CELLS, 'cells', cells)
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
    return result;
  }

  /**
   * Function: getCellsForUngroup
   *
   * Returns the selection cells that can be ungrouped.
   */
  getCellsForUngroup() {
    const cells = this.getSelectionCells();

    // Finds the cells with children
    const tmp = [];

    for (let i = 0; i < cells.length; i += 1) {
      if (cells[i].isVertex() && cells[i].getChildCount() > 0) {
        tmp.push(cells[i]);
      }
    }
    return tmp;
  }

  /**
   * Hook to remove the groups after {@link ungroupCells}.
   *
   * @param cells Array of {@link mxCell} that were ungrouped.
   */
  // removeCellsAfterUngroup(cells: mxCell[]): void;
  removeCellsAfterUngroup(cells: mxCell[]) {
    this.cellsRemoved(this.addAllEdges(cells));
  }

  /**
   * Removes the specified cells from their parents and adds them to the
   * default parent. Returns the cells that were removed from their parents.
   *
   * @param cells Array of {@link mxCell} to be removed from their parents.
   */
  // removeCellsFromParent(cells: mxCell[]): mxCell[];
  removeCellsFromParent(cells: mxCell[]) {
    if (cells == null) {
      cells = this.getSelectionCells();
    }
    this.getModel().beginUpdate();
    try {
      const parent = this.getDefaultParent();
      const index = parent.getChildCount();

      this.cellsAdded(cells, parent, index, null, null, true);
      this.fireEvent(
        new mxEventObject(mxEvent.REMOVE_CELLS_FROM_PARENT, 'cells', cells)
      );
    } finally {
      this.getModel().endUpdate();
    }
    return cells;
  }

  /**
   * Function: updateGroupBounds
   *
   * Updates the bounds of the given groups to include all children and returns
   * the passed-in cells. Call this with the groups in parent to child order,
   * top-most group first, the cells are processed in reverse order and cells
   * with no children are ignored.
   *
   * Parameters:
   *
   * cells - The groups whose bounds should be updated. If this is null, then
   * the selection cells are used.
   * border - Optional border to be added in the group. Default is 0.
   * moveGroup - Optional boolean that allows the group to be moved. Default
   * is false.
   * topBorder - Optional top border to be added in the group. Default is 0.
   * rightBorder - Optional top border to be added in the group. Default is 0.
   * bottomBorder - Optional top border to be added in the group. Default is 0.
   * leftBorder - Optional top border to be added in the group. Default is 0.
   */
  updateGroupBounds(
    cells: mxCell[],
    border: number = 0,
    moveGroup: boolean = false,
    topBorder: number = 0,
    rightBorder: number = 0,
    bottomBorder: number = 0,
    leftBorder: number = 0
  ): mxCell[] {
    if (cells == null) {
      cells = this.getSelectionCells();
    }

    border = border != null ? border : 0;
    moveGroup = moveGroup != null ? moveGroup : false;
    topBorder = topBorder != null ? topBorder : 0;
    rightBorder = rightBorder != null ? rightBorder : 0;
    bottomBorder = bottomBorder != null ? bottomBorder : 0;
    leftBorder = leftBorder != null ? leftBorder : 0;

    this.getModel().beginUpdate();
    try {
      for (let i = cells.length - 1; i >= 0; i--) {
        let geo = cells[i].getGeometry();

        if (geo != null) {
          const children = <mxCell[]>this.getChildCells(cells[i]);

          if (children != null && children.length > 0) {
            const bounds = this.getBoundingBoxFromGeometry(children, true);

            if (bounds != null && bounds.width > 0 && bounds.height > 0) {
              // Adds the size of the title area for swimlanes
              const size = <mxRectangle>(
                (this.isSwimlane(cells[i])
                  ? this.getActualStartSize(cells[i], true)
                  : new mxRectangle())
              );
              geo = <mxGeometry>geo.clone();

              if (moveGroup) {
                geo.x = Math.round(
                  geo.x + bounds.x - border - size.x - leftBorder
                );
                geo.y = Math.round(
                  geo.y + bounds.y - border - size.y - topBorder
                );
              }

              geo.width = Math.round(
                bounds.width +
                  2 * border +
                  size.x +
                  leftBorder +
                  rightBorder +
                  size.width
              );
              geo.height = Math.round(
                bounds.height +
                  2 * border +
                  size.y +
                  topBorder +
                  bottomBorder +
                  size.height
              );

              this.getModel().setGeometry(cells[i], geo);
              this.moveCells(
                children,
                border + size.x - bounds.x + leftBorder,
                border + size.y - bounds.y + topBorder
              );
            }
          }
        }
      }
    } finally {
      this.getModel().endUpdate();
    }

    return cells;
  }

  /**
   * Returns the bounding box for the given array of {@link mxCell}. The bounding box for
   * each cell and its descendants is computed using {@link mxGraphView.getBoundingBox}.
   *
   * @param cells Array of {@link mxCell} whose bounding box should be returned.
   */
  // getBoundingBox(cells: mxCell[]): mxRectangle;
  getBoundingBox(cells: mxCell[]) {
    let result = null;

    if (cells != null && cells.length > 0) {
      for (let i = 0; i < cells.length; i += 1) {
        if (cells[i].isVertex() || cells[i].isEdge()) {
          const bbox = this.getView().getBoundingBox(
            this.getView().getState(cells[i]),
            true
          );

          if (bbox != null) {
            if (result == null) {
              result = mxRectangle.fromRectangle(bbox);
            } else {
              result.add(bbox);
            }
          }
        }
      }
    }
    return result;
  }

  /*****************************************************************************
   * Group: Cell cloning, insertion and removal
   *****************************************************************************/

  /**
   * Returns the clone for the given cell. Uses {@link cloneCells}.
   *
   * @param cell {@link mxCell} to be cloned.
   * @param allowInvalidEdges Optional boolean that specifies if invalid edges
   * should be cloned. Default is `true`.
   * @param mapping Optional mapping for existing clones.
   * @param keepPosition Optional boolean indicating if the position of the cells should
   * be updated to reflect the lost parent cell. Default is `false`.
   */
  // cloneCell(cell: mxCell, allowInvalidEdges?: boolean, mapping?: any, keepPosition?: boolean): mxCell[];
  cloneCell(
    cell: mxCell,
    allowInvalidEdges: boolean = false,
    mapping: any = null,
    keepPosition: boolean = false
  ): mxCell {
    return (<mxCell[]>(
      this.cloneCells([cell], allowInvalidEdges, mapping, keepPosition)
    ))[0];
  }

  /**
   * Returns the clones for the given cells. The clones are created recursively
   * using {@link mxGraphModel.cloneCells}. If the terminal of an edge is not in the
   * given array, then the respective end is assigned a terminal point and the
   * terminal is removed.
   *
   * @param cells Array of {@link mxCell} to be cloned.
   * @param allowInvalidEdges Optional boolean that specifies if invalid edges
   * should be cloned. Default is `true`.
   * @param mapping Optional mapping for existing clones.
   * @param keepPosition Optional boolean indicating if the position of the cells should
   * be updated to reflect the lost parent cell. Default is `false`.
   */
  // cloneCells(cells: mxCell[], allowInvalidEdges?: boolean, mapping?: any, keepPosition?: boolean): mxCell[];
  cloneCells(
    cells: mxCell[],
    allowInvalidEdges: boolean = true,
    mapping: any = {},
    keepPosition: boolean = false
  ): mxCell[] | null {
    allowInvalidEdges = allowInvalidEdges != null ? allowInvalidEdges : true;
    let clones = null;

    if (cells != null) {
      // Creates a dictionary for fast lookups
      const dict = new mxDictionary();
      const tmp = [];

      for (let i = 0; i < cells.length; i += 1) {
        dict.put(cells[i], true);
        tmp.push(cells[i]);
      }

      if (tmp.length > 0) {
        const { scale } = this.view;
        const trans = this.getView().translate;
        const out: mxCell[] = [];
        clones = this.getModel().cloneCells(cells, true, mapping);

        for (let i = 0; i < cells.length; i += 1) {
          if (
            !allowInvalidEdges &&
            clones[i].isEdge() &&
            this.getEdgeValidationError(
              <mxCell>clones[i],
              (<mxCell>clones[i]).getTerminal(true),
              (<mxCell>clones[i]).getTerminal(false)
            ) != null
          ) {
            //clones[i] = null;
          } else {
            out.push(clones[i]);
            const g = clones[i].getGeometry();

            if (g != null) {
              const state = this.getView().getState(cells[i]);
              const pstate = this.getView().getState(cells[i].getParent());

              if (state != null && pstate != null) {
                const dx = keepPosition ? 0 : (<mxPoint>pstate.origin).x;
                const dy = keepPosition ? 0 : (<mxPoint>pstate.origin).y;

                if (clones[i].isEdge()) {
                  const pts = <mxPoint[]>state.absolutePoints;

                  if (pts != null) {
                    // Checks if the source is cloned or sets the terminal point
                    let src = cells[i].getTerminal(true);

                    while (src != null && !dict.get(src)) {
                      src = src.getParent();
                    }

                    if (src == null && pts[0] != null) {
                      g.setTerminalPoint(
                        new mxPoint(
                          pts[0].x / scale - trans.x,
                          pts[0].y / scale - trans.y
                        ),
                        true
                      );
                    }

                    // Checks if the target is cloned or sets the terminal point
                    let trg = cells[i].getTerminal(false);

                    while (trg != null && !dict.get(trg)) {
                      trg = trg.getParent();
                    }

                    const n = pts.length - 1;

                    if (trg == null && pts[n] != null) {
                      g.setTerminalPoint(
                        new mxPoint(
                          pts[n].x / scale - trans.x,
                          pts[n].y / scale - trans.y
                        ),
                        false
                      );
                    }

                    // Translates the control points
                    const { points } = g;

                    if (points != null) {
                      for (let j = 0; j < points.length; j++) {
                        points[j].x += dx;
                        points[j].y += dy;
                      }
                    }
                  }
                } else {
                  g.translate(dx, dy);
                }
              }
            }
          }
        }
        clones = out;
      } else {
        clones = [];
      }
    }
    return clones;
  }

  /**
   * Function: insertVertex
   *
   * Adds a new vertex into the given parent <mxCell> using value as the user
   * object and the given coordinates as the <mxGeometry> of the new vertex.
   * The id and style are used for the respective properties of the new
   * <mxCell>, which is returned.
   *
   * When adding new vertices from a mouse event, one should take into
   * account the offset of the graph container and the scale and translation
   * of the view in order to find the correct unscaled, untranslated
   * coordinates using <mxGraph.getPointForEvent> as follows:
   *
   * (code)
   * let pt = graph.getPointForEvent(evt);
   * let parent = graph.getDefaultParent();
   * graph.insertVertex(parent, null,
   *       'Hello, World!', x, y, 220, 30);
   * (end)
   *
   * For adding image cells, the style parameter can be assigned as
   *
   * (code)
   * stylename;image=imageUrl
   * (end)
   *
   * See <mxGraph> for more information on using images.
   *
   * Parameters:
   *
   * parent - <mxCell> that specifies the parent of the new vertex.
   * id - Optional string that defines the Id of the new vertex.
   * value - Object to be used as the user object.
   * x - Integer that defines the x coordinate of the vertex.
   * y - Integer that defines the y coordinate of the vertex.
   * width - Integer that defines the width of the vertex.
   * height - Integer that defines the height of the vertex.
   * style - Optional string that defines the cell style.
   * relative - Optional boolean that specifies if the geometry is relative.
   * Default is false.
   * geometryClass - Optional class reference to a class derived from mxGeometry.
   *                 This can be useful for defining custom constraints.
   */
  insertVertex = (...args: any[]): mxCell => {
    let parent;
    let id;
    let value;
    let x;
    let y;
    let width;
    let height;
    let style;
    let relative;
    let geometryClass;

    if (args.length === 1) {
      // If only a single parameter, treat as an object
      // This syntax can be more readable
      const params = args[0];
      parent = params.parent;
      id = params.id;
      value = params.value;

      x = 'x' in params ? params.x : params.position[0];
      y = 'y' in params ? params.y : params.position[1];
      width = 'width' in params ? params.width : params.size[0];
      height = 'height' in params ? params.height : params.size[1];

      style = params.style;
      relative = params.relative;
      geometryClass = params.geometryClass;
    } else {
      // Otherwise treat as arguments
      [
        parent,
        id,
        value,
        x,
        y,
        width,
        height,
        style,
        relative,
        geometryClass,
      ] = args;
    }

    const vertex = this.createVertex(
      parent,
      id,
      value,
      x,
      y,
      width,
      height,
      style,
      relative,
      geometryClass
    );
    return this.addCell(vertex, parent);
  };

  /**
   * Function: createVertex
   *
   * Hook method that creates the new vertex for <insertVertex>.
   */
  createVertex(
    parent: mxCell,
    id: string,
    value: any,
    x: number,
    y: number,
    width: number,
    height: number,
    style: any,
    relative: boolean = false,
    geometryClass: typeof mxGeometry = mxGeometry
  ) {
    // Creates the geometry for the vertex
    const geometry = new geometryClass(x, y, width, height);
    geometry.relative = relative != null ? relative : false;

    // Creates the vertex
    const vertex = new mxCell(value, geometry, style);
    vertex.setId(id);
    vertex.setVertex(true);
    vertex.setConnectable(true);

    return vertex;
  }

  /**
   * Adds a new edge into the given parent {@link mxCell} using value as the user
   * object and the given source and target as the terminals of the new edge.
   * The id and style are used for the respective properties of the new
   * {@link mxCell}, which is returned.
   *
   * @param parent {@link mxCell} that specifies the parent of the new edge.
   * @param id Optional string that defines the Id of the new edge.
   * @param value JavaScript object to be used as the user object.
   * @param source {@link mxCell} that defines the source of the edge.
   * @param target {@link mxCell} that defines the target of the edge.
   * @param style Optional string that defines the cell style.
   */
  // insertEdge(parent: mxCell, id: string | null, value: any, source: mxCell, target: mxCell, style?: string): mxCell;
  insertEdge(...args: any[]): mxCell {
    let parent: mxCell;
    let id: string = '';
    let value: any; // note me - can be a string or a class instance!!!
    let source: mxCell;
    let target: mxCell;
    let style: string; // TODO: Also allow for an object or class instance??

    if (args.length === 1) {
      // If only a single parameter, treat as an object
      // This syntax can be more readable
      const params = args[0];
      parent = params.parent;
      id = params.id || '';
      value = params.value || '';
      source = params.source;
      target = params.target;
      style = params.style;
    } else {
      // otherwise treat as individual arguments
      [parent, id, value, source, target, style] = args;
    }

    const edge = this.createEdge(parent, id, value, source, target, style);
    return this.addEdge(edge, parent, source, target);
  }

  /**
   * Hook method that creates the new edge for {@link insertEdge}. This
   * implementation does not set the source and target of the edge, these
   * are set when the edge is added to the model.
   *
   */
  // createEdge(parent: mxCell, id: string | null, value: any, source: mxCell, target: mxCell, style?: string): mxCell;
  createEdge(
    parent: mxCell | null = null,
    id: string,
    value: any,
    source: mxCell | null = null,
    target: mxCell | null = null,
    style: any
  ) {
    // Creates the edge
    const edge = new mxCell(value, new mxGeometry(), style);
    edge.setId(id);
    edge.setEdge(true);
    (<mxGeometry>edge.geometry).relative = true;
    return edge;
  }

  /**
   * Adds the edge to the parent and connects it to the given source and
   * target terminals. This is a shortcut method. Returns the edge that was
   * added.
   *
   * @param edge {@link mxCell} to be inserted into the given parent.
   * @param parent {@link mxCell} that represents the new parent. If no parent is
   * given then the default parent is used.
   * @param source Optional {@link mxCell} that represents the source terminal.
   * @param target Optional {@link mxCell} that represents the target terminal.
   * @param index Optional index to insert the cells at. Default is 'to append'.
   */
  // addEdge(edge: mxCell, parent?: mxCell, source?: mxCell, target?: mxCell, index?: number): mxCell;
  addEdge(
    edge: mxCell,
    parent: mxCell | null = null,
    source: mxCell | null = null,
    target: mxCell | null = null,
    index: number | null = null
  ) {
    return this.addCell(edge, parent, index, source, target);
  }

  /**
   * Adds the cell to the parent and connects it to the given source and
   * target terminals. This is a shortcut method. Returns the cell that was
   * added.
   *
   * @param cell {@link mxCell} to be inserted into the given parent.
   * @param parent {@link mxCell} that represents the new parent. If no parent is
   * given then the default parent is used.
   * @param index Optional index to insert the cells at. Default is 'to append'.
   * @param source Optional {@link mxCell} that represents the source terminal.
   * @param target Optional {@link mxCell} that represents the target terminal.
   */
  // addCell(cell: mxCell, parent?: mxCell, index?: number, source?: mxCell, target?: mxCell): mxCell;
  addCell(
    cell: mxCell,
    parent: mxCell | null = null,
    index: number | null = null,
    source: mxCell | null = null,
    target: mxCell | null = null
  ): mxCell {
    return this.addCells([cell], parent, index, source, target)[0];
  }

  /**
   * Function: addCells
   *
   * Adds the cells to the parent at the given index, connecting each cell to
   * the optional source and target terminal. The change is carried out using
   * <cellsAdded>. This method fires <mxEvent.ADD_CELLS> while the
   * transaction is in progress. Returns the cells that were added.
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be inserted.
   * parent - <mxCell> that represents the new parent. If no parent is
   * given then the default parent is used.
   * index - Optional index to insert the cells at. Default is to append.
   * source - Optional source <mxCell> for all inserted cells.
   * target - Optional target <mxCell> for all inserted cells.
   * absolute - Optional boolean indicating of cells should be kept at
   * their absolute position. Default is false.
   */
  addCells(
    cells: mxCell[],
    parent: mxCell | null = null,
    index: number | null = null,
    source: mxCell | null = null,
    target: mxCell | null = null,
    absolute: boolean = false
  ) {
    if (parent == null) {
      parent = this.getDefaultParent();
    }

    if (index == null) {
      index = parent.getChildCount();
    }

    this.getModel().beginUpdate();
    try {
      this.cellsAdded(
        cells,
        parent,
        index,
        source,
        target,
        absolute != null ? absolute : false,
        true
      );
      this.fireEvent(
        new mxEventObject(
          mxEvent.ADD_CELLS,
          'cells',
          cells,
          'parent',
          parent,
          'index',
          index,
          'source',
          source,
          'target',
          target
        )
      );
    } finally {
      this.getModel().endUpdate();
    }

    return cells;
  }

  /**
   * Function: cellsAdded
   *
   * Adds the specified cells to the given parent. This method fires
   * <mxEvent.CELLS_ADDED> while the transaction is in progress.
   */
  cellsAdded(
    cells: mxCell[] | null = null,
    parent: mxCell | null = null,
    index: number | null = null,
    source: mxCell | null = null,
    target: mxCell | null = null,
    absolute: boolean = false,
    constrain: boolean = false,
    extend: boolean = true
  ): void {
    if (cells != null && parent != null && index != null) {
      this.getModel().beginUpdate();
      try {
        const parentState = absolute ? this.getView().getState(parent) : null;
        const o1 = parentState != null ? parentState.origin : null;
        const zero = new mxPoint(0, 0);

        for (let i = 0; i < cells.length; i += 1) {
          if (cells[i] == null) {
            index--;
          } else {
            const previous = cells[i].getParent();

            // Keeps the cell at its absolute location
            if (o1 != null && cells[i] !== parent && parent !== previous) {
              const oldState = this.getView().getState(previous);
              const o2 = <mxPoint>(oldState != null ? oldState.origin : zero);
              let geo = cells[i].getGeometry();

              if (geo != null) {
                const dx = o2.x - o1.x;
                const dy = o2.y - o1.y;

                // FIXME: Cells should always be inserted first before any other edit
                // to avoid forward references in sessions.
                geo = <mxGeometry>geo.clone();
                geo.translate(dx, dy);

                if (
                  !geo.relative &&
                  cells[i].isVertex() &&
                  !this.isAllowNegativeCoordinates()
                ) {
                  geo.x = Math.max(0, geo.x);
                  geo.y = Math.max(0, geo.y);
                }

                this.getModel().setGeometry(cells[i], geo);
              }
            }

            // Decrements all following indices
            // if cell is already in parent
            if (parent === previous && index + i > parent.getChildCount()) {
              index--;
            }

            this.getModel().add(parent, cells[i], index + i);

            if (this.autoSizeCellsOnAdd) {
              this.autoSizeCell(cells[i], true);
            }

            // Extends the parent or constrains the child
            if (
              (extend == null || extend) &&
              this.isExtendParentsOnAdd(cells[i]) &&
              this.isExtendParent(cells[i])
            ) {
              this.extendParent(cells[i]);
            }

            // Additionally constrains the child after extending the parent
            if (constrain == null || constrain) {
              this.constrainChild(cells[i]);
            }

            // Sets the source terminal
            if (source != null) {
              this.cellConnected(cells[i], source, true);
            }

            // Sets the target terminal
            if (target != null) {
              this.cellConnected(cells[i], target, false);
            }
          }
        }

        this.fireEvent(
          new mxEventObject(
            mxEvent.CELLS_ADDED,
            'cells',
            cells,
            'parent',
            parent,
            'index',
            index,
            'source',
            source,
            'target',
            target,
            'absolute',
            absolute
          )
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Resizes the specified cell to just fit around the its label and/or children
   *
   * @param cell {@link mxCell} to be resized.
   * @param recurse Optional boolean which specifies if all descendants should be
   * autosized. Default is `true`.
   */
  // autoSizeCell(cell: mxCell, recurse?: boolean): void;
  autoSizeCell(cell: mxCell, recurse: boolean = true) {
    if (recurse) {
      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        this.autoSizeCell(<mxCell>cell.getChildAt(i));
      }
    }

    if (cell.isVertex() && this.isAutoSizeCell(cell)) {
      this.updateCellSize(cell);
    }
  }

  /**
   * Removes the given cells from the graph including all connected edges if
   * includeEdges is true. The change is carried out using {@link cellsRemoved}.
   * This method fires {@link mxEvent.REMOVE_CELLS} while the transaction is in
   * progress. The removed cells are returned as an array.
   *
   * @param cells Array of {@link mxCell} to remove. If null is specified then the
   * selection cells which are deletable are used.
   * @param includeEdges Optional boolean which specifies if all connected edges
   * should be removed as well. Default is `true`.
   */
  // removeCells(cells: mxCell[], includeEdges?: boolean): mxCell[];
  removeCells(cells: mxCell[] | null = null, includeEdges: boolean = true) {
    includeEdges = includeEdges != null ? includeEdges : true;

    if (cells == null) {
      cells = <mxCell[]>this.getDeletableCells(this.getSelectionCells());
    }

    // Adds all edges to the cells
    if (includeEdges) {
      // FIXME: Remove duplicate cells in result or do not add if
      // in cells or descendant of cells
      cells = this.getDeletableCells(this.addAllEdges(cells));
    } else {
      cells = cells.slice();

      // Removes edges that are currently not
      // visible as those cannot be updated
      const edges = <mxCell[]>this.getDeletableCells(this.getAllEdges(cells));
      const dict = new mxDictionary();

      for (let i = 0; i < cells.length; i += 1) {
        dict.put(cells[i], true);
      }

      for (let i = 0; i < edges.length; i += 1) {
        if (this.getView().getState(edges[i]) == null && !dict.get(edges[i])) {
          dict.put(edges[i], true);
          cells.push(edges[i]);
        }
      }
    }

    this.getModel().beginUpdate();
    try {
      this.cellsRemoved(<mxCell[]>cells);
      this.fireEvent(
        new mxEventObject(
          mxEvent.REMOVE_CELLS,
          'cells',
          cells,
          'includeEdges',
          includeEdges
        )
      );
    } finally {
      this.getModel().endUpdate();
    }

    return cells;
  }

  /**
   * Removes the given cells from the model. This method fires
   * {@link mxEvent.CELLS_REMOVED} while the transaction is in progress.
   *
   * @param cells Array of {@link mxCell} to remove.
   */
  // cellsRemoved(cells: mxCell[]): void;
  cellsRemoved(cells: mxCell[]) {
    if (cells != null && cells.length > 0) {
      const { scale } = this.view;
      const tr = this.getView().translate;

      this.getModel().beginUpdate();
      try {
        // Creates hashtable for faster lookup
        const dict = new mxDictionary();

        for (let i = 0; i < cells.length; i += 1) {
          dict.put(cells[i], true);
        }

        for (let i = 0; i < cells.length; i += 1) {
          // Disconnects edges which are not being removed
          const edges = this.getAllEdges([cells[i]]);

          const disconnectTerminal = (edge: mxCell, source: boolean) => {
            let geo = edge.getGeometry();

            if (geo != null) {
              // Checks if terminal is being removed
              const terminal = edge.getTerminal(source);
              let connected = false;
              let tmp = terminal;

              while (tmp != null) {
                if (cells[i] === tmp) {
                  connected = true;
                  break;
                }
                tmp = tmp.getParent();
              }

              if (connected) {
                geo = <mxGeometry>geo.clone();
                const state = this.getView().getState(edge);

                if (state != null && state.absolutePoints != null) {
                  const pts = <mxPoint[]>state.absolutePoints;
                  const n = source ? 0 : pts.length - 1;

                  geo.setTerminalPoint(
                    new mxPoint(
                      pts[n].x / scale - tr.x - (<mxPoint>state.origin).x,
                      pts[n].y / scale - tr.y - (<mxPoint>state.origin).y
                    ),
                    source
                  );
                } else {
                  // Fallback to center of terminal if routing
                  // points are not available to add new point
                  // KNOWN: Should recurse to find parent offset
                  // of edge for nested groups but invisible edges
                  // should be removed in removeCells step
                  const tstate = this.getView().getState(terminal);

                  if (tstate != null) {
                    geo.setTerminalPoint(
                      new mxPoint(
                        tstate.getCenterX() / scale - tr.x,
                        tstate.getCenterY() / scale - tr.y
                      ),
                      source
                    );
                  }
                }

                this.getModel().setGeometry(edge, geo);
                this.getModel().setTerminal(edge, null, source);
              }
            }
          };

          for (let j = 0; j < edges.length; j++) {
            if (!dict.get(edges[j])) {
              dict.put(edges[j], true);
              disconnectTerminal(edges[j], true);
              disconnectTerminal(edges[j], false);
            }
          }

          this.getModel().remove(cells[i]);
        }

        this.fireEvent(
          new mxEventObject(mxEvent.CELLS_REMOVED, 'cells', cells)
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Function: splitEdge
   *
   * Splits the given edge by adding the newEdge between the previous source
   * and the given cell and reconnecting the source of the given edge to the
   * given cell. This method fires <mxEvent.SPLIT_EDGE> while the transaction
   * is in progress. Returns the new edge that was inserted.
   *
   * Parameters:
   *
   * edge - <mxCell> that represents the edge to be splitted.
   * cells - <mxCells> that represents the cells to insert into the edge.
   * newEdge - <mxCell> that represents the edge to be inserted.
   * dx - Optional integer that specifies the vector to move the cells.
   * dy - Optional integer that specifies the vector to move the cells.
   * x - Integer that specifies the x-coordinate of the drop location.
   * y - Integer that specifies the y-coordinate of the drop location.
   * parent - Optional parent to insert the cell. If null the parent of
   * the edge is used.
   */
  splitEdge(
    edge: mxCell,
    cells: mxCell[],
    newEdge: mxCell,
    dx: number = 0,
    dy: number = 0,
    x: number,
    y: number,
    parent: mxCell | null = null
  ) {
    parent = parent != null ? parent : edge.getParent();
    const source = edge.getTerminal(true);

    this.getModel().beginUpdate();
    try {
      if (newEdge == null) {
        newEdge = <mxCell>this.cloneCell(edge);

        // Removes waypoints before/after new cell
        const state = this.getView().getState(edge);
        let geo = newEdge.getGeometry();

        if (geo != null && geo.points != null && state != null) {
          const t = this.getView().translate;
          const s = this.getView().scale;
          const idx = mxUtils.findNearestSegment(
            state,
            (dx + t.x) * s,
            (dy + t.y) * s
          );

          geo.points = geo.points.slice(0, idx);
          geo = <mxGeometry>edge.getGeometry();

          if (geo != null && geo.points != null) {
            geo = <mxGeometry>geo.clone();
            geo.points = geo.points.slice(idx);
            this.getModel().setGeometry(edge, geo);
          }
        }
      }

      this.cellsMoved(cells, dx, dy, false, false);
      this.cellsAdded(
        cells,
        parent,
        parent ? parent.getChildCount() : 0,
        null,
        null,
        true
      );
      this.cellsAdded(
        [newEdge],
        parent,
        parent ? parent.getChildCount() : 0,
        source,
        cells[0],
        false
      );
      this.cellConnected(edge, cells[0], true);
      this.fireEvent(
        new mxEventObject(
          mxEvent.SPLIT_EDGE,
          'edge',
          edge,
          'cells',
          cells,
          'newEdge',
          newEdge,
          'dx',
          dx,
          'dy',
          dy
        )
      );
    } finally {
      this.getModel().endUpdate();
    }

    return newEdge;
  }

  /*****************************************************************************
   * Group: Cell visibility
   *****************************************************************************/

  /**
   * Sets the visible state of the specified cells and all connected edges
   * if includeEdges is true. The change is carried out using {@link cellsToggled}.
   * This method fires {@link mxEvent.TOGGLE_CELLS} while the transaction is in
   * progress. Returns the cells whose visible state was changed.
   *
   * @param show Boolean that specifies the visible state to be assigned.
   * @param cells Array of {@link mxCell} whose visible state should be changed. If
   * null is specified then the selection cells are used.
   * @param includeEdges Optional boolean indicating if the visible state of all
   * connected edges should be changed as well. Default is `true`.
   */
  // toggleCells(show: boolean, cells: mxCell[], includeEdges: boolean): mxCell[];
  toggleCells(
    show: boolean = false,
    cells: mxCell[] = this.getSelectionCells(),
    includeEdges: boolean = true
  ): mxCell[] | null {
    // Adds all connected edges recursively
    if (includeEdges) {
      cells = this.addAllEdges(cells);
    }

    this.getModel().beginUpdate();
    try {
      this.cellsToggled(cells, show);
      this.fireEvent(
        new mxEventObject(
          mxEvent.TOGGLE_CELLS,
          'show',
          show,
          'cells',
          cells,
          'includeEdges',
          includeEdges
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
    return cells;
  }

  /**
   * Sets the visible state of the specified cells.
   *
   * @param cells Array of {@link mxCell} whose visible state should be changed.
   * @param show Boolean that specifies the visible state to be assigned.
   */
  // cellsToggled(cells: mxCell[], show: boolean): void;
  cellsToggled(cells: mxCell[] | null = null, show: boolean = false): void {
    if (cells != null && cells.length > 0) {
      this.getModel().beginUpdate();
      try {
        for (let i = 0; i < cells.length; i += 1) {
          this.getModel().setVisible(cells[i], show);
        }
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /*****************************************************************************
   * Group: Folding
   *****************************************************************************/

  /**
   * Sets the collapsed state of the specified cells and all descendants
   * if recurse is true. The change is carried out using {@link cellsFolded}.
   * This method fires {@link mxEvent.FOLD_CELLS} while the transaction is in
   * progress. Returns the cells whose collapsed state was changed.
   *
   * @param collapse Boolean indicating the collapsed state to be assigned.
   * @param recurse Optional boolean indicating if the collapsed state of all
   * descendants should be set. Default is `false`.
   * @param cells Array of {@link mxCell} whose collapsed state should be set. If
   * null is specified then the foldable selection cells are used.
   * @param checkFoldable Optional boolean indicating of isCellFoldable should be
   * checked. Default is `false`.
   * @param evt Optional native event that triggered the invocation.
   */
  // foldCells(collapse: boolean, recurse: boolean, cells: mxCell[], checkFoldable?: boolean, evt?: Event): mxCell[];
  foldCells(
    collapse: boolean = false,
    recurse: boolean = false,
    cells: mxCell[] | null = null,
    checkFoldable: boolean = false,
    evt: mxEventObject | null = null
  ): mxCell[] | null {
    if (cells == null) {
      cells = this.getFoldableCells(this.getSelectionCells(), collapse);
    }

    this.stopEditing(false);

    this.getModel().beginUpdate();
    try {
      this.cellsFolded(cells, collapse, recurse, checkFoldable);
      this.fireEvent(
        new mxEventObject(
          mxEvent.FOLD_CELLS,
          'collapse',
          collapse,
          'recurse',
          recurse,
          'cells',
          cells
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
    return cells;
  }

  /**
   * Sets the collapsed state of the specified cells. This method fires
   * {@link mxEvent.CELLS_FOLDED} while the transaction is in progress. Returns the
   * cells whose collapsed state was changed.
   *
   * @param cells Array of {@link mxCell} whose collapsed state should be set.
   * @param collapse Boolean indicating the collapsed state to be assigned.
   * @param recurse Boolean indicating if the collapsed state of all descendants
   * should be set.
   * @param checkFoldable Optional boolean indicating of isCellFoldable should be
   * checked. Default is `false`.
   */
  // cellsFolded(cells: mxCell[], collapse: boolean, recurse: boolean, checkFoldable?: boolean): void;
  cellsFolded(
    cells: mxCell[] | null = null,
    collapse: boolean = false,
    recurse: boolean = false,
    checkFoldable: boolean = false
  ): void {
    if (cells != null && cells.length > 0) {
      this.getModel().beginUpdate();
      try {
        for (let i = 0; i < cells.length; i += 1) {
          if (
            (!checkFoldable || this.isCellFoldable(cells[i], collapse)) &&
            collapse !== cells[i].isCollapsed()
          ) {
            this.getModel().setCollapsed(cells[i], collapse);
            this.swapBounds(cells[i], collapse);

            if (this.isExtendParent(cells[i])) {
              this.extendParent(cells[i]);
            }

            if (recurse) {
              const children = cells[i].getChildren();
              this.cellsFolded(children, collapse, recurse);
            }

            this.constrainChild(cells[i]);
          }
        }

        this.fireEvent(
          new mxEventObject(
            mxEvent.CELLS_FOLDED,
            'cells',
            cells,
            'collapse',
            collapse,
            'recurse',
            recurse
          )
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Swaps the alternate and the actual bounds in the geometry of the given
   * cell invoking {@link updateAlternateBounds} before carrying out the swap.
   *
   * @param cell {@link mxCell} for which the bounds should be swapped.
   * @param willCollapse Boolean indicating if the cell is going to be collapsed.
   */
  // swapBounds(cell: mxCell, willCollapse: boolean): void;
  swapBounds(cell: mxCell, willCollapse: boolean = false): void {
    let geo = cell.getGeometry();
    if (geo != null) {
      geo = <mxGeometry>geo.clone();

      this.updateAlternateBounds(cell, geo, willCollapse);
      geo.swap();

      this.getModel().setGeometry(cell, geo);
    }
  }

  /**
   * Updates or sets the alternate bounds in the given geometry for the given
   * cell depending on whether the cell is going to be collapsed. If no
   * alternate bounds are defined in the geometry and
   * {@link collapseToPreferredSize} is true, then the preferred size is used for
   * the alternate bounds. The top, left corner is always kept at the same
   * location.
   *
   * @param cell {@link mxCell} for which the geometry is being udpated.
   * @param g {@link mxGeometry} for which the alternate bounds should be updated.
   * @param willCollapse Boolean indicating if the cell is going to be collapsed.
   */
  // updateAlternateBounds(cell: mxCell, geo: mxGeometry, willCollapse: boolean): void;
  updateAlternateBounds(
    cell: mxCell | null = null,
    geo: mxGeometry | null = null,
    willCollapse: boolean = false
  ): void {
    if (cell != null && geo != null) {
      const style = this.getCurrentCellStyle(cell);

      if (geo.alternateBounds == null) {
        let bounds = geo;

        if (this.collapseToPreferredSize) {
          const tmp = this.getPreferredSizeForCell(cell);

          if (tmp != null) {
            bounds = <mxGeometry>tmp;

            const startSize = mxUtils.getValue(style, 'startSize');

            if (startSize > 0) {
              bounds.height = Math.max(bounds.height, startSize);
            }
          }
        }

        geo.alternateBounds = new mxRectangle(
          0,
          0,
          bounds.width,
          bounds.height
        );
      }

      if (geo.alternateBounds != null) {
        geo.alternateBounds.x = geo.x;
        geo.alternateBounds.y = geo.y;

        const alpha = mxUtils.toRadians(style.rotation || 0);

        if (alpha !== 0) {
          const dx = geo.alternateBounds.getCenterX() - geo.getCenterX();
          const dy = geo.alternateBounds.getCenterY() - geo.getCenterY();

          const cos = Math.cos(alpha);
          const sin = Math.sin(alpha);

          const dx2 = cos * dx - sin * dy;
          const dy2 = sin * dx + cos * dy;

          geo.alternateBounds.x += dx2 - dx;
          geo.alternateBounds.y += dy2 - dy;
        }
      }
    }
  }

  /**
   * Returns an array with the given cells and all edges that are connected
   * to a cell or one of its descendants.
   */
  // addAllEdges(cells: mxCell[]): mxCell[];
  addAllEdges(cells: mxCell[]): mxCell[] {
    const allCells = cells.slice();
    return mxUtils.removeDuplicates(allCells.concat(this.getAllEdges(cells)));
  }

  /**
   * Returns all edges connected to the given cells or its descendants.
   */
  // getAllEdges(cells: mxCell[]): mxCell[];
  getAllEdges(cells: mxCell[] | null): mxCell[] {
    let edges: mxCell[] = [];
    if (cells != null) {
      for (let i = 0; i < cells.length; i += 1) {
        const edgeCount = cells[i].getEdgeCount();

        for (let j = 0; j < edgeCount; j++) {
          edges.push(<mxCell>cells[i].getEdgeAt(j));
        }

        // Recurses
        const children = cells[i].getChildren();
        edges = edges.concat(this.getAllEdges(<mxCell[]>children));
      }
    }
    return edges;
  }

  /*****************************************************************************
   * Group: Cell sizing
   *****************************************************************************/

  /**
   * Updates the size of the given cell in the model using {@link cellSizeUpdated}.
   * This method fires {@link mxEvent.UPDATE_CELL_SIZE} while the transaction is in
   * progress. Returns the cell whose size was updated.
   *
   * @param cell {@link mxCell} whose size should be updated.
   */
  // updateCellSize(cell: mxCell, ignoreChildren?: boolean): mxCell;
  updateCellSize(cell: mxCell, ignoreChildren: boolean = false) {
    this.getModel().beginUpdate();
    try {
      this.cellSizeUpdated(cell, ignoreChildren);
      this.fireEvent(
        new mxEventObject(
          mxEvent.UPDATE_CELL_SIZE,
          'cell',
          cell,
          'ignoreChildren',
          ignoreChildren
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
    return cell;
  }

  /**
   * Updates the size of the given cell in the model using
   * {@link getPreferredSizeForCell} to get the new size.
   *
   * @param cell {@link mxCell} for which the size should be changed.
   */
  // cellSizeUpdated(cell: mxCell, ignoreChildren: boolean): void;
  cellSizeUpdated(
    cell: mxCell | null = null,
    ignoreChildren: boolean = false
  ): void {
    if (cell != null) {
      this.getModel().beginUpdate();
      try {
        const size = this.getPreferredSizeForCell(cell);
        let geo = cell.getGeometry();

        if (size != null && geo != null) {
          const collapsed = cell.isCollapsed();
          geo = <mxGeometry>geo.clone();

          if (this.isSwimlane(cell)) {
            const style = this.getCellStyle(cell);
            let cellStyle = cell.getStyle();

            if (cellStyle == null) {
              cellStyle = '';
            }

            if (mxUtils.getValue(style, 'horizontal', true)) {
              cellStyle = mxUtils.setStyle(
                cellStyle,
                'startSize',
                size.height + 8
              );

              if (collapsed) {
                geo.height = size.height + 8;
              }

              geo.width = size.width;
            } else {
              cellStyle = mxUtils.setStyle(
                cellStyle,
                'startSize',
                size.width + 8
              );

              if (collapsed) {
                geo.width = size.width + 8;
              }

              geo.height = size.height;
            }

            this.getModel().setStyle(cell, cellStyle);
          } else {
            const state = this.getView().createState(cell);
            const align = state.style.align || ALIGN_CENTER;

            if (align === ALIGN_RIGHT) {
              geo.x += geo.width - size.width;
            } else if (align === ALIGN_CENTER) {
              geo.x += Math.round((geo.width - size.width) / 2);
            }

            const valign = this.getVerticalAlign(state);

            if (valign === ALIGN_BOTTOM) {
              geo.y += geo.height - size.height;
            } else if (valign === ALIGN_MIDDLE) {
              geo.y += Math.round((geo.height - size.height) / 2);
            }

            geo.width = size.width;
            geo.height = size.height;
          }

          if (!ignoreChildren && !collapsed) {
            const bounds = this.getView().getBounds(cell.getChildren());

            if (bounds != null) {
              const tr = this.getView().translate;
              const { scale } = this.view;

              const width = (bounds.x + bounds.width) / scale - geo.x - tr.x;
              const height = (bounds.y + bounds.height) / scale - geo.y - tr.y;

              geo.width = Math.max(geo.width, width);
              geo.height = Math.max(geo.height, height);
            }
          }

          this.cellsResized([cell], [geo], false);
        }
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Returns the preferred width and height of the given {@link mxCell} as an
   * {@link mxRectangle}. To implement a minimum width, add a new style eg.
   * minWidth in the vertex and override this method as follows.
   *
   * ```javascript
   * var graphGetPreferredSizeForCell = graph.getPreferredSizeForCell;
   * graph.getPreferredSizeForCell = function(cell)
   * {
   *   var result = graphGetPreferredSizeForCell.apply(this, arguments);
   *   var style = this.getCellStyle(cell);
   *
   *   if (style.minWidth > 0)
   *   {
   *     result.width = Math.max(style.minWidth, result.width);
   *   }
   *
   *   return result;
   * };
   * ```
   *
   * @param cell {@link mxCell} for which the preferred size should be returned.
   * @param textWidth Optional maximum text width for word wrapping.
   */
  // getPreferredSizeForCell(cell: mxCell, textWidth?: number): mxRectangle;
  getPreferredSizeForCell(
    cell: mxCell,
    textWidth: number | null = null
  ): mxRectangle | null {
    let result = null;

    if (cell != null) {
      const state = this.getView().createState(cell);
      const { style } = state;

      if (!cell.isEdge()) {
        const fontSize = style.fontSize || DEFAULT_FONTSIZE;
        let dx = 0;
        let dy = 0;

        // Adds dimension of image if shape is a label
        if (this.getImage(state) != null || style.image != null) {
          if (style.shape === SHAPE_LABEL) {
            if (style.verticalAlign === ALIGN_MIDDLE) {
              dx +=
                parseFloat(style.imageWidth) || new mxLabel().imageSize;
            }

            if (style.align !== ALIGN_CENTER) {
              dy +=
                parseFloat(style.imageHeight) ||
                new mxLabel().imageSize;
            }
          }
        }

        // Adds spacings
        dx += 2 * (style.spacing || 0);
        dx += style.spacingLeft || 0;
        dx += style.spacingRight || 0;

        dy += 2 * (style.spacing || 0);
        dy += style.spacingTop || 0;
        dy += style.spacingBottom || 0;

        // Add spacing for collapse/expand icon
        // LATER: Check alignment and use constants
        // for image spacing
        const image = this.getFoldingImage(state);

        if (image != null) {
          dx += image.width + 8;
        }

        // Adds space for label
        let value = <string>this.cellRenderer.getLabelValue(state);

        if (value != null && value.length > 0) {
          if (!this.isHtmlLabel(<mxCell>state.cell)) {
            value = htmlEntities(value, false);
          }

          value = value.replace(/\n/g, '<br>');

          const size = mxUtils.getSizeForString(
            value,
            fontSize,
            style.fontFamily,
            textWidth,
            style.fontStyle
          );
          let width = size.width + dx;
          let height = size.height + dy;

          if (!mxUtils.getValue(style, 'horizontal', true)) {
            const tmp = height;
            height = width;
            width = tmp;
          }

          if (this.gridEnabled) {
            width = this.snap(width + this.gridSize / 2);
            height = this.snap(height + this.gridSize / 2);
          }

          result = new mxRectangle(0, 0, width, height);
        } else {
          const gs2 = 4 * this.gridSize;
          result = new mxRectangle(0, 0, gs2, gs2);
        }
      }
    }

    return result;
  }

  /**
   * Sets the bounds of the given cell using {@link resizeCells}. Returns the
   * cell which was passed to the function.
   *
   * @param cell {@link mxCell} whose bounds should be changed.
   * @param bounds {@link mxRectangle} that represents the new bounds.
   */
  // resizeCell(cell: mxCell, bounds: mxRectangle, recurse?: boolean): mxCell[];
  resizeCell(
    cell: mxCell,
    bounds: mxRectangle,
    recurse: boolean = false
  ): mxCell {
    return this.resizeCells([cell], [bounds], recurse)[0];
  }

  /**
   * Sets the bounds of the given cells and fires a {@link mxEvent.RESIZE_CELLS}
   * event while the transaction is in progress. Returns the cells which
   * have been passed to the function.
   *
   * @param cells Array of {@link mxCell} whose bounds should be changed.
   * @param bounds Array of {@link mxRectangles} that represent the new bounds.
   */
  // resizeCells(cells: mxCell[], bounds: mxRectangle[], recurse: boolean): mxCell[];
  resizeCells(
    cells: mxCell[],
    bounds: mxRectangle[],
    recurse: boolean = this.isRecursiveResize()
  ): mxCell[] {
    this.getModel().beginUpdate();
    try {
      const prev = this.cellsResized(cells, bounds, recurse);
      this.fireEvent(
        new mxEventObject(
          mxEvent.RESIZE_CELLS,
          'cells',
          cells,
          'bounds',
          bounds,
          'previous',
          prev
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
    return cells;
  }

  /**
   * Sets the bounds of the given cells and fires a {@link mxEvent.CELLS_RESIZED}
   * event. If {@link extendParents} is true, then the parent is extended if a
   * child size is changed so that it overlaps with the parent.
   *
   * The following example shows how to control group resizes to make sure
   * that all child cells stay within the group.
   *
   * ```javascript
   * graph.addListener(mxEvent.CELLS_RESIZED, function(sender, evt)
   * {
   *   var cells = evt.getProperty('cells');
   *
   *   if (cells != null)
   *   {
   *     for (var i = 0; i < cells.length; i++)
   *     {
   *       if (graph.getModel().getChildCount(cells[i]) > 0)
   *       {
   *         var geo = cells[i].getGeometry();
   *
   *         if (geo != null)
   *         {
   *           var children = graph.getChildCells(cells[i], true, true);
   *           var bounds = graph.getBoundingBoxFromGeometry(children, true);
   *
   *           geo = geo.clone();
   *           geo.width = Math.max(geo.width, bounds.width);
   *           geo.height = Math.max(geo.height, bounds.height);
   *
   *           graph.getModel().setGeometry(cells[i], geo);
   *         }
   *       }
   *     }
   *   }
   * });
   * ```
   *
   * @param cells Array of {@link mxCell} whose bounds should be changed.
   * @param bounds Array of {@link mxRectangles} that represent the new bounds.
   * @param recurse Optional boolean that specifies if the children should be resized.
   */
  // cellsResized(cells: mxCell[], bounds: mxRectangle[], recurse?: boolean): mxGeometry[];
  cellsResized(
    cells: mxCell[] | null = null,
    bounds: mxRectangle[] | null = null,
    recurse: boolean = false
  ): any[] {
    recurse = recurse != null ? recurse : false;
    const prev = [];

    if (cells != null && bounds != null && cells.length === bounds.length) {
      this.getModel().beginUpdate();
      try {
        for (let i = 0; i < cells.length; i += 1) {
          prev.push(this.cellResized(cells[i], bounds[i], false, recurse));

          if (this.isExtendParent(cells[i])) {
            this.extendParent(cells[i]);
          }

          this.constrainChild(cells[i]);
        }

        if (this.resetEdgesOnResize) {
          this.resetEdges(cells);
        }

        this.fireEvent(
          new mxEventObject(
            mxEvent.CELLS_RESIZED,
            'cells',
            cells,
            'bounds',
            bounds,
            'previous',
            prev
          )
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
    return prev;
  }

  /**
   * Resizes the parents recursively so that they contain the complete area
   * of the resized child cell.
   *
   * @param cell {@link mxCell} whose bounds should be changed.
   * @param bounds {@link mxRectangles} that represent the new bounds.
   * @param ignoreRelative Boolean that indicates if relative cells should be ignored.
   * @param recurse Optional boolean that specifies if the children should be resized.
   */
  // cellResized(cell: mxCell, bounds: mxRectangle, ignoreRelative?: boolean, recurse?: boolean): mxGeometry;
  cellResized(
    cell: mxCell,
    bounds: mxRectangle,
    ignoreRelative: boolean = false,
    recurse: boolean = false
  ): mxGeometry | null {
    const prev = cell.getGeometry();

    if (
      prev != null &&
      (prev.x !== bounds.x ||
        prev.y !== bounds.y ||
        prev.width !== bounds.width ||
        prev.height !== bounds.height)
    ) {
      const geo = prev.clone();

      if (!ignoreRelative && geo.relative) {
        const { offset } = geo;

        if (offset != null) {
          offset.x += bounds.x - geo.x;
          offset.y += bounds.y - geo.y;
        }
      } else {
        geo.x = bounds.x;
        geo.y = bounds.y;
      }

      geo.width = bounds.width;
      geo.height = bounds.height;

      if (
        !geo.relative &&
        cell.isVertex() &&
        !this.isAllowNegativeCoordinates()
      ) {
        geo.x = Math.max(0, geo.x);
        geo.y = Math.max(0, geo.y);
      }

      this.getModel().beginUpdate();
      try {
        if (recurse) {
          this.resizeChildCells(cell, geo);
        }

        this.getModel().setGeometry(cell, geo);
        this.constrainChildCells(cell);
      } finally {
        this.getModel().endUpdate();
      }
    }
    return prev;
  }

  /**
   * Resizes the child cells of the given cell for the given new geometry with
   * respect to the current geometry of the cell.
   *
   * @param cell {@link mxCell} that has been resized.
   * @param newGeo {@link mxGeometry} that represents the new bounds.
   */
  // resizeChildCells(cell: mxCell, newGeo: mxGeometry): void;
  resizeChildCells(cell: mxCell, newGeo: mxGeometry): void {
    const geo = <mxGeometry>cell.getGeometry();
    const dx = geo.width !== 0 ? newGeo.width / geo.width : 1;
    const dy = geo.height !== 0 ? newGeo.height / geo.height : 1;
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      this.scaleCell(<mxCell>cell.getChildAt(i), dx, dy, true);
    }
  }

  /**
   * Constrains the children of the given cell using {@link constrainChild}.
   *
   * @param cell {@link mxCell} that has been resized.
   */
  // constrainChildCells(cell: mxCell): void;
  constrainChildCells(cell: mxCell) {
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      this.constrainChild(<mxCell>cell.getChildAt(i));
    }
  }

  /**
   * Scales the points, position and size of the given cell according to the
   * given vertical and horizontal scaling factors.
   *
   * @param cell {@link mxCell} whose geometry should be scaled.
   * @param dx Horizontal scaling factor.
   * @param dy Vertical scaling factor.
   * @param recurse Boolean indicating if the child cells should be scaled.
   */
  // scaleCell(cell: mxCell, dx: number, dy: number, recurse?: boolean): void;
  scaleCell(
    cell: mxCell,
    dx: number,
    dy: number,
    recurse: boolean = false
  ): void {
    let geo = cell.getGeometry();

    if (geo != null) {
      const style = this.getCurrentCellStyle(cell);
      geo = <mxGeometry>geo.clone();

      // Stores values for restoring based on style
      const { x } = geo;
      const { y } = geo;
      const w = geo.width;
      const h = geo.height;

      geo.scale(dx, dy, style.aspect === 'fixed');

      if (style.resizeWidth == '1') {
        geo.width = w * dx;
      } else if (style.resizeWidth == '0') {
        geo.width = w;
      }

      if (style.resizeHeight == '1') {
        geo.height = h * dy;
      } else if (style.resizeHeight == '0') {
        geo.height = h;
      }

      if (!this.isCellMovable(cell)) {
        geo.x = x;
        geo.y = y;
      }

      if (!this.isCellResizable(cell)) {
        geo.width = w;
        geo.height = h;
      }

      if (cell.isVertex()) {
        this.cellResized(cell, geo, true, recurse);
      } else {
        this.getModel().setGeometry(cell, geo);
      }
    }
  }

  /**
   * Resizes the parents recursively so that they contain the complete area
   * of the resized child cell.
   *
   * @param cell {@link mxCell} that has been resized.
   */
  // extendParent(cell: mxCell): void;
  extendParent(cell: mxCell | null = null): void {
    if (cell != null) {
      const parent = <mxCell>cell.getParent();
      let p = parent.getGeometry();

      if (parent != null && p != null && !parent.isCollapsed()) {
        const geo = cell.getGeometry();

        if (
          geo != null &&
          !geo.relative &&
          (p.width < geo.x + geo.width || p.height < geo.y + geo.height)
        ) {
          p = <mxGeometry>p.clone();

          p.width = Math.max(p.width, geo.x + geo.width);
          p.height = Math.max(p.height, geo.y + geo.height);

          this.cellsResized([parent], [p], false);
        }
      }
    }
  }

  /*****************************************************************************
   * Group: Cell moving
   *****************************************************************************/

  /**
   * Clones and inserts the given cells into the graph using the move
   * method and returns the inserted cells. This shortcut is used if
   * cells are inserted via datatransfer.
   *
   * @param cells Array of {@link mxCell} to be imported.
   * @param dx Integer that specifies the x-coordinate of the vector. Default is `0`.
   * @param dy Integer that specifies the y-coordinate of the vector. Default is `0`.
   * @param target {@link mxCell} that represents the new parent of the cells.
   * @param evt Mouseevent that triggered the invocation.
   * @param mapping Optional mapping for existing clones.
   */
  // importCells(cells: mxCell[], dx: number, dy: number, target: mxCell, evt?: Event, mapping?: any): mxCell[];
  importCells(
    cells: mxCell[] | null = null,
    dx: number,
    dy: number,
    target: mxCell | null = null,
    evt: MouseEvent,
    mapping: any = {}
  ): mxCell[] | null {
    return this.moveCells(cells, dx, dy, true, target, evt, mapping);
  }

  /**
   * Function: moveCells
   *
   * Moves or clones the specified cells and moves the cells or clones by the
   * given amount, adding them to the optional target cell. The evt is the
   * mouse event as the mouse was released. The change is carried out using
   * <cellsMoved>. This method fires <mxEvent.MOVE_CELLS> while the
   * transaction is in progress. Returns the cells that were moved.
   *
   * Use the following code to move all cells in the graph.
   *
   * (code)
   * graph.moveCells(graph.getChildCells(null, true, true), 10, 10);
   * (end)
   *
   * Parameters:
   *
   * cells - Array of <mxCells> to be moved, cloned or added to the target.
   * dx - Integer that specifies the x-coordinate of the vector. Default is 0.
   * dy - Integer that specifies the y-coordinate of the vector. Default is 0.
   * clone - Boolean indicating if the cells should be cloned. Default is false.
   * target - <mxCell> that represents the new parent of the cells.
   * evt - Mouseevent that triggered the invocation.
   * mapping - Optional mapping for existing clones.
   */
  moveCells(
    cells: mxCell[] | null = null,
    dx: number,
    dy: number,
    clone: boolean = false,
    target: mxCell | null = null,
    evt: MouseEvent | null = null,
    mapping: any = null
  ): mxCell[] | null {
    dx = dx != null ? dx : 0;
    dy = dy != null ? dy : 0;
    clone = clone != null ? clone : false;

    // alert(`moveCells: ${cells} ${dx} ${dy} ${clone} ${target}`)

    if (cells != null && (dx !== 0 || dy !== 0 || clone || target != null)) {
      // Removes descendants with ancestors in cells to avoid multiple moving
      cells = this.getModel().getTopmostCells(cells);
      const origCells = cells;

      this.getModel().beginUpdate();
      try {
        // Faster cell lookups to remove relative edge labels with selected
        // terminals to avoid explicit and implicit move at same time
        const dict = new mxDictionary();

        for (let i = 0; i < cells.length; i += 1) {
          dict.put(cells[i], true);
        }

        const isSelected = (cell: mxCell | null) => {
          while (cell != null) {
            if (dict.get(cell)) {
              return true;
            }
            cell = <mxCell>cell.getParent();
          }
          return false;
        };

        // Removes relative edge labels with selected terminals
        const checked = [];

        for (let i = 0; i < cells.length; i += 1) {
          const geo = cells[i].getGeometry();
          const parent = cells[i].getParent();

          if (
            geo == null ||
            !geo.relative ||
            (parent && !parent.isEdge()) ||
            (parent &&
              !isSelected(parent.getTerminal(true)) &&
              !isSelected(parent.getTerminal(false)))
          ) {
            checked.push(cells[i]);
          }
        }

        cells = checked;

        if (clone) {
          cells = <mxCell[]>(
            this.cloneCells(cells, this.isCloneInvalidEdges(), mapping)
          );

          if (target == null) {
            target = this.getDefaultParent();
          }
        }

        // FIXME: Cells should always be inserted first before any other edit
        // to avoid forward references in sessions.
        // Need to disable allowNegativeCoordinates if target not null to
        // allow for temporary negative numbers until cellsAdded is called.
        const previous = this.isAllowNegativeCoordinates();

        if (target != null) {
          this.setAllowNegativeCoordinates(true);
        }

        this.cellsMoved(
          cells,
          dx,
          dy,
          !clone && this.isDisconnectOnMove() && this.isAllowDanglingEdges(),
          target == null,
          this.isExtendParentsOnMove() && target == null
        );

        this.setAllowNegativeCoordinates(previous);

        if (target != null) {
          const index = target.getChildCount();
          this.cellsAdded(cells, target, index, null, null, true);

          // Restores parent edge on cloned edge labels
          if (clone) {
            for (let i = 0; i < cells.length; i += 1) {
              const geo = cells[i].getGeometry();
              const parent = <mxCell>origCells[i].getParent();

              if (
                geo != null &&
                geo.relative &&
                parent.isEdge() &&
                this.getModel().contains(parent)
              ) {
                this.getModel().add(parent, cells[i]);
              }
            }
          }
        }

        // Dispatches a move event
        this.fireEvent(
          new mxEventObject(
            mxEvent.MOVE_CELLS,
            'cells',
            cells,
            'dx',
            dx,
            'dy',
            dy,
            'clone',
            clone,
            'target',
            target,
            'event',
            evt
          )
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
    return cells;
  }

  /**
   * Function: cellsMoved
   *
   * Moves the specified cells by the given vector, disconnecting the cells
   * using disconnectGraph is disconnect is true. This method fires
   * <mxEvent.CELLS_MOVED> while the transaction is in progress.
   */
  cellsMoved(
    cells: mxCell[] | null,
    dx: number,
    dy: number,
    disconnect: boolean = false,
    constrain: boolean = false,
    extend: boolean = false
  ): void {
    if (cells != null && (dx !== 0 || dy !== 0)) {
      this.getModel().beginUpdate();
      try {
        if (disconnect) {
          this.disconnectGraph(cells);
        }

        for (const cell of cells) {
          this.translateCell(cell, dx, dy);

          if (extend && this.isExtendParent(cell)) {
            this.extendParent(cell);
          } else if (constrain) {
            this.constrainChild(cell);
          }
        }

        if (this.resetEdgesOnMove) {
          this.resetEdges(cells);
        }

        this.fireEvent(
          new mxEventObject(
            mxEvent.CELLS_MOVED,
            'cells',
            cells,
            'dx',
            dx,
            'dy',
            dy,
            'disconnect',
            disconnect
          )
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Translates the geometry of the given cell and stores the new,
   * translated geometry in the model as an atomic change.
   */
  // translateCell(cell: mxCell, dx: number, dy: number): void;
  translateCell(cell: mxCell, dx: number, dy: number): void {
    let geometry = cell.getGeometry();

    if (geometry != null) {
      dx = parseFloat(String(dx));
      dy = parseFloat(String(dy));
      geometry = <mxGeometry>geometry.clone();
      geometry.translate(dx, dy);

      if (
        !geometry.relative &&
        cell.isVertex() &&
        !this.isAllowNegativeCoordinates()
      ) {
        geometry.x = Math.max(0, geometry.x);
        geometry.y = Math.max(0, geometry.y);
      }

      if (geometry.relative && !cell.isEdge()) {
        const parent = <mxCell>cell.getParent();
        let angle = 0;

        if (parent.isVertex()) {
          const style = this.getCurrentCellStyle(parent);
          angle = mxUtils.getValue(style, 'rotation', 0);
        }

        if (angle !== 0) {
          const rad = mxUtils.toRadians(-angle);
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const pt = mxUtils.getRotatedPoint(
            new mxPoint(dx, dy),
            cos,
            sin,
            new mxPoint(0, 0)
          );
          dx = pt.x;
          dy = pt.y;
        }

        if (geometry.offset == null) {
          geometry.offset = new mxPoint(dx, dy);
        } else {
          geometry.offset.x += dx;
          geometry.offset.y += dy;
        }
      }
      this.getModel().setGeometry(cell, geometry);
    }
  }

  /**
   * Returns the {@link mxRectangle} inside which a cell is to be kept.
   *
   * @param cell {@link mxCell} for which the area should be returned.
   */
  // getCellContainmentArea(cell: mxCell): mxRectangle;
  getCellContainmentArea(cell: mxCell): mxRectangle | null {
    if (cell != null && !cell.isEdge()) {
      const parent = cell.getParent();

      if (parent != null && parent !== this.getDefaultParent()) {
        const g = parent.getGeometry();

        if (g != null) {
          let x = 0;
          let y = 0;
          let w = g.width;
          let h = g.height;

          if (this.isSwimlane(parent)) {
            const size = this.getStartSize(parent);
            const style = this.getCurrentCellStyle(parent);
            const dir = mxUtils.getValue(
              style,
              'direction',
              DIRECTION_EAST
            );
            const flipH = mxUtils.getValue(style, 'flipH', 0) == 1;
            const flipV = mxUtils.getValue(style, 'flipV', 0) == 1;

            if (dir === DIRECTION_SOUTH || dir === DIRECTION_NORTH) {
              const tmp = size.width;
              size.width = size.height;
              size.height = tmp;
            }

            if (
              (dir === DIRECTION_EAST && !flipV) ||
              (dir === DIRECTION_NORTH && !flipH) ||
              (dir === DIRECTION_WEST && flipV) ||
              (dir === DIRECTION_SOUTH && flipH)
            ) {
              x = size.width;
              y = size.height;
            }

            w -= size.width;
            h -= size.height;
          }

          return new mxRectangle(x, y, w, h);
        }
      }
    }
    return null;
  }

  /**
   * Returns the bounds inside which the diagram should be kept as an
   * {@link mxRectangle}.
   */
  // getMaximumGraphBounds(): mxRectangle;
  getMaximumGraphBounds(): mxRectangle | null {
    return this.maximumGraphBounds;
  }

  /**
   * Keeps the given cell inside the bounds returned by
   * {@link getCellContainmentArea} for its parent, according to the rules defined by
   * {@link getOverlap} and {@link isConstrainChild}. This modifies the cell's geometry
   * in-place and does not clone it.
   *
   * @param cell {@link mxCell} which should be constrained.
   * @param sizeFirst Specifies if the size should be changed first. Default is `true`.
   */
  // constrainChild(cell: mxCell, sizeFirst?: boolean): void;
  constrainChild(cell: mxCell, sizeFirst: boolean = true): void {
    if (cell != null) {
      let geo = cell.getGeometry();

      if (
        geo != null &&
        (this.isConstrainRelativeChildren() || !geo.relative)
      ) {
        const parent = cell.getParent();
        const pgeo = (<mxCell>parent).getGeometry();
        let max = this.getMaximumGraphBounds();

        // Finds parent offset
        if (max != null) {
          const off = this.getBoundingBoxFromGeometry([<mxCell>parent], false);

          if (off != null) {
            max = mxRectangle.fromRectangle(max);

            max.x -= off.x;
            max.y -= off.y;
          }
        }

        if (this.isConstrainChild(cell)) {
          let tmp = this.getCellContainmentArea(cell);

          if (tmp != null) {
            const overlap = this.getOverlap(cell);

            if (overlap > 0) {
              tmp = mxRectangle.fromRectangle(tmp);

              tmp.x -= tmp.width * overlap;
              tmp.y -= tmp.height * overlap;
              tmp.width += 2 * tmp.width * overlap;
              tmp.height += 2 * tmp.height * overlap;
            }

            // Find the intersection between max and tmp
            if (max == null) {
              max = tmp;
            } else {
              max = mxRectangle.fromRectangle(max);
              max.intersect(tmp);
            }
          }
        }

        if (max != null) {
          const cells = [cell];

          if (!cell.isCollapsed()) {
            const desc = this.getModel().getDescendants(cell);

            for (let i = 0; i < desc.length; i += 1) {
              if (desc[i].isVisible()) {
                cells.push(desc[i]);
              }
            }
          }

          const bbox = this.getBoundingBoxFromGeometry(cells, false);

          if (bbox != null) {
            geo = <mxGeometry>geo.clone();

            // Cumulative horizontal movement
            let dx = 0;

            if (geo.width > max.width) {
              dx = geo.width - max.width;
              geo.width -= dx;
            }

            if (bbox.x + bbox.width > max.x + max.width) {
              dx -= bbox.x + bbox.width - max.x - max.width - dx;
            }

            // Cumulative vertical movement
            let dy = 0;

            if (geo.height > max.height) {
              dy = geo.height - max.height;
              geo.height -= dy;
            }

            if (bbox.y + bbox.height > max.y + max.height) {
              dy -= bbox.y + bbox.height - max.y - max.height - dy;
            }

            if (bbox.x < max.x) {
              dx -= bbox.x - max.x;
            }

            if (bbox.y < max.y) {
              dy -= bbox.y - max.y;
            }

            if (dx !== 0 || dy !== 0) {
              if (geo.relative) {
                // Relative geometries are moved via absolute offset
                if (geo.offset == null) {
                  geo.offset = new mxPoint();
                }

                geo.offset.x += dx;
                geo.offset.y += dy;
              } else {
                geo.x += dx;
                geo.y += dy;
              }
            }

            this.getModel().setGeometry(cell, geo);
          }
        }
      }
    }
  }

  /**
   * Resets the control points of the edges that are connected to the given
   * cells if not both ends of the edge are in the given cells array.
   *
   * @param cells Array of {@link mxCell} for which the connected edges should be
   * reset.
   */
  // resetEdges(cells: mxCell[]): void;
  resetEdges(cells: mxCell[]): void {
    if (cells != null) {
      // Prepares faster cells lookup
      const dict = new mxDictionary();

      for (let i = 0; i < cells.length; i += 1) {
        dict.put(cells[i], true);
      }

      this.getModel().beginUpdate();
      try {
        for (let i = 0; i < cells.length; i += 1) {
          const edges = this.getModel().getEdges(cells[i]);

          if (edges != null) {
            for (let j = 0; j < edges.length; j++) {
              const state = this.getView().getState(edges[j]);

              const source =
                state != null
                  ? state.getVisibleTerminal(true)
                  : this.getView().getVisibleTerminal(edges[j], true);
              const target =
                state != null
                  ? state.getVisibleTerminal(false)
                  : this.getView().getVisibleTerminal(edges[j], false);

              // Checks if one of the terminals is not in the given array
              if (!dict.get(source) || !dict.get(target)) {
                this.resetEdge(<mxCell>edges[j]);
              }
            }
          }

          this.resetEdges(cells[i].getChildren());
        }
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Resets the control points of the given edge.
   *
   * @param edge {@link mxCell} whose points should be reset.
   */
  // resetEdge(edge: mxCell): mxCell;
  resetEdge(edge: mxCell): mxCell | null {
    let geo = edge.getGeometry();

    // Resets the control points
    if (geo != null && geo.points != null && geo.points.length > 0) {
      geo = <mxGeometry>geo.clone();
      geo.points = [];
      this.getModel().setGeometry(edge, geo);
    }
    return edge;
  }

  /*****************************************************************************
   * Group: Cell connecting and connection constraints
   *****************************************************************************/

  /**
   * Returns the constraint used to connect to the outline of the given state.
   */
  // getOutlineConstraint(point: mxPoint, terminalState: mxCellState, me: mxMouseEvent): mxConnectionConstraint;
  getOutlineConstraint(
    point: mxPoint,
    terminalState: mxCellState,
    me: mxMouseEvent
  ): mxConnectionConstraint | null {
    if (terminalState.shape != null) {
      const bounds = <mxRectangle>(
        this.getView().getPerimeterBounds(terminalState)
      );
      const direction = terminalState.style.direction;

      if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
        bounds.x += bounds.width / 2 - bounds.height / 2;
        bounds.y += bounds.height / 2 - bounds.width / 2;
        const tmp = bounds.width;
        bounds.width = bounds.height;
        bounds.height = tmp;
      }

      const alpha = mxUtils.toRadians(terminalState.shape.getShapeRotation());

      if (alpha !== 0) {
        const cos = Math.cos(-alpha);
        const sin = Math.sin(-alpha);

        const ct = new mxPoint(bounds.getCenterX(), bounds.getCenterY());
        point = mxUtils.getRotatedPoint(point, cos, sin, ct);
      }

      let sx = 1;
      let sy = 1;
      let dx = 0;
      let dy = 0;

      // LATER: Add flipping support for image shapes
      if ((<mxCell>terminalState.cell).isVertex()) {
        let flipH = terminalState.style.flipH;
        let flipV = terminalState.style.flipV;

        // Legacy support for stencilFlipH/V
        if (
          terminalState.shape != null &&
          terminalState.shape.stencil != null
        ) {
          flipH =
            mxUtils.getValue(terminalState.style, 'stencilFlipH', 0) == 1 ||
            flipH;
          flipV =
            mxUtils.getValue(terminalState.style, 'stencilFlipV', 0) == 1 ||
            flipV;
        }

        if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
          const tmp = flipH;
          flipH = flipV;
          flipV = tmp;
        }

        if (flipH) {
          sx = -1;
          dx = -bounds.width;
        }

        if (flipV) {
          sy = -1;
          dy = -bounds.height;
        }
      }

      point = new mxPoint(
        (point.x - bounds.x) * sx - dx + bounds.x,
        (point.y - bounds.y) * sy - dy + bounds.y
      );

      const x =
        bounds.width === 0
          ? 0
          : Math.round(((point.x - bounds.x) * 1000) / bounds.width) / 1000;
      const y =
        bounds.height === 0
          ? 0
          : Math.round(((point.y - bounds.y) * 1000) / bounds.height) / 1000;

      return new mxConnectionConstraint(new mxPoint(x, y), false);
    }
    return null;
  }

  /**
   * Returns an array of all {@link mxConnectionConstraints} for the given terminal. If
   * the shape of the given terminal is a {@link mxStencilShape} then the constraints
   * of the corresponding {@link mxStencil} are returned.
   *
   * @param terminal {@link mxCellState} that represents the terminal.
   * @param source Boolean that specifies if the terminal is the source or target.
   */
  // getAllConnectionConstraints(terminal: mxCellState, source?: boolean): mxConnectionConstraint[];
  getAllConnectionConstraints(
    terminal: mxCellState,
    source: boolean
  ): mxConnectionConstraint[] | null {
    if (
      terminal != null &&
      terminal.shape != null &&
      terminal.shape.stencil != null
    ) {
      return terminal.shape.stencil.constraints;
    }
    return null;
  }

  /**
   * Returns an {@link mxConnectionConstraint} that describes the given connection
   * point. This result can then be passed to {@link getConnectionPoint}.
   *
   * @param edge {@link mxCellState} that represents the edge.
   * @param terminal {@link mxCellState} that represents the terminal.
   * @param source Boolean indicating if the terminal is the source or target.
   */
  // getConnectionConstraint(edge: mxCellState, terminal: mxCellState, source?: boolean): mxConnectionConstraint;
  getConnectionConstraint(
    edge: mxCellState,
    terminal: mxCellState | null = null,
    source: boolean = false
  ): mxConnectionConstraint {
    let point = null;
    // @ts-ignore
    const x = <string>edge.style[source ? 'exitX' : 'entryX'];

    if (x != null) {
      // @ts-ignore
      const y = <string>edge.style[source ? 'exitY' : 'entryY'];

      if (y != null) {
        point = new mxPoint(parseFloat(x), parseFloat(y));
      }
    }

    let perimeter = false;
    let dx = 0;
    let dy = 0;

    if (point != null) {
      perimeter = mxUtils.getValue(
        edge.style,
        source ? 'exitPerimeter' : 'entryPerimeter',
        true
      );

      // Add entry/exit offset
      // @ts-ignore
      dx = parseFloat(
        <string>edge.style[source ? 'exitDx' : 'entryDx']
      );
      // @ts-ignore
      dy = parseFloat(
        <string>edge.style[source ? 'exitDy' : 'entryDy']
      );

      dx = Number.isFinite(dx) ? dx : 0;
      dy = Number.isFinite(dy) ? dy : 0;
    }

    return new mxConnectionConstraint(point, perimeter, null, dx, dy);
  }

  /**
   * Sets the {@link mxConnectionConstraint} that describes the given connection point.
   * If no constraint is given then nothing is changed. To remove an existing
   * constraint from the given edge, use an empty constraint instead.
   *
   * @param edge {@link mxCell} that represents the edge.
   * @param terminal {@link mxCell} that represents the terminal.
   * @param source Boolean indicating if the terminal is the source or target.
   * @param constraint Optional {@link mxConnectionConstraint} to be used for this
   * connection.
   */
  // setConnectionConstraint(edge: mxCell, terminal: mxCell, source: boolean, constraint?: mxConnectionConstraint): void;
  setConnectionConstraint(
    edge: mxCell,
    terminal: mxCell,
    source: boolean = false,
    constraint: mxConnectionConstraint | null = null
  ) {
    if (constraint != null) {
      this.getModel().beginUpdate();

      try {
        if (constraint == null || constraint.point == null) {
          this.setCellStyles(source ? 'exitX' : 'entryX', null, [
            edge,
          ]);
          this.setCellStyles(source ? 'exitY' : 'entryY', null, [
            edge,
          ]);
          this.setCellStyles(source ? 'exitDx' : 'entryDx', null, [
            edge,
          ]);
          this.setCellStyles(source ? 'exitDy' : 'entryDy', null, [
            edge,
          ]);
          this.setCellStyles(
            source ? 'exitPerimeter' : 'entryPerimeter',
            null,
            [edge]
          );
        } else if (constraint.point != null) {
          this.setCellStyles(
            source ? 'exitX' : 'entryX',
            constraint.point.x,
            [edge]
          );
          this.setCellStyles(
            source ? 'exitY' : 'entryY',
            constraint.point.y,
            [edge]
          );
          this.setCellStyles(
            source ? 'exitDx' : 'entryDx',
            constraint.dx,
            [edge]
          );
          this.setCellStyles(
            source ? 'exitDy' : 'entryDy',
            constraint.dy,
            [edge]
          );

          // Only writes 0 since 1 is default
          if (!constraint.perimeter) {
            this.setCellStyles(
              source ? 'exitPerimeter' : 'entryPerimeter',
              '0',
              [edge]
            );
          } else {
            this.setCellStyles(
              source ? 'exitPerimeter' : 'entryPerimeter',
              null,
              [edge]
            );
          }
        }
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Returns the nearest point in the list of absolute points or the center
   * of the opposite terminal.
   *
   * @param vertex {@link mxCellState} that represents the vertex.
   * @param constraint {@link mxConnectionConstraint} that represents the connection point
   * constraint as returned by {@link getConnectionConstraint}.
   */
  // getConnectionPoint(vertex: mxCellState, constraint: mxConnectionConstraint, round?: boolean): mxPoint;
  getConnectionPoint(
    vertex: mxCellState,
    constraint: mxConnectionConstraint,
    round: boolean = true
  ): mxPoint {
    let point = null;

    if (vertex != null && constraint.point != null) {
      const bounds = <mxRectangle>this.getView().getPerimeterBounds(vertex);
      const cx = new mxPoint(bounds.getCenterX(), bounds.getCenterY());
      const direction = vertex.style.direction;
      let r1 = 0;

      // Bounds need to be rotated by 90 degrees for further computation
      if (
        direction != null &&
        mxUtils.getValue(vertex.style, 'anchorPointDirection', 1) == 1
      ) {
        if (direction === DIRECTION_NORTH) {
          r1 += 270;
        } else if (direction === DIRECTION_WEST) {
          r1 += 180;
        } else if (direction === DIRECTION_SOUTH) {
          r1 += 90;
        }

        // Bounds need to be rotated by 90 degrees for further computation
        if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
          bounds.rotate90();
        }
      }

      const { scale } = this.view;
      point = new mxPoint(
        bounds.x +
          constraint.point.x * bounds.width +
          <number>constraint.dx * scale,
        bounds.y +
          constraint.point.y * bounds.height +
          <number>constraint.dy * scale
      );

      // Rotation for direction before projection on perimeter
      let r2 = vertex.style.rotation || 0;

      if (constraint.perimeter) {
        if (r1 !== 0) {
          // Only 90 degrees steps possible here so no trig needed
          let cos = 0;
          let sin = 0;

          if (r1 === 90) {
            sin = 1;
          } else if (r1 === 180) {
            cos = -1;
          } else if (r1 === 270) {
            sin = -1;
          }

          point = mxUtils.getRotatedPoint(point, cos, sin, cx);
        }

        point = this.getView().getPerimeterPoint(vertex, point, false);
      } else {
        r2 += r1;

        if ((<mxCell>vertex.cell).isVertex()) {
          let flipH = vertex.style.flipH == 1;
          let flipV = vertex.style.flipV == 1;

          // Legacy support for stencilFlipH/V
          if (vertex.shape != null && vertex.shape.stencil != null) {
            flipH =
              mxUtils.getValue(vertex.style, 'stencilFlipH', 0) == 1 || flipH;
            flipV =
              mxUtils.getValue(vertex.style, 'stencilFlipV', 0) == 1 || flipV;
          }

          if (direction === DIRECTION_NORTH || direction === DIRECTION_SOUTH) {
            const temp = flipH;
            flipH = flipV;
            flipV = temp;
          }

          if (flipH) {
            point.x = 2 * bounds.getCenterX() - point.x;
          }

          if (flipV) {
            point.y = 2 * bounds.getCenterY() - point.y;
          }
        }
      }

      // Generic rotation after projection on perimeter
      if (r2 !== 0 && point != null) {
        const rad = mxUtils.toRadians(r2);
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);

        point = mxUtils.getRotatedPoint(point, cos, sin, cx);
      }
    }

    if (round && point != null) {
      point.x = Math.round(point.x);
      point.y = Math.round(point.y);
    }
    return point;
  }

  /**
   * Connects the specified end of the given edge to the given terminal
   * using {@link cellConnected} and fires {@link mxEvent.CONNECT_CELL} while the
   * transaction is in progress. Returns the updated edge.
   *
   * @param edge {@link mxCell} whose terminal should be updated.
   * @param terminal {@link mxCell} that represents the new terminal to be used.
   * @param source Boolean indicating if the new terminal is the source or target.
   * @param constraint Optional {@link mxConnectionConstraint} to be used for this
   * connection.
   */
  // connectCell(edge: mxCell, terminal: mxCell, source: boolean, constraint?: mxConnectionConstraint): mxCell;
  connectCell(
    edge: mxCell,
    terminal: mxCell,
    source: boolean = false,
    constraint: mxConnectionConstraint | null = null
  ): mxCell {
    this.getModel().beginUpdate();
    try {
      const previous = edge.getTerminal(source);
      this.cellConnected(edge, terminal, source, constraint);
      this.fireEvent(
        new mxEventObject(
          mxEvent.CONNECT_CELL,
          'edge',
          edge,
          'terminal',
          terminal,
          'source',
          source,
          'previous',
          previous
        )
      );
    } finally {
      this.getModel().endUpdate();
    }
    return edge;
  }

  /**
   * Sets the new terminal for the given edge and resets the edge points if
   * {@link resetEdgesOnConnect} is true. This method fires
   * {@link mxEvent.CELL_CONNECTED} while the transaction is in progress.
   *
   * @param edge {@link mxCell} whose terminal should be updated.
   * @param terminal {@link mxCell} that represents the new terminal to be used.
   * @param source Boolean indicating if the new terminal is the source or target.
   * @param constraint {@link mxConnectionConstraint} to be used for this connection.
   */
  // cellConnected(edge: mxCell, terminal: mxCell, source: boolean, constraint: mxConnectionConstraint): void;
  cellConnected(
    edge: mxCell,
    terminal: mxCell,
    source: boolean = false,
    constraint: mxConnectionConstraint | null = null
  ): void {
    if (edge != null) {
      this.getModel().beginUpdate();
      try {
        const previous = edge.getTerminal(source);

        // Updates the constraint
        this.setConnectionConstraint(edge, terminal, source, constraint);

        // Checks if the new terminal is a port, uses the ID of the port in the
        // style and the parent of the port as the actual terminal of the edge.
        if (this.isPortsEnabled()) {
          let id = null;

          if (this.isPort(terminal)) {
            id = terminal.getId();
            terminal = <mxCell>this.getTerminalForPort(terminal, source);
          }

          // Sets or resets all previous information for connecting to a child port
          const key = source ? 'sourcePort' : 'targetPort';
          this.setCellStyles(key, id, [edge]);
        }

        this.getModel().setTerminal(edge, terminal, source);

        if (this.resetEdgesOnConnect) {
          this.resetEdge(edge);
        }

        this.fireEvent(
          new mxEventObject(
            mxEvent.CELL_CONNECTED,
            'edge',
            edge,
            'terminal',
            terminal,
            'source',
            source,
            'previous',
            previous
          )
        );
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /**
   * Disconnects the given edges from the terminals which are not in the
   * given array.
   *
   * @param cells Array of {@link mxCell} to be disconnected.
   */
  // disconnectGraph(cells: mxCell[]): void;
  disconnectGraph(cells: mxCell[] | null) {
    if (cells != null) {
      this.getModel().beginUpdate();
      try {
        const { scale } = this.view;
        const tr = this.getView().translate;

        // Fast lookup for finding cells in array
        const dict = new mxDictionary();

        for (let i = 0; i < cells.length; i += 1) {
          dict.put(cells[i], true);
        }

        for (const cell of cells) {
          if (cell.isEdge()) {
            let geo = <mxGeometry>cell.getGeometry();

            if (geo != null) {
              const state = this.getView().getState(cell);
              const pstate = <mxCellState>(
                this.getView().getState(cell.getParent())
              );

              if (state != null && pstate != null) {
                geo = geo.clone();

                // @ts-ignore
                const dx = -pstate.origin.x;
                // @ts-ignore
                const dy = -pstate.origin.y;
                const pts = <mxPoint[]>state.absolutePoints;

                let src = cell.getTerminal(true);

                if (src != null && this.isCellDisconnectable(cell, src, true)) {
                  while (src != null && !dict.get(src)) {
                    src = src.getParent();
                  }

                  if (src == null) {
                    geo.setTerminalPoint(
                      new mxPoint(
                        pts[0].x / scale - tr.x + dx,
                        pts[0].y / scale - tr.y + dy
                      ),
                      true
                    );
                    this.getModel().setTerminal(cell, null, true);
                  }
                }

                let trg = cell.getTerminal(false);

                if (
                  trg != null &&
                  this.isCellDisconnectable(cell, trg, false)
                ) {
                  while (trg != null && !dict.get(trg)) {
                    trg = trg.getParent();
                  }

                  if (trg == null) {
                    const n = pts.length - 1;
                    geo.setTerminalPoint(
                      new mxPoint(
                        <number>(<mxPoint>pts[n]).x / scale - tr.x + dx,
                        <number>(<mxPoint>pts[n]).y / scale - tr.y + dy
                      ),
                      false
                    );
                    this.getModel().setTerminal(cell, null, false);
                  }
                }

                this.getModel().setGeometry(cell, geo);
              }
            }
          }
        }
      } finally {
        this.getModel().endUpdate();
      }
    }
  }

  /*****************************************************************************
   * Group: Drilldown
   *****************************************************************************/

  /**
   * Returns the current root of the displayed cell hierarchy. This is a
   * shortcut to {@link mxGraphView.currentRoot} in {@link view}.
   */
  // getCurrentRoot(): mxCell;
  getCurrentRoot(): mxCell | null {
    return this.getView().currentRoot;
  }

  /**
   * Returns the translation to be used if the given cell is the root cell as
   * an {@link mxPoint}. This implementation returns null.
   *
   * To keep the children at their absolute position while stepping into groups,
   * this function can be overridden as follows.
   *
   * @example
   * ```javascript
   * var offset = new mxPoint(0, 0);
   *
   * while (cell != null)
   * {
   *   var geo = this.model.getGeometry(cell);
   *
   *   if (geo != null)
   *   {
   *     offset.x -= geo.x;
   *     offset.y -= geo.y;
   *   }
   *
   *   cell = this.model.getParent(cell);
   * }
   *
   * return offset;
   * ```
   *
   * @param cell {@link mxCell} that represents the root.
   */
  // getTranslateForRoot(cell: mxCell): mxPoint;
  getTranslateForRoot(cell: mxCell | null): mxPoint | null {
    return null;
  }

  /**
   * Returns true if the given cell is a "port", that is, when connecting to
   * it, the cell returned by getTerminalForPort should be used as the
   * terminal and the port should be referenced by the ID in either the
   * mxConstants.STYLE_SOURCE_PORT or the or the
   * mxConstants.STYLE_TARGET_PORT. Note that a port should not be movable.
   * This implementation always returns false.
   *
   * A typical implementation is the following:
   *
   * ```javascript
   * graph.isPort = function(cell)
   * {
   *   var geo = cell.getGeometry();
   *
   *   return (geo != null) ? geo.relative : false;
   * };
   * ```
   *
   * @param cell {@link mxCell} that represents the port.
   */
  // isPort(cell: mxCell): boolean;
  isPort(cell: mxCell) {
    return false;
  }

  /**
   * Returns the terminal to be used for a given port. This implementation
   * always returns the parent cell.
   *
   * @param cell {@link mxCell} that represents the port.
   * @param source If the cell is the source or target port.
   */
  // getTerminalForPort(cell: mxCell, source: boolean): mxCell;
  getTerminalForPort(cell: mxCell, source: boolean = false): mxCell | null {
    return cell.getParent();
  }

  /**
   * Returns the offset to be used for the cells inside the given cell. The
   * root and layer cells may be identified using {@link mxGraphModel.isRoot} and
   * {@link mxGraphModel.isLayer}. For all other current roots, the
   * {@link mxGraphView.currentRoot} field points to the respective cell, so that
   * the following holds: cell == this.view.currentRoot. This implementation
   * returns null.
   *
   * @param cell {@link mxCell} whose offset should be returned.
   */
  // getChildOffsetForCell(cell: mxCell): number;
  getChildOffsetForCell(cell: mxCell): mxPoint | null {
    return null;
  }

  /**
   * Uses the given cell as the root of the displayed cell hierarchy. If no
   * cell is specified then the selection cell is used. The cell is only used
   * if {@link isValidRoot} returns true.
   *
   * @param cell Optional {@link mxCell} to be used as the new root. Default is the
   * selection cell.
   */
  // enterGroup(cell: mxCell): void;
  enterGroup(cell: mxCell): void {
    cell = cell || this.getSelectionCell();

    if (cell != null && this.isValidRoot(cell)) {
      this.getView().setCurrentRoot(cell);
      this.clearSelection();
    }
  }

  /**
   * Changes the current root to the next valid root in the displayed cell
   * hierarchy.
   */
  // exitGroup(): void;
  exitGroup(): void {
    const root = this.getModel().getRoot();
    const current = this.getCurrentRoot();

    if (current != null) {
      let next = <mxCell>current.getParent();

      // Finds the next valid root in the hierarchy
      while (
        next !== root &&
        !this.isValidRoot(next) &&
        next.getParent() !== root
      ) {
        next = <mxCell>next.getParent();
      }

      // Clears the current root if the new root is
      // the model's root or one of the layers.
      if (next === root || next.getParent() === root) {
        this.getView().setCurrentRoot(null);
      } else {
        this.getView().setCurrentRoot(next);
      }

      const state = this.getView().getState(current);

      // Selects the previous root in the graph
      if (state != null) {
        this.setSelectionCell(current);
      }
    }
  }

  /**
   * Uses the root of the model as the root of the displayed cell hierarchy
   * and selects the previous root.
   */
  // home(): void;
  home() {
    const current = this.getCurrentRoot();

    if (current != null) {
      this.getView().setCurrentRoot(null);
      const state = this.getView().getState(current);

      if (state != null) {
        this.setSelectionCell(current);
      }
    }
  }

  /**
   * Returns true if the given cell is a valid root for the cell display
   * hierarchy. This implementation returns true for all non-null values.
   *
   * @param cell {@link mxCell} which should be checked as a possible root.
   */
  // isValidRoot(cell: mxCell): boolean;
  isValidRoot(cell: mxCell) {
    return cell != null;
  }

  /*****************************************************************************
   * Group: Graph display
   *****************************************************************************/

  /**
   * Returns the bounds of the visible graph. Shortcut to
   * {@link mxGraphView.getGraphBounds}. See also: {@link getBoundingBoxFromGeometry}.
   */
  // getGraphBounds(): mxRectangle;
  getGraphBounds(): mxRectangle {
    return this.getView().getGraphBounds();
  }

  /**
   * Returns the scaled, translated bounds for the given cell. See
   * {@link mxGraphView.getBounds} for arrays.
   *
   * @param cell {@link mxCell} whose bounds should be returned.
   * @param includeEdges Optional boolean that specifies if the bounds of
   * the connected edges should be included. Default is `false`.
   * @param includeDescendants Optional boolean that specifies if the bounds
   * of all descendants should be included. Default is `false`.
   */
  // getCellBounds(cell: mxCell, includeEdges?: boolean, includeDescendants?: boolean): mxRectangle;
  getCellBounds(
    cell: mxCell,
    includeEdges: boolean = false,
    includeDescendants: boolean = false
  ): mxRectangle | null {
    let cells = [cell];

    // Includes all connected edges
    if (includeEdges) {
      cells = cells.concat(<mxCell[]>this.getModel().getEdges(cell));
    }

    let result = this.getView().getBounds(cells);

    // Recursively includes the bounds of the children
    if (includeDescendants) {
      const childCount = cell.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const tmp = this.getCellBounds(
          <mxCell>cell.getChildAt(i),
          includeEdges,
          true
        );

        if (result != null) {
          if (tmp) result.add(tmp);
        } else {
          result = tmp;
        }
      }
    }
    return result;
  }

  /**
   * Returns the bounding box for the geometries of the vertices in the
   * given array of cells. This can be used to find the graph bounds during
   * a layout operation (ie. before the last endUpdate) as follows:
   *
   * ```javascript
   * var cells = graph.getChildCells(graph.getDefaultParent(), true, true);
   * var bounds = graph.getBoundingBoxFromGeometry(cells, true);
   * ```
   *
   * This can then be used to move cells to the origin:
   *
   * ```javascript
   * if (bounds.x < 0 || bounds.y < 0)
   * {
   *   graph.moveCells(cells, -Math.min(bounds.x, 0), -Math.min(bounds.y, 0))
   * }
   * ```
   *
   * Or to translate the graph view:
   *
   * ```javascript
   * if (bounds.x < 0 || bounds.y < 0)
   * {
   *   graph.view.setTranslate(-Math.min(bounds.x, 0), -Math.min(bounds.y, 0));
   * }
   * ```
   *
   * @param cells Array of {@link mxCell} whose bounds should be returned.
   * @param includeEdges Specifies if edge bounds should be included by computing
   * the bounding box for all points in geometry. Default is `false`.
   */
  // getBoundingBoxFromGeometry(cells: mxCell[], includeEdges?: boolean): mxRectangle;
  getBoundingBoxFromGeometry(
    cells: mxCell[],
    includeEdges: boolean = false
  ): mxRectangle | null {
    includeEdges = includeEdges != null ? includeEdges : false;
    let result = null;
    let tmp: mxRectangle | null = null;

    if (cells != null) {
      for (const cell of cells) {
        if (includeEdges || cell.isVertex()) {
          // Computes the bounding box for the points in the geometry
          const geo = cell.getGeometry();

          if (geo != null) {
            let bbox = null;

            if (cell.isEdge()) {
              const addPoint = (pt: mxPoint | null) => {
                if (pt != null) {
                  if (tmp == null) {
                    tmp = new mxRectangle(pt.x, pt.y, 0, 0);
                  } else {
                    tmp.add(new mxRectangle(pt.x, pt.y, 0, 0));
                  }
                }
              };

              if (cell.getTerminal(true) == null) {
                addPoint(geo.getTerminalPoint(true));
              }

              if (cell.getTerminal(false) == null) {
                addPoint(geo.getTerminalPoint(false));
              }

              const pts = geo.points;

              if (pts != null && pts.length > 0) {
                tmp = new mxRectangle(pts[0].x, pts[0].y, 0, 0);

                for (let j = 1; j < pts.length; j++) {
                  addPoint(pts[j]);
                }
              }

              bbox = tmp;
            } else {
              const parent = <mxCell>cell.getParent();

              if (geo.relative) {
                if (
                  parent.isVertex() &&
                  parent !== this.getView().currentRoot
                ) {
                  tmp = this.getBoundingBoxFromGeometry([parent], false);

                  if (tmp != null) {
                    bbox = new mxRectangle(
                      geo.x * tmp.width,
                      geo.y * tmp.height,
                      geo.width,
                      geo.height
                    );

                    if (cells.indexOf(parent) >= 0) {
                      bbox.x += tmp.x;
                      bbox.y += tmp.y;
                    }
                  }
                }
              } else {
                bbox = mxRectangle.fromRectangle(geo);

                if (parent.isVertex() && cells.indexOf(parent) >= 0) {
                  tmp = this.getBoundingBoxFromGeometry([parent], false);

                  if (tmp != null) {
                    bbox.x += tmp.x;
                    bbox.y += tmp.y;
                  }
                }
              }

              if (bbox != null && geo.offset != null) {
                bbox.x += geo.offset.x;
                bbox.y += geo.offset.y;
              }

              const style = this.getCurrentCellStyle(cell);

              if (bbox != null) {
                const angle = mxUtils.getValue(style, 'rotation', 0);

                if (angle !== 0) {
                  bbox = mxUtils.getBoundingBox(bbox, angle);
                }
              }
            }

            if (bbox != null) {
              if (result == null) {
                result = mxRectangle.fromRectangle(bbox);
              } else {
                result.add(bbox);
              }
            }
          }
        }
      }
    }
    return result;
  }

  /**
   * Clears all cell states or the states for the hierarchy starting at the
   * given cell and validates the graph. This fires a refresh event as the
   * last step.
   *
   * @param cell Optional {@link mxCell} for which the cell states should be cleared.
   */
  // refresh(cell?: mxCell): void;
  refresh(cell: mxCell | null = null): void {
    if (cell) {
      this.getView().clear(cell, false);
    } else {
      this.getView().clear(undefined, true);
    }
    this.getView().validate();
    this.sizeDidChange();
    this.fireEvent(new mxEventObject(mxEvent.REFRESH));
  }

  /**
   * Snaps the given numeric value to the grid if {@link gridEnabled} is true.
   *
   * @param value Numeric value to be snapped to the grid.
   */
  // snap(value: number): number;
  snap(value: number): number {
    if (this.gridEnabled) {
      value = Math.round(value / this.gridSize) * this.gridSize;
    }
    return value;
  }

  /**
   * Function: snapDelta
   *
   * Snaps the given delta with the given scaled bounds.
   */
  snapDelta(
    delta: mxPoint,
    bounds: mxRectangle,
    ignoreGrid: boolean = false,
    ignoreHorizontal: boolean = false,
    ignoreVertical: boolean = false
  ): mxPoint {
    const t = this.getView().translate;
    const s = this.getView().scale;

    if (!ignoreGrid && this.gridEnabled) {
      const tol = this.gridSize * s * 0.5;

      if (!ignoreHorizontal) {
        const tx = bounds.x - (this.snap(bounds.x / s - t.x) + t.x) * s;

        if (Math.abs(delta.x - tx) < tol) {
          delta.x = 0;
        } else {
          delta.x = this.snap(delta.x / s) * s - tx;
        }
      }

      if (!ignoreVertical) {
        const ty = bounds.y - (this.snap(bounds.y / s - t.y) + t.y) * s;

        if (Math.abs(delta.y - ty) < tol) {
          delta.y = 0;
        } else {
          delta.y = this.snap(delta.y / s) * s - ty;
        }
      }
    } else {
      const tol = 0.5 * s;

      if (!ignoreHorizontal) {
        const tx = bounds.x - (Math.round(bounds.x / s - t.x) + t.x) * s;

        if (Math.abs(delta.x - tx) < tol) {
          delta.x = 0;
        } else {
          delta.x = Math.round(delta.x / s) * s - tx;
        }
      }

      if (!ignoreVertical) {
        const ty = bounds.y - (Math.round(bounds.y / s - t.y) + t.y) * s;

        if (Math.abs(delta.y - ty) < tol) {
          delta.y = 0;
        } else {
          delta.y = Math.round(delta.y / s) * s - ty;
        }
      }
    }
    return delta;
  }

  /**
   * Shifts the graph display by the given amount. This is used to preview
   * panning operations, use {@link mxGraphView.setTranslate} to set a persistent
   * translation of the view. Fires {@link mxEvent.PAN}.
   *
   * @param dx Amount to shift the graph along the x-axis.
   * @param dy Amount to shift the graph along the y-axis.
   */
  // panGraph(dx: number, dy: number): void;
  panGraph(dx: number, dy: number): void {
    const container = <HTMLElement>this.container;

    if (this.useScrollbarsForPanning && mxUtils.hasScrollbars(container)) {
      container.scrollLeft = -dx;
      container.scrollTop = -dy;
    } else {
      const canvas = <SVGElement>this.getView().getCanvas();

      // Puts everything inside the container in a DIV so that it
      // can be moved without changing the state of the container
      if (dx === 0 && dy === 0) {
        canvas.removeAttribute('transform');

        if (this.shiftPreview1 != null) {
          let child = this.shiftPreview1.firstChild;

          while (child != null) {
            const next = child.nextSibling;
            container.appendChild(child);
            child = next;
          }

          if (this.shiftPreview1.parentNode != null) {
            this.shiftPreview1.parentNode.removeChild(this.shiftPreview1);
          }

          this.shiftPreview1 = null;

          container.appendChild(<Node>canvas.parentNode);
          const shiftPreview2 = <HTMLElement>this.shiftPreview2;
          child = shiftPreview2.firstChild;

          while (child != null) {
            const next = child.nextSibling;
            container.appendChild(child);
            child = next;
          }

          if (shiftPreview2.parentNode != null) {
            shiftPreview2.parentNode.removeChild(shiftPreview2);
          }
          this.shiftPreview2 = null;
        }
      } else {
        canvas.setAttribute('transform', `translate(${dx},${dy})`);

        if (this.shiftPreview1 == null) {
          // Needs two divs for stuff before and after the SVG element
          this.shiftPreview1 = document.createElement('div');
          this.shiftPreview1.style.position = 'absolute';
          this.shiftPreview1.style.overflow = 'visible';

          this.shiftPreview2 = document.createElement('div');
          this.shiftPreview2.style.position = 'absolute';
          this.shiftPreview2.style.overflow = 'visible';

          let current = this.shiftPreview1;
          let child = container.firstChild;

          while (child != null) {
            const next = child.nextSibling;

            // SVG element is moved via transform attribute
            // @ts-ignore
            if (child !== canvas.parentNode) {
              current.appendChild(child);
            } else {
              current = this.shiftPreview2;
            }

            child = next;
          }

          // Inserts elements only if not empty
          if (this.shiftPreview1.firstChild != null) {
            container.insertBefore(this.shiftPreview1, canvas.parentNode);
          }

          if (this.shiftPreview2.firstChild != null) {
            container.appendChild(this.shiftPreview2);
          }
        }

        this.shiftPreview1.style.left = `${dx}px`;
        this.shiftPreview1.style.top = `${dy}px`;

        if (this.shiftPreview2) {
          this.shiftPreview2.style.left = `${dx}px`;
          this.shiftPreview2.style.top = `${dy}px`;
        }
      }

      this.panDx = dx;
      this.panDy = dy;

      this.fireEvent(new mxEventObject(mxEvent.PAN));
    }
  }

  /**
   * Zooms into the graph by {@link zoomFactor}.
   */
  // zoomIn(): void;
  zoomIn(): void {
    this.zoom(this.zoomFactor);
  }

  /**
   * Zooms out of the graph by {@link zoomFactor}.
   */
  // zoomOut(): void;
  zoomOut(): void {
    this.zoom(1 / this.zoomFactor);
  }

  /**
   * Resets the zoom and panning in the view.
   */
  // zoomActual(): void;
  zoomActual(): void {
    if (this.getView().scale === 1) {
      this.getView().setTranslate(0, 0);
    } else {
      this.getView().translate.x = 0;
      this.getView().translate.y = 0;

      this.getView().setScale(1);
    }
  }

  /**
   * Zooms the graph to the given scale with an optional boolean center
   * argument, which is passd to {@link zoom}.
   */
  // zoomTo(scale: number, center?: boolean): void;
  zoomTo(scale: number, center: boolean = false): void {
    this.zoom(scale / this.getView().scale, center);
  }

  /**
   * Centers the graph in the container.
   *
   * @param horizontal Optional boolean that specifies if the graph should be centered
   * horizontally. Default is `true`.
   * @param vertical Optional boolean that specifies if the graph should be centered
   * vertically. Default is `true`.
   * @param cx Optional float that specifies the horizontal center. Default is `0.5`.
   * @param cy Optional float that specifies the vertical center. Default is `0.5`.
   */
  // center(horizontal?: boolean, vertical?: boolean, cx?: number, cy?: number): void;
  center(
    horizontal: boolean = true,
    vertical: boolean = true,
    cx: number = 0.5,
    cy: number = 0.5
  ): void {
    horizontal = horizontal != null ? horizontal : true;
    vertical = vertical != null ? vertical : true;
    cx = cx != null ? cx : 0.5;
    cy = cy != null ? cy : 0.5;

    const container = <HTMLElement>this.container;
    const hasScrollbars = mxUtils.hasScrollbars(this.container);
    const padding = 2 * this.getBorder();
    const cw = container.clientWidth - padding;
    const ch = container.clientHeight - padding;
    const bounds = this.getGraphBounds();

    const t = this.getView().translate;
    const s = this.getView().scale;

    let dx = horizontal ? cw - bounds.width : 0;
    let dy = vertical ? ch - bounds.height : 0;

    if (!hasScrollbars) {
      this.getView().setTranslate(
        horizontal ? Math.floor(t.x - bounds.x / s + (dx * cx) / s) : t.x,
        vertical ? Math.floor(t.y - bounds.y / s + (dy * cy) / s) : t.y
      );
    } else {
      bounds.x -= t.x;
      bounds.y -= t.y;

      const sw = container.scrollWidth;
      const sh = container.scrollHeight;

      if (sw > cw) {
        dx = 0;
      }

      if (sh > ch) {
        dy = 0;
      }

      this.getView().setTranslate(
        Math.floor(dx / 2 - bounds.x),
        Math.floor(dy / 2 - bounds.y)
      );
      container.scrollLeft = (sw - cw) / 2;
      container.scrollTop = (sh - ch) / 2;
    }
  }

  /**
   * Zooms the graph using the given factor. Center is an optional boolean
   * argument that keeps the graph scrolled to the center. If the center argument
   * is omitted, then {@link centerZoom} will be used as its value.
   */
  // zoom(factor: number, center: boolean): void;
  zoom(factor: number, center: boolean = this.centerZoom): void {
    const scale = Math.round(this.getView().scale * factor * 100) / 100;
    const state = this.getView().getState(this.getSelectionCell());
    const container = <HTMLElement>this.container;
    factor = scale / this.getView().scale;

    if (this.keepSelectionVisibleOnZoom && state != null) {
      const rect = new mxRectangle(
        state.x * factor,
        state.y * factor,
        state.width * factor,
        state.height * factor
      );

      // Refreshes the display only once if a scroll is carried out
      this.getView().scale = scale;

      if (!this.scrollRectToVisible(rect)) {
        this.getView().revalidate();

        // Forces an event to be fired but does not revalidate again
        this.getView().setScale(scale);
      }
    } else {
      const hasScrollbars = mxUtils.hasScrollbars(this.container);

      if (center && !hasScrollbars) {
        let dx = container.offsetWidth;
        let dy = container.offsetHeight;

        if (factor > 1) {
          const f = (factor - 1) / (scale * 2);
          dx *= -f;
          dy *= -f;
        } else {
          const f = (1 / factor - 1) / (this.getView().scale * 2);
          dx *= f;
          dy *= f;
        }

        this.getView().scaleAndTranslate(
          scale,
          this.getView().translate.x + dx,
          this.getView().translate.y + dy
        );
      } else {
        // Allows for changes of translate and scrollbars during setscale
        const tx = this.getView().translate.x;
        const ty = this.getView().translate.y;
        const sl = container.scrollLeft;
        const st = container.scrollTop;

        this.getView().setScale(scale);

        if (hasScrollbars) {
          let dx = 0;
          let dy = 0;

          if (center) {
            dx = (container.offsetWidth * (factor - 1)) / 2;
            dy = (container.offsetHeight * (factor - 1)) / 2;
          }

          container.scrollLeft =
            (this.getView().translate.x - tx) * this.getView().scale +
            Math.round(sl * factor + dx);
          container.scrollTop =
            (this.getView().translate.y - ty) * this.getView().scale +
            Math.round(st * factor + dy);
        }
      }
    }
  }

  /**
   * Zooms the graph to the specified rectangle. If the rectangle does not have same aspect
   * ratio as the display container, it is increased in the smaller relative dimension only
   * until the aspect match. The original rectangle is centralised within this expanded one.
   *
   * Note that the input rectangular must be un-scaled and un-translated.
   *
   * @param rect The un-scaled and un-translated rectangluar region that should be just visible
   * after the operation
   */
  // zoomToRect(rect: mxRectangle): void;
  zoomToRect(rect: mxRectangle): void {
    const container = <HTMLElement>this.container;
    const scaleX = container.clientWidth / rect.width;
    const scaleY = container.clientHeight / rect.height;
    const aspectFactor = scaleX / scaleY;

    // Remove any overlap of the rect outside the client area
    rect.x = Math.max(0, rect.x);
    rect.y = Math.max(0, rect.y);
    let rectRight = Math.min(container.scrollWidth, rect.x + rect.width);
    let rectBottom = Math.min(container.scrollHeight, rect.y + rect.height);
    rect.width = rectRight - rect.x;
    rect.height = rectBottom - rect.y;

    // The selection area has to be increased to the same aspect
    // ratio as the container, centred around the centre point of the
    // original rect passed in.
    if (aspectFactor < 1.0) {
      // Height needs increasing
      const newHeight = rect.height / aspectFactor;
      const deltaHeightBuffer = (newHeight - rect.height) / 2.0;
      rect.height = newHeight;

      // Assign up to half the buffer to the upper part of the rect, not crossing 0
      // put the rest on the bottom
      const upperBuffer = Math.min(rect.y, deltaHeightBuffer);
      rect.y -= upperBuffer;

      // Check if the bottom has extended too far
      rectBottom = Math.min(container.scrollHeight, rect.y + rect.height);
      rect.height = rectBottom - rect.y;
    } else {
      // Width needs increasing
      const newWidth = rect.width * aspectFactor;
      const deltaWidthBuffer = (newWidth - rect.width) / 2.0;
      rect.width = newWidth;

      // Assign up to half the buffer to the upper part of the rect, not crossing 0
      // put the rest on the bottom
      const leftBuffer = Math.min(rect.x, deltaWidthBuffer);
      rect.x -= leftBuffer;

      // Check if the right hand side has extended too far
      rectRight = Math.min(container.scrollWidth, rect.x + rect.width);
      rect.width = rectRight - rect.x;
    }

    const scale = container.clientWidth / rect.width;
    const newScale = this.getView().scale * scale;

    if (!mxUtils.hasScrollbars(this.container)) {
      this.getView().scaleAndTranslate(
        newScale,
        this.getView().translate.x - rect.x / this.getView().scale,
        this.getView().translate.y - rect.y / this.getView().scale
      );
    } else {
      this.getView().setScale(newScale);
      container.scrollLeft = Math.round(rect.x * scale);
      container.scrollTop = Math.round(rect.y * scale);
    }
  }

  /**
   * Pans the graph so that it shows the given cell. Optionally the cell may
   * be centered in the container.
   *
   * To center a given graph if the {@link container} has no scrollbars, use the following code.
   *
   * [code]
   * var bounds = graph.getGraphBounds();
   * graph.view.setTranslate(-bounds.x - (bounds.width - container.clientWidth) / 2,
   * 						   -bounds.y - (bounds.height - container.clientHeight) / 2);
   * [/code]
   *
   * @param cell {@link mxCell} to be made visible.
   * @param center Optional boolean flag. Default is `false`.
   */
  // scrollCellToVisible(cell: mxCell, center?: boolean): void;
  scrollCellToVisible(cell: mxCell, center: boolean = false): void {
    const x = -this.getView().translate.x;
    const y = -this.getView().translate.y;

    const state = this.getView().getState(cell);

    if (state != null) {
      const bounds = new mxRectangle(
        x + state.x,
        y + state.y,
        state.width,
        state.height
      );

      if (center && this.container != null) {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        bounds.x = bounds.getCenterX() - w / 2;
        bounds.width = w;
        bounds.y = bounds.getCenterY() - h / 2;
        bounds.height = h;
      }

      const tr = new mxPoint(
        this.getView().translate.x,
        this.getView().translate.y
      );

      if (this.scrollRectToVisible(bounds)) {
        // Triggers an update via the view's event source
        const tr2 = new mxPoint(
          this.getView().translate.x,
          this.getView().translate.y
        );
        this.getView().translate.x = tr.x;
        this.getView().translate.y = tr.y;
        this.getView().setTranslate(tr2.x, tr2.y);
      }
    }
  }

  /**
   * Pans the graph so that it shows the given rectangle.
   *
   * @param rect {@link mxRectangle} to be made visible.
   */
  // scrollRectToVisible(rect: mxRectangle): boolean;
  scrollRectToVisible(rect: mxRectangle): boolean {
    let isChanged = false;

    if (rect != null) {
      const container = <HTMLElement>this.container;
      const w = container.offsetWidth;
      const h = container.offsetHeight;

      const widthLimit = Math.min(w, rect.width);
      const heightLimit = Math.min(h, rect.height);

      if (mxUtils.hasScrollbars(container)) {
        rect.x += this.getView().translate.x;
        rect.y += this.getView().translate.y;
        let dx = container.scrollLeft - rect.x;
        const ddx = Math.max(dx - container.scrollLeft, 0);

        if (dx > 0) {
          container.scrollLeft -= dx + 2;
        } else {
          dx =
            rect.x + widthLimit - container.scrollLeft - container.clientWidth;

          if (dx > 0) {
            container.scrollLeft += dx + 2;
          }
        }

        let dy = container.scrollTop - rect.y;
        const ddy = Math.max(0, dy - container.scrollTop);

        if (dy > 0) {
          container.scrollTop -= dy + 2;
        } else {
          dy =
            rect.y + heightLimit - container.scrollTop - container.clientHeight;

          if (dy > 0) {
            container.scrollTop += dy + 2;
          }
        }

        if (!this.useScrollbarsForPanning && (ddx != 0 || ddy != 0)) {
          this.getView().setTranslate(ddx, ddy);
        }
      } else {
        const x = -this.getView().translate.x;
        const y = -this.getView().translate.y;

        const s = this.getView().scale;

        if (rect.x + widthLimit > x + w) {
          this.getView().translate.x -= (rect.x + widthLimit - w - x) / s;
          isChanged = true;
        }

        if (rect.y + heightLimit > y + h) {
          this.getView().translate.y -= (rect.y + heightLimit - h - y) / s;
          isChanged = true;
        }

        if (rect.x < x) {
          this.getView().translate.x += (x - rect.x) / s;
          isChanged = true;
        }

        if (rect.y < y) {
          this.getView().translate.y += (y - rect.y) / s;
          isChanged = true;
        }

        if (isChanged) {
          this.getView().refresh();

          // Repaints selection marker (ticket 18)
          if (this.selectionCellsHandler != null) {
            this.selectionCellsHandler.refresh();
          }
        }
      }
    }

    return isChanged;
  }

  /**
   * Returns the {@link mxGeometry} for the given cell. This implementation uses
   * {@link mxGraphModel.getGeometry}. Subclasses can override this to implement
   * specific geometries for cells in only one graph, that is, it can return
   * geometries that depend on the current state of the view.
   *
   * @param cell {@link mxCell} whose geometry should be returned.
   */
  // getCellGeometry(cell: mxCell): mxGeometry;
  getCellGeometry(cell: mxCell): mxGeometry | null {
    // SLATED FOR DELETION
    return cell.getGeometry();
  }

  /**
   * Returns true if the given cell is visible in this graph. This
   * implementation uses {@link mxGraphModel.isVisible}. Subclassers can override
   * this to implement specific visibility for cells in only one graph, that
   * is, without affecting the visible state of the cell.
   *
   * When using dynamic filter expressions for cell visibility, then the
   * graph should be revalidated after the filter expression has changed.
   *
   * @param cell {@link mxCell} whose visible state should be returned.
   */
  // isCellVisible(cell: mxCell): boolean;
  isCellVisible(cell: mxCell): boolean {
    // SLATED FOR DELETION
    return cell.isVisible();
  }

  /**
   * Returns true if the given cell is collapsed in this graph. This
   * implementation uses {@link mxCell.isCollapsed}. Subclassers can override
   * this to implement specific collapsed states for cells in only one graph,
   * that is, without affecting the collapsed state of the cell.
   *
   * When using dynamic filter expressions for the collapsed state, then the
   * graph should be revalidated after the filter expression has changed.
   *
   * @param cell {@link mxCell} whose collapsed state should be returned.
   */
  // isCellCollapsed(cell: mxCell): boolean;
  isCellCollapsed(cell: mxCell): boolean {
    // SLATED FOR DELETION
    return cell.isCollapsed();
  }

  /**
   * Returns true if the given cell is connectable in this graph. This
   * implementation uses {@link mxCell.isConnectable}. Subclassers can override
   * this to implement specific connectable states for cells in only one graph,
   * that is, without affecting the connectable state of the cell in the model.
   *
   * @param cell {@link mxCell} whose connectable state should be returned.
   */
  // isCellConnectable(cell: mxCell): boolean;
  isCellConnectable(cell: mxCell): boolean {
    // SLATED FOR DELETION
    return cell.isConnectable();
  }

  /**
   * Returns true if perimeter points should be computed such that the
   * resulting edge has only horizontal or vertical segments.
   *
   * @param edge {@link mxCellState} that represents the edge.
   */
  // isOrthogonal(edge: mxCellState): boolean;
  isOrthogonal(edge: mxCellState): boolean {
    /*
    'orthogonal' defines if the connection points on either end of the edge should
    be computed so that the edge is vertical or horizontal if possible
    and if the point is not at a fixed location. Default is false.
    This also returns true if the edgeStyle of the edge is an elbow or
    entity.
     */
    const orthogonal = edge.style.orthogonal;

    if (orthogonal != null) {
      return orthogonal;
    }

    const tmp = this.getView().getEdgeStyle(edge);

    return (
      tmp === mxEdgeStyle.SegmentConnector ||
      tmp === mxEdgeStyle.ElbowConnector ||
      tmp === mxEdgeStyle.SideToSide ||
      tmp === mxEdgeStyle.TopToBottom ||
      tmp === mxEdgeStyle.EntityRelation ||
      tmp === mxEdgeStyle.OrthConnector
    );
  }

  /**
   * Returns true if the given cell state is a loop.
   *
   * @param state {@link mxCellState} that represents a potential loop.
   */
  // isLoop(state: mxCellState): boolean;
  isLoop(state: mxCellState): boolean {
    // SLATED FOR DELETION
    return state.isLoop();
  }

  /**
   * Returns true if the given event is a clone event. This implementation
   * returns true if control is pressed.
   */
  // isCloneEvent(evt: MouseEvent): boolean;
  isCloneEvent(evt: MouseEvent): boolean {
    return isControlDown(evt);
  }

  /**
   * Hook for implementing click-through behaviour on selected cells. If this
   * returns true the cell behind the selected cell will be selected. This
   * implementation returns false;
   */
  // isTransparentClickEvent(evt: MouseEvent): boolean;
  isTransparentClickEvent(evt: MouseEvent): boolean {
    return false;
  }

  /**
   * Returns true if the given event is a toggle event. This implementation
   * returns true if the meta key (Cmd) is pressed on Macs or if control is
   * pressed on any other platform.
   */
  // isToggleEvent(evt: MouseEvent): boolean;
  isToggleEvent(evt: MouseEvent): boolean {
    return mxClient.IS_MAC ? isMetaDown(evt) : isControlDown(evt);
  }

  /**
   * Returns true if the given mouse event should be aligned to the grid.
   */
  // isGridEnabledEvent(evt: MouseEvent): boolean;
  isGridEnabledEvent(evt: MouseEvent): boolean {
    return evt != null && !isAltDown(evt);
  }

  /**
   * Returns true if the given mouse event should be aligned to the grid.
   */
  // isConstrainedEvent(evt: MouseEvent): boolean;
  isConstrainedEvent(evt: MouseEvent): boolean {
    return isShiftDown(evt);
  }

  /**
   * Returns true if the given mouse event should not allow any connections to be
   * made. This implementation returns false.
   */
  // isIgnoreTerminalEvent(evt: MouseEvent): boolean;
  isIgnoreTerminalEvent(evt: MouseEvent): boolean {
    return false;
  }

  /*****************************************************************************
   * Group: Validation
   *****************************************************************************/

  /**
   * Displays the given validation error in a dialog. This implementation uses
   * mxUtils.alert.
   */
  // validationAlert(message: string): void;
  validationAlert(message: any): void {
    alert(message);
  }

  /**
   * Checks if the return value of {@link getEdgeValidationError} for the given
   * arguments is null.
   *
   * @param edge {@link mxCell} that represents the edge to validate.
   * @param source {@link mxCell} that represents the source terminal.
   * @param target {@link mxCell} that represents the target terminal.
   */
  // isEdgeValid(edge: mxCell, source: mxCell, target: mxCell): boolean;
  isEdgeValid(edge: mxCell, source: mxCell, target: mxCell): boolean {
    return this.getEdgeValidationError(edge, source, target) == null;
  }

  /**
   * Returns the validation error message to be displayed when inserting or
   * changing an edges' connectivity. A return value of null means the edge
   * is valid, a return value of '' means it's not valid, but do not display
   * an error message. Any other (non-empty) string returned from this method
   * is displayed as an error message when trying to connect an edge to a
   * source and target. This implementation uses the {@link multiplicities}, and
   * checks {@link multigraph}, {@link allowDanglingEdges} and {@link allowLoops} to generate
   * validation errors.
   *
   * For extending this method with specific checks for source/target cells,
   * the method can be extended as follows. Returning an empty string means
   * the edge is invalid with no error message, a non-null string specifies
   * the error message, and null means the edge is valid.
   *
   * ```javascript
   * graph.getEdgeValidationError = function(edge, source, target)
   * {
   *   if (source != null && target != null &&
   *     this.model.getValue(source) != null &&
   *     this.model.getValue(target) != null)
   *   {
   *     if (target is not valid for source)
   *     {
   *       return 'Invalid Target';
   *     }
   *   }
   *
   *   // "Supercall"
   *   return getEdgeValidationError.apply(this, arguments);
   * }
   * ```
   *
   * @param edge {@link mxCell} that represents the edge to validate.
   * @param source {@link mxCell} that represents the source terminal.
   * @param target {@link mxCell} that represents the target terminal.
   */
  // getEdgeValidationError(edge: mxCell, source: mxCell, target: mxCell): string;
  getEdgeValidationError(
    edge: mxCell | null = null,
    source: mxCell | null = null,
    target: mxCell | null = null
  ): string | null {
    if (edge && !this.isAllowDanglingEdges() && (!source || !target)) {
      return '';
    }

    if (edge && !edge.getTerminal(true) && !edge.getTerminal(false)) {
      return null;
    }

    // Checks if we're dealing with a loop
    if (!this.allowLoops && source === target && source) {
      return '';
    }

    // Checks if the connection is generally allowed
    if (!this.isValidConnection(source, target)) {
      return '';
    }

    if (source && target) {
      let error = '';

      // Checks if the cells are already connected
      // and adds an error message if required
      if (!this.multigraph) {
        const tmp = this.getModel().getEdgesBetween(source, target, true);

        // Checks if the source and target are not connected by another edge
        if (tmp.length > 1 || (tmp.length === 1 && tmp[0] !== edge)) {
          error += `${
            mxResources.get(this.alreadyConnectedResource) ||
            this.alreadyConnectedResource
          }\n`;
        }
      }

      // Gets the number of outgoing edges from the source
      // and the number of incoming edges from the target
      // without counting the edge being currently changed.
      const sourceOut = this.getModel().getDirectedEdgeCount(
        source,
        true,
        edge
      );
      const targetIn = this.getModel().getDirectedEdgeCount(
        target,
        false,
        edge
      );

      // Checks the change against each multiplicity rule
      if (this.multiplicities) {
        for (let i = 0; i < this.multiplicities.length; i += 1) {
          const err = this.multiplicities[i].check(
            this,
            edge,
            source,
            target,
            sourceOut,
            targetIn
          );

          if (err != null) {
            error += err;
          }
        }
      }

      // Validates the source and target terminals independently
      const err = this.validateEdge(edge, source, target);
      if (err != null) {
        error += err;
      }
      return error.length > 0 ? error : null;
    }

    return this.allowDanglingEdges ? null : '';
  }

  /**
   * Hook method for subclassers to return an error message for the given
   * edge and terminals. This implementation returns null.
   *
   * @param edge {@link mxCell} that represents the edge to validate.
   * @param source {@link mxCell} that represents the source terminal.
   * @param target {@link mxCell} that represents the target terminal.
   */
  // validateEdge(edge: mxCell, source: mxCell, target: mxCell): string | null;
  validateEdge(
    edge: mxCell | null,
    source: mxCell | null,
    target: mxCell | null
  ): string | null {
    return null;
  }

  /**
   * Validates the graph by validating each descendant of the given cell or
   * the root of the model. Context is an object that contains the validation
   * state for the complete validation run. The validation errors are
   * attached to their cells using {@link setCellWarning}. Returns null in the case of
   * successful validation or an array of strings (warnings) in the case of
   * failed validations.
   *
   * Paramters:
   *
   * @param cell Optional {@link mxCell} to start the validation recursion. Default is
   * the graph root.
   * @param context Object that represents the global validation state.
   */
  // validateGraph(cell: mxCell, context: any): string | null;
  validateGraph(
    cell: mxCell = <mxCell>this.getModel().getRoot(),
    context: any
  ): string | null {
    context = context != null ? context : {};

    let isValid = true;
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const tmp = <mxCell>cell.getChildAt(i);
      let ctx = context;

      if (this.isValidRoot(tmp)) {
        ctx = {};
      }

      const warn = this.validateGraph(tmp, ctx);

      if (warn != null) {
        this.setCellWarning(tmp, warn.replace(/\n/g, '<br>'));
      } else {
        this.setCellWarning(tmp, null);
      }

      isValid = isValid && warn == null;
    }

    let warning = '';

    // Adds error for invalid children if collapsed (children invisible)
    if (cell && cell.isCollapsed() && !isValid) {
      warning += `${
        mxResources.get(this.containsValidationErrorsResource) ||
        this.containsValidationErrorsResource
      }\n`;
    }

    // Checks edges and cells using the defined multiplicities
    if (cell && cell.isEdge()) {
      warning +=
        this.getEdgeValidationError(
          cell,
          cell.getTerminal(true),
          cell.getTerminal(false)
        ) || '';
    } else {
      warning += this.getCellValidationError(<mxCell>cell) || '';
    }

    // Checks custom validation rules
    const err = this.validateCell(<mxCell>cell, context);

    if (err != null) {
      warning += err;
    }

    // Updates the display with the warning icons
    // before any potential alerts are displayed.
    // LATER: Move this into addCellOverlay. Redraw
    // should check if overlay was added or removed.
    if (cell.getParent() == null) {
      this.getView().validate();
    }
    return warning.length > 0 || !isValid ? warning : null;
  }

  /**
   * Checks all {@link multiplicities} that cannot be enforced while the graph is
   * being modified, namely, all multiplicities that require a minimum of
   * 1 edge.
   *
   * @param cell {@link mxCell} for which the multiplicities should be checked.
   */
  // getCellValidationError(cell: mxCell): string | null;
  getCellValidationError(cell: mxCell): string | null {
    const outCount = this.getModel().getDirectedEdgeCount(cell, true);
    const inCount = this.getModel().getDirectedEdgeCount(cell, false);
    const value = cell.getValue();
    let error = '';

    if (this.multiplicities != null) {
      for (let i = 0; i < this.multiplicities.length; i += 1) {
        const rule = this.multiplicities[i];

        if (
          rule.source &&
          isNode(value, rule.type, rule.attr, rule.value) &&
          (outCount > rule.max || outCount < rule.min)
        ) {
          error += `${rule.countError}\n`;
        } else if (
          !rule.source &&
          isNode(value, rule.type, rule.attr, rule.value) &&
          (inCount > rule.max || inCount < rule.min)
        ) {
          error += `${rule.countError}\n`;
        }
      }
    }
    return error.length > 0 ? error : null;
  }

  /**
   * Hook method for subclassers to return an error message for the given
   * cell and validation context. This implementation returns null. Any HTML
   * breaks will be converted to linefeeds in the calling method.
   *
   * @param cell {@link mxCell} that represents the cell to validate.
   * @param context Object that represents the global validation state.
   */
  // validateCell(cell: mxCell, context: any): string | null;
  validateCell(cell: mxCell, context: mxCellState): void | null {
    return null;
  }

  /*****************************************************************************
   * Group: Graph appearance
   *****************************************************************************/

  /**
   * Returns the {@link backgroundImage} as an {@link mxImage}.
   */
  // getBackgroundImage(): mxImage;
  getBackgroundImage(): mxImage | null {
    return this.backgroundImage;
  }

  /**
   * Sets the new {@link backgroundImage}.
   *
   * @param image New {@link mxImage} to be used for the background.
   */
  // setBackgroundImage(image: mxImage): void;
  setBackgroundImage(image: mxImage | null): void {
    this.backgroundImage = image;
  }

  /**
   * Returns the {@link mxImage} used to display the collapsed state of
   * the specified cell state. This returns null for all edges.
   */
  // getFoldingImage(state: mxCellState): mxImage;
  getFoldingImage(state: mxCellState): mxImage | null {
    if (state != null && this.foldingEnabled && !state.cell.isEdge()) {
      const tmp = (<mxCell>state.cell).isCollapsed();

      if (this.isCellFoldable(state.cell, !tmp)) {
        return tmp ? this.collapsedImage : this.expandedImage;
      }
    }
    return null;
  }

  /**
   * Returns the textual representation for the given cell. This
   * implementation returns the nodename or string-representation of the user
   * object.
   *
   *
   * The following returns the label attribute from the cells user
   * object if it is an XML node.
   *
   * @example
   * ```javascript
   * graph.convertValueToString = function(cell)
   * {
   * 	return cell.getAttribute('label');
   * }
   * ```
   *
   * See also: {@link cellLabelChanged}.
   *
   * @param cell {@link mxCell} whose textual representation should be returned.
   */
  // convertValueToString(cell: mxCell): string;
  convertValueToString(cell: mxCell): string | null {
    const value = cell.getValue();

    if (value != null) {
      if (isNode(value)) {
        return value.nodeName;
      }
      if (typeof value.toString === 'function') {
        return value.toString();
      }
    }
    return '';
  }

  /**
   * Returns a string or DOM node that represents the label for the given
   * cell. This implementation uses {@link convertValueToString} if {@link labelsVisible}
   * is true. Otherwise it returns an empty string.
   *
   * To truncate a label to match the size of the cell, the following code
   * can be used.
   *
   * ```javascript
   * graph.getLabel = function(cell)
   * {
   *   var label = getLabel.apply(this, arguments);
   *
   *   if (label != null && this.model.isVertex(cell))
   *   {
   *     var geo = cell.getCellGeometry();
   *
   *     if (geo != null)
   *     {
   *       var max = parseInt(geo.width / 8);
   *
   *       if (label.length > max)
   *       {
   *         label = label.substring(0, max)+'...';
   *       }
   *     }
   *   }
   *   return mxUtils.htmlEntities(label);
   * }
   * ```
   *
   * A resize listener is needed in the graph to force a repaint of the label
   * after a resize.
   *
   * ```javascript
   * graph.addListener(mxEvent.RESIZE_CELLS, function(sender, evt)
   * {
   *   var cells = evt.getProperty('cells');
   *
   *   for (var i = 0; i < cells.length; i++)
   *   {
   *     this.view.removeState(cells[i]);
   *   }
   * });
   * ```
   *
   * @param cell {@link mxCell} whose label should be returned.
   */
  // getLabel(cell: mxCell): string | Node;
  getLabel(cell: mxCell): string | null {
    let result: string | null = '';

    if (this.labelsVisible && cell != null) {
      const style = this.getCurrentCellStyle(cell);

      if (!mxUtils.getValue(style, 'noLabel', false)) {
        result = this.convertValueToString(cell);
      }
    }
    return result;
  }

  /**
   * Returns true if the label must be rendered as HTML markup. The default
   * implementation returns {@link htmlLabels}.
   *
   * @param cell {@link mxCell} whose label should be displayed as HTML markup.
   */
  // isHtmlLabel(cell: mxCell): boolean;
  isHtmlLabel(cell: mxCell): boolean {
    return this.isHtmlLabels();
  }

  /**
   * Returns {@link htmlLabels}.
   */
  // isHtmlLabels(): boolean;
  isHtmlLabels(): boolean {
    return this.htmlLabels;
  }

  /**
   * Sets {@link htmlLabels}.
   */
  // setHtmlLabels(value: boolean): void;
  setHtmlLabels(value: boolean) {
    this.htmlLabels = value;
  }

  /**
   * This enables wrapping for HTML labels.
   *
   * Returns true if no white-space CSS style directive should be used for
   * displaying the given cells label. This implementation returns true if
   * {@link 'whiteSpace'} in the style of the given cell is 'wrap'.
   *
   * This is used as a workaround for IE ignoring the white-space directive
   * of child elements if the directive appears in a parent element. It
   * should be overridden to return true if a white-space directive is used
   * in the HTML markup that represents the given cells label. In order for
   * HTML markup to work in labels, {@link isHtmlLabel} must also return true
   * for the given cell.
   *
   * @example
   *
   * ```javascript
   * graph.getLabel = function(cell)
   * {
   *   var tmp = getLabel.apply(this, arguments); // "supercall"
   *
   *   if (this.model.isEdge(cell))
   *   {
   *     tmp = '<div style="width: 150px; white-space:normal;">'+tmp+'</div>';
   *   }
   *
   *   return tmp;
   * }
   *
   * graph.isWrapping = function(state)
   * {
   * 	 return this.model.isEdge(state.cell);
   * }
   * ```
   *
   * Makes sure no edge label is wider than 150 pixels, otherwise the content
   * is wrapped. Note: No width must be specified for wrapped vertex labels as
   * the vertex defines the width in its geometry.
   *
   * @param state {@link mxCell} whose label should be wrapped.
   */
  // isWrapping(cell: mxCell): boolean;
  isWrapping(cell: mxCell): boolean {
    return this.getCurrentCellStyle(cell).whiteSpace === 'wrap';
  }

  /**
   * Returns true if the overflow portion of labels should be hidden. If this
   * returns true then vertex labels will be clipped to the size of the vertices.
   * This implementation returns true if `overflow` in the
   * style of the given cell is 'hidden'.
   *
   * @param state {@link mxCell} whose label should be clipped.
   */
  // isLabelClipped(cell: mxCell): boolean;
  isLabelClipped(cell: mxCell): boolean {
    return this.getCurrentCellStyle(cell).overflow === 'hidden';
  }

  /**
   * Returns the string or DOM node that represents the tooltip for the given
   * state, node and coordinate pair. This implementation checks if the given
   * node is a folding icon or overlay and returns the respective tooltip. If
   * this does not result in a tooltip, the handler for the cell is retrieved
   * from {@link selectionCellsHandler} and the optional getTooltipForNode method is
   * called. If no special tooltip exists here then {@link getTooltipForCell} is used
   * with the cell in the given state as the argument to return a tooltip for the
   * given state.
   *
   * @param state {@link mxCellState} whose tooltip should be returned.
   * @param node DOM node that is currently under the mouse.
   * @param x X-coordinate of the mouse.
   * @param y Y-coordinate of the mouse.
   */
  // getTooltip(state: mxCellState, node: Node, x: number, y: number): string;
  getTooltip(
    state: mxCellState,
    node: HTMLElement,
    x: number,
    y: number
  ): string | null {
    let tip: string | null = null;

    if (state != null) {
      // Checks if the mouse is over the folding icon
      if (
        state.control != null &&
        // @ts-ignore
        (node === state.control.node || node.parentNode === state.control.node)
      ) {
        tip = this.collapseExpandResource;
        tip = htmlEntities(mxResources.get(tip) || tip, true).replace(
          /\\n/g,
          '<br>'
        );
      }

      if (tip == null && state.overlays != null) {
        state.overlays.visit((id: string, shape: mxShape) => {
          // LATER: Exit loop if tip is not null
          if (
            tip == null &&
            // @ts-ignore
            (node === shape.node || node.parentNode === shape.node)
          ) {
            // @ts-ignore
            tip = shape.overlay.toString();
          }
        });
      }

      if (tip == null) {
        const handler = (<mxSelectionCellsHandler>(
          this.selectionCellsHandler
        )).getHandler(<mxCell>state.cell);
        if (
          handler != null &&
          typeof handler.getTooltipForNode === 'function'
        ) {
          tip = handler.getTooltipForNode(node);
        }
      }

      if (tip == null) {
        tip = this.getTooltipForCell(<mxCell>state.cell);
      }
    }
    return tip;
  }

  /**
   * Returns the string or DOM node to be used as the tooltip for the given
   * cell. This implementation uses the cells getTooltip function if it
   * exists, or else it returns {@link convertValueToString} for the cell.
   *
   * @example
   *
   * ```javascript
   * graph.getTooltipForCell = function(cell)
   * {
   *   return 'Hello, World!';
   * }
   * ```
   *
   * Replaces all tooltips with the string Hello, World!
   *
   * @param cell {@link mxCell} whose tooltip should be returned.
   */
  // getTooltipForCell(cell: mxCell): string;
  getTooltipForCell(cell: mxCell): string | null {
    let tip = null;

    if (cell != null && 'getTooltip' in cell) {
      // @ts-ignore
      tip = cell.getTooltip();
    } else {
      tip = this.convertValueToString(cell);
    }
    return tip;
  }

  /**
   * Returns the string to be used as the link for the given cell. This
   * implementation returns null.
   *
   * @param cell {@link mxCell} whose tooltip should be returned.
   */
  // getLinkForCell(cell: mxCell): any;
  getLinkForCell(cell: mxCell): string | null {
    return null;
  }

  /**
   * Returns the cursor value to be used for the CSS of the shape for the
   * given event. This implementation calls {@link getCursorForCell}.
   *
   * @param me {@link mxMouseEvent} whose cursor should be returned.
   */
  // getCursorForMouseEvent(me: mxMouseEvent): string;
  getCursorForMouseEvent(me: mxMouseEvent): string | null {
    return this.getCursorForCell(me.getCell());
  }

  /**
   * Returns the cursor value to be used for the CSS of the shape for the
   * given cell. This implementation returns null.
   *
   * @param cell {@link mxCell} whose cursor should be returned.
   */
  // getCursorForCell(cell: mxCell): string;
  getCursorForCell(cell: mxCell): string | null {
    return null;
  }

  /**
   * Returns the start size of the given swimlane, that is, the width or
   * height of the part that contains the title, depending on the
   * horizontal style. The return value is an {@link mxRectangle} with either
   * width or height set as appropriate.
   *
   * @param swimlane {@link mxCell} whose start size should be returned.
   * @param ignoreState Optional boolean that specifies if cell state should be ignored.
   */
  // getStartSize(swimlane: mxCell, ignoreState?: boolean): mxRectangle;
  getStartSize(swimlane: mxCell, ignoreState: boolean = false): mxRectangle {
    const result = new mxRectangle();
    const style = this.getCurrentCellStyle(swimlane, ignoreState);
    const size = parseInt(
      mxUtils.getValue(style, 'startSize', DEFAULT_STARTSIZE)
    );

    if (mxUtils.getValue(style, 'horizontal', true)) {
      result.height = size;
    } else {
      result.width = size;
    }
    return result;
  }

  /**
   * Returns the direction for the given swimlane style.
   */
  // getSwimlaneDirection(style: string): string;
  getSwimlaneDirection(style: any): string {
    const dir = mxUtils.getValue(style, 'direction', DIRECTION_EAST);
    const flipH = mxUtils.getValue(style, 'flipH', 0) == 1;
    const flipV = mxUtils.getValue(style, 'flipV', 0) == 1;
    const h = mxUtils.getValue(style, 'horizontal', true);
    let n = h ? 0 : 3;

    if (dir === DIRECTION_NORTH) {
      n--;
    } else if (dir === DIRECTION_WEST) {
      n += 2;
    } else if (dir === DIRECTION_SOUTH) {
      n += 1;
    }

    const mod = mxUtils.mod(n, 2);

    if (flipH && mod === 1) {
      n += 2;
    }

    if (flipV && mod === 0) {
      n += 2;
    }

    return [DIRECTION_NORTH, DIRECTION_EAST, DIRECTION_SOUTH, DIRECTION_WEST][
      mxUtils.mod(n, 4)
    ];
  }

  /**
   * Returns the actual start size of the given swimlane taking into account
   * direction and horizontal and vertial flip styles. The start size is
   * returned as an {@link mxRectangle} where top, left, bottom, right start sizes
   * are returned as x, y, height and width, respectively.
   *
   * @param swimlane {@link mxCell} whose start size should be returned.
   * @param ignoreState Optional boolean that specifies if cell state should be ignored.
   */
  // getActualStartSize(swimlane: mxCell, ignoreState?: boolean): mxRectangle;
  getActualStartSize(
    swimlane: mxCell,
    ignoreState: boolean = false
  ): mxRectangle {
    const result = new mxRectangle();

    if (this.isSwimlane(swimlane, ignoreState)) {
      const style = this.getCurrentCellStyle(swimlane, ignoreState);
      const size = parseInt(
        mxUtils.getValue(style, 'startSize', DEFAULT_STARTSIZE)
      );
      const dir = this.getSwimlaneDirection(style);

      if (dir === DIRECTION_NORTH) {
        result.y = size;
      } else if (dir === DIRECTION_WEST) {
        result.x = size;
      } else if (dir === DIRECTION_SOUTH) {
        result.height = size;
      } else {
        result.width = size;
      }
    }
    return result;
  }

  /**
   * Returns the image URL for the given cell state. This implementation
   * returns the value stored under {@link 'image'} in the cell
   * style.
   *
   * @param state {@link mxCellState} whose image URL should be returned.
   */
  // getImage(state: mxCellState): string;
  getImage(state: mxCellState): mxImage | null {
    return state != null && state.style != null
      ? state.style.image
      : null;
  }

  /**
   * Returns true if the given state has no stroke- or fillcolor and no image.
   *
   * @param state {@link mxCellState} to check.
   */
  // isTransparentState(state: mxCellState): boolean;
  isTransparentState(state: mxCellState): boolean {
    let result = false;
    if (state != null) {
      const stroke = mxUtils.getValue(state.style, 'strokeColor', NONE);
      const fill = mxUtils.getValue(state.style, 'fillColor', NONE);
      result = stroke === NONE && fill === NONE && this.getImage(state) == null;
    }
    return result;
  }

  /**
   * Returns the vertical alignment for the given cell state. This
   * implementation returns the value stored under
   * {@link 'verticalAlign'} in the cell style.
   *
   * @param state {@link mxCellState} whose vertical alignment should be
   * returned.
   */
  // getVerticalAlign(state: mxCellState): string;
  getVerticalAlign(state: mxCellState): string | null {
    return state != null && state.style != null
      ? state.style.verticalAlign || ALIGN_MIDDLE
      : null;
  }

  /**
   * Returns the indicator color for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_COLOR} in the cell style.
   *
   * @param state {@link mxCellState} whose indicator color should be
   * returned.
   */
  // getIndicatorColor(state: mxCellState): string;
  getIndicatorColor(state: mxCellState): string | null {
    return state != null && state.style != null
      ? state.style.indicatorColor
      : null;
  }

  /**
   * Returns the indicator gradient color for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_GRADIENTCOLOR} in the cell style.
   *
   * @param state {@link mxCellState} whose indicator gradient color should be
   * returned.
   */
  // getIndicatorGradientColor(state: mxCellState): string;
  getIndicatorGradientColor(state: mxCellState): string | null {
    return state != null && state.style != null
      ? state.style.gradientColor
      : null;
  }

  /**
   * Returns the indicator shape for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_SHAPE} in the cell style.
   *
   * @param state {@link mxCellState} whose indicator shape should be returned.
   */
  // getIndicatorShape(state: mxCellState): any;
  getIndicatorShape(state: mxCellState): string | null {
    return state != null && state.style != null
      ? state.style.indicatorShape
      : null;
  }

  /**
   * Returns the indicator image for the given cell state. This
   * implementation returns the value stored under
   * {@link mxConstants.STYLE_INDICATOR_IMAGE} in the cell style.
   *
   * @param state {@link mxCellState} whose indicator image should be returned.
   */
  // getIndicatorImage(state: mxCellState): any;
  getIndicatorImage(state: mxCellState): mxImage | null {
    return state != null && state.style != null
      ? state.style.indicatorImage
      : null;
  }

  /**
   * Returns the value of {@link border}.
   */
  // getBorder(): number;
  getBorder(): number {
    return this.border;
  }

  /**
   * Sets the value of {@link border}.
   *
   * @param value Positive integer that represents the border to be used.
   */
  // setBorder(value: number): void;
  setBorder(value: number) {
    this.border = value;
  }

  /**
   * Returns true if the given cell is a swimlane in the graph. A swimlane is
   * a container cell with some specific behaviour. This implementation
   * checks if the shape associated with the given cell is a {@link mxSwimlane}.
   *
   * @param cell {@link mxCell} to be checked.
   * @param ignoreState Optional boolean that specifies if the cell state should be ignored.
   */
  // isSwimlane(cell: mxCell, ignoreState?: boolean): boolean;
  isSwimlane(cell: mxCell, ignoreState: boolean = false): boolean {
    if (
      cell != null &&
      cell.getParent() !== this.getModel().getRoot() &&
      !cell.isEdge()
    ) {
      return (
        this.getCurrentCellStyle(cell, ignoreState).shape ===
        SHAPE_SWIMLANE
      );
    }
    return false;
  }

  /*****************************************************************************
   * Group: Graph behaviour
   *****************************************************************************/

  /**
   * Returns {@link resizeContainer}.
   */
  // isResizeContainer(): boolean;
  isResizeContainer(): boolean {
    return this.resizeContainer;
  }

  /**
   * Sets {@link resizeContainer}.
   *
   * @param value Boolean indicating if the container should be resized.
   */
  // setResizeContainer(value: boolean): void;
  setResizeContainer(value: boolean) {
    this.resizeContainer = value;
  }

  /**
   * Returns true if the graph is {@link enabled}.
   */
  // isEnabled(): boolean;
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Specifies if the graph should allow any interactions. This
   * implementation updates {@link enabled}.
   *
   * @param value Boolean indicating if the graph should be enabled.
   */
  // setEnabled(value: boolean): void;
  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  /**
   * Returns {@link escapeEnabled}.
   */
  // isEscapeEnabled(): boolean;
  isEscapeEnabled(): boolean {
    return this.escapeEnabled;
  }

  /**
   * Sets {@link escapeEnabled}.
   *
   * @param enabled Boolean indicating if escape should be enabled.
   */
  // setEscapeEnabled(value: boolean): void;
  setEscapeEnabled(value: boolean): void {
    this.escapeEnabled = value;
  }

  /**
   * Returns {@link invokesStopCellEditing}.
   */
  // isInvokesStopCellEditing(): boolean;
  isInvokesStopCellEditing(): boolean {
    return this.invokesStopCellEditing;
  }

  /**
   * Sets {@link invokesStopCellEditing}.
   */
  // setInvokesStopCellEditing(value: boolean): void;
  setInvokesStopCellEditing(value: boolean): void {
    this.invokesStopCellEditing = value;
  }

  /**
   * Returns {@link enterStopsCellEditing}.
   */
  // isEnterStopsCellEditing(): boolean;
  isEnterStopsCellEditing(): boolean {
    return this.enterStopsCellEditing;
  }

  /**
   * Sets {@link enterStopsCellEditing}.
   */
  // setEnterStopsCellEditing(value: boolean): void;
  setEnterStopsCellEditing(value: boolean): void {
    this.enterStopsCellEditing = value;
  }

  /**
   * Returns true if the given cell may not be moved, sized, bended,
   * disconnected, edited or selected. This implementation returns true for
   * all vertices with a relative geometry if {@link locked} is false.
   *
   * @param cell {@link mxCell} whose locked state should be returned.
   */
  // isCellLocked(cell: mxCell): boolean;
  isCellLocked(cell: mxCell): boolean {
    const geometry = cell.getGeometry();

    return (
      this.isCellsLocked() ||
      (geometry != null && cell.isVertex() && geometry.relative)
    );
  }

  /**
   * Returns true if the given cell may not be moved, sized, bended,
   * disconnected, edited or selected. This implementation returns true for
   * all vertices with a relative geometry if {@link locked} is false.
   *
   * @param cell {@link mxCell} whose locked state should be returned.
   */
  // isCellsLocked(): boolean;
  isCellsLocked(): boolean {
    return this.cellsLocked;
  }

  /**
   * Sets if any cell may be moved, sized, bended, disconnected, edited or
   * selected.
   *
   * @param value Boolean that defines the new value for {@link cellsLocked}.
   */
  // setCellsLocked(value: boolean): void;
  setCellsLocked(value: boolean) {
    this.cellsLocked = value;
  }

  /**
   * Returns the cells which may be exported in the given array of cells.
   */
  // getCloneableCells(cells: mxCell[]): mxCell[];
  getCloneableCells(cells: mxCell[]): mxCell[] | null {
    return this.getModel().filterCells(cells, (cell: mxCell) => {
      return this.isCellCloneable(cell);
    });
  }

  /**
   * Returns true if the given cell is cloneable. This implementation returns
   * {@link isCellsCloneable} for all cells unless a cell style specifies
   * {@link mxConstants.STYLE_CLONEABLE} to be 0.
   *
   * @param cell Optional {@link mxCell} whose cloneable state should be returned.
   */
  // isCellCloneable(cell: mxCell): boolean;
  isCellCloneable(cell: mxCell): boolean {
    const style = this.getCurrentCellStyle(cell);
    return this.isCellsCloneable() && style.cloneable !== 0;
  }

  /**
   * Returns {@link cellsCloneable}, that is, if the graph allows cloning of cells
   * by using control-drag.
   */
  // isCellsCloneable(): boolean;
  isCellsCloneable(): boolean {
    return this.cellsCloneable;
  }

  /**
   * Specifies if the graph should allow cloning of cells by holding down the
   * control key while cells are being moved. This implementation updates
   * {@link cellsCloneable}.
   *
   * @param value Boolean indicating if the graph should be cloneable.
   */
  // setCellsCloneable(value: boolean): void;
  setCellsCloneable(value: boolean): void {
    this.cellsCloneable = value;
  }

  /**
   * Returns the cells which may be exported in the given array of cells.
   */
  // getExportableCells(cells: mxCell[]): mxCell[];
  getExportableCells(cells: mxCell[]): mxCell[] | null {
    return this.getModel().filterCells(cells, (cell: mxCell) => {
      return this.canExportCell(cell);
    });
  }

  /**
   * Returns true if the given cell may be exported to the clipboard. This
   * implementation returns {@link exportEnabled} for all cells.
   *
   * @param cell {@link mxCell} that represents the cell to be exported.
   */
  // canExportCell(cell: mxCell): boolean;
  canExportCell(cell: mxCell | null = null): boolean {
    return this.exportEnabled;
  }

  /**
   * Returns the cells which may be imported in the given array of cells.
   */
  // getImportableCells(cells: mxCell[]): mxCell[];
  getImportableCells(cells: mxCell[]): mxCell[] | null {
    return this.getModel().filterCells(cells, (cell: mxCell) => {
      return this.canImportCell(cell);
    });
  }

  /**
   * Returns true if the given cell may be imported from the clipboard.
   * This implementation returns {@link importEnabled} for all cells.
   *
   * @param cell {@link mxCell} that represents the cell to be imported.
   */
  // canImportCell(cell: mxCell): boolean;
  canImportCell(cell: mxCell | null = null): boolean {
    return this.importEnabled;
  }

  /**
   * Returns true if the given cell is selectable. This implementation
   * returns {@link cellsSelectable}.
   *
   * To add a new style for making cells (un)selectable, use the following code.
   *
   * ```javascript
   * isCellSelectable = function(cell)
   * {
   *   var style = this.getCurrentCellStyle(cell);
   *
   *   return this.isCellsSelectable() && !this.isCellLocked(cell) && style.selectable != 0;
   * };
   * ```
   *
   * You can then use the new style as shown in this example.
   *
   * ```javascript
   * graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30, 'selectable=0');
   * ```
   *
   * @param cell {@link mxCell} whose selectable state should be returned.
   */
  // isCellSelectable(cell: mxCell): boolean;
  isCellSelectable(cell: mxCell): boolean {
    return this.isCellsSelectable();
  }

  /**
   * Returns {@link cellsSelectable}.
   */
  // isCellsSelectable(): boolean;
  isCellsSelectable(): boolean {
    return this.cellsSelectable;
  }

  /**
   * Sets {@link cellsSelectable}.
   */
  // setCellsSelectable(value: boolean): void;
  setCellsSelectable(value: boolean): void {
    this.cellsSelectable = value;
  }

  /**
   * Returns the cells which may be exported in the given array of cells.
   */
  // getDeletableCells(cells: mxCell[]): mxCell[];
  getDeletableCells(cells: mxCell[]): mxCell[] | null {
    return this.getModel().filterCells(cells, (cell: mxCell) => {
      return this.isCellDeletable(cell);
    });
  }

  /**
   * Returns true if the given cell is moveable. This returns
   * {@link cellsDeletable} for all given cells if a cells style does not specify
   * {@link 'deletable'} to be 0.
   *
   * @param cell {@link mxCell} whose deletable state should be returned.
   */
  // isCellDeletable(cell: mxCell): boolean;
  isCellDeletable(cell: mxCell): boolean {
    const style = this.getCurrentCellStyle(cell);
    return this.isCellsDeletable() && style.deletable !== 0;
  }

  /**
   * Returns {@link cellsDeletable}.
   */
  // isCellsDeletable(): boolean;
  isCellsDeletable(): boolean {
    return this.cellsDeletable;
  }

  /**
   * Sets {@link cellsDeletable}.
   *
   * @param value Boolean indicating if the graph should allow deletion of cells.
   */
  // setCellsDeletable(value: boolean): void;
  setCellsDeletable(value: boolean): void {
    this.cellsDeletable = value;
  }

  /**
   * Returns true if the given edges's label is moveable. This returns
   * {@link movable} for all given cells if {@link isLocked} does not return true
   * for the given cell.
   *
   * @param cell {@link mxCell} whose label should be moved.
   */
  // isLabelMovable(cell: mxCell): boolean;
  isLabelMovable(cell: mxCell): boolean {
    return (
      !this.isCellLocked(cell) &&
      ((cell.isEdge() && this.edgeLabelsMovable) ||
        (cell.isVertex() && this.vertexLabelsMovable))
    );
  }

  /**
   * Returns true if the given cell is rotatable. This returns true for the given
   * cell if its style does not specify {@link 'rotatable'} to be 0.
   *
   * @param cell {@link mxCell} whose rotatable state should be returned.
   */
  // isCellRotatable(cell: mxCell): boolean;
  isCellRotatable(cell: mxCell): boolean {
    const style = this.getCurrentCellStyle(cell);
    return style.rotatable !== 0;
  }

  /**
   * Returns the cells which are movable in the given array of cells.
   */
  // getMovableCells(cells: mxCell[]): mxCell[];
  getMovableCells(cells: mxCell[]): mxCell[] | null {
    return this.getModel().filterCells(cells, (cell: mxCell) => {
      return this.isCellMovable(cell);
    });
  }

  /**
   * Returns true if the given cell is moveable. This returns {@link cellsMovable}
   * for all given cells if {@link isCellLocked} does not return true for the given
   * cell and its style does not specify {@link 'movable'} to be 0.
   *
   * @param cell {@link mxCell} whose movable state should be returned.
   */
  // isCellMovable(cell: mxCell): boolean;
  isCellMovable(cell: mxCell): boolean {
    const style = this.getCurrentCellStyle(cell);

    return (
      this.isCellsMovable() &&
      !this.isCellLocked(cell) &&
      style.movable !== 0
    );
  }

  /**
   * Returns {@link cellsMovable}.
   */
  // isCellsMovable(): boolean;
  isCellsMovable(): boolean {
    return this.cellsMovable;
  }

  /**
   * Specifies if the graph should allow moving of cells. This implementation
   * updates {@link cellsMsovable}.
   *
   * @param value Boolean indicating if the graph should allow moving of cells.
   */
  // setCellsMovable(value: boolean): void;
  setCellsMovable(value: boolean): void {
    this.cellsMovable = value;
  }

  /**
   * Returns {@link gridEnabled} as a boolean.
   */
  // isGridEnabled(): boolean;
  isGridEnabled(): boolean {
    return this.gridEnabled;
  }

  /**
   * Specifies if the grid should be enabled.
   *
   * @param value Boolean indicating if the grid should be enabled.
   */
  // setGridEnabled(value: boolean): void;
  setGridEnabled(value: boolean): void {
    this.gridEnabled = value;
  }

  /**
   * Returns {@link portsEnabled} as a boolean.
   */
  // isPortsEnabled(): boolean;
  isPortsEnabled(): boolean {
    return this.portsEnabled;
  }

  /**
   * Specifies if the ports should be enabled.
   *
   * @param value Boolean indicating if the ports should be enabled.
   */
  // setPortsEnabled(value: boolean): void;
  setPortsEnabled(value: boolean): void {
    this.portsEnabled = value;
  }

  /**
   * Returns {@link gridSize}.
   */
  // getGridSize(): number;
  getGridSize(): number {
    return this.gridSize;
  }

  /**
   * Sets {@link gridSize}.
   */
  // setGridSize(value: number): void;
  setGridSize(value: number): void {
    this.gridSize = value;
  }

  /**
   * Returns {@link tolerance}.
   */
  // getTolerance(): number;
  getTolerance(): number {
    return this.tolerance;
  }

  /**
   * Sets {@link tolerance}.
   */
  // setTolerance(value: number): void;
  setTolerance(value: number): void {
    this.tolerance = value;
  }

  /**
   * Returns {@link vertexLabelsMovable}.
   */
  // isVertexLabelsMovable(): boolean;
  isVertexLabelsMovable(): boolean {
    return this.vertexLabelsMovable;
  }

  /**
   * Sets {@link vertexLabelsMovable}.
   */
  // setVertexLabelsMovable(value: boolean): void;
  setVertexLabelsMovable(value: boolean): void {
    this.vertexLabelsMovable = value;
  }

  /**
   * Returns {@link edgeLabelsMovable}.
   */
  // isEdgeLabelsMovable(): boolean;
  isEdgeLabelsMovable(): boolean {
    return this.edgeLabelsMovable;
  }

  /**
   * Sets {@link edgeLabelsMovable}.
   */
  // setEdgeLabelsMovable(value: boolean): void;
  setEdgeLabelsMovable(value: boolean): void {
    this.edgeLabelsMovable = value;
  }

  /**
   * Returns {@link swimlaneNesting} as a boolean.
   */
  // isSwimlaneNesting(): boolean;
  isSwimlaneNesting(): boolean {
    return this.swimlaneNesting;
  }

  /**
   * Specifies if swimlanes can be nested by drag and drop. This is only
   * taken into account if dropEnabled is true.
   *
   * @param value Boolean indicating if swimlanes can be nested.
   */
  // setSwimlaneNesting(value: boolean): void;
  setSwimlaneNesting(value: boolean): void {
    this.swimlaneNesting = value;
  }

  /**
   * Returns {@link swimlaneSelectionEnabled} as a boolean.
   */
  // isSwimlaneSelectionEnabled(): boolean;
  isSwimlaneSelectionEnabled(): boolean {
    return this.swimlaneSelectionEnabled;
  }

  /**
   * Specifies if swimlanes should be selected if the mouse is released
   * over their content area.
   *
   * @param value Boolean indicating if swimlanes content areas
   * should be selected when the mouse is released over them.
   */
  // setSwimlaneSelectionEnabled(value: boolean): void;
  setSwimlaneSelectionEnabled(value: boolean): void {
    this.swimlaneSelectionEnabled = value;
  }

  /**
   * Returns {@link multigraph} as a boolean.
   */
  // isMultigraph(): boolean;
  isMultigraph() {
    return this.multigraph;
  }

  /**
   * Specifies if the graph should allow multiple connections between the
   * same pair of vertices.
   *
   * @param value Boolean indicating if the graph allows multiple connections
   * between the same pair of vertices.
   */
  // setMultigraph(value: boolean): void;
  setMultigraph(value: boolean): void {
    this.multigraph = value;
  }

  /**
   * Returns {@link allowLoops} as a boolean.
   */
  // isAllowLoops(): boolean;
  isAllowLoops(): boolean {
    return this.allowLoops;
  }

  /**
   * Specifies if dangling edges are allowed, that is, if edges are allowed
   * that do not have a source and/or target terminal defined.
   *
   * @param value Boolean indicating if dangling edges are allowed.
   */
  // setAllowDanglingEdges(value: boolean): void;
  setAllowDanglingEdges(value: boolean): void {
    this.allowDanglingEdges = value;
  }

  /**
   * Returns {@link allowDanglingEdges} as a boolean.
   */
  // isAllowDanglingEdges(): boolean;
  isAllowDanglingEdges(): boolean {
    return this.allowDanglingEdges;
  }

  /**
   * Specifies if edges should be connectable.
   *
   * @param value Boolean indicating if edges should be connectable.
   */
  // setConnectableEdges(value: boolean): void;
  setConnectableEdges(value: boolean): void {
    this.connectableEdges = value;
  }

  /**
   * Returns {@link connectableEdges} as a boolean.
   */
  // isConnectableEdges(): boolean;
  isConnectableEdges(): boolean {
    return this.connectableEdges;
  }

  /**
   * Specifies if edges should be inserted when cloned but not valid wrt.
   * {@link getEdgeValidationError}. If false such edges will be silently ignored.
   *
   * @param value Boolean indicating if cloned invalid edges should be
   * inserted into the graph or ignored.
   */
  // setCloneInvalidEdges(value: boolean): void;
  setCloneInvalidEdges(value: boolean): void {
    this.cloneInvalidEdges = value;
  }

  /**
   * Returns {@link cloneInvalidEdges} as a boolean.
   */
  // isCloneInvalidEdges(): boolean;
  isCloneInvalidEdges(): boolean {
    return this.cloneInvalidEdges;
  }

  /**
   * Specifies if loops are allowed.
   *
   * @param value Boolean indicating if loops are allowed.
   */
  // setAllowLoops(value: boolean): void;
  setAllowLoops(value: boolean) {
    this.allowLoops = value;
  }

  /**
   * Returns {@link disconnectOnMove} as a boolean.
   */
  // isDisconnectOnMove(): boolean;
  isDisconnectOnMove(): boolean {
    return this.disconnectOnMove;
  }

  /**
   * Specifies if edges should be disconnected when moved. (Note: Cloned
   * edges are always disconnected.)
   *
   * @param value Boolean indicating if edges should be disconnected
   * when moved.
   */
  // setDisconnectOnMove(value: boolean): void;
  setDisconnectOnMove(value: boolean): void {
    this.disconnectOnMove = value;
  }

  /**
   * Returns {@link dropEnabled} as a boolean.
   */
  // isDropEnabled(): boolean;
  isDropEnabled(): boolean {
    return this.dropEnabled;
  }

  /**
   * Specifies if the graph should allow dropping of cells onto or into other
   * cells.
   *
   * @param dropEnabled Boolean indicating if the graph should allow dropping
   * of cells into other cells.
   */
  // setDropEnabled(value: boolean): void;
  setDropEnabled(value: boolean): void {
    this.dropEnabled = value;
  }

  /**
   * Returns {@link splitEnabled} as a boolean.
   */
  // isSplitEnabled(): boolean;
  isSplitEnabled(): boolean {
    return this.splitEnabled;
  }

  /**
   * Specifies if the graph should allow dropping of cells onto or into other
   * cells.
   *
   * @param dropEnabled Boolean indicating if the graph should allow dropping
   * of cells into other cells.
   */
  // setSplitEnabled(value: boolean): void;
  setSplitEnabled(value: boolean): void {
    this.splitEnabled = value;
  }

  /**
   * Returns true if the given cell is resizable. This returns
   * {@link cellsResizable} for all given cells if {@link isCellLocked} does not return
   * true for the given cell and its style does not specify
   * {@link 'resizable'} to be 0.
   *
   * @param cell {@link mxCell} whose resizable state should be returned.
   */
  // isCellResizable(cell: mxCell): boolean;
  isCellResizable(cell: mxCell): boolean {
    const style = this.getCurrentCellStyle(cell);

    const r =
      this.isCellsResizable() &&
      !this.isCellLocked(cell) &&
      mxUtils.getValue(style, 'resizeable', '1') != '0';
    // alert(r);
    return r;
  }

  /**
   * Returns {@link cellsResizable}.
   */
  // isCellsResizable(): boolean;
  isCellsResizable(): boolean {
    return this.cellsResizable;
  }

  /**
   * Specifies if the graph should allow resizing of cells. This
   * implementation updates {@link cellsResizable}.
   *
   * @param value Boolean indicating if the graph should allow resizing of
   * cells.
   */
  // setCellsResizable(value: boolean): void;
  setCellsResizable(value: boolean): void {
    this.cellsResizable = value;
  }

  /**
   * Returns true if the given terminal point is movable. This is independent
   * from {@link isCellConnectable} and {@link isCellDisconnectable} and controls if terminal
   * points can be moved in the graph if the edge is not connected. Note that it
   * is required for this to return true to connect unconnected edges. This
   * implementation returns true.
   *
   * @param cell {@link mxCell} whose terminal point should be moved.
   * @param source Boolean indicating if the source or target terminal should be moved.
   */
  // isTerminalPointMovable(cell: mxCell, source?: boolean): boolean;
  isTerminalPointMovable(cell: mxCell, source: boolean): boolean {
    return true;
  }

  /**
   * Returns true if the given cell is bendable. This returns {@link cellsBendable}
   * for all given cells if {@link isLocked} does not return true for the given
   * cell and its style does not specify {@link mxConstants.STYLE_BENDABLE} to be 0.
   *
   * @param cell {@link mxCell} whose bendable state should be returned.
   */
  // isCellBendable(cell: mxCell): boolean;
  isCellBendable(cell: mxCell): boolean {
    const style = this.getCurrentCellStyle(cell);

    return (
      this.isCellsBendable() &&
      !this.isCellLocked(cell) &&
      style.bendable !== 0
    );
  }

  /**
   * Returns {@link cellsBenadable}.
   */
  // isCellsBendable(): boolean;
  isCellsBendable(): boolean {
    return this.cellsBendable;
  }

  /**
   * Specifies if the graph should allow bending of edges. This
   * implementation updates {@link bendable}.
   *
   * @param value Boolean indicating if the graph should allow bending of
   * edges.
   */
  // setCellsBendable(value: boolean): void;
  setCellsBendable(value: boolean) {
    this.cellsBendable = value;
  }

  /**
   * Returns true if the given cell is editable. This returns {@link cellsEditable} for
   * all given cells if {@link isCellLocked} does not return true for the given cell
   * and its style does not specify {@link 'editable'} to be 0.
   *
   * @param cell {@link mxCell} whose editable state should be returned.
   */
  // isCellEditable(cell: mxCell): boolean;
  isCellEditable(cell: mxCell): boolean {
    const style = this.getCurrentCellStyle(cell);

    return (
      this.isCellsEditable() &&
      !this.isCellLocked(cell) &&
      style.editable != 0
    );
  }

  /**
   * Returns {@link cellsEditable}.
   */
  // isCellsEditable(): boolean;
  isCellsEditable(): boolean {
    return this.cellsEditable;
  }

  /**
   * Specifies if the graph should allow in-place editing for cell labels.
   * This implementation updates {@link cellsEditable}.
   *
   * @param value Boolean indicating if the graph should allow in-place
   * editing.
   */
  // setCellsEditable(value: boolean): void;
  setCellsEditable(value: boolean): void {
    this.cellsEditable = value;
  }

  /**
   * Returns true if the given cell is disconnectable from the source or
   * target terminal. This returns {@link isCellsDisconnectable} for all given
   * cells if {@link isCellLocked} does not return true for the given cell.
   *
   * @param cell {@link mxCell} whose disconnectable state should be returned.
   * @param terminal {@link mxCell} that represents the source or target terminal.
   * @param source Boolean indicating if the source or target terminal is to be
   * disconnected.
   */
  // isCellDisconnectable(cell: mxCell, terminal: mxCell, source?: boolean): boolean;
  isCellDisconnectable(
    cell: mxCell,
    terminal: mxCell | null = null,
    source: boolean = false
  ): boolean {
    return this.isCellsDisconnectable() && !this.isCellLocked(cell);
  }

  /**
   * Returns {@link cellsDisconnectable}.
   */
  // isCellsDisconnectable(): boolean;
  isCellsDisconnectable(): boolean {
    return this.cellsDisconnectable;
  }

  /**
   * Sets {@link cellsDisconnectable}.
   */
  // setCellsDisconnectable(value: boolean): void;
  setCellsDisconnectable(value: boolean): void {
    this.cellsDisconnectable = value;
  }

  /**
   * Returns true if the given cell is a valid source for new connections.
   * This implementation returns true for all non-null values and is
   * called by is called by {@link isValidConnection}.
   *
   * @param cell {@link mxCell} that represents a possible source or null.
   */
  // isValidSource(cell: mxCell): boolean;
  isValidSource(cell: mxCell | null): boolean {
    return (
      (!cell && this.allowDanglingEdges) ||
      (!!cell &&
        (!cell.isEdge() || this.connectableEdges) &&
        cell.isConnectable())
    );
  }

  /**
   * Returns {@link isValidSource} for the given cell. This is called by
   * {@link isValidConnection}.
   *
   * @param cell {@link mxCell} that represents a possible target or null.
   */
  // isValidTarget(cell: mxCell): boolean;
  isValidTarget(cell: mxCell | null): boolean {
    return this.isValidSource(cell);
  }

  /**
   * Returns true if the given target cell is a valid target for source.
   * This is a boolean implementation for not allowing connections between
   * certain pairs of vertices and is called by {@link getEdgeValidationError}.
   * This implementation returns true if {@link isValidSource} returns true for
   * the source and {@link isValidTarget} returns true for the target.
   *
   * @param source {@link mxCell} that represents the source cell.
   * @param target {@link mxCell} that represents the target cell.
   */
  // isValidConnection(source: mxCell, target: mxCell): boolean;
  isValidConnection(source: mxCell | null, target: mxCell | null): boolean {
    return this.isValidSource(source) && this.isValidTarget(target);
  }

  /**
   * Specifies if the graph should allow new connections. This implementation
   * updates {@link mxConnectionHandler.enabled} in {@link connectionHandler}.
   *
   * @param connectable Boolean indicating if new connections should be allowed.
   */
  // setConnectable(connectable: boolean): void;
  setConnectable(connectable: boolean): void {
    (<mxConnectionHandler>this.connectionHandler).setEnabled(connectable);
  }

  /**
   * Returns true if the {@link connectionHandler} is enabled.
   */
  // isConnectable(): boolean;
  isConnectable(): boolean {
    return (<mxConnectionHandler>this.connectionHandler).isEnabled();
  }

  /**
   * Specifies if tooltips should be enabled. This implementation updates
   * {@link mxTooltipHandler.enabled} in {@link tooltipHandler}.
   *
   * @param enabled Boolean indicating if tooltips should be enabled.
   */
  // setTooltips(enabled: boolean): void;
  setTooltips(enabled: boolean): void {
    (<mxTooltipHandler>this.tooltipHandler).setEnabled(enabled);
  }

  /**
   * Specifies if panning should be enabled. This implementation updates
   * {@link mxPanningHandler.panningEnabled} in {@link panningHandler}.
   *
   * @param enabled Boolean indicating if panning should be enabled.
   */
  // setPanning(enabled: boolean): void;
  setPanning(enabled: boolean): void {
    (<mxPanningHandler>this.panningHandler).panningEnabled = enabled;
  }

  /**
   * Returns true if the given cell is currently being edited.
   * If no cell is specified then this returns true if any
   * cell is currently being edited.
   *
   * @param cell {@link mxCell} that should be checked.
   */
  // isEditing(cell?: mxCell): boolean;
  isEditing(cell: mxCell | null = null): boolean {
    if (this.cellEditor != null) {
      const editingCell = this.cellEditor.getEditingCell();
      return cell == null ? editingCell != null : cell === editingCell;
    }
    return false;
  }

  /**
   * Returns true if the size of the given cell should automatically be
   * updated after a change of the label. This implementation returns
   * {@link autoSizeCells} or checks if the cell style does specify
   * {@link 'autoSize'} to be 1.
   *
   * @param cell {@link mxCell} that should be resized.
   */
  // isAutoSizeCell(cell: mxCell): boolean;
  isAutoSizeCell(cell: mxCell) {
    const style = this.getCurrentCellStyle(cell);

    return this.isAutoSizeCells() || style.autosize == 1;
  }

  /**
   * Returns {@link autoSizeCells}.
   */
  // isAutoSizeCells(): boolean;
  isAutoSizeCells() {
    return this.autoSizeCells;
  }

  /**
   * Specifies if cell sizes should be automatically updated after a label
   * change. This implementation sets {@link autoSizeCells} to the given parameter.
   * To update the size of cells when the cells are added, set
   * {@link autoSizeCellsOnAdd} to true.
   *
   * @param value Boolean indicating if cells should be resized
   * automatically.
   */
  // setAutoSizeCells(value: boolean): void;
  setAutoSizeCells(value: boolean) {
    this.autoSizeCells = value;
  }

  /**
   * Returns true if the parent of the given cell should be extended if the
   * child has been resized so that it overlaps the parent. This
   * implementation returns {@link isExtendParents} if the cell is not an edge.
   *
   * @param cell {@link mxCell} that has been resized.
   */
  // isExtendParent(cell: mxCell): boolean;
  isExtendParent(cell: mxCell): boolean {
    return !cell.isEdge() && this.isExtendParents();
  }

  /**
   * Returns {@link extendParents}.
   */
  // isExtendParents(): boolean;
  isExtendParents(): boolean {
    return this.extendParents;
  }

  /**
   * Sets {@link extendParents}.
   *
   * @param value New boolean value for {@link extendParents}.
   */
  // setExtendParents(value: boolean): void;
  setExtendParents(value: boolean) {
    this.extendParents = value;
  }

  /**
   * Returns {@link extendParentsOnAdd}.
   */
  // isExtendParentsOnAdd(cell: mxCell): boolean;
  isExtendParentsOnAdd(cell: mxCell): boolean {
    return this.extendParentsOnAdd;
  }

  /**
   * Sets {@link extendParentsOnAdd}.
   *
   * @param value New boolean value for {@link extendParentsOnAdd}.
   */
  // setExtendParentsOnAdd(value: boolean): void;
  setExtendParentsOnAdd(value: boolean) {
    this.extendParentsOnAdd = value;
  }

  /**
   * Returns {@link extendParentsOnMove}.
   */
  // isExtendParentsOnMove(): boolean;
  isExtendParentsOnMove(): boolean {
    return this.extendParentsOnMove;
  }

  /**
   * Sets {@link extendParentsOnMove}.
   *
   * @param value New boolean value for {@link extendParentsOnAdd}.
   */
  // setExtendParentsOnMove(value: boolean): void;
  setExtendParentsOnMove(value: boolean) {
    this.extendParentsOnMove = value;
  }

  /**
   * Returns {@link recursiveResize}.
   *
   * @param state {@link mxCellState} that is being resized.
   */
  // isRecursiveResize(state?: mxCellState): boolean;
  isRecursiveResize(state: mxCellState | null = null): boolean {
    return this.recursiveResize;
  }

  /**
   * Sets {@link recursiveResize}.
   *
   * @param value New boolean value for {@link recursiveResize}.
   */
  // setRecursiveResize(value: boolean): void;
  setRecursiveResize(value: boolean): void {
    this.recursiveResize = value;
  }

  /**
   * Returns true if the given cell should be kept inside the bounds of its
   * parent according to the rules defined by {@link getOverlap} and
   * {@link isAllowOverlapParent}. This implementation returns false for all children
   * of edges and {@link isConstrainChildren} otherwise.
   *
   * @param cell {@link mxCell} that should be constrained.
   */
  // isConstrainChild(cell: mxCell): boolean;
  isConstrainChild(cell: mxCell): boolean {
    return (
      this.isConstrainChildren() &&
      !!cell.getParent() &&
      !(<mxCell>cell.getParent()).isEdge()
    );
  }

  /**
   * Returns {@link constrainChildren}.
   */
  // isConstrainChildren(): boolean;
  isConstrainChildren(): boolean {
    return this.constrainChildren;
  }

  /**
   * Sets {@link constrainChildren}.
   */
  // setConstrainChildren(value: boolean): void;
  setConstrainChildren(value: boolean) {
    this.constrainChildren = value;
  }

  /**
   * Returns {@link constrainRelativeChildren}.
   */
  // isConstrainRelativeChildren(): boolean;
  isConstrainRelativeChildren(): boolean {
    return this.constrainRelativeChildren;
  }

  /**
   * Sets {@link constrainRelativeChildren}.
   */
  // setConstrainRelativeChildren(value: boolean): void;
  setConstrainRelativeChildren(value: boolean) {
    this.constrainRelativeChildren = value;
  }

  /**
   * Returns {@link allowNegativeCoordinates}.
   */
  // isAllowNegativeCoordinates(): boolean;
  isAllowNegativeCoordinates(): boolean {
    return this.allowNegativeCoordinates;
  }

  /**
   * Sets {@link allowNegativeCoordinates}.
   */
  // setAllowNegativeCoordinates(value: boolean): void;
  setAllowNegativeCoordinates(value: boolean) {
    this.allowNegativeCoordinates = value;
  }

  /**
   * Returns a decimal number representing the amount of the width and height
   * of the given cell that is allowed to overlap its parent. A value of 0
   * means all children must stay inside the parent, 1 means the child is
   * allowed to be placed outside of the parent such that it touches one of
   * the parents sides. If {@link isAllowOverlapParent} returns false for the given
   * cell, then this method returns 0.
   *
   * @param cell {@link mxCell} for which the overlap ratio should be returned.
   */
  // getOverlap(cell: mxCell): number;
  getOverlap(cell: mxCell): number {
    return this.isAllowOverlapParent(cell) ? this.defaultOverlap : 0;
  }

  /**
   * Returns true if the given cell is allowed to be placed outside of the
   * parents area.
   *
   * @param cell {@link mxCell} that represents the child to be checked.
   */
  // isAllowOverlapParent(cell: mxCell): boolean;
  isAllowOverlapParent(cell: mxCell): boolean {
    return false;
  }

  /**
   * Returns the cells which are movable in the given array of cells.
   */
  // getFoldableCells(cells: mxCell[], collapse: boolean): mxCell[];
  getFoldableCells(
    cells: mxCell[],
    collapse: boolean = false
  ): mxCell[] | null {
    return this.getModel().filterCells(cells, (cell: mxCell) => {
      return this.isCellFoldable(cell, collapse);
    });
  }

  /**
   * Returns true if the given cell is foldable. This implementation
   * returns true if the cell has at least one child and its style
   * does not specify {@link mxConstants.STYLE_FOLDABLE} to be 0.
   *
   * @param cell {@link mxCell} whose foldable state should be returned.
   */
  // isCellFoldable(cell: mxCell, collapse: boolean): boolean;
  isCellFoldable(cell: mxCell, collapse: boolean = false): boolean {
    const style = this.getCurrentCellStyle(cell);
    return cell.getChildCount() > 0 && style.foldable != 0;
  }

  /**
   * Returns true if the given cell is a valid drop target for the specified
   * cells. If {@link splitEnabled} is true then this returns {@link isSplitTarget} for
   * the given arguments else it returns true if the cell is not collapsed
   * and its child count is greater than 0.
   *
   * @param cell {@link mxCell} that represents the possible drop target.
   * @param cells {@link mxCell} that should be dropped into the target.
   * @param evt Mouseevent that triggered the invocation.
   */
  // isValidDropTarget(cell: mxCell, cells: mxCell[], evt: Event): boolean;
  isValidDropTarget(cell: mxCell, cells: mxCell[], evt: MouseEvent): boolean {
    return (
      cell != null &&
      ((this.isSplitEnabled() && this.isSplitTarget(cell, cells, evt)) ||
        (!cell.isEdge() &&
          (this.isSwimlane(cell) ||
            (cell.getChildCount() > 0 && !cell.isCollapsed()))))
    );
  }

  /**
   * Returns true if the given edge may be splitted into two edges with the
   * given cell as a new terminal between the two.
   *
   * @param target {@link mxCell} that represents the edge to be splitted.
   * @param cells {@link mxCell} that should split the edge.
   * @param evt Mouseevent that triggered the invocation.
   */
  // isSplitTarget(target: mxCell, cells: mxCell[], evt: Event): boolean;
  isSplitTarget(target: mxCell, cells: mxCell[], evt: MouseEvent): boolean {
    if (
      target.isEdge() &&
      cells != null &&
      cells.length == 1 &&
      cells[0].isConnectable() &&
      this.getEdgeValidationError(target, target.getTerminal(true), cells[0]) ==
        null
    ) {
      const src = <mxCell>target.getTerminal(true);
      const trg = <mxCell>target.getTerminal(false);

      return (
        !this.getModel().isAncestor(cells[0], src) &&
        !this.getModel().isAncestor(cells[0], trg)
      );
    }
    return false;
  }

  /**
   * Returns the given cell if it is a drop target for the given cells or the
   * nearest ancestor that may be used as a drop target for the given cells.
   * If the given array contains a swimlane and {@link swimlaneNesting} is false
   * then this always returns null. If no cell is given, then the bottommost
   * swimlane at the location of the given event is returned.
   *
   * This function should only be used if {@link isDropEnabled} returns true.
   *
   * @param cells Array of {@link mxCell} which are to be dropped onto the target.
   * @param evt Mouseevent for the drag and drop.
   * @param cell {@link mxCell} that is under the mousepointer.
   * @param clone Optional boolean to indicate of cells will be cloned.
   */
  // getDropTarget(cells: mxCell[], evt: Event, cell: mxCell, clone?: boolean): mxCell;
  getDropTarget(
    cells: mxCell[],
    evt: MouseEvent,
    cell: mxCell | null = null,
    clone: boolean = false
  ): mxCell | null {
    if (!this.isSwimlaneNesting()) {
      for (let i = 0; i < cells.length; i += 1) {
        if (this.isSwimlane(cells[i])) {
          return null;
        }
      }
    }

    const pt = mxUtils.convertPoint(
      this.container,
      getClientX(evt),
      getClientY(evt)
    );
    pt.x -= this.panDx;
    pt.y -= this.panDy;
    const swimlane = this.getSwimlaneAt(pt.x, pt.y);

    if (cell == null) {
      cell = swimlane;
    } else if (swimlane != null) {
      // Checks if the cell is an ancestor of the swimlane
      // under the mouse and uses the swimlane in that case
      let tmp = swimlane.getParent();

      while (tmp != null && this.isSwimlane(tmp) && tmp != cell) {
        tmp = tmp.getParent();
      }

      if (tmp == cell) {
        cell = swimlane;
      }
    }

    while (
      cell != null &&
      !this.isValidDropTarget(cell, cells, evt) &&
      !this.getModel().isLayer(cell)
    ) {
      cell = cell.getParent();
    }

    // Checks if parent is dropped into child if not cloning
    if (!clone) {
      let parent = cell;
      while (parent != null && cells.indexOf(parent) < 0) {
        parent = parent.getParent();
      }
    }

    return !this.getModel().isLayer(<mxCell>cell) && parent == null
      ? cell
      : null;
  }

  /*****************************************************************************
   * Group: Cell retrieval
   *****************************************************************************/

  /**
   * Returns {@link defaultParent} or {@link mxGraphView.currentRoot} or the first child
   * child of {@link mxGraphModel.root} if both are null. The value returned by
   * this function should be used as the parent for new cells (aka default
   * layer).
   */
  // getDefaultParent(): mxCell;
  getDefaultParent(): mxCell {
    let parent = this.getCurrentRoot();

    if (parent == null) {
      parent = this.defaultParent;

      if (parent == null) {
        const root = <mxCell>this.getModel().getRoot();
        parent = root.getChildAt(0);
      }
    }
    return <mxCell>parent;
  }

  /**
   * Sets the {@link defaultParent} to the given cell. Set this to null to return
   * the first child of the root in getDefaultParent.
   */
  // setDefaultParent(cell: mxCell): void;
  setDefaultParent(cell: mxCell | null): void {
    this.defaultParent = cell;
  }

  /**
   * Returns the nearest ancestor of the given cell which is a swimlane, or
   * the given cell, if it is itself a swimlane.
   *
   * @param cell {@link mxCell} for which the ancestor swimlane should be returned.
   */
  // getSwimlane(cell: mxCell): mxCell;
  getSwimlane(cell: mxCell | null = null): mxCell | null {
    while (cell != null && !this.isSwimlane(cell)) {
      cell = <mxCell>cell.getParent();
    }
    return cell;
  }

  /**
   * Returns the bottom-most swimlane that intersects the given point (x, y)
   * in the cell hierarchy that starts at the given parent.
   *
   * @param x X-coordinate of the location to be checked.
   * @param y Y-coordinate of the location to be checked.
   * @param parent {@link mxCell} that should be used as the root of the recursion.
   * Default is {@link defaultParent}.
   */
  // getSwimlaneAt(x: number, y: number, parent: mxCell): mxCell;
  getSwimlaneAt(
    x: number,
    y: number,
    parent: mxCell = this.getDefaultParent()
  ): mxCell | null {
    if (parent == null) {
      parent = <mxCell>this.getCurrentRoot();

      if (parent == null) {
        parent = <mxCell>this.getModel().getRoot();
      }
    }

    if (parent != null) {
      const childCount = parent.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const child = parent.getChildAt(i);

        if (child != null) {
          const result = this.getSwimlaneAt(x, y, child);

          if (result != null) {
            return result;
          }
          if (child.isVisible() && this.isSwimlane(child)) {
            const state = this.getView().getState(child);

            if (this.intersects(state, x, y)) {
              return child;
            }
          }
        }
      }
    }
    return null;
  }

  /**
   * Returns the bottom-most cell that intersects the given point (x, y) in
   * the cell hierarchy starting at the given parent. This will also return
   * swimlanes if the given location intersects the content area of the
   * swimlane. If this is not desired, then the {@link hitsSwimlaneContent} may be
   * used if the returned cell is a swimlane to determine if the location
   * is inside the content area or on the actual title of the swimlane.
   *
   * @param x X-coordinate of the location to be checked.
   * @param y Y-coordinate of the location to be checked.
   * @param parent {@link mxCell} that should be used as the root of the recursion.
   * Default is current root of the view or the root of the model.
   * @param vertices Optional boolean indicating if vertices should be returned.
   * Default is `true`.
   * @param edges Optional boolean indicating if edges should be returned. Default
   * is `true`.
   * @param ignoreFn Optional function that returns true if cell should be ignored.
   * The function is passed the cell state and the x and y parameter.
   */
  // getCellAt(x: number, y: number, parent?: mxCell, vertices?: boolean, edges?: boolean, ignoreFn?: Function): mxCell;
  getCellAt(
    x: number,
    y: number,
    parent: mxCell | null = null,
    vertices: boolean = true,
    edges: boolean = true,
    ignoreFn: Function | null = null
  ): mxCell | null {
    if (parent == null) {
      parent = <mxCell>this.getCurrentRoot();

      if (parent == null) {
        parent = <mxCell>this.getModel().getRoot();
      }
    }

    if (parent != null) {
      const childCount = parent.getChildCount();

      for (let i = childCount - 1; i >= 0; i--) {
        const cell = <mxCell>parent.getChildAt(i);
        const result = this.getCellAt(x, y, cell, vertices, edges, ignoreFn);

        if (result != null) {
          return result;
        }
        if (
          cell.isVisible() &&
          ((edges && cell.isEdge()) || (vertices && cell.isVertex()))
        ) {
          const state = this.getView().getState(cell);

          if (
            state != null &&
            (ignoreFn == null || !ignoreFn(state, x, y)) &&
            this.intersects(state, x, y)
          ) {
            return cell;
          }
        }
      }
    }
    return null;
  }

  /**
   * Returns the bottom-most cell that intersects the given point (x, y) in
   * the cell hierarchy that starts at the given parent.
   *
   * @param state {@link mxCellState} that represents the cell state.
   * @param x X-coordinate of the location to be checked.
   * @param y Y-coordinate of the location to be checked.
   */
  // intersects(state: mxCellState, x: number, y: number): mxCell;
  intersects(state: mxCellState | null = null, x: number, y: number): boolean {
    if (state != null) {
      const pts = <mxPoint[]>state.absolutePoints;

      if (pts != null) {
        const t2 = this.tolerance * this.tolerance;
        let pt = pts[0];

        for (let i = 1; i < pts.length; i += 1) {
          const next = pts[i];
          const dist = mxUtils.ptSegDistSq(pt.x, pt.y, next.x, next.y, x, y);

          if (dist <= t2) {
            return true;
          }

          pt = next;
        }
      } else {
        const alpha = mxUtils.toRadians(
          mxUtils.getValue(state.style, 'rotation') || 0
        );

        if (alpha != 0) {
          const cos = Math.cos(-alpha);
          const sin = Math.sin(-alpha);
          const cx = new mxPoint(state.getCenterX(), state.getCenterY());
          const pt = mxUtils.getRotatedPoint(new mxPoint(x, y), cos, sin, cx);
          x = pt.x;
          y = pt.y;
        }

        if (mxUtils.contains(state, x, y)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Returns true if the given coordinate pair is inside the content
   * are of the given swimlane.
   *
   * @param swimlane {@link mxCell} that specifies the swimlane.
   * @param x X-coordinate of the mouse event.
   * @param y Y-coordinate of the mouse event.
   */
  // hitsSwimlaneContent(swimlane: mxCell, x: number, y: number): boolean;
  hitsSwimlaneContent(swimlane: mxCell, x: number, y: number): boolean {
    const state = this.getView().getState(swimlane);
    const size = this.getStartSize(swimlane);

    if (state != null) {
      const scale = this.getView().getScale();
      x -= state.x;
      y -= state.y;

      if (size.width > 0 && x > 0 && x > size.width * scale) {
        return true;
      }
      if (size.height > 0 && y > 0 && y > size.height * scale) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns the visible child vertices of the given parent.
   *
   * @param parent {@link mxCell} whose children should be returned.
   */
  // getChildVertices(parent: mxCell): mxCell[];
  getChildVertices(parent: mxCell): (mxCell | null)[] {
    return this.getChildCells(parent, true, false);
  }

  /**
   * Returns the visible child edges of the given parent.
   *
   * @param parent {@link mxCell} whose child vertices should be returned.
   */
  // getChildEdges(parent: mxCell): mxCell[];
  getChildEdges(parent: mxCell): (mxCell | null)[] {
    return this.getChildCells(parent, false, true);
  }

  /**
   * Returns the visible child vertices or edges in the given parent. If
   * vertices and edges is false, then all children are returned.
   *
   * @param parent {@link mxCell} whose children should be returned.
   * @param vertices Optional boolean that specifies if child vertices should
   * be returned. Default is `false`.
   * @param edges Optional boolean that specifies if child edges should
   * be returned. Default is `false`.
   */
  // getChildCells(parent: mxCell, vertices?: boolean, edges?: boolean): mxCell[];
  getChildCells(
    parent: mxCell = this.getDefaultParent(),
    vertices: boolean = false,
    edges: boolean = false
  ): (mxCell | null)[] {
    const cells = this.getModel().getChildCells(parent, vertices, edges);
    const result = [];

    // Filters out the non-visible child cells
    for (let i = 0; i < cells.length; i += 1) {
      if (cells[i].isVisible()) {
        result.push(cells[i]);
      }
    }
    return result;
  }

  /**
   * Returns all visible edges connected to the given cell without loops.
   *
   * @param cell {@link mxCell} whose connections should be returned.
   * @param parent Optional parent of the opposite end for a connection to be
   * returned.
   */
  // getConnections(cell: mxCell, parent: mxCell): mxCell[];
  getConnections(cell: mxCell, parent: mxCell | null = null): mxCell[] {
    return this.getEdges(cell, parent, true, true, false);
  }

  /**
   * Returns the visible incoming edges for the given cell. If the optional
   * parent argument is specified, then only child edges of the given parent
   * are returned.
   *
   * @param cell {@link mxCell} whose incoming edges should be returned.
   * @param parent Optional parent of the opposite end for an edge to be
   * returned.
   */
  // getIncomingEdges(cell: mxCell, parent: mxCell): mxCell[];
  getIncomingEdges(cell: mxCell, parent: mxCell | null = null): mxCell[] {
    return this.getEdges(cell, parent, true, false, false);
  }

  /**
   * Returns the visible outgoing edges for the given cell. If the optional
   * parent argument is specified, then only child edges of the given parent
   * are returned.
   *
   * @param cell {@link mxCell} whose outgoing edges should be returned.
   * @param parent Optional parent of the opposite end for an edge to be
   * returned.
   */
  // getOutgoingEdges(cell: mxCell, parent?: mxCell): mxCell[];
  getOutgoingEdges(cell: mxCell, parent: mxCell | null = null): mxCell[] {
    return this.getEdges(cell, parent, false, true, false);
  }

  /**
   * Function: getEdges
   *
   * Returns the incoming and/or outgoing edges for the given cell.
   * If the optional parent argument is specified, then only edges are returned
   * where the opposite is in the given parent cell. If at least one of incoming
   * or outgoing is true, then loops are ignored, if both are false, then all
   * edges connected to the given cell are returned including loops.
   *
   * Parameters:
   *
   * cell - <mxCell> whose edges should be returned.
   * parent - Optional parent of the opposite end for an edge to be
   * returned.
   * incoming - Optional boolean that specifies if incoming edges should
   * be included in the result. Default is true.
   * outgoing - Optional boolean that specifies if outgoing edges should
   * be included in the result. Default is true.
   * includeLoops - Optional boolean that specifies if loops should be
   * included in the result. Default is true.
   * recurse - Optional boolean the specifies if the parent specified only
   * need be an ancestral parent, true, or the direct parent, false.
   * Default is false
   */
  getEdges(
    cell: mxCell,
    parent: mxCell | null = null,
    incoming: boolean = true,
    outgoing: boolean = true,
    includeLoops: boolean = true,
    recurse: boolean = false
  ): mxCell[] {
    let edges: mxCell[] = [];
    const isCollapsed = cell.isCollapsed();
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);

      if (isCollapsed || !(<mxCell>child).isVisible()) {
        edges = edges.concat(
          <mxCell[]>this.getModel().getEdges(<mxCell>child, incoming, outgoing)
        );
      }
    }

    edges = edges.concat(
      <mxCell[]>this.getModel().getEdges(cell, incoming, outgoing)
    );
    const result = [];

    for (let i = 0; i < edges.length; i += 1) {
      const state = this.getView().getState(edges[i]);

      const source =
        state != null
          ? state.getVisibleTerminal(true)
          : this.getView().getVisibleTerminal(edges[i], true);
      const target =
        state != null
          ? state.getVisibleTerminal(false)
          : this.getView().getVisibleTerminal(edges[i], false);

      if (
        (includeLoops && source == target) ||
        (source != target &&
          ((incoming &&
            target == cell &&
            (parent == null ||
              this.isValidAncestor(<mxCell>source, parent, recurse))) ||
            (outgoing &&
              source == cell &&
              (parent == null ||
                this.isValidAncestor(<mxCell>target, parent, recurse)))))
      ) {
        result.push(edges[i]);
      }
    }
    return result;
  }

  /**
   * Returns whether or not the specified parent is a valid
   * ancestor of the specified cell, either direct or indirectly
   * based on whether ancestor recursion is enabled.
   *
   * @param cell {@link mxCell} the possible child cell
   * @param parent {@link mxCell} the possible parent cell
   * @param recurse boolean whether or not to recurse the child ancestors
   */
  // isValidAncestor(cell: mxCell, parent: mxCell, recurse?: boolean): boolean;
  isValidAncestor(
    cell: mxCell,
    parent: mxCell,
    recurse: boolean = false
  ): boolean {
    return recurse
      ? this.getModel().isAncestor(parent, cell)
      : cell.getParent() == parent;
  }

  /**
   * Returns all distinct visible opposite cells for the specified terminal
   * on the given edges.
   *
   * @param edges Array of {@link mxCell} that contains the edges whose opposite
   * terminals should be returned.
   * @param terminal Terminal that specifies the end whose opposite should be
   * returned.
   * @param sources Optional boolean that specifies if source terminals should be
   * included in the result. Default is `true`.
   * @param targets Optional boolean that specifies if targer terminals should be
   * included in the result. Default is `true`.
   */
  // getOpposites(edges: mxCell[], terminal: mxCellState, sources?: boolean, targets?: boolean): mxCellState[];
  getOpposites(
    edges: mxCell[],
    terminal: mxCell | null = null,
    sources: boolean = true,
    targets: boolean = true
  ): mxCell[] {
    const terminals = [];

    // Fast lookup to avoid duplicates in terminals array
    const dict = new mxDictionary();

    if (edges != null) {
      for (let i = 0; i < edges.length; i += 1) {
        const state = this.getView().getState(edges[i]);

        const source =
          state != null
            ? state.getVisibleTerminal(true)
            : this.getView().getVisibleTerminal(edges[i], true);
        const target =
          state != null
            ? state.getVisibleTerminal(false)
            : this.getView().getVisibleTerminal(edges[i], false);

        // Checks if the terminal is the source of the edge and if the
        // target should be stored in the result
        if (
          source == terminal &&
          target != null &&
          target != terminal &&
          targets
        ) {
          if (!dict.get(target)) {
            dict.put(target, true);
            terminals.push(target);
          }
        }

        // Checks if the terminal is the taget of the edge and if the
        // source should be stored in the result
        else if (
          target == terminal &&
          source != null &&
          source != terminal &&
          sources
        ) {
          if (!dict.get(source)) {
            dict.put(source, true);
            terminals.push(source);
          }
        }
      }
    }
    return terminals;
  }

  /**
   * Returns the edges between the given source and target. This takes into
   * account collapsed and invisible cells and returns the connected edges
   * as displayed on the screen.
   *
   * source -
   * target -
   * directed -
   */
  // getEdgesBetween(source: mxCell, target: mxCell, directed?: boolean): mxCell[];
  getEdgesBetween(source: mxCell, target: mxCell, directed: boolean = false) {
    const edges = this.getEdges(source);
    const result = [];

    // Checks if the edge is connected to the correct
    // cell and returns the first match
    for (let i = 0; i < edges.length; i += 1) {
      const state = this.getView().getState(edges[i]);

      const src =
        state != null
          ? state.getVisibleTerminal(true)
          : this.getView().getVisibleTerminal(edges[i], true);
      const trg =
        state != null
          ? state.getVisibleTerminal(false)
          : this.getView().getVisibleTerminal(edges[i], false);

      if (
        (src == source && trg == target) ||
        (!directed && src == target && trg == source)
      ) {
        result.push(edges[i]);
      }
    }
    return result;
  }

  /**
   * Returns an {@link mxPoint} representing the given event in the unscaled,
   * non-translated coordinate space of {@link container} and applies the grid.
   *
   * @param evt Mousevent that contains the mouse pointer location.
   * @param addOffset Optional boolean that specifies if the position should be
   * offset by half of the {@link gridSize}. Default is `true`.
   */
  // getPointForEvent(evt: MouseEvent, addOffset: boolean): mxPoint;
  getPointForEvent(evt: MouseEvent, addOffset: boolean = true) {
    const p = mxUtils.convertPoint(
      this.container,
      getClientX(evt),
      getClientY(evt)
    );

    const s = this.getView().scale;
    const tr = this.getView().translate;
    const off = addOffset ? this.gridSize / 2 : 0;

    p.x = this.snap(p.x / s - tr.x - off);
    p.y = this.snap(p.y / s - tr.y - off);
    return p;
  }

  /**
   * Returns the child vertices and edges of the given parent that are contained
   * in the given rectangle. The result is added to the optional result array,
   * which is returned. If no result array is specified then a new array is
   * created and returned.
   *
   * @param x X-coordinate of the rectangle.
   * @param y Y-coordinate of the rectangle.
   * @param width Width of the rectangle.
   * @param height Height of the rectangle.
   * @param parent {@link mxCell} that should be used as the root of the recursion.
   * Default is current root of the view or the root of the model.
   * @param result Optional array to store the result in.
   */
  // getCells(x: number, y: number, width: number, height: number, parent?: mxCell, result?: mxCell[]): mxCell[];
  getCells(
    x: number,
    y: number,
    width: number,
    height: number,
    parent: mxCell | null = null,
    result: mxCell[] = [],
    intersection: mxRectangle | null = null,
    ignoreFn: Function | null = null,
    includeDescendants: boolean = false
  ): mxCell[] {
    if (width > 0 || height > 0 || intersection != null) {
      const model = this.getModel();
      const right = x + width;
      const bottom = y + height;

      if (parent == null) {
        parent = this.getCurrentRoot();

        if (parent == null) {
          parent = model.getRoot();
        }
      }

      if (parent != null) {
        const childCount = parent.getChildCount();

        for (let i = 0; i < childCount; i += 1) {
          const cell = <mxCell>parent.getChildAt(i);
          const state: mxCellState = <mxCellState>this.getView().getState(cell);

          if (
            state != null &&
            cell.isVisible() &&
            (ignoreFn == null || !ignoreFn(state))
          ) {
            const deg = mxUtils.getValue(state.style, 'rotation') || 0;

            let box: mxCellState | mxRectangle = state; // TODO: CHECK ME!!!! ==========================================================
            if (deg != 0) {
              box = <mxRectangle>mxUtils.getBoundingBox(box, deg);
            }

            const hit =
              (intersection != null &&
                cell.isVertex() &&
                mxUtils.intersects(intersection, box)) ||
              (intersection == null &&
                (cell.isEdge() || cell.isVertex()) &&
                box.x >= x &&
                box.y + box.height <= bottom &&
                box.y >= y &&
                box.x + box.width <= right);

            if (hit) {
              result.push(cell);
            }

            if (!hit || includeDescendants) {
              this.getCells(
                x,
                y,
                width,
                height,
                cell,
                result,
                intersection,
                ignoreFn,
                includeDescendants
              );
            }
          }
        }
      }
    }
    return result;
  }

  /**
   * Function: getCellsBeyond
   *
   * Returns the children of the given parent that are contained in the
   * halfpane from the given point (x0, y0) rightwards or downwards
   * depending on rightHalfpane and bottomHalfpane.
   *
   * Parameters:
   *
   * x0 - X-coordinate of the origin.
   * y0 - Y-coordinate of the origin.
   * parent - Optional <mxCell> whose children should be checked. Default is
   * <defaultParent>.
   * rightHalfpane - Boolean indicating if the cells in the right halfpane
   * from the origin should be returned.
   * bottomHalfpane - Boolean indicating if the cells in the bottom halfpane
   * from the origin should be returned.
   */
  getCellsBeyond(
    x0: number,
    y0: number,
    parent: mxCell | null = null,
    rightHalfpane: boolean = false,
    bottomHalfpane: boolean = false
  ) {
    const result = [];

    if (rightHalfpane || bottomHalfpane) {
      if (parent == null) {
        parent = <mxCell>this.getDefaultParent();
      }

      if (parent != null) {
        const childCount = parent.getChildCount();

        for (let i = 0; i < childCount; i += 1) {
          const child = <mxCell>parent.getChildAt(i);
          const state = this.getView().getState(child);

          if (child.isVisible() && state != null) {
            if (
              (!rightHalfpane || state.x >= x0) &&
              (!bottomHalfpane || state.y >= y0)
            ) {
              result.push(child);
            }
          }
        }
      }
    }
    return result;
  }

  /*****************************************************************************
   * Group: Tree and traversal-related
   *****************************************************************************/

  /**
   * Returns all children in the given parent which do not have incoming
   * edges. If the result is empty then the with the greatest difference
   * between incoming and outgoing edges is returned.
   *
   * @param parent {@link mxCell} whose children should be checked.
   * @param isolate Optional boolean that specifies if edges should be ignored if
   * the opposite end is not a child of the given parent cell. Default is
   * false.
   * @param invert Optional boolean that specifies if outgoing or incoming edges
   * should be counted for a tree root. If false then outgoing edges will be
   * counted. Default is `false`.
   */
  // findTreeRoots(parent: mxCell, isolate?: boolean, invert?: boolean): mxCell[];
  findTreeRoots(
    parent: mxCell,
    isolate: boolean = false,
    invert: boolean = false
  ): mxCell[] {
    const roots: mxCell[] = [];

    if (parent != null) {
      const model = this.getModel();
      const childCount = parent.getChildCount();
      let best = null;
      let maxDiff = 0;

      for (let i = 0; i < childCount; i += 1) {
        const cell = <mxCell>parent.getChildAt(i);

        if (cell.isVertex() && cell.isVisible()) {
          const conns = this.getConnections(cell, isolate ? parent : null);
          let fanOut = 0;
          let fanIn = 0;

          for (let j = 0; j < conns.length; j++) {
            const src = this.getView().getVisibleTerminal(conns[j], true);

            if (src == cell) {
              fanOut++;
            } else {
              fanIn++;
            }
          }

          if (
            (invert && fanOut == 0 && fanIn > 0) ||
            (!invert && fanIn == 0 && fanOut > 0)
          ) {
            roots.push(cell);
          }

          const diff = invert ? fanIn - fanOut : fanOut - fanIn;

          if (diff > maxDiff) {
            maxDiff = diff;
            best = cell;
          }
        }
      }

      if (roots.length == 0 && best != null) {
        roots.push(best);
      }
    }
    return roots;
  }

  /**
   * Function: traverse
   *
   * Traverses the (directed) graph invoking the given function for each
   * visited vertex and edge. The function is invoked with the current vertex
   * and the incoming edge as a parameter. This implementation makes sure
   * each vertex is only visited once. The function may return false if the
   * traversal should stop at the given vertex.
   *
   * Example:
   *
   * (code)
   * mxLog.show();
   * let cell = graph.getSelectionCell();
   * graph.traverse(cell, false, (vertex, edge)=>
   * {
   *   mxLog.debug(graph.getLabel(vertex));
   * });
   * (end)
   *
   * Parameters:
   *
   * vertex - <mxCell> that represents the vertex where the traversal starts.
   * directed - Optional boolean indicating if edges should only be traversed
   * from source to target. Default is true.
   * func - Visitor function that takes the current vertex and the incoming
   * edge as arguments. The traversal stops if the function returns false.
   * edge - Optional <mxCell> that represents the incoming edge. This is
   * null for the first step of the traversal.
   * visited - Optional <mxDictionary> from cells to true for the visited cells.
   * inverse - Optional boolean to traverse in inverse direction. Default is false.
   * This is ignored if directed is false.
   */
  traverse(
    vertex: mxCell | null = null,
    directed: boolean = true,
    func: Function | null = null,
    edge: mxCell | null = null,
    visited: mxDictionary | null = null,
    inverse: boolean = false
  ): void {
    if (func != null && vertex != null) {
      directed = directed != null ? directed : true;
      inverse = inverse != null ? inverse : false;
      visited = visited || new mxDictionary();

      if (!visited.get(vertex)) {
        visited.put(vertex, true);
        const result = func(vertex, edge);

        if (result == null || result) {
          const edgeCount = vertex.getEdgeCount();

          if (edgeCount > 0) {
            for (let i = 0; i < edgeCount; i += 1) {
              const e = <mxCell>vertex.getEdgeAt(i);
              const isSource = e.getTerminal(true) == vertex;

              if (!directed || !inverse == isSource) {
                const next = e.getTerminal(!isSource);
                this.traverse(next, directed, func, e, visited, inverse);
              }
            }
          }
        }
      }
    }
  }

  /*****************************************************************************
   * Group: Selection
   *****************************************************************************/

  /**
   * Returns true if the given cell is selected.
   *
   * @param cell {@link mxCell} for which the selection state should be returned.
   */
  // isCellSelected(cell: mxCell): boolean;
  isCellSelected(cell: mxCell): boolean {
    return this.getSelectionModel().isSelected(cell);
  }

  /**
   * Returns true if the selection is empty.
   */
  // isSelectionEmpty(): boolean;
  isSelectionEmpty(): boolean {
    return this.getSelectionModel().isEmpty();
  }

  /**
   * Clears the selection using {@link mxGraphSelectionModel.clear}.
   */
  // clearSelection(): void;
  clearSelection(): void {
    return this.getSelectionModel().clear();
  }

  /**
   * Returns the number of selected cells.
   */
  // getSelectionCount(): number;
  getSelectionCount(): number {
    return this.getSelectionModel().cells.length;
  }

  /**
   * Returns the first cell from the array of selected {@link mxCell}.
   */
  // getSelectionCell(): mxCell;
  getSelectionCell(): mxCell {
    return this.getSelectionModel().cells[0];
  }

  /**
   * Returns the array of selected {@link mxCell}.
   */
  // getSelectionCells(): mxCell[];
  getSelectionCells(): mxCell[] {
    return this.getSelectionModel().cells.slice();
  }

  /**
   * Sets the selection cell.
   *
   * @param cell {@link mxCell} to be selected.
   */
  // setSelectionCell(cell: mxCell): void;
  setSelectionCell(cell: mxCell | null): void {
    this.getSelectionModel().setCell(cell);
  }

  /**
   * Sets the selection cell.
   *
   * @param cells Array of {@link mxCell} to be selected.
   */
  // setSelectionCells(cells: mxCell[]): void;
  setSelectionCells(cells: mxCell[]): void {
    this.getSelectionModel().setCells(cells);
  }

  /**
   * Adds the given cell to the selection.
   *
   * @param cell {@link mxCell} to be add to the selection.
   */
  // addSelectionCell(cell: mxCell): void;
  addSelectionCell(cell: mxCell): void {
    this.getSelectionModel().addCell(cell);
  }

  /**
   * Adds the given cells to the selection.
   *
   * @param cells Array of {@link mxCell} to be added to the selection.
   */
  // addSelectionCells(cells: mxCell[]): void;
  addSelectionCells(cells: mxCell[]): void {
    this.getSelectionModel().addCells(cells);
  }

  /**
   * Removes the given cell from the selection.
   *
   * @param cell {@link mxCell} to be removed from the selection.
   */
  // removeSelectionCell(cell: mxCell): void;
  removeSelectionCell(cell: mxCell): void {
    this.getSelectionModel().removeCell(cell);
  }

  /**
   * Removes the given cells from the selection.
   *
   * @param cells Array of {@link mxCell} to be removed from the selection.
   */
  // removeSelectionCells(cells: mxCell[]): void;
  removeSelectionCells(cells: mxCell[]): void {
    this.getSelectionModel().removeCells(cells);
  }

  /**
   * Selects and returns the cells inside the given rectangle for the
   * specified event.
   *
   * @param rect {@link mxRectangle} that represents the region to be selected.
   * @param evt Mouseevent that triggered the selection.
   */
  // selectRegion(rect: mxRectangle, evt: Event): mxCell[];
  selectRegion(rect: mxRectangle, evt: MouseEvent): mxCell[] | null {
    const cells = this.getCells(rect.x, rect.y, rect.width, rect.height);
    this.selectCellsForEvent(cells, evt);
    return cells;
  }

  /**
   * Selects the next cell.
   */
  // selectNextCell(): void;
  selectNextCell(): void {
    this.selectCell(true);
  }

  /**
   * Selects the previous cell.
   */
  // selectPreviousCell(): void;
  selectPreviousCell(): void {
    this.selectCell();
  }

  /**
   * Selects the parent cell.
   */
  // selectParentCell(): void;
  selectParentCell(): void {
    this.selectCell(false, true);
  }

  /**
   * Selects the first child cell.
   */
  // selectChildCell(): void;
  selectChildCell(): void {
    this.selectCell(false, false, true);
  }

  /**
   * Selects the next, parent, first child or previous cell, if all arguments
   * are false.
   *
   * @param isNext Boolean indicating if the next cell should be selected.
   * @param isParent Boolean indicating if the parent cell should be selected.
   * @param isChild Boolean indicating if the first child cell should be selected.
   */
  // selectCell(isNext?: boolean, isParent?: boolean, isChild?: boolean): void;
  selectCell(
    isNext: boolean = false,
    isParent: boolean = false,
    isChild: boolean = false
  ): void {
    const sel = <mxGraphSelectionModel>this.selectionModel;
    const cell = sel.cells.length > 0 ? sel.cells[0] : null;

    if (sel.cells.length > 1) {
      sel.clear();
    }

    const parent = <mxCell>(
      (cell != null ? cell.getParent() : this.getDefaultParent())
    );

    const childCount = parent.getChildCount();

    if (cell == null && childCount > 0) {
      const child = parent.getChildAt(0);
      this.setSelectionCell(child);
    } else if (
      parent &&
      (cell == null || isParent) &&
      this.getView().getState(parent) != null &&
      parent.getGeometry() != null
    ) {
      if (this.getCurrentRoot() != parent) {
        this.setSelectionCell(parent);
      }
    } else if (cell != null && isChild) {
      const tmp = cell.getChildCount();

      if (tmp > 0) {
        const child = cell.getChildAt(0);
        this.setSelectionCell(child);
      }
    } else if (childCount > 0) {
      let i = (<mxCell>parent).getIndex(cell);

      if (isNext) {
        i++;
        const child = parent.getChildAt(i % childCount);
        this.setSelectionCell(child);
      } else {
        i--;
        const index = i < 0 ? childCount - 1 : i;
        const child = parent.getChildAt(index);
        this.setSelectionCell(child);
      }
    }
  }

  /**
   * Selects all children of the given parent cell or the children of the
   * default parent if no parent is specified. To select leaf vertices and/or
   * edges use {@link selectCells}.
   *
   * @param parent Optional {@link mxCell} whose children should be selected.
   * Default is {@link defaultParent}.
   * @param descendants Optional boolean specifying whether all descendants should be
   * selected. Default is `false`.
   */
  // selectAll(parent: mxCell, descendants?: boolean): void;
  selectAll(
    parent: mxCell = this.getDefaultParent(),
    descendants: boolean = false
  ): void {
    const cells = descendants
      ? this.getModel().filterDescendants((cell: mxCell) => {
          return cell != parent && this.getView().getState(cell) != null;
        }, parent)
      : parent.getChildren();

    if (cells != null) {
      this.setSelectionCells(cells);
    }
  }

  /**
   * Select all vertices inside the given parent or the default parent.
   */
  // selectVertices(parent: mxCell, selectGroups: boolean): void;
  selectVertices(parent: mxCell, selectGroups: boolean = false): void {
    this.selectCells(true, false, parent, selectGroups);
  }

  /**
   * Select all vertices inside the given parent or the default parent.
   */
  // selectEdges(parent: mxCell): void;
  selectEdges(parent: mxCell): void {
    this.selectCells(false, true, parent);
  }

  /**
   * Selects all vertices and/or edges depending on the given boolean
   * arguments recursively, starting at the given parent or the default
   * parent if no parent is specified. Use {@link selectAll} to select all cells.
   * For vertices, only cells with no children are selected.
   *
   * @param vertices Boolean indicating if vertices should be selected.
   * @param edges Boolean indicating if edges should be selected.
   * @param parent Optional {@link mxCell} that acts as the root of the recursion.
   * Default is {@link defaultParent}.
   * @param selectGroups Optional boolean that specifies if groups should be
   * selected. Default is `false`.
   */
  // selectCells(vertices: boolean, edges: boolean, parent?: mxCell, selectGroups?: boolean): void;
  selectCells(
    vertices: boolean = false,
    edges: boolean = false,
    parent: mxCell = this.getDefaultParent(),
    selectGroups: boolean = false
  ): void {
    const filter = (cell: mxCell) => {
      return (
        this.getView().getState(cell) != null &&
        (((selectGroups || cell.getChildCount() == 0) &&
          cell.isVertex() &&
          vertices &&
          cell.getParent() &&
          !(<mxCell>cell.getParent()).isEdge()) ||
          (cell.isEdge() && edges))
      );
    };

    const cells = this.getModel().filterDescendants(filter, parent);
    if (cells != null) {
      this.setSelectionCells(cells);
    }
  }

  /**
   * Selects the given cell by either adding it to the selection or
   * replacing the selection depending on whether the given mouse event is a
   * toggle event.
   *
   * @param cell {@link mxCell} to be selected.
   * @param evt Optional mouseevent that triggered the selection.
   */
  selectCellForEvent(cell: mxCell, evt: MouseEvent): void {
    const isSelected = this.isCellSelected(cell);

    if (this.isToggleEvent(evt)) {
      if (isSelected) {
        this.removeSelectionCell(cell);
      } else {
        this.addSelectionCell(cell);
      }
    } else if (!isSelected || this.getSelectionCount() != 1) {
      this.setSelectionCell(cell);
    }
  }

  /**
   * Selects the given cells by either adding them to the selection or
   * replacing the selection depending on whether the given mouse event is a
   * toggle event.
   *
   * @param cells Array of {@link mxCell} to be selected.
   * @param evt Optional mouseevent that triggered the selection.
   */
  // selectCellsForEvent(cells: mxCell[], evt?: MouseEvent): void;
  selectCellsForEvent(cells: mxCell[], evt: MouseEvent) {
    if (this.isToggleEvent(evt)) {
      this.addSelectionCells(cells);
    } else {
      this.setSelectionCells(cells);
    }
  }

  /*****************************************************************************
   * Group: Selection state
   *****************************************************************************/

  /**
   * Creates a new handler for the given cell state. This implementation
   * returns a new {@link mxEdgeHandler} of the corresponding cell is an edge,
   * otherwise it returns an {@link mxVertexHandler}.
   *
   * @param state {@link mxCellState} whose handler should be created.
   */
  // createHandler(state: mxCellState): mxVertexHandler | mxEdgeHandler;
  createHandler(
    state: mxCellState | null = null
  ): mxEdgeHandler | mxVertexHandler | null {
    let result: mxEdgeHandler | mxVertexHandler | null = null;

    if (state != null) {
      if (state.cell.isEdge()) {
        const source = state.getVisibleTerminalState(true);
        const target = state.getVisibleTerminalState(false);
        const geo = (<mxCell>state.cell).getGeometry();

        const edgeStyle = this.getView().getEdgeStyle(
          state,
          geo != null ? geo.points : [],
          <mxCellState>source,
          <mxCellState>target
        );
        result = this.createEdgeHandler(state, edgeStyle);
      } else {
        result = this.createVertexHandler(state);
      }
    }
    return result;
  }

  /**
   * Hooks to create a new {@link mxVertexHandler} for the given {@link mxCellState}.
   *
   * @param state {@link mxCellState} to create the handler for.
   */
  // createVertexHandler(state: mxCellState): mxVertexHandler;
  createVertexHandler(state: mxCellState): mxVertexHandler {
    return new mxVertexHandler(state);
  }

  /**
   * Hooks to create a new {@link mxEdgeHandler} for the given {@link mxCellState}.
   *
   * @param state {@link mxCellState} to create the handler for.
   */
  // createEdgeHandler(state: mxCellState, edgeStyle: any): mxEdgeHandler;
  createEdgeHandler(state: mxCellState, edgeStyle: any): mxEdgeHandler {
    let result = null;
    if (
      edgeStyle == mxEdgeStyle.Loop ||
      edgeStyle == mxEdgeStyle.ElbowConnector ||
      edgeStyle == mxEdgeStyle.SideToSide ||
      edgeStyle == mxEdgeStyle.TopToBottom
    ) {
      result = this.createElbowEdgeHandler(state);
    } else if (
      edgeStyle == mxEdgeStyle.SegmentConnector ||
      edgeStyle == mxEdgeStyle.OrthConnector
    ) {
      result = this.createEdgeSegmentHandler(state);
    } else {
      result = new mxEdgeHandler(state);
    }
    return result;
  }

  /**
   * Hooks to create a new {@link mxEdgeSegmentHandler} for the given {@link mxCellState}.
   *
   * @param state {@link mxCellState} to create the handler for.
   */
  // createEdgeSegmentHandler(state: mxCellState): mxEdgeSegmentHandler;
  createEdgeSegmentHandler(state: mxCellState): mxEdgeSegmentHandler {
    return new mxEdgeSegmentHandler(state);
  }

  /**
   * Hooks to create a new {@link mxElbowEdgeHandler} for the given {@link mxCellState}.
   *
   * @param state {@link mxCellState} to create the handler for.
   */
  // createElbowEdgeHandler(state: mxCellState): mxElbowEdgeHandler;
  createElbowEdgeHandler(state: mxCellState) {
    return new mxElbowEdgeHandler(state);
  }

  /*****************************************************************************
   * Group: Graph events
   *****************************************************************************/

  /**
   * Adds a listener to the graph event dispatch loop. The listener
   * must implement the mouseDown, mouseMove and mouseUp methods
   * as shown in the {@link mxMouseEvent} class.
   *
   * @param listener Listener to be added to the graph event listeners.
   */
  // addMouseListener(listener: { [key: string]: (sender: mxEventSource, me: mxMouseEvent) => void }): void;
  addMouseListener(listener: any): void {
    if (this.mouseListeners == null) {
      this.mouseListeners = [];
    }
    this.mouseListeners.push(listener);
  }

  /**
   * Removes the specified graph listener.
   *
   * @param listener Listener to be removed from the graph event listeners.
   */
  // removeMouseListener(listener: { [key: string]: (sender: mxEventSource, me: mxMouseEvent) => void }): void;
  removeMouseListener(listener: any) {
    if (this.mouseListeners != null) {
      for (let i = 0; i < this.mouseListeners.length; i += 1) {
        if (this.mouseListeners[i] === listener) {
          this.mouseListeners.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Sets the graphX and graphY properties if the given {@link mxMouseEvent} if
   * required and returned the event.
   *
   * @param me {@link mxMouseEvent} to be updated.
   * @param evtName Name of the mouse event.
   */
  // updateMouseEvent(me: mxMouseEvent, evtName: string): mxMouseEvent;
  updateMouseEvent(me: mxMouseEvent, evtName: string) {
    if (me.graphX == null || me.graphY == null) {
      const pt = mxUtils.convertPoint(this.container, me.getX(), me.getY());

      me.graphX = pt.x - this.panDx;
      me.graphY = pt.y - this.panDy;

      // Searches for rectangles using method if native hit detection is disabled on shape
      if (
        me.getCell() == null &&
        this.isMouseDown &&
        evtName === mxEvent.MOUSE_MOVE
      ) {
        me.state = this.getView().getState(
          this.getCellAt(pt.x, pt.y, null, true, true, (state: mxCellState) => {
            return (
              state.shape == null ||
              state.shape.paintBackground !== this.paintBackground ||
              mxUtils.getValue(state.style, 'pointerEvents', '1') == '1' ||
              (state.shape.fill != null && state.shape.fill !== NONE)
            );
          })
        );
      }
    }

    return me;
  }

  /**
   * Returns the state for the given touch event.
   */
  // getStateForTouchEvent(evt: MouseEvent | TouchEvent): mxCellState;
  getStateForTouchEvent(evt: MouseEvent) {
    const x = getClientX(evt);
    const y = getClientY(evt);

    // Dispatches the drop event to the graph which
    // consumes and executes the source function
    const pt = mxUtils.convertPoint(this.container, x, y);

    return this.getView().getState(this.getCellAt(pt.x, pt.y));
  }

  /**
   * Returns true if the event should be ignored in {@link fireMouseEvent}.
   */
  // isEventIgnored(evtName: string, me: mxMouseEvent, sender: mxEventSource): boolean;
  isEventIgnored(evtName: string, me: mxMouseEvent, sender: any): boolean {
    const mouseEvent = isMouseEvent(me.getEvent());
    let result = false;

    // Drops events that are fired more than once
    if (me.getEvent() === this.lastEvent) {
      result = true;
    } else {
      this.lastEvent = me.getEvent();
    }

    // Installs event listeners to capture the complete gesture from the event source
    // for non-MS touch events as a workaround for all events for the same geture being
    // fired from the event source even if that was removed from the DOM.
    if (this.eventSource != null && evtName !== mxEvent.MOUSE_MOVE) {
      mxEvent.removeGestureListeners(
        this.eventSource,
        null,
        this.mouseMoveRedirect,
        this.mouseUpRedirect
      );
      this.mouseMoveRedirect = null;
      this.mouseUpRedirect = null;
      this.eventSource = null;
    } else if (
      !mxClient.IS_GC &&
      this.eventSource != null &&
      me.getSource() !== this.eventSource
    ) {
      result = true;
    } else if (
      mxClient.IS_TOUCH &&
      evtName === mxEvent.MOUSE_DOWN &&
      !mouseEvent &&
      !isPenEvent(me.getEvent())
    ) {
      this.eventSource = me.getSource();

      this.mouseMoveRedirect = ((evt: MouseEvent) => {
        this.fireMouseEvent(
          mxEvent.MOUSE_MOVE,
          new mxMouseEvent(evt, this.getStateForTouchEvent(evt))
        );
      }) as EventListener;
      this.mouseUpRedirect = ((evt: MouseEvent) => {
        this.fireMouseEvent(
          mxEvent.MOUSE_UP,
          new mxMouseEvent(evt, this.getStateForTouchEvent(evt))
        );
      }) as EventListener;

      mxEvent.addGestureListeners(
        this.eventSource,
        null,
        this.mouseMoveRedirect,
        this.mouseUpRedirect
      );
    }

    // Factored out the workarounds for FF to make it easier to override/remove
    // Note this method has side-effects!
    if (this.isSyntheticEventIgnored(evtName, me, sender)) {
      result = true;
    }

    // Never fires mouseUp/-Down for double clicks
    if (
      !isPopupTrigger(this.lastEvent) &&
      evtName !== mxEvent.MOUSE_MOVE &&
      this.lastEvent.detail === 2
    ) {
      return true;
    }

    // Filters out of sequence events or mixed event types during a gesture
    if (evtName === mxEvent.MOUSE_UP && this.isMouseDown) {
      this.isMouseDown = false;
    } else if (evtName === mxEvent.MOUSE_DOWN && !this.isMouseDown) {
      this.isMouseDown = true;
      this.isMouseTrigger = mouseEvent;
    }
    // Drops mouse events that are fired during touch gestures as a workaround for Webkit
    // and mouse events that are not in sync with the current internal button state
    else if (
      !result &&
      (((!mxClient.IS_FF || evtName !== mxEvent.MOUSE_MOVE) &&
        this.isMouseDown &&
        this.isMouseTrigger !== mouseEvent) ||
        (evtName === mxEvent.MOUSE_DOWN && this.isMouseDown) ||
        (evtName === mxEvent.MOUSE_UP && !this.isMouseDown))
    ) {
      result = true;
    }

    if (!result && evtName === mxEvent.MOUSE_DOWN) {
      this.lastMouseX = me.getX();
      this.lastMouseY = me.getY();
    }

    return result;
  }

  /**
   * Hook for ignoring synthetic mouse events after touchend in Firefox.
   */
  // isSyntheticEventIgnored(evtName: string, me: mxMouseEvent, sender: mxEventSource): boolean;
  isSyntheticEventIgnored(
    evtName: string,
    me: mxMouseEvent,
    sender: any
  ): boolean {
    let result = false;
    const mouseEvent = isMouseEvent(me.getEvent());

    // LATER: This does not cover all possible cases that can go wrong in FF
    if (
      this.ignoreMouseEvents &&
      mouseEvent &&
      evtName !== mxEvent.MOUSE_MOVE
    ) {
      this.ignoreMouseEvents = evtName !== mxEvent.MOUSE_UP;
      result = true;
    } else if (mxClient.IS_FF && !mouseEvent && evtName === mxEvent.MOUSE_UP) {
      this.ignoreMouseEvents = true;
    }
    return result;
  }

  /**
   * Returns true if the event should be ignored in {@link fireMouseEvent}. This
   * implementation returns true for select, option and input (if not of type
   * checkbox, radio, button, submit or file) event sources if the event is not
   * a mouse event or a left mouse button press event.
   *
   * @param evtName The name of the event.
   * @param me {@link mxMouseEvent} that should be ignored.
   */
  // isEventSourceIgnored(evtName: string, me: mxMouseEvent): boolean;
  isEventSourceIgnored(evtName: string, me: mxMouseEvent): boolean {
    const source = me.getSource();
    const name = source.nodeName != null ? source.nodeName.toLowerCase() : '';
    const candidate =
      !isMouseEvent(me.getEvent()) || isLeftMouseButton(me.getEvent());

    return (
      evtName === mxEvent.MOUSE_DOWN &&
      candidate &&
      (name === 'select' ||
        name === 'option' ||
        (name === 'input' &&
          source.type !== 'checkbox' &&
          source.type !== 'radio' &&
          source.type !== 'button' &&
          source.type !== 'submit' &&
          source.type !== 'file'))
    );
  }

  /**
   * Returns the {@link mxCellState} to be used when firing the mouse event for the
   * given state. This implementation returns the given state.
   *
   * {@link mxCellState} - State whose event source should be returned.
   */
  // getEventState(state: mxCellState): mxCellState;
  getEventState(state: mxCellState) {
    return state;
  }

  /**
   * Dispatches the given event in the graph event dispatch loop. Possible
   * event names are {@link mxEvent.MOUSE_DOWN}, {@link mxEvent.MOUSE_MOVE} and
   * {@link mxEvent.MOUSE_UP}. All listeners are invoked for all events regardless
   * of the consumed state of the event.
   *
   * @param evtName String that specifies the type of event to be dispatched.
   * @param me {@link mxMouseEvent} to be fired.
   * @param sender Optional sender argument. Default is `this`.
   */
  // fireMouseEvent(evtName: string, me: mxMouseEvent, sender?: mxEventSource): void;
  fireMouseEvent(evtName: string, me: mxMouseEvent, sender: any = this): void {
    if (this.isEventSourceIgnored(evtName, me)) {
      if (this.tooltipHandler != null) {
        this.tooltipHandler.hide();
      }
      return;
    }

    if (sender == null) {
      sender = this;
    }

    // Updates the graph coordinates in the event
    me = this.updateMouseEvent(me, evtName);

    // Detects and processes double taps for touch-based devices which do not have native double click events
    // or where detection of double click is not always possible (quirks, IE10+). Note that this can only handle
    // double clicks on cells because the sequence of events in IE prevents detection on the background, it fires
    // two mouse ups, one of which without a cell but no mousedown for the second click which means we cannot
    // detect which mouseup(s) are part of the first click, ie we do not know when the first click ends.
    if (
      (!this.nativeDblClickEnabled && !isPopupTrigger(me.getEvent())) ||
      (this.doubleTapEnabled &&
        mxClient.IS_TOUCH &&
        (isTouchEvent(me.getEvent()) || isPenEvent(me.getEvent())))
    ) {
      const currentTime = new Date().getTime();

      if (evtName === mxEvent.MOUSE_DOWN) {
        if (
          this.lastTouchEvent != null &&
          this.lastTouchEvent !== me.getEvent() &&
          currentTime - this.lastTouchTime < this.doubleTapTimeout &&
          Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance &&
          Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance &&
          this.doubleClickCounter < 2
        ) {
          this.doubleClickCounter += 1;
          let doubleClickFired = false;

          if (evtName === mxEvent.MOUSE_UP) {
            if (
              me.getCell() === this.lastTouchCell &&
              this.lastTouchCell !== null
            ) {
              this.lastTouchTime = 0;
              const cell = this.lastTouchCell;
              this.lastTouchCell = null;

              this.dblClick(me.getEvent(), cell);
              doubleClickFired = true;
            }
          } else {
            this.fireDoubleClick = true;
            this.lastTouchTime = 0;
          }

          if (doubleClickFired) {
            mxEvent.consume(me.getEvent());
            return;
          }
        } else if (
          this.lastTouchEvent == null ||
          this.lastTouchEvent !== me.getEvent()
        ) {
          this.lastTouchCell = me.getCell();
          this.lastTouchX = me.getX();
          this.lastTouchY = me.getY();
          this.lastTouchTime = currentTime;
          this.lastTouchEvent = me.getEvent();
          this.doubleClickCounter = 0;
        }
      } else if (
        (this.isMouseDown || evtName === mxEvent.MOUSE_UP) &&
        this.fireDoubleClick
      ) {
        this.fireDoubleClick = false;
        const cell = this.lastTouchCell;
        this.lastTouchCell = null;
        this.isMouseDown = false;

        // Workaround for Chrome/Safari not firing native double click events for double touch on background
        const valid =
          cell != null ||
          ((isTouchEvent(me.getEvent()) || isPenEvent(me.getEvent())) &&
            (mxClient.IS_GC || mxClient.IS_SF));

        if (
          valid &&
          Math.abs(this.lastTouchX - me.getX()) < this.doubleTapTolerance &&
          Math.abs(this.lastTouchY - me.getY()) < this.doubleTapTolerance
        ) {
          this.dblClick(me.getEvent(), cell);
        } else {
          mxEvent.consume(me.getEvent());
        }

        return;
      }
    }

    if (!this.isEventIgnored(evtName, me, sender)) {
      // Updates the event state via getEventState
      me.state = this.getEventState(me.getState());
      this.fireEvent(
        new mxEventObject(
          mxEvent.FIRE_MOUSE_EVENT,
          'eventName',
          evtName,
          'event',
          me
        )
      );

      if (
        mxClient.IS_SF ||
        mxClient.IS_GC ||
        me.getEvent().target !== this.container
      ) {
        const container = <HTMLElement>this.container;

        if (
          evtName === mxEvent.MOUSE_MOVE &&
          this.isMouseDown &&
          this.autoScroll &&
          !isMultiTouchEvent(me.getEvent)
        ) {
          this.scrollPointToVisible(
            me.getGraphX(),
            me.getGraphY(),
            this.autoExtend
          );
        } else if (
          evtName === mxEvent.MOUSE_UP &&
          this.ignoreScrollbars &&
          this.translateToScrollPosition &&
          (container.scrollLeft !== 0 || container.scrollTop !== 0)
        ) {
          const s = this.getView().scale;
          const tr = this.getView().translate;
          this.getView().setTranslate(
            tr.x - container.scrollLeft / s,
            tr.y - container.scrollTop / s
          );
          container.scrollLeft = 0;
          container.scrollTop = 0;
        }

        if (this.mouseListeners != null) {
          const args = [sender, me];
          const mouseListeners = this.mouseListeners;

          // Does not change returnValue in Opera
          if (!me.getEvent().preventDefault) {
            me.getEvent().returnValue = true;
          }

          for (const l of mouseListeners) {
            if (evtName === mxEvent.MOUSE_DOWN) {
              l.mouseDown.apply(l, args);
            } else if (evtName === mxEvent.MOUSE_MOVE) {
              l.mouseMove.apply(l, args);
            } else if (evtName === mxEvent.MOUSE_UP) {
              l.mouseUp.apply(l, args);
            }
          }
        }

        // Invokes the click handler
        if (evtName === mxEvent.MOUSE_UP) {
          this.click(me);
        }
      }

      // Detects tapAndHold events using a timer
      if (
        (isTouchEvent(me.getEvent()) || isPenEvent(me.getEvent())) &&
        evtName === mxEvent.MOUSE_DOWN &&
        this.tapAndHoldEnabled &&
        !this.tapAndHoldInProgress
      ) {
        this.tapAndHoldInProgress = true;
        this.initialTouchX = me.getGraphX();
        this.initialTouchY = me.getGraphY();

        const handler = () => {
          if (this.tapAndHoldValid) {
            this.tapAndHold(me);
          }

          this.tapAndHoldInProgress = false;
          this.tapAndHoldValid = false;
        };

        if (this.tapAndHoldThread) {
          window.clearTimeout(this.tapAndHoldThread);
        }

        this.tapAndHoldThread = window.setTimeout(
          handler,
          this.tapAndHoldDelay
        );
        this.tapAndHoldValid = true;
      } else if (evtName === mxEvent.MOUSE_UP) {
        this.tapAndHoldInProgress = false;
        this.tapAndHoldValid = false;
      } else if (this.tapAndHoldValid) {
        this.tapAndHoldValid =
          Math.abs(this.initialTouchX - me.getGraphX()) < this.tolerance &&
          Math.abs(this.initialTouchY - me.getGraphY()) < this.tolerance;
      }

      // Stops editing for all events other than from cellEditor
      if (
        evtName === mxEvent.MOUSE_DOWN &&
        this.isEditing() &&
        !(<mxCellEditor>this.cellEditor).isEventSource(me.getEvent())
      ) {
        this.stopEditing(!this.isInvokesStopCellEditing());
      }

      this.consumeMouseEvent(evtName, me, sender);
    }
  }

  /**
   * Consumes the given {@link mxMouseEvent} if it's a touchStart event.
   */
  // consumeMouseEvent(evtName: string, me: mxMouseEvent, sender: mxEventSource): void;
  consumeMouseEvent(evtName: string, me: mxMouseEvent, sender: any = this) {
    // Workaround for duplicate click in Windows 8 with Chrome/FF/Opera with touch
    if (evtName === mxEvent.MOUSE_DOWN && isTouchEvent(me.getEvent())) {
      me.consume(false);
    }
  }

  /**
   * Dispatches a {@link mxEvent.GESTURE} event. The following example will resize the
   * cell under the mouse based on the scale property of the native touch event.
   *
   * ```javascript
   * graph.addListener(mxEvent.GESTURE, function(sender, eo)
   * {
   *   var evt = eo.getProperty('event');
   *   var state = graph.view.getState(eo.getProperty('cell'));
   *
   *   if (graph.isEnabled() && graph.isCellResizable(state.cell) && Math.abs(1 - evt.scale) > 0.2)
   *   {
   *     var scale = graph.view.scale;
   *     var tr = graph.view.translate;
   *
   *     var w = state.width * evt.scale;
   *     var h = state.height * evt.scale;
   *     var x = state.x - (w - state.width) / 2;
   *     var y = state.y - (h - state.height) / 2;
   *
   *     var bounds = new mxRectangle(graph.snap(x / scale) - tr.x,
   *     		graph.snap(y / scale) - tr.y, graph.snap(w / scale), graph.snap(h / scale));
   *     graph.resizeCell(state.cell, bounds);
   *     eo.consume();
   *   }
   * });
   * ```
   *
   * @param evt Gestureend event that represents the gesture.
   * @param cell Optional {@link mxCell} associated with the gesture.
   */
  // fireGestureEvent(evt: any, cell?: mxCell): void;
  fireGestureEvent(evt: MouseEvent, cell: mxCell | null = null): void {
    // Resets double tap event handling when gestures take place
    this.lastTouchTime = 0;
    this.fireEvent(
      new mxEventObject(mxEvent.GESTURE, 'event', evt, 'cell', cell)
    );
  }

  /**
   * Destroys the graph and all its resources.
   */
  // destroy(): void;
  destroy(): void {
    if (!this.destroyed) {
      this.destroyed = true;
      this.container = null;

      this.tooltipHandler?.destroy?.();
      this.selectionCellsHandler?.destroy?.();
      this.panningHandler?.destroy?.();
      this.popupMenuHandler?.destroy?.();
      this.connectionHandler?.destroy?.();
      this.graphHandler?.destroy?.();
      this.cellEditor?.destroy?.();
      this.view?.destroy?.();

      if (this.model != null && this.graphModelChangeListener != null) {
        this.getModel().removeListener(this.graphModelChangeListener);
        this.graphModelChangeListener = null;
      }
    }
  }
}

export default mxGraph;
// import("../../serialization/mxGraphCodec");
