/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

/**
 * Class: mxPoint
 *
 * Implements a 2-dimensional vector with double precision coordinates.
 *
 * Constructor: mxPoint
 *
 * Constructs a new point for the optional x and y coordinates. If no
 * coordinates are given, then the default values for <x> and <y> are used.
 */
class mxPoint {
  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Variable: x
   *
   * Holds the x-coordinate of the point. Default is 0.
   */
  _x = 0;

  /**
   * Variable: y
   *
   * Holds the y-coordinate of the point. Default is 0.
   */
  _y = 0;

  get x() {
    return this._x;
  }

  set x(x: number) {
    if (Number.isNaN(x)) throw new Error('Invalid x supplied.');

    this._x = x;
  }

  get y() {
    return this._y;
  }

  set y(y: number) {
    if (Number.isNaN(y)) throw new Error('Invalid y supplied.');

    this._y = y;
  }

  /**
   * Function: equals
   *
   * Returns true if the given object equals this point.
   */
  equals(p: mxPoint | null) {
    if (!p) return false;

    return p.x === this.x && p.y === this.y;
  }

  /**
   * Function: clone
   *
   * Returns a clone of this <mxPoint>.
   */
  clone() {
    return new mxPoint(this.x, this.y);
  }
}

export default mxPoint;
