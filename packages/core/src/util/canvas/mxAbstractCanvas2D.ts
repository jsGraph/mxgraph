/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import { arcToCurves, getRotatedPoint } from '../mxUtils';
import {
  DEFAULT_FONTFAMILY,
  DEFAULT_FONTSIZE,
  NONE,
  SHADOWCOLOR,
  SHADOW_OFFSET_X,
  SHADOW_OFFSET_Y,
  SHADOW_OPACITY,
} from '../mxConstants';
import mxUrlConverter from '../network/mxUrlConverter';
import mxPoint from '../datatypes/mxPoint';
import { clone } from '../mxCloneUtils';

import type { CanvasState, ColorValue } from '../../types';

/**
 * Class: mxAbstractCanvas2D
 *
 * Base class for all canvases. A description of the public API is available in <mxXmlCanvas2D>.
 * All color values of <mxConstants.NONE> will be converted to null in the state.
 *
 * Constructor: D
 *
 * Constructs a new abstract canvas.
 */
class mxAbstractCanvas2D {
  constructor() {
    /**
     * Variable: converter
     *
     * Holds the <mxUrlConverter> to convert image URLs.
     */
    this.converter = this.createUrlConverter();
    this.reset();
  }

  converter: mxUrlConverter;

  /**
   * Variable: state
   *
   * Holds the current state.
   */
  state: CanvasState = this.createState();

  /**
   * Variable: states
   *
   * Stack of states.
   */
  states: CanvasState[] = [];

  /**
   * Variable: path
   *
   * Holds the current path as an array.
   */
  path: (string | number)[] = [];

  /**
   * Variable: rotateHtml
   *
   * Switch for rotation of HTML. Default is false.
   */
  rotateHtml = true;

  /**
   * Variable: lastX
   *
   * Holds the last x coordinate.
   */
  lastX = 0;

  /**
   * Variable: lastY
   *
   * Holds the last y coordinate.
   */
  lastY = 0;

  /**
   * Variable: moveOp
   *
   * Contains the string used for moving in paths. Default is 'M'.
   */
  moveOp = 'M';

  /**
   * Variable: lineOp
   *
   * Contains the string used for moving in paths. Default is 'L'.
   */
  lineOp = 'L';

  /**
   * Variable: quadOp
   *
   * Contains the string used for quadratic paths. Default is 'Q'.
   */
  quadOp = 'Q';

  /**
   * Variable: curveOp
   *
   * Contains the string used for bezier curves. Default is 'C'.
   */
  curveOp = 'C';

  /**
   * Variable: closeOp
   *
   * Holds the operator for closing curves. Default is 'Z'.
   */
  closeOp = 'Z';

  /**
   * Variable: pointerEvents
   *
   * Boolean value that specifies if events should be handled. Default is false.
   */
  pointerEvents = false;

  /**
   * Function: createUrlConverter
   *
   * Create a new <mxUrlConverter> and returns it.
   */
  createUrlConverter() {
    return new mxUrlConverter();
  }

  /**
   * Function: reset
   *
   * Resets the state of this canvas.
   */
  reset() {
    this.state = this.createState();
    this.states = [];
  }

  /**
   * Function: createState
   *
   * Creates the state of the this canvas.
   */
  createState() {
    return {
      dx: 0,
      dy: 0,
      scale: 1,
      alpha: 1,
      fillAlpha: 1,
      strokeAlpha: 1,
      fillColor: null,
      gradientFillAlpha: 1,
      gradientColor: null,
      gradientAlpha: 1,
      gradientDirection: null,
      strokeColor: null,
      strokeWidth: 1,
      dashed: false,
      dashPattern: '3 3',
      fixDash: false,
      lineCap: 'flat',
      lineJoin: 'miter',
      miterLimit: 10,
      fontColor: '#000000',
      fontBackgroundColor: null,
      fontBorderColor: null,
      fontSize: DEFAULT_FONTSIZE,
      fontFamily: DEFAULT_FONTFAMILY,
      fontStyle: 0,
      shadow: false,
      shadowColor: SHADOWCOLOR,
      shadowAlpha: SHADOW_OPACITY,
      shadowDx: SHADOW_OFFSET_X,
      shadowDy: SHADOW_OFFSET_Y,
      rotation: 0,
      rotationCx: 0,
      rotationCy: 0,
    } as CanvasState;
  }

  /**
   * Function: format
   *
   * Rounds all numbers to integers.
   */
  format(value: number) {
    return Math.round(value);
  }

