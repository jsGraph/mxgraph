import mxCell from './mxCell';
import mxDictionary from '../../util/datatypes/mxDictionary';
import mxObjectIdentity from '../../util/datatypes/mxObjectIdentity';

import type { CellMap, FilterFunction } from '../../types';

class mxCells extends Array<mxCell> {
  constructor(...items: mxCell[]) {
    super(...items);
  }

  /**
   * Returns the cells from the given array where the given filter function
   * returns true.
   */
  filterCells(filter: FilterFunction) {
    const result = [];

    for (let i = 0; i < this.length; i += 1) {
      if (filter(this[i])) {
        result.push(this[i]);
      }
    }

    return result;
  }

  /**
   * Returns all opposite vertices wrt terminal for the given edges, only
   * returning sources and/or targets as specified. The result is returned
   * as an array of {@link mxCell}.
   *
   * @param {mxCell} terminal  that specifies the known end of the edges.
   * @param sources  Boolean that specifies if source terminals should be contained
   * in the result. Default is true.
   * @param targets  Boolean that specifies if target terminals should be contained
   * in the result. Default is true.
   */
  getOpposites(
    terminal: mxCell,
    sources: boolean = true,
    targets: boolean = true
  ) {
    const terminals = [];

    for (let i = 0; i < this.length; i += 1) {
      const source = this[i].getTerminal(true);
      const target = this[i].getTerminal(false);

      // Checks if the terminal is the source of
      // the edge and if the target should be
      // stored in the result
      if (source === terminal && target && target !== terminal && targets) {
        terminals.push(target);
      }

      // Checks if the terminal is the taget of
      // the edge and if the source should be
      // stored in the result
      else if (
        target === terminal &&
        source &&
        source !== terminal &&
        sources
      ) {
        terminals.push(source);
      }
    }
    return terminals;
  }

  /**
   * Returns the topmost cells of the hierarchy in an array that contains no
   * descendants for each {@link mxCell} that it contains. Duplicates should be
   * removed in the cells array to improve performance.
   */
  getTopmostCells() {
    const dict = new mxDictionary();
    const tmp = [];

    for (let i = 0; i < this.length; i += 1) {
      dict.put(this[i], true);
    }

    for (let i = 0; i < this.length; i += 1) {
      const cell = this[i];
      let topmost = true;
      let parent = cell.getParent();

      while (parent) {
        if (dict.get(parent)) {
          topmost = false;
          break;
        }
        parent = parent.getParent();
      }

      if (topmost) {
        tmp.push(cell);
      }
    }

    return tmp;
  }

  /**
   * Returns an array that represents the set (no duplicates) of all parents
   * for the given array of cells.
   */
  getParents() {
    const parents = [];
    const dict = new mxDictionary();

    for (const cell of this) {
      const parent = cell.getParent();
      if (parent && !dict.get(parent)) {
        dict.put(parent, true);
        parents.push(parent);
      }
    }

    return parents;
  }

  /**
   * Returns an array of clones for the given array of {@link mxCell}`.
   * Depending on the value of includeChildren, a deep clone is created for
   * each cell. Connections are restored based if the corresponding
   * cell is contained in the passed in array.
   *
   * @param includeChildren  Boolean indicating if the cells should be cloned
   * with all descendants.
   * @param mapping  Optional mapping for existing clones.
   */
  cloneCells(includeChildren = true, mapping: CellMap = {}) {
    const clones: mxCell[] = [];

    for (const cell of this) {
      clones.push(this.cloneCellImpl(cell, mapping, includeChildren));
    }

    for (let i = 0; i < clones.length; i += 1) {
      if (clones[i]) {
        this.restoreClone(clones[i], this[i], mapping);
      }
    }
    return clones;
  }

  /**
   * Inner helper method for cloning cells recursively.
   *
   * @private
   */
  cloneCellImpl(cell: mxCell, mapping: CellMap, includeChildren: boolean) {
    const ident = mxObjectIdentity.get(cell);
    let clone = mapping ? mapping[ident] : null;

    if (clone === null) {
      clone = cell.clone();
      mapping[ident] = clone;

      if (includeChildren) {
        const childCount = cell.getChildCount();

        for (let i = 0; i < childCount; i += 1) {
          const cloneChild = this.cloneCellImpl(
            cell.getChildAt(i),
            mapping,
            true
          );
          clone.insert(cloneChild);
        }
      }
    }

    return clone;
  }

  /**
   * Inner helper method for restoring the connections in
   * a network of cloned cells.
   *
   * @private
   */
  restoreClone(clone: mxCell, cell: mxCell, mapping: CellMap): void {
    const source = cell.getTerminal(true);

    if (source) {
      const tmp = mapping[mxObjectIdentity.get(source)];
      if (tmp) {
        tmp.insertEdge(clone, true);
      }
    }

    const target = cell.getTerminal(false);
    if (target) {
      const tmp = mapping[mxObjectIdentity.get(target)];
      if (tmp) {
        tmp.insertEdge(clone, false);
      }
    }

    const childCount = clone.getChildCount();
    for (let i = 0; i < childCount; i += 1) {
      this.restoreClone(clone.getChildAt(i), cell.getChildAt(i), mapping);
    }
  }
}

export default mxCells;
