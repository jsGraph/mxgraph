/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxPoint from './mxPoint';

/**
 * Class: mxRectangle
 *
 * Extends <mxPoint> to implement a 2-dimensional rectangle with double
 * precision coordinates.
 *
 * Constructor: mxRectangle
 *
 * Constructs a new rectangle for the optional parameters. If no parameters
 * are given then the respective default values are used.
 */
class mxRectangle extends mxPoint {
  constructor(
    x: number = 0,
    y: number = 0,
    width: number = 0,
    height: number = 0
  ) {
    super(x, y);

    // replace super of mxPoint
    this.width = width;
    this.height = height;
  }

  /**
   * Variable: width
   *
   * Holds the width of the rectangle. Default is 0.
   */
  _width = 0;

  /**
   * Variable: height
   *
   * Holds the height of the rectangle. Default is 0.
   */
  _height = 0;

  get width() {
    return this._width;
  }

  set width(width: number) {
    if (Number.isNaN(width)) throw new Error('Invalid width supplied.');

    this._width = width;
  }

  get height() {
    return this._height;
  }

  set height(height: number) {
    if (Number.isNaN(height)) throw new Error('Invalid height supplied.');

    this._height = height;
  }

  /**
   * Function: fromRectangle
   *
   * Returns a new <mxRectangle> which is a copy of the given rectangle.
   */
  static fromRectangle = (rect: mxRectangle) => {
    return new mxRectangle(rect.x, rect.y, rect.width, rect.height);
  };

  /**
   * Function: setRect
   *
   * Sets this rectangle to the specified values
   */
  setRect(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  /**
   * Function: getCenterX
   *
   * Returns the x-coordinate of the center point.
   */
  getCenterX() {
    return this.x + this.width / 2;
  }

  /**
   * Function: getCenterY
   *
   * Returns the y-coordinate of the center point.
   */
  getCenterY() {
    return this.y + this.height / 2;
  }

  /**
   * Function: add
   *
   * Adds the given rectangle to this rectangle.
   */
  add(rect: mxRectangle) {
    const minX = Math.min(this.x, rect.x);
    const minY = Math.min(this.y, rect.y);
    const maxX = Math.max(this.x + this.width, rect.x + rect.width);
    const maxY = Math.max(this.y + this.height, rect.y + rect.height);

    this.x = minX;
    this.y = minY;
    this.width = maxX - minX;
    this.height = maxY - minY;
  }

  /**
   * Function: intersect
   *
   * Changes this rectangle to where it overlaps with the given rectangle.
   */
  intersect(rect: mxRectangle) {
    const r1 = this.x + this.width;
    const r2 = rect.x + rect.width;

    const b1 = this.y + this.height;
    const b2 = rect.y + rect.height;

    this.x = Math.max(this.x, rect.x);
    this.y = Math.max(this.y, rect.y);
    this.width = Math.min(r1, r2) - this.x;
    this.height = Math.min(b1, b2) - this.y;
  }

  /**
   * Function: grow
   *
   * Grows the rectangle by the given amount, that is, this method subtracts
   * the given amount from the x- and y-coordinates and adds twice the amount
   * to the width and height.
   */
  grow(amount: number) {
    this.x -= amount;
    this.y -= amount;
    this.width += 2 * amount;
    this.height += 2 * amount;
  }

  /**
   * Function: getPoint
   *
   * Returns the top, left corner as a new <mxPoint>.
   */
  getPoint() {
    return new mxPoint(this.x, this.y);
  }

  /**
   * Function: rotate90
   *
   * Rotates this rectangle by 90 degree around its center point.
   */
  rotate90() {
    const t = (this.width - this.height) / 2;
    this.x += t;
    this.y -= t;

    const tmp = this.width;
    this.width = this.height;
    this.height = tmp;
  }

  /**
   * Function: equals
   *
   * Returns true if the given object equals this rectangle.
   */
  equals(rect: mxRectangle | null) {
    if (!rect) return false;

    return (
      rect.x === this.x &&
      rect.y === this.y &&
      rect.width === this.width &&
      rect.height === this.height
    );
  }

  clone() {
    return new mxRectangle(this.x, this.y, this.width, this.height);
  }
}

export default mxRectangle;