  /**
   * Function: addOp
   *
   * Adds the given operation to the path.
   */
  addOp = (op: string, ...args: number[]) => {
    this.path.push(op);

    if (args.length > 1) {
      const s = this.state;

      for (let i = 1; i < args.length; i += 2) {
        this.lastX = args[i - 1];
        this.lastY = args[i];

        this.path.push(this.format((this.lastX + s.dx) * s.scale));
        this.path.push(this.format((this.lastY + s.dy) * s.scale));
      }
    }
  };

  /**
   * Function: rotatePoint
   *
   * Rotates the given point and returns the result as an <mxPoint>.
   */
  rotatePoint(x: number, y: number, theta: number, cx: number, cy: number) {
    const rad = theta * (Math.PI / 180);

    return getRotatedPoint(
      new mxPoint(x, y),
      Math.cos(rad),
      Math.sin(rad),
      new mxPoint(cx, cy)
    );
  }

  /**
   * Function: save
   *
   * Saves the current state.
   */
  save() {
    this.states.push(this.state);
    this.state = clone(this.state);
  }

  /**
   * Function: restore
   *
   * Restores the current state.
   */
  restore() {
    const state = this.states.pop();

    if (state) this.state = state;
  }

  /**
   * Function: setLink
   *
   * Sets the current link. Hook for subclassers.
   */
  setLink(link: string | null) {
    // nop
  }

  /**
   * Function: scale
   *
   * Scales the current state.
   */
  scale(value: number) {
    this.state.scale *= value;

    if (this.state.strokeWidth !== null) this.state.strokeWidth *= value;
  }

  /**
   * Function: translate
   *
   * Translates the current state.
   */
  translate(dx: number, dy: number) {
    this.state.dx += dx;
    this.state.dy += dy;
  }

  /**
   * Function: rotate
   *
   * Rotates the current state.
   */
  rotate(
    theta: number,
    flipH: boolean,
    flipV: boolean,
    cx: number,
    cy: number
  ) {
    // nop
  }

  /**
   * Function: setAlpha
   *
   * Sets the current alpha.
   */
  setAlpha(value: number) {
    this.state.alpha = value;
  }

  /**
   * Function: setFillAlpha
   *
   * Sets the current solid fill alpha.
   */
  setFillAlpha(value: number) {
    this.state.fillAlpha = value;
  }

  /**
   * Function: setStrokeAlpha
   *
   * Sets the current stroke alpha.
   */
  setStrokeAlpha(value: number) {
    this.state.strokeAlpha = value;
  }

  /**
   * Function: setFillColor
   *
   * Sets the current fill color.
   */
  setFillColor(value: ColorValue) {
    const v = value === NONE ? null : value;

    this.state.fillColor = v;
    this.state.gradientColor = null;
  }

  /**
   * Function: setGradient
   *
   * Sets the current gradient.
   */
  setGradient(
    color1: ColorValue,
    color2: ColorValue,
    x: number,
    y: number,
    w: number,
    h: number,
    direction: string | null,
    alpha1 = 1,
    alpha2: number = 1
  ) {
    const s = this.state;
    s.fillColor = color1;
    s.gradientFillAlpha = alpha1;
    s.gradientColor = color2;
    s.gradientAlpha = alpha2;
    s.gradientDirection = direction;
  }

  /**
   * Function: setStrokeColor
   *
   * Sets the current stroke color.
   */
  setStrokeColor(value: ColorValue) {
    const v = value === NONE ? null : value;
    this.state.strokeColor = v;
  }

  /**
   * Function: setStrokeWidth
   *
   * Sets the current stroke width.
   */
  setStrokeWidth(value: number | null) {
    this.state.strokeWidth = value;
  }

  /**
   * Function: setDashed
   *
   * Enables or disables dashed lines.
   */
  setDashed(value: boolean, fixDash = false) {
    this.state.dashed = value;
    this.state.fixDash = fixDash;
  }

  /**
   * Function: setDashPattern
   *
   * Sets the current dash pattern.
   */
  setDashPattern(value: string) {
    this.state.dashPattern = value;
  }

  /**
   * Function: setLineCap
   *
   * Sets the current line cap.
   */
  setLineCap(value: string) {
    this.state.lineCap = value;
  }

  /**
   * Function: setLineJoin
   *
   * Sets the current line join.
   */
  setLineJoin(value: string) {
    this.state.lineJoin = value;
  }

