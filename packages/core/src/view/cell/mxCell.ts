/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { NODETYPE_ELEMENT } from '../../util/mxConstants';
import mxGeometry from '../../util/datatypes/mxGeometry';
import mxCellOverlay from './mxCellOverlay';
import { clone } from '../../util/mxCloneUtils';
import mxPoint from '../../util/datatypes/mxPoint';
import mxCellPath from './mxCellPath';
import { isNotNullish } from '../../util/mxUtils';

import type { FilterFunction } from '../../types';

/**
 * Cells are the elements of the graph model. They represent the state
 * of the groups, vertices and edges in a graph.
 *
 * ### Custom attributes
 * For custom attributes we recommend using an XML node as the value of a cell.
 * The following code can be used to create a cell with an XML node as the value:
 * @example
 * ```javascript
 * var doc = mxUtils.createXmlDocument();
 * var node = doc.createElement('MyNode')
 * node.setAttribute('label', 'MyLabel');
 * node.setAttribute('attribute1', 'value1');
 * graph.insertVertex(graph.getDefaultParent(), null, node, 40, 40, 80, 30);
 * ```
 *
 * For the label to work, {@link mxGraph.convertValueToString} and
 * {@link mxGraph.cellLabelChanged} should be overridden as follows:
 *
 * @example
 * ```javascript
 * graph.convertValueToString(cell)
 * {
 *   if (mxUtils.isNode(cell.value))
 *   {
 *     return cell.getAttribute('label', '')
 *   }
 * };
 *
 * var cellLabelChanged = graph.cellLabelChanged;
 * graph.cellLabelChanged(cell, newValue, autoSize)
 * {
 *   if (mxUtils.isNode(cell.value))
 *   {
 *     // Clones the value for correct undo/redo
 *     var elt = cell.value.cloneNode(true);
 *     elt.setAttribute('label', newValue);
 *     newValue = elt;
 *   }
 *
 *   cellLabelChanged.apply(this, arguments);
 * };
 * ```
 * @class mxCell
 */
class mxCell {
  constructor(
    value: any = null,
    geometry: mxGeometry | null = null,
    style: string | null = null
  ) {
    this.value = value;
    this.setGeometry(geometry);
    this.setStyle(style);

    if (this.onInit) {
      this.onInit();
    }
  }

  // TODO: Document me!!!
  getChildren(): mxCell[] {
    return this.children;
  }

  // TODO: Document me!
  // used by invalidate() of mxGraphView
  invalidating: boolean = false;

  onInit: (() => void) | null = null;

  // used by addCellOverlay() of mxGraph
  overlays: mxCellOverlay[] = [];

  /**
   * Holds the Id. Default is null.
   */
  id: string | null = null;

  /**
   * Holds the user object. Default is null.
   */
  value: any = null;

  /**
   * Holds the <mxGeometry>. Default is null.
   */
  geometry: mxGeometry | null = null;

  /**
   * Holds the style as a string of the form [(stylename|key=value);]. Default is
   * null.
   */
  style: string | null = null;

  /**
   * Specifies whether the cell is a vertex. Default is false.
   */
  vertex: boolean = false;

  /**
   * Specifies whether the cell is an edge. Default is false.
   */
  edge: boolean = false;

  /**
   * Specifies whether the cell is connectable. Default is true.
   */
  connectable: boolean = true;

  /**
   * Specifies whether the cell is visible. Default is true.
   */
  visible: boolean = true;

  /**
   * Specifies whether the cell is collapsed. Default is false.
   */
  collapsed: boolean = false;

  /**
   * Reference to the parent cell.
   */
  parent: mxCell | null = null;

  /**
   * Reference to the source terminal.
   */
  source: mxCell | null = null;

  /**
   * Reference to the target terminal.
   */
  target: mxCell | null = null;

  /**
   * Holds the child cells.
   */
  children: mxCell[] = [];

  /**
   * Holds the edges.
   */
  edges: mxCell[] = [];

  /**
   * List of members that should not be cloned inside <clone>. This field is
   * passed to <mxUtils.clone> and is not made persistent in <mxCellCodec>.
   * This is not a convention for all classes, it is only used in this class
   * to mark transient fields since transient modifiers are not supported by
   * the language.
   */
  mxTransient: string[] = [
    'id',
    'value',
    'parent',
    'source',
    'target',
    'children',
    'edges',
  ];

