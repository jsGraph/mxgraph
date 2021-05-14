/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxCell from './mxCell';

/**
 * Implements a mechanism for temporary cell Ids.
 * @class mxCellPath
 */
class mxCellPath {
  constructor() {
    throw new Error("Static class can't be instantiated!");
  }

  /**
   * Defines the separator between the path components. Default is ".".
   */
  static PATH_SEPARATOR = '.';

  /**
   * Creates the cell path for the given cell. The cell path is a
   * concatenation of the indices of all ancestors on the (finite) path to
   * the root, eg. "0.0.0.1".
   *
   * Parameters:
   *
   * cell - Cell whose path should be returned.
   */
  static create(cell: mxCell): string {
    let result = '';
    let parent = cell.getParent();

    while (parent) {
      const index = parent.getIndex(cell);
      result = index + mxCellPath.PATH_SEPARATOR + result;

      cell = parent;
      parent = cell.getParent();
    }

    // Remove trailing separator
    const n = result.length;
    if (n > 1) {
      result = result.substring(0, n - 1);
    }
    return result;
  }

  /**
   * Returns the path for the parent of the cell represented by the given
   * path. Returns null if the given path has no parent.
   *
   * Parameters:
   *
   * path - Path whose parent path should be returned.
   */
  static getParentPath(path: string) {
    const index = path.lastIndexOf(mxCellPath.PATH_SEPARATOR);

    if (index >= 0) {
      return path.substring(0, index);
    }
    if (path.length > 0) {
      return '';
    }

    return null;
  }

  /**
   * Returns the cell for the specified cell path using the given root as the
   * root of the path.
   *
   * Parameters:
   *
   * root - Root cell of the path to be resolved.
   * path - String that defines the path.
   */
  static resolve(root: mxCell, path: string) {
    let parent: mxCell | null = root;

    const tokens = path.split(mxCellPath.PATH_SEPARATOR);
    for (let i = 0; i < tokens.length; i += 1) {
      parent = parent.getChildAt(parseInt(tokens[i]));
    }

    return parent;
  }

  /**
   * Compares the given cell paths and returns -1 if p1 is smaller, 0 if
   * p1 is equal and 1 if p1 is greater than p2.
   */
  static compare(p1: string[], p2: string[]) {
    const min = Math.min(p1.length, p2.length);
    let comp = 0;

    for (let i = 0; i < min; i += 1) {
      if (p1[i] !== p2[i]) {
        if (p1[i].length === 0 || p2[i].length === 0) {
          comp = p1[i] === p2[i] ? 0 : p1[i] > p2[i] ? 1 : -1;
        } else {
          const t1 = parseInt(p1[i]);
          const t2 = parseInt(p2[i]);
          comp = t1 === t2 ? 0 : t1 > t2 ? 1 : -1;
        }
        break;
      }
    }

    // Compares path length if both paths are equal to this point
    if (comp === 0) {
      const t1 = p1.length;
      const t2 = p2.length;
      if (t1 !== t2) {
        comp = t1 > t2 ? 1 : -1;
      }
    }
    return comp;
  }
}

export default mxCellPath;