  /**
   * Function: setMiterLimit
   *
   * Sets the current miter limit.
   */
  setMiterLimit(value: number) {
    this.state.miterLimit = value;
  }

  /**
   * Function: setFontColor
   *
   * Sets the current font color.
   */
  setFontColor(value: ColorValue) {
    const v = value === NONE ? null : value;
    this.state.fontColor = v;
  }

  /**
   * Function: setFontBackgroundColor
   *
   * Sets the current font background color.
   */
  setFontBackgroundColor(value: ColorValue) {
    const v = value === NONE ? null : value;
    this.state.fontBackgroundColor = v;
  }

  /**
   * Function: setFontBorderColor
   *
   * Sets the current font border color.
   */
  setFontBorderColor(value: ColorValue) {
    const v = value === NONE ? null : value;
    this.state.fontBorderColor = v;
  }

  /**
   * Function: setFontSize
   *
   * Sets the current font size.
   */
  setFontSize(value: number) {
    this.state.fontSize = value;
  }

  /**
   * Function: setFontFamily
   *
   * Sets the current font family.
   */
  setFontFamily(value: string) {
    this.state.fontFamily = value;
  }

  /**
   * Function: setFontStyle
   *
   * Sets the current font style.
   */
  setFontStyle(value: number) {
    this.state.fontStyle = value;
  }

  /**
   * Function: setShadow
   *
   * Enables or disables and configures the current shadow.
   */
  setShadow(enabled: boolean) {
    this.state.shadow = enabled;
  }

  /**
   * Function: setShadowColor
   *
   * Enables or disables and configures the current shadow.
   */
  setShadowColor(value: ColorValue) {
    const v = value === NONE ? null : value;
    this.state.shadowColor = v;
  }

  /**
   * Function: setShadowAlpha
   *
   * Enables or disables and configures the current shadow.
   */
  setShadowAlpha(value: number) {
    this.state.shadowAlpha = value;
  }

  /**
   * Function: setShadowOffset
   *
   * Enables or disables and configures the current shadow.
   */
  setShadowOffset(dx: number, dy: number) {
    this.state.shadowDx = dx;
    this.state.shadowDy = dy;
  }

  /**
   * Function: begin
   *
   * Starts a new path.
   */
  begin() {
    this.lastX = 0;
    this.lastY = 0;
    this.path = [];
  }

  /**
   * Function: moveTo
   *
   *  Moves the current path the given coordinates.
   */
  moveTo(x: number, y: number) {
    this.addOp(this.moveOp, x, y);
  }

  /**
   * Function: lineTo
   *
   * Draws a line to the given coordinates. Uses moveTo with the op argument.
   */
  lineTo(x: number, y: number) {
    this.addOp(this.lineOp, x, y);
  }

  /**
   * Function: quadTo
   *
   * Adds a quadratic curve to the current path.
   */
  quadTo(x1: number, y1: number, x2: number, y2: number) {
    this.addOp(this.quadOp, x1, y1, x2, y2);
  }

  /**
   * Function: curveTo
   *
   * Adds a bezier curve to the current path.
   */
  curveTo(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number
  ) {
    this.addOp(this.curveOp, x1, y1, x2, y2, x3, y3);
  }

  /**
   * Function: arcTo
   *
   * Adds the given arc to the current path. This is a synthetic operation that
   * is broken down into curves.
   */
  arcTo(
    rx: number,
    ry: number,
    angle: number,
    largeArcFlag: boolean,
    sweepFlag: boolean,
    x: number,
    y: number
  ) {
    const curves = arcToCurves(
      this.lastX,
      this.lastY,
      rx,
      ry,
      angle,
      largeArcFlag,
      sweepFlag,
      x,
      y
    );

    if (curves != null) {
      for (let i = 0; i < curves.length; i += 6) {
        this.curveTo(
          curves[i],
          curves[i + 1],
          curves[i + 2],
          curves[i + 3],
          curves[i + 4],
          curves[i + 5]
        );
      }
    }
  }

  /**
   * Function: close
   *
   * Closes the current path.
   */
  close(
    x1?: number,
    y1?: number,
    x2?: number,
    y2?: number,
    x3?: number,
    y3?: number
  ) {
    this.addOp(this.closeOp);
  }

  /**
   * Function: end
   *
   * Empty implementation for backwards compatibility. This will be removed.
   */
  end() {}
}

export default mxAbstractCanvas2D;