  /**
   * Returns the Id of the cell as a string.
   */
  getId() {
    return this.id;
  }

  /**
   * Sets the Id of the cell to the given string.
   */
  setId(id: string) {
    this.id = id;
  }

  /**
   * Returns the user object of the cell. The user
   * object is stored in <value>.
   */
  getValue() {
    return this.value;
  }

  /**
   * Sets the user object of the cell. The user object
   * is stored in <value>.
   */
  setValue(value: any) {
    this.value = value;
  }

  /**
   * Changes the user object after an in-place edit
   * and returns the previous value. This implementation
   * replaces the user object with the given value and
   * returns the old user object.
   */
  valueChanged(newValue: any) {
    const previous = this.getValue();
    this.setValue(newValue);
    return previous;
  }

  /**
   * Returns the <mxGeometry> that describes the <geometry>.
   */
  getGeometry() {
    return this.geometry;
  }

  /**
   * Sets the <mxGeometry> to be used as the <geometry>.
   */
  setGeometry(geometry: mxGeometry | null) {
    this.geometry = geometry;
  }

  /**
   * Returns a string that describes the <style>.
   */
  getStyle() {
    return this.style;
  }

  /**
   * Sets the string to be used as the <style>.
   */
  setStyle(style: string | null) {
    this.style = style;
  }

  /**
   * Returns true if the cell is a vertex.
   */
  isVertex() {
    return this.vertex;
  }

  /**
   * Specifies if the cell is a vertex. This should only be assigned at
   * construction of the cell and not be changed during its lifecycle.
   *
   * Parameters:
   *
   * @param vertex Boolean that specifies if the cell is a vertex.
   */
  setVertex(vertex: boolean) {
    this.vertex = vertex;
  }

  /**
   * Returns true if the cell is an edge.
   */
  isEdge() {
    return this.edge;
  }

  /**
   * Specifies if the cell is an edge. This should only be assigned at
   * construction of the cell and not be changed during its lifecycle.
   *
   * Parameters:
   *
   * @param edge Boolean that specifies if the cell is an edge.
   */
  setEdge(edge: boolean) {
    this.edge = edge;
  }

  /**
   * Returns true if the cell is connectable.
   */
  isConnectable() {
    return this.connectable;
  }

  /**
   * Sets the connectable state.
   *
   * Parameters:
   *
   * @param connectable Boolean that specifies the new connectable state.
   */
  setConnectable(connectable: boolean) {
    this.connectable = connectable;
  }

  /**
   * Returns true if the cell is visibile.
   */
  isVisible() {
    return this.visible;
  }

  /**
   * Specifies if the cell is visible.
   *
   * Parameters:
   *
   * @param visible Boolean that specifies the new visible state.
   */
  setVisible(visible: boolean) {
    this.visible = visible;
  }

  /**
   * Returns true if the cell is collapsed.
   */
  isCollapsed() {
    return this.collapsed;
  }

  /**
   * Sets the collapsed state.
   *
   * Parameters:
   *
   * @param collapsed Boolean that specifies the new collapsed state.
   */
  setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed;
  }

  /**
   * Returns the cell's parent.
   */
  getParent() {
    return this.parent;
  }

  /**
   * Sets the parent cell.
   *
   * Parameters:
   *
   * @param parent<mxCell> that represents the new parent.
   */
  setParent(parent: mxCell | null) {
    this.parent = parent;
  }

  /**
   * Returns the source or target terminal.
   *
   * Parameters:
   *
   * @param source Boolean that specifies if the source terminal should be
   * returned.
   */
  getTerminal(source: boolean = false) {
    return source ? this.source : this.target;
  }

  /**
   * Sets the source or target terminal and returns the new terminal.
   *
   * @param {mxCell} terminal     mxCell that represents the new source or target terminal.
   * @param {boolean} isSource  boolean that specifies if the source or target terminal
   * should be set.
   */
  setTerminal(terminal: mxCell | null, isSource: boolean) {
    if (isSource) {
      this.source = terminal;
    } else {
      this.target = terminal;
    }

    return terminal;
  }

  /**
   * Returns the number of child cells.
   */
  getChildCount() {
    return this.children.length;
  }

  /**
   * Returns the index of the specified child in the child array.
   *
   * Parameters:
   *
   * @param childChild whose index should be returned.
   */
  getIndex(child: mxCell | null) {
    if (child === null) return -1;
    return this.children.indexOf(child);
  }

  /**
   * Returns the child at the specified index.
   *
   * Parameters:
   *
   * @param indexInteger that specifies the child to be returned.
   */
  getChildAt(index: number) {
    return this.children[index];
  }

  /**
   * Inserts the specified child into the child array at the specified index
   * and updates the parent reference of the child. If not childIndex is
   * specified then the child is appended to the child array. Returns the
   * inserted child.
   *
   * Parameters:
   *
   * @param child<mxCell> to be inserted or appended to the child array.
   * @param indexOptional integer that specifies the index at which the child
   * should be inserted into the child array.
   */
  insert(child: mxCell, index?: number) {
    if (index === undefined) {
      index = this.getChildCount();

      if (child.getParent() === this) {
        index--;
      }
    }

    child.removeFromParent();
    child.setParent(this);

    this.children.splice(index, 0, child);

    return child;
  }

  /**
   * Removes the child at the specified index from the child array and
   * returns the child that was removed. Will remove the parent reference of
   * the child.
   *
   * Parameters:
   *
   * @param indexInteger that specifies the index of the child to be
   * removed.
   */
  remove(index: number) {
    let child = null;

    if (index >= 0) {
      child = this.getChildAt(index);
      if (child) {
        this.children.splice(index, 1);
        child.setParent(null);
      }
    }

    return child;
  }

  /**
   * Removes the cell from its parent.
   */
  removeFromParent() {
    if (this.parent) {
      const index = this.parent.getIndex(this);
      this.parent.remove(index);
    }
  }

  /**
   * Returns the number of edges in the edge array.
   */
  getEdgeCount() {
    return this.edges.length;
  }

  /**
   * Returns the index of the specified edge in <edges>.
   *
   * Parameters:
   *
   * @param edge<mxCell> whose index in <edges> should be returned.
   */
  getEdgeIndex(edge: mxCell) {
    return this.edges.indexOf(edge);
  }

  /**
   * Returns the edge at the specified index in <edges>.
   *
   * Parameters:
   *
   * @param indexInteger that specifies the index of the edge to be returned.
   */
  // getEdgeAt(index: number): mxCell;
  getEdgeAt(index: number) {
    return this.edges[index];
  }

  /**
   * Inserts the specified edge into the edge array and returns the edge.
   * Will update the respective terminal reference of the edge.
   *
   * Parameters:
   *
   * @param edge              <mxCell> to be inserted into the edge array.
   * @param isOutgoing Boolean that specifies if the edge is outgoing.
   */
  insertEdge(edge: mxCell, isOutgoing: boolean = false) {
    edge.removeFromTerminal(isOutgoing);
    edge.setTerminal(this, isOutgoing);

    if (
      this.edges.length === 0 ||
      edge.getTerminal(!isOutgoing) !== this ||
      this.edges.indexOf(edge) < 0
    ) {
      this.edges.push(edge);
    }

    return edge;
  }

  /**
   * Removes the specified edge from the edge array and returns the edge.
   * Will remove the respective terminal reference from the edge.
   *
   * Parameters:
   *
   * @param edge<mxCell> to be removed from the edge array.
   * @param isOutgoing Boolean that specifies if the edge is outgoing.
   */
  removeEdge(edge: mxCell, isOutgoing: boolean = false) {
    if (edge.getTerminal(!isOutgoing) !== this && this.edges.length > 0) {
      const index = this.getEdgeIndex(edge);

      if (index >= 0) {
        this.edges.splice(index, 1);
      }
    }

    edge.setTerminal(null, isOutgoing);

    return edge;
  }

  /**
   * Removes the edge from its source or target terminal.
   *
   * Parameters:
   *
   * @param isSource Boolean that specifies if the edge should be removed from its source or target terminal.
   */
  removeFromTerminal(isSource: boolean) {
    const terminal = this.getTerminal(isSource);

    if (terminal) {
      terminal.removeEdge(this, isSource);
    }
  }

  /**
   * Returns true if the user object is an XML node that contains the given
   * attribute.
   *
   * Parameters:
   *
   * @param nameName nameName of the attribute.
   */
  hasAttribute(name: string) {
    const userObject = this.getValue();

    return (
      isNotNullish(userObject) &&
      (userObject.nodeType === NODETYPE_ELEMENT && userObject.hasAttribute
        ? userObject.hasAttribute(name)
        : isNotNullish(userObject.getAttribute(name)))
    );
  }

  /**
   * Returns the specified attribute from the user object if it is an XML
   * node.
   *
   * Parameters:
   *
   * @param nameName              of the attribute whose value should be returned.
   * @param defaultValueOptional  default value to use if the attribute has no
   * value.
   */
  getAttribute(name: string, defaultValue?: any) {
    const userObject = this.getValue();
    const val =
      isNotNullish(userObject) && userObject.nodeType === NODETYPE_ELEMENT
        ? userObject.getAttribute(name)
        : null;

    return val ? val : defaultValue;
  }

  /**
   * Sets the specified attribute on the user object if it is an XML node.
   *
   * Parameters:
   *
   * @param nameName    of the attribute whose value should be set.
   * @param valueNew    value of the attribute.
   */
  setAttribute(name: string, value: any) {
    const userObject = this.getValue();

    if (isNotNullish(userObject) && userObject.nodeType === NODETYPE_ELEMENT) {
      userObject.setAttribute(name, value);
    }
  }

  /**
   * Returns a clone of the cell. Uses <cloneValue> to clone
   * the user object. All fields in <mxTransient> are ignored
   * during the cloning.
   */
  clone(): mxCell {
    const c = clone(this, this.mxTransient);
    c.setValue(this.cloneValue());
    return c;
  }

  /**
   * Returns a clone of the cell's user object.
   */
  cloneValue() {
    let value = this.getValue();
    if (isNotNullish(value)) {
      if (typeof value.clone === 'function') {
        value = value.clone();
      } else if (isNotNullish(value.nodeType)) {
        value = value.cloneNode(true);
      }
    }
    return value;
  }

  /**
   * Returns the nearest common ancestor for the specified cells to `this`.
   *
   * @param {mxCell} cell2  that specifies the second cell in the tree.
   */
  getNearestCommonAncestor(cell2: mxCell) {
    // Creates the cell path for the second cell
    let path = mxCellPath.create(cell2);

    if (path.length > 0) {
      // Bubbles through the ancestors of the first
      // cell to find the nearest common ancestor.
      let cell: mxCell | null = this;
      let current: string | null = mxCellPath.create(cell);

      // Inverts arguments
      if (path.length < current.length) {
        cell = cell2;
        const tmp = current;
        current = path;
        path = tmp;
      }

      while (cell && current) {
        const parent: mxCell | null = cell.getParent();

        // Checks if the cell path is equal to the beginning of the given cell path
        if (path.indexOf(current + mxCellPath.PATH_SEPARATOR) === 0 && parent) {
          return cell;
        }

        current = mxCellPath.getParentPath(current);
        cell = parent;
      }
    }

    return null;
  }

  /**
   * Returns true if the given parent is an ancestor of the given child. Note
   * returns true if child == parent.
   *
   * @param {mxCell} child  that specifies the child.
   */
  isAncestor(child: mxCell | null) {
    while (child && child !== this) {
      child = child.getParent();
    }

    return child === this;
  }

  /**
   * Returns the child vertices of the given parent.
   */
  getChildVertices() {
    return this.getChildCells(true, false);
  }

  /**
   * Returns the child edges of the given parent.
   */
  getChildEdges() {
    return this.getChildCells(false, true);
  }

  /**
   * Returns the children of the given cell that are vertices and/or edges
   * depending on the arguments.
   *
   * @param vertices  Boolean indicating if child vertices should be returned.
   * Default is false.
   * @param edges  Boolean indicating if child edges should be returned.
   * Default is false.
   */
  getChildCells(vertices: boolean = false, edges: boolean = false) {
    const childCount = this.getChildCount();
    const result = [];

    for (let i = 0; i < childCount; i += 1) {
      const child = this.getChildAt(i);

      if (
        (!edges && !vertices) ||
        (edges && child.isEdge()) ||
        (vertices && child.isVertex())
      ) {
        result.push(child);
      }
    }

    return result;
  }

  /**
   * Returns the number of incoming or outgoing edges, ignoring the given
   * edge.
   *
   * @param outgoing  Boolean that specifies if the number of outgoing or
   * incoming edges should be returned.
   * @param {mxCell} ignoredEdge  that represents an edge to be ignored.
   */
  getDirectedEdgeCount(outgoing: boolean, ignoredEdge: mxCell | null = null) {
    let count = 0;
    const edgeCount = this.getEdgeCount();

    for (let i = 0; i < edgeCount; i += 1) {
      const edge = this.getEdgeAt(i);
      if (edge !== ignoredEdge && edge && edge.getTerminal(outgoing) === this) {
        count += 1;
      }
    }

    return count;
  }

  /**
   * Returns all edges of the given cell without loops.
   */
  getConnections() {
    return this.getEdges(true, true, false);
  }

  /**
   * Returns the incoming edges of the given cell without loops.
   */
  getIncomingEdges() {
    return this.getEdges(true, false, false);
  }

  /**
   * Returns the outgoing edges of the given cell without loops.
   */
  getOutgoingEdges() {
    return this.getEdges(false, true, false);
  }

  /**
   * Returns all distinct edges connected to this cell as a new array of
   * {@link mxCell}. If at least one of incoming or outgoing is true, then loops
   * are ignored, otherwise if both are false, then all edges connected to
   * the given cell are returned including loops.
   *
   * @param incoming  Optional boolean that specifies if incoming edges should be
   * returned. Default is true.
   * @param outgoing  Optional boolean that specifies if outgoing edges should be
   * returned. Default is true.
   * @param includeLoops  Optional boolean that specifies if loops should be returned.
   * Default is true.
   */
  getEdges(
    incoming: boolean = true,
    outgoing: boolean = true,
    includeLoops: boolean = true
  ) {
    const edgeCount = this.getEdgeCount();
    const result = [];

    for (let i = 0; i < edgeCount; i += 1) {
      const edge = this.getEdgeAt(i);
      const source = edge.getTerminal(true);
      const target = edge.getTerminal(false);

      if (
        (includeLoops && source === target) ||
        (source !== target &&
          ((incoming && target === this) || (outgoing && source === this)))
      ) {
        result.push(edge);
      }
    }

    return result;
  }

  /**
   * Returns the absolute, accumulated origin for the children inside the
   * given parent as an {@link mxPoint}.
   */
  getOrigin() {
    let result = new mxPoint();
    const parent = this.getParent();

    if (parent) {
      result = parent.getOrigin();

      if (!this.isEdge()) {
        const geo = this.getGeometry();

        if (geo) {
          result.x += geo.x;
          result.y += geo.y;
        }
      }
    }

    return result;
  }

  /**
   * Returns all descendants of the given cell and the cell itself in an array.
   */
  // getDescendants(parent: mxCell): Array<mxCell>;
  getDescendants() {
    return this.filterDescendants(null);
  }

  /**
   * Visits all cells recursively and applies the specified filter function
   * to each cell. If the function returns true then the cell is added
   * to the resulting array. The parent and result paramters are optional.
   * If parent is not specified then the recursion starts at {@link root}.
   *
   * Example:
   * The following example extracts all vertices from a given model:
   * ```javascript
   * var filter(cell)
   * {
   * 	return model.isVertex(cell);
   * }
   * var vertices = model.filterDescendants(filter);
   * ```
   *
   * @param filter  JavaScript function that takes an {@link mxCell} as an argument
   * and returns a boolean.
   */
  filterDescendants(filter: FilterFunction | null) {
    // Creates a new array for storing the result
    let result: mxCell[] = [];

    // Checks if the filter returns true for the cell
    // and adds it to the result array
    if (filter === null || filter(this)) {
      result.push(this);
    }

    // Visits the children of the cell
    const childCount = this.getChildCount();
    for (let i = 0; i < childCount; i += 1) {
      const child = this.getChildAt(i);
      result = result.concat(child.filterDescendants(filter));
    }

    return result;
  }

  /**
   * Returns the root of the model or the topmost parent of the given cell.
   */
  getRoot() {
    let root = null;
    let cell: mxCell | null = this;

    while (cell) {
      root = cell;
      cell = cell.getParent();
    }

    return root;
  }
}

export default mxCell;
