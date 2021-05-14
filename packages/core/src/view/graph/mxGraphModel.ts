/**
 * Copyright (c) 2006-2018, JGraph Ltd
 * Copyright (c) 2006-2018, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */
import mxEventSource from '../../util/event/mxEventSource';
import mxUndoableEdit from '../../util/undo/mxUndoableEdit';
import mxCellPath from '../cell/mxCellPath';
import mxCell from '../cell/mxCell';
import { isNotNullish, isNumeric } from '../../util/mxUtils';
import mxEventObject from '../../util/event/mxEventObject';
import mxEvent from '../../util/event/mxEvent';
import mxChildChange from '../../atomic_changes/mxChildChange';
import mxCollapseChange from '../../atomic_changes/mxCollapseChange';
import mxGeometryChange from '../../atomic_changes/mxGeometryChange';
import mxRootChange from '../../atomic_changes/mxRootChange';
import mxStyleChange from '../../atomic_changes/mxStyleChange';
import mxTerminalChange from '../../atomic_changes/mxTerminalChange';
import mxValueChange from '../../atomic_changes/mxValueChange';
import mxVisibleChange from '../../atomic_changes/mxVisibleChange';
import mxGeometry from '../../util/datatypes/mxGeometry';
import mxCells from '../cell/mxCells';

import type { CellMap, FilterFunction, UndoableChange } from '../../types';

/**
 * Extends {@link mxEventSource} to implement a graph model. The graph model acts as
 * a wrapper around the cells which are in charge of storing the actual graph
 * datastructure. The model acts as a transactional wrapper with event
 * notification for all changes, whereas the cells contain the atomic
 * operations for updating the actual datastructure.
 *
 * ### Layers
 *
 * The cell hierarchy in the model must have a top-level root cell which
 * contains the layers (typically one default layer), which in turn contain the
 * top-level cells of the layers. This means each cell is contained in a layer.
 * If no layers are required, then all new cells should be added to the default
 * layer.
 *
 * Layers are useful for hiding and showing groups of cells, or for placing
 * groups of cells on top of other cells in the display. To identify a layer,
 * the {@link isLayer} function is used. It returns true if the parent of the given
 * cell is the root of the model.
 *
 * ### Events
 *
 * See events section for more details. There is a new set of events for
 * tracking transactional changes as they happen. The events are called
 * startEdit for the initial beginUpdate, executed for each executed change
 * and endEdit for the terminal endUpdate. The executed event contains a
 * property called change which represents the change after execution.
 *
 * ### Encoding the model
 *
 * #### To encode a graph model, use the following code:
 *
 * ```javascript
 * var enc = new mxCodec();
 * var node = enc.encode(graph.getModel());
 * ```
 *
 * This will create an XML node that contains all the model information.
 *
 * #### Encoding and decoding changes:
 *
 * For the encoding of changes, a graph model listener is required that encodes
 * each change from the given array of changes.
 *
 * ```javascript
 * model.addListener(mxEvent.CHANGE, function(sender, evt)
 * {
 *   var changes = evt.getProperty('edit').changes;
 *   var nodes = [];
 *   var codec = new mxCodec();
 *
 *   for (var i = 0; i < changes.length; i++)
 *   {
 *     nodes.push(codec.encode(changes[i]));
 *   }
 *   // do something with the nodes
 * });
 * ```
 *
 * For the decoding and execution of changes, the codec needs a lookup function
 * that allows it to resolve cell IDs as follows:
 *
 * ```javascript
 * var codec = new mxCodec();
 * codec.lookup(id)
 * {
 *   return model.getCell(id);
 * }
 * ```
 *
 * For each encoded change (represented by a node), the following code can be
 * used to carry out the decoding and create a change object.
 *
 * ```javascript
 * var changes = [];
 * var change = codec.decode(node);
 * change.model = model;
 * change.execute();
 * changes.push(change);
 * ```
 *
 * The changes can then be dispatched using the model as follows.
 *
 * ```javascript
 * var edit = new mxUndoableEdit(model, false);
 * edit.changes = changes;
 *
 * edit.notify()
 * {
 *   edit.source.fireEvent(new mxEventObject(mxEvent.CHANGE,
 *   	'edit', edit, 'changes', edit.changes));
 *   edit.source.fireEvent(new mxEventObject(mxEvent.NOTIFY,
 *   	'edit', edit, 'changes', edit.changes));
 * }
 *
 * model.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', edit));
 * model.fireEvent(new mxEventObject(mxEvent.CHANGE,
 *    'edit', edit, 'changes', changes));
 * ```
 *
 * Event: mxEvent.CHANGE
 *
 * Fires when an undoable edit is dispatched. The `edit` property
 * contains the {@link mxUndoableEdit}. The `changes` property contains
 * the array of atomic changes inside the undoable edit. The changes property
 * is **deprecated**, please use edit.changes instead.
 *
 * ### Example
 *
 * For finding newly inserted cells, the following code can be used:
 *
 * ```javascript
 * graph.model.addListener(mxEvent.CHANGE, function(sender, evt)
 * {
 *   var changes = evt.getProperty('edit').changes;
 *
 *   for (var i = 0; i < changes.length; i++)
 *   {
 *     var change = changes[i];
 *
 *     if (change instanceof mxChildChange &&
 *       change.change.previous == null)
 *     {
 *       graph.startEditingAtCell(change.child);
 *       break;
 *     }
 *   }
 * });
 * ```
 *
 * Event: mxEvent.NOTIFY
 *
 * Same as <mxEvent.CHANGE>, this event can be used for classes that need to
 * implement a sync mechanism between this model and, say, a remote model. In
 * such a setup, only local changes should trigger a notify event and all
 * changes should trigger a change event.
 *
 * Event: mxEvent.EXECUTE
 *
 * Fires between begin- and endUpdate and after an atomic change was executed
 * in the model. The `change` property contains the atomic change
 * that was executed.
 *
 * Event: mxEvent.EXECUTED
 *
 * Fires between START_EDIT and END_EDIT after an atomic change was executed.
 * The `change` property contains the change that was executed.
 *
 * Event: mxEvent.BEGIN_UPDATE
 *
 * Fires after the {@link updateLevel} was incremented in {@link beginUpdate}. This event
 * contains no properties.
 *
 * Event: mxEvent.START_EDIT
 *
 * Fires after the {@link updateLevel} was changed from 0 to 1. This event
 * contains no properties.
 *
 * Event: mxEvent.END_UPDATE
 *
 * Fires after the {@link updateLevel} was decreased in {@link endUpdate} but before any
 * notification or change dispatching. The `edit` property contains
 * the {@link currentEdit}.
 *
 * Event: mxEvent.END_EDIT
 *
 * Fires after the {@link updateLevel} was changed from 1 to 0. This event
 * contains no properties.
 *
 * Event: mxEvent.BEFORE_UNDO
 *
 * Fires before the change is dispatched after the update level has reached 0
 * in {@link endUpdate}. The `edit` property contains the {@link curreneEdit}.
 *
 * Event: mxEvent.UNDO
 *
 * Fires after the change was dispatched in {@link endUpdate}. The `edit`
 * property contains the {@link currentEdit}.
 *
 * @class mxGraphModel
 */
class mxGraphModel extends mxEventSource {
  constructor(root: mxCell | null = null) {
    super();
    this.currentEdit = this.createUndoableEdit();

    if (root) {
      this.setRoot(root);
    } else {
      this.clear();
    }
  }

  /**
   * Holds the root cell, which in turn contains the cells that represent the
   * layers of the diagram as child cells. That is, the actual elements of the
   * diagram are supposed to live in the third generation of cells and below.
   */
  root: mxCell | null = null;

  /**
   * Maps from Ids to cells.
   */
  cells: CellMap = {};

  /**
   * Specifies if edges should automatically be moved into the nearest common
   * ancestor of their terminals. Default is true.
   */
  maintainEdgeParent = true;

  /**
   * Specifies if relative edge parents should be ignored for finding the nearest
   * common ancestors of an edge's terminals. Default is true.
   */
  ignoreRelativeEdgeParent = true;

  /**
   * Specifies if the model should automatically create Ids for new cells.
   * Default is true.
   */
  createIds = true;

  /**
   * Defines the prefix of new Ids. Default is an empty string.
   */
  prefix = '';

  /**
   * Defines the postfix of new Ids. Default is an empty string.
   */
  postfix = '';

  /**
   * Specifies the next Id to be created. Initial value is 0.
   */
  nextId = 0;

  /**
   * Holds the changes for the current transaction. If the transaction is
   * closed then a new object is created for this variable using
   * {@link createUndoableEdit}.
   */
  // currentEdit: any;
  currentEdit: any = null;

  /**
   * Counter for the depth of nested transactions. Each call to {@link beginUpdate}
   * will increment this number and each call to {@link endUpdate} will decrement
   * it. When the counter reaches 0, the transaction is closed and the
   * respective events are fired. Initial value is 0.
   */
  updateLevel = 0;

  /**
   * True if the program flow is currently inside endUpdate.
   */
  endingUpdate = false;

  /**
   * Sets a new root using {@link createRoot}.
   */
  clear() {
    this.setRoot(this.createRoot());
  }

  /**
   * Returns {@link createIds}.
   */
  isCreateIds() {
    return this.createIds;
  }

  /**
   * Sets {@link createIds}.
   */
  setCreateIds(value: boolean) {
    this.createIds = value;
  }

  /**
   * Creates a new root cell with a default layer (child 0).
   */
  createRoot() {
    const cell = new mxCell();
    cell.insert(new mxCell());
    return cell;
  }

  /**
   * Returns the {@link mxCell} for the specified Id or null if no cell can be
   * found for the given Id.
   *
   * @param {string} id  A string representing the Id of the cell.
   */
  getCell(id: string) {
    return this.cells[id] ?? null;
  }

  filterCells(cells: mxCell[], filter: FilterFunction) {
    return new mxCells(...cells).filterCells(filter);
  }

  getDescendants(parent: mxCell) {
    // SLATED FOR DELETION
    return parent.getDescendants();
  }

  filterDescendants(filter: FilterFunction | null, parent: mxCell) {
    // SLATED FOR DELETION
    return parent.filterDescendants(filter);
  }

  getRoot(cell: mxCell | null) {
    // SLATED FOR DELETION
    return cell ? cell.getRoot() : this.root;
  }

  /**
   * Sets the {@link root} of the model using {@link mxRootChange} and adds the change to
   * the current transaction. This resets all datastructures in the model and
   * is the preferred way of clearing an existing model. Returns the new
   * root.
   *
   * Example:
   *
   * ```javascript
   * var root = new mxCell();
   * root.insert(new mxCell());
   * model.setRoot(root);
   * ```
   *
   * @param {mxCell} root  that specifies the new root.
   */
  setRoot(root: mxCell | null) {
    this.execute(new mxRootChange(this, root));
    return root;
  }

  /**
   * Inner callback to change the root of the model and update the internal
   * datastructures, such as {@link cells} and {@link nextId}. Returns the previous root.
   *
   * @param {mxCell} root  that specifies the new root.
   */
  rootChanged(root: mxCell | null) {
    const oldRoot = this.root;
    this.root = root;

    // Resets counters and datastructures
    this.nextId = 0;
    this.cells = {};

    if (root) this.cellAdded(root);

    return oldRoot;
  }

  /**
   * Returns true if the given cell is the root of the model and a non-null
   * value.
   *
   * @param {mxCell} cell  that represents the possible root.
   */
  isRoot(cell: mxCell | null = null) {
    return isNotNullish(cell) && this.root === cell;
  }

  /**
   * Returns true if {@link isRoot} returns true for the parent of the given cell.
   *
   * @param {mxCell} cell  that represents the possible layer.
   */
  isLayer(cell: mxCell) {
    return this.isRoot(cell.getParent());
  }

  isAncestor(parent: mxCell | null, child: mxCell | null) {
    // SLATED FOR DELETION
    return parent?.isAncestor(child) || false;
  }

  /**
   * Returns true if the model contains the given {@link mxCell}.
   *
   * @param {mxCell} cell  that specifies the cell.
   */
  contains(cell: mxCell | null) {
    return this.isAncestor(this.root, cell);
  }

  /**
   * Returns the parent of the given cell.
   *
   * @param {mxCell} cell  whose parent should be returned.
   */
  getParent(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getParent();
  }

  /**
   * Adds the specified child to the parent at the given index using
   * {@link mxChildChange} and adds the change to the current transaction. If no
   * index is specified then the child is appended to the parent's array of
   * children. Returns the inserted child.
   *
   * @param {mxCell} parent  that specifies the parent to contain the child.
   * @param {mxCell} child  that specifies the child to be inserted.
   * @param index  Optional integer that specifies the index of the child.
   */
  add(parent: mxCell, child: mxCell, index: number | null = null) {
    if (child !== parent) {
      // Appends the child if no index was specified
      if (index === null) {
        index = parent.getChildCount();
      }

      const parentChanged = parent !== child.getParent();
      this.execute(new mxChildChange(this, parent, child, index));

      // Maintains the edges parents by moving the edges
      // into the nearest common ancestor of its terminals
      if (this.maintainEdgeParent && parentChanged) {
        this.updateEdgeParents(child);
      }
    }
    return child;
  }

  /**
   * Inner callback to update {@link cells} when a cell has been added. This
   * implementation resolves collisions by creating new Ids. To change the
   * ID of a cell after it was inserted into the model, use the following
   * code:
   *
   * (code
   * delete model.cells[cell.getId()];
   * cell.setId(newId);
   * model.cells[cell.getId()] = cell;
   * ```
   *
   * If the change of the ID should be part of the command history, then the
   * cell should be removed from the model and a clone with the new ID should
   * be reinserted into the model instead.
   *
   * @param {mxCell} cell  that specifies the cell that has been added.
   */
  cellAdded(cell: mxCell) {
    let id = cell.getId();

    // Creates an Id for the cell if not Id exists
    if (id === null && this.createIds) {
      cell.setId(this.createId(cell));
    }

    if (id !== null) {
      let collision = this.getCell(id);

      if (collision !== cell) {
        // Creates new Id for the cell
        // as long as there is a collision
        while (collision) {
          id = this.createId(cell);
          cell.setId(id);
          collision = this.getCell(id);
        }

        this.cells[id] = cell;
      }
    }

    // Makes sure IDs of deleted cells are not reused
    if (id && isNumeric(id)) {
      this.nextId = Math.max(this.nextId, parseInt(id));
    }

    // Recursively processes child cells
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      this.cellAdded(cell.getChildAt(i));
    }
  }

  /**
   * Hook method to create an Id for the specified cell. This implementation
   * concatenates {@link prefix}, id and {@link postfix} to create the Id and increments
   * {@link nextId}. The cell is ignored by this implementation, but can be used in
   * overridden methods to prefix the Ids with eg. the cell type.
   *
   * @param {mxCell} cell  to create the Id for.
   */
  createId(cell: mxCell) {
    const id = this.nextId;
    this.nextId++;
    return this.prefix + id + this.postfix;
  }

  /**
   * Updates the parent for all edges that are connected to cell or one of
   * its descendants using {@link updateEdgeParent}.
   */
  updateEdgeParents(cell: mxCell, root?: mxCell) {
    if (!root) {
      const r = this.getRoot(cell);
      if (!r) return;

      root = r;
    }

    // Updates edges on children first
    const childCount = cell.getChildCount();

    for (let i = 0; i < childCount; i += 1) {
      const child = cell.getChildAt(i);
      this.updateEdgeParents(child, root);
    }

    // Updates the parents of all connected edges
    const edgeCount = cell.getEdgeCount();
    const edges = [];

    for (let i = 0; i < edgeCount; i += 1) {
      edges.push(cell.getEdgeAt(i));
    }

    for (let i = 0; i < edges.length; i += 1) {
      const edge = edges[i];

      // Updates edge parent if edge and child have
      // a common root node (does not need to be the
      // model root node)
      if (this.isAncestor(root, edge)) {
        this.updateEdgeParent(edge, root);
      }
    }
  }

  /**
   * Inner callback to update the parent of the specified {@link mxCell} to the
   * nearest-common-ancestor of its two terminals.
   *
   * @param {mxCell} edge  that specifies the edge.
   * @param {mxCell} root  that represents the current root of the model.
   */
  updateEdgeParent(edge: mxCell, root: mxCell) {
    let source = edge.getTerminal(true);
    let target = edge.getTerminal(false);
    let cell = null;

    // Uses the first non-relative descendants of the source terminal
    while (
      source &&
      !source.isEdge() &&
      source.geometry &&
      source.geometry.relative
    ) {
      source = source.getParent();
    }

    // Uses the first non-relative descendants of the target terminal
    while (
      target &&
      this.ignoreRelativeEdgeParent &&
      !target.isEdge() &&
      target.geometry &&
      target.geometry.relative
    ) {
      target = target.getParent();
    }

    if (this.isAncestor(root, source) && this.isAncestor(root, target)) {
      if (source === target) {
        cell = source ? source.getParent() : null;
      } else if (source && target) {
        cell = source.getNearestCommonAncestor(target);
      }

      if (
        cell &&
        (cell.getParent() !== this.root || this.isAncestor(cell, edge)) &&
        edge &&
        edge.getParent() !== cell
      ) {
        let geo = edge.getGeometry();

        if (geo) {
          const origin1 = this.getOrigin(<mxCell>edge.getParent());
          const origin2 = this.getOrigin(cell);

          const dx = origin2.x - origin1.x;
          const dy = origin2.y - origin1.y;

          geo = geo.clone();
          geo.translate(-dx, -dy);
          this.setGeometry(edge, geo);
        }

        this.add(cell, edge, cell.getChildCount());
      }
    }
  }

  getOrigin(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getOrigin();
  }

  getNearestCommonAncestor(cell1: mxCell, cell2: mxCell) {
    // SLATED FOR DELETION
    return cell1.getNearestCommonAncestor(cell2);
  }

  /**
   * Removes the specified cell from the model using {@link mxChildChange} and adds
   * the change to the current transaction. This operation will remove the
   * cell and all of its children from the model. Returns the removed cell.
   *
   * @param {mxCell} cell  that should be removed.
   */
  remove(cell: mxCell) {
    if (cell === this.root) {
      this.setRoot(null);
    } else if (cell.getParent()) {
      this.execute(new mxChildChange(this, null, cell));
    }

    return cell;
  }

  /**
   * Inner callback to update {@link cells} when a cell has been removed.
   *
   * @param {mxCell} cell  that specifies the cell that has been removed.
   */
  cellRemoved(cell: mxCell) {
    if (cell) {
      // Recursively processes child cells
      const childCount = cell.getChildCount();

      for (let i = childCount - 1; i >= 0; i--) {
        this.cellRemoved(cell.getChildAt(i));
      }

      const id = cell.getId();

      // Removes the dictionary entry for the cell
      if (id) delete this.cells[id];
    }
  }

  /**
   * Inner callback to update the parent of a cell using <mxCell.insert>
   * on the parent and return the previous parent.
   *
   * @param {mxCell} cell  to update the parent for.
   * @param {mxCell} parent  that specifies the new parent of the cell.
   * @param index  Optional integer that defines the index of the child
   * in the parent's child array.
   */
  parentForCellChanged(cell: mxCell, parent: mxCell | null, index?: number) {
    const previous = cell.getParent();

    if (parent) {
      if (parent !== previous || previous.getIndex(cell) !== index) {
        parent.insert(cell, index);
      }
    } else if (previous) {
      const oldIndex = previous.getIndex(cell);
      previous.remove(oldIndex);
    }

    // Adds or removes the cell from the model
    const par = parent ? this.contains(parent) : null;
    const pre = this.contains(previous);

    if (par && !pre) {
      this.cellAdded(cell);
    } else if (pre && !par) {
      this.cellRemoved(cell);
    }

    return previous;
  }

  /**
   * Returns the number of children in the given cell.
   *
   * @param {mxCell} cell  whose number of children should be returned.
   */
  getChildCount(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getChildCount();
  }

  /**
   * Returns the child of the given {@link mxCell} at the given index.
   *
   * @param {mxCell} cell  that represents the parent.
   * @param index  Integer that specifies the index of the child to be returned.
   */
  getChildAt(cell: mxCell, index: number) {
    // SLATED FOR DELETION
    return cell.getChildAt(index);
  }

  /**
   * Returns all children of the given {@link mxCell} as an array of {@link mxCell}. The
   * return value should be only be read.
   *
   * @param {mxCell} cell  the represents the parent.
   */
  getChildren(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.children;
  }

  getChildVertices(parent: mxCell) {
    // SLATED FOR DELETION
    return parent.getChildVertices();
  }

  getChildEdges(parent: mxCell) {
    // SLATED FOR DELETION
    return parent.getChildEdges();
  }

  getChildCells(parent: mxCell, vertices = false, edges = false) {
    // SLATED FOR DELETION
    return parent.getChildCells(vertices, edges);
  }

  /**
   * Returns the source or target {@link mxCell} of the given edge depending on the
   * value of the boolean parameter.
   *
   * @param {mxCell} edge  that specifies the edge.
   * @param isSource  Boolean indicating which end of the edge should be returned.
   */
  getTerminal(edge: mxCell, isSource = false) {
    // SLATED FOR DELETION
    return edge.getTerminal(isSource);
  }

  /**
   * Sets the source or target terminal of the given {@link mxCell} using
   * {@link mxTerminalChange} and adds the change to the current transaction.
   * This implementation updates the parent of the edge using {@link updateEdgeParent}
   * if required.
   *
   * @param {mxCell} edge  that specifies the edge.
   * @param {mxCell} terminal  that specifies the new terminal.
   * @param isSource  Boolean indicating if the terminal is the new source or
   * target terminal of the edge.
   */
  setTerminal(
    edge: mxCell,
    terminal: mxCell | null,
    isSource: boolean
  ): mxCell | null {
    const terminalChanged = terminal !== edge.getTerminal(isSource);
    this.execute(new mxTerminalChange(this, edge, terminal, isSource));

    const root = this.getRoot(null);

    if (this.maintainEdgeParent && terminalChanged && root) {
      this.updateEdgeParent(edge, root);
    }
    return terminal;
  }

  /**
   * Sets the source and target {@link mxCell} of the given {@link mxCell} in a single
   * transaction using {@link setTerminal} for each end of the edge.
   *
   * @param {mxCell} edge  that specifies the edge.
   * @param {mxCell} source  that specifies the new source terminal.
   * @param {mxCell} target  that specifies the new target terminal.
   */
  setTerminals(edge: mxCell, source: mxCell | null, target: mxCell | null) {
    this.beginUpdate();
    try {
      this.setTerminal(edge, source, true);
      this.setTerminal(edge, target, false);
    } finally {
      this.endUpdate();
    }
  }

  /**
   * Inner helper function to update the terminal of the edge using
   * <mxCell.insertEdge> and return the previous terminal.
   *
   * @param {mxCell} edge  that specifies the edge to be updated.
   * @param {mxCell} terminal  that specifies the new terminal.
   * @param isSource  Boolean indicating if the terminal is the new source or
   * target terminal of the edge.
   */
  terminalForCellChanged(
    edge: mxCell,
    terminal: mxCell | null,
    isSource = false
  ) {
    const previous = edge.getTerminal(isSource);

    if (terminal) {
      terminal.insertEdge(edge, isSource);
    } else if (previous) {
      previous.removeEdge(edge, isSource);
    }

    return previous;
  }

  /**
   * Returns the number of distinct edges connected to the given cell.
   *
   * @param {mxCell} cell  that represents the vertex.
   */
  getEdgeCount(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getEdgeCount();
  }

  /**
   * Returns the edge of cell at the given index.
   *
   * @param {mxCell} cell  that specifies the vertex.
   * @param index  Integer that specifies the index of the edge
   * to return.
   */
  // getEdgeAt(cell: mxCell, index: number): mxCell;
  getEdgeAt(cell: mxCell, index: number) {
    // SLATED FOR DELETION
    return cell.getEdgeAt(index);
  }

  getDirectedEdgeCount(
    cell: mxCell,
    outgoing: boolean,
    ignoredEdge: mxCell | null = null
  ) {
    // SLATED FOR DELETION
    return cell.getDirectedEdgeCount(outgoing, ignoredEdge);
  }

  getConnections(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getConnections();
  }

  getIncomingEdges(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getIncomingEdges();
  }

  getOutgoingEdges(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getOutgoingEdges();
  }

  getEdges(
    cell: mxCell,
    incoming = true,
    outgoing = true,
    includeLoops = true
  ) {
    // SLATED FOR DELETION
    return cell.getEdges(incoming, outgoing, includeLoops);
  }

  /**
   * Returns all edges between the given source and target pair. If directed
   * is true, then only edges from the source to the target are returned,
   * otherwise, all edges between the two cells are returned.
   *
   * @param {mxCell} source  that defines the source terminal of the edge to be
   * returned.
   * @param {mxCell} target  that defines the target terminal of the edge to be
   * returned.
   * @param directed  Optional boolean that specifies if the direction of the
   * edge should be taken into account. Default is false.
   */
  getEdgesBetween(source: mxCell, target: mxCell, directed = false) {
    const tmp1 = source.getEdgeCount();
    const tmp2 = target.getEdgeCount();

    // Assumes the source has less connected edges
    let terminal = source;
    let edgeCount = tmp1;

    // Uses the smaller array of connected edges
    // for searching the edge
    if (tmp2 < tmp1) {
      edgeCount = tmp2;
      terminal = target;
    }

    const result = [];

    // Checks if the edge is connected to the correct
    // cell and returns the first match
    for (let i = 0; i < edgeCount; i += 1) {
      const edge = terminal.getEdgeAt(i);
      const src = edge.getTerminal(true);
      const trg = edge.getTerminal(false);
      const directedMatch = src === source && trg === target;
      const oppositeMatch = trg === source && src === target;

      if (directedMatch || (!directed && oppositeMatch)) {
        result.push(edge);
      }
    }

    return result;
  }

  getOpposites(
    edges: mxCell[],
    terminal: mxCell,
    sources = true,
    targets = true
  ) {
    // SLATED FOR DELETION
    return new mxCells(...edges).getOpposites(terminal, sources, targets);
  }

  getTopmostCells(cells: mxCell[]) {
    // SLATED FOR DELETION
    return new mxCells(...cells).getTopmostCells();
  }

  /**
   * Returns true if the given cell is a vertex.
   *
   * @param {mxCell} cell  that represents the possible vertex.
   */
  isVertex(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.isVertex();
  }

  /**
   * Returns true if the given cell is an edge.
   *
   * @param {mxCell} cell  that represents the possible edge.
   */
  isEdge(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.isEdge();
  }

  /**
   * Returns true if the given {@link mxCell} is connectable. If {@link edgesConnectable}
   * is false, then this function returns false for all edges else it returns
   * the return value of <mxCell.isConnectable>.
   *
   * @param {mxCell} cell  whose connectable state should be returned.
   */
  isConnectable(cell: mxCell) {
    // SLATED FOR DELECTION
    return cell.isConnectable();
  }

  /**
   * Returns the user object of the given {@link mxCell} using <mxCell.getValue>.
   *
   * @param {mxCell} cell  whose user object should be returned.
   */
  getValue(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getValue();
  }

  /**
   * Sets the user object of then given {@link mxCell} using {@link mxValueChange}
   * and adds the change to the current transaction.
   *
   * @param {mxCell} cell  whose user object should be changed.
   * @param value  Object that defines the new user object.
   */
  // setValue(cell: mxCell, value: any): any;
  setValue(cell: mxCell, value: any) {
    this.execute(new mxValueChange(this, cell, value));
    return value;
  }

  /**
   * Inner callback to update the user object of the given {@link mxCell}
   * using <mxCell.valueChanged> and return the previous value,
   * that is, the return value of <mxCell.valueChanged>.
   *
   * To change a specific attribute in an XML node, the following code can be
   * used.
   *
   * ```javascript
   * graph.getModel().valueForCellChanged(cell, value)
   * {
   *   var previous = cell.value.getAttribute('label');
   *   cell.value.setAttribute('label', value);
   *
   *   return previous;
   * };
   * ```
   */
  valueForCellChanged(cell: mxCell, value: any) {
    return cell.valueChanged(value);
  }

  /**
   * Returns the {@link mxGeometry} of the given {@link mxCell}.
   *
   * @param {mxCell} cell  whose geometry should be returned.
   */
  getGeometry(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.getGeometry();
  }

  /**
   * Sets the {@link mxGeometry} of the given {@link mxCell}. The actual update
   * of the cell is carried out in {@link geometryForCellChanged}. The
   * {@link mxGeometryChange} action is used to encapsulate the change.
   *
   * @param {mxCell} cell  whose geometry should be changed.
   * @param {mxGeometry} geometry  that defines the new geometry.
   */
  setGeometry(cell: mxCell, geometry: mxGeometry) {
    if (geometry !== cell.getGeometry()) {
      this.execute(new mxGeometryChange(this, cell, geometry));
    }

    return geometry;
  }

  /**
   * Inner callback to update the {@link mxGeometry} of the given {@link mxCell} using
   * <mxCell.setGeometry> and return the previous {@link mxGeometry}.
   */
  geometryForCellChanged(cell: mxCell, geometry: mxGeometry | null) {
    const previous = cell.getGeometry();
    cell.setGeometry(geometry);
    return previous;
  }

  /**
   * Returns the style of the given {@link mxCell}.
   *
   * @param {mxCell} cell  whose style should be returned.
   */
  getStyle(cell: mxCell | null) {
    // SLATED FOR DELETION
    return cell ? cell.getStyle() : null;
  }

  /**
   * Sets the style of the given {@link mxCell} using {@link mxStyleChange} and
   * adds the change to the current transaction.
   *
   * @param {mxCell} cell  whose style should be changed.
   * @param style  String of the form [stylename;|key=value;] to specify
   * the new cell style.
   */
  setStyle(cell: mxCell, style: string | null) {
    if (style !== cell.getStyle()) {
      this.execute(new mxStyleChange(this, cell, style));
    }

    return style;
  }

  /**
   * Inner callback to update the style of the given {@link mxCell}
   * using <mxCell.setStyle> and return the previous style.
   *
   * @param {mxCell} cell  that specifies the cell to be updated.
   * @param style  String of the form [stylename;|key=value;] to specify
   * the new cell style.
   */
  styleForCellChanged(cell: mxCell, style: string | null) {
    const previous = cell.getStyle();
    cell.setStyle(style);
    return previous;
  }

  /**
   * Returns true if the given {@link mxCell} is collapsed.
   *
   * @param {mxCell} cell  whose collapsed state should be returned.
   */
  isCollapsed(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.isCollapsed();
  }

  /**
   * Sets the collapsed state of the given {@link mxCell} using {@link mxCollapseChange}
   * and adds the change to the current transaction.
   *
   * @param {mxCell} cell  whose collapsed state should be changed.
   * @param collapsed  Boolean that specifies the new collpased state.
   */
  setCollapsed(cell: mxCell, collapsed: boolean) {
    if (collapsed !== cell.isCollapsed()) {
      this.execute(new mxCollapseChange(this, cell, collapsed));
    }

    return collapsed;
  }

  /**
   * Inner callback to update the collapsed state of the
   * given {@link mxCell} using <mxCell.setCollapsed> and return
   * the previous collapsed state.
   *
   * @param {mxCell} cell  that specifies the cell to be updated.
   * @param collapsed  Boolean that specifies the new collpased state.
   */
  collapsedStateForCellChanged(cell: mxCell, collapsed: boolean) {
    const previous = cell.isCollapsed();
    cell.setCollapsed(collapsed);
    return previous;
  }

  /**
   * Returns true if the given {@link mxCell} is visible.
   *
   * @param {mxCell} cell  whose visible state should be returned.
   */
  isVisible(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.isVisible();
  }

  /**
   * Sets the visible state of the given {@link mxCell} using {@link mxVisibleChange} and
   * adds the change to the current transaction.
   *
   * @param {mxCell} cell  whose visible state should be changed.
   * @param visible  Boolean that specifies the new visible state.
   */
  setVisible(cell: mxCell, visible: boolean) {
    if (visible !== cell.isVisible()) {
      this.execute(new mxVisibleChange(this, cell, visible));
    }
    return visible;
  }

  /**
   * Inner callback to update the visible state of the
   * given {@link mxCell} using <mxCell.setCollapsed> and return
   * the previous visible state.
   *
   * @param {mxCell} cell  that specifies the cell to be updated.
   * @param visible  Boolean that specifies the new visible state.
   */
  visibleStateForCellChanged(cell: mxCell, visible: boolean) {
    const previous = cell.isVisible();
    cell.setVisible(visible);
    return previous;
  }

  /**
   * Executes the given edit and fires events if required. The edit object
   * requires an execute function which is invoked. The edit is added to the
   * {@link currentEdit} between {@link beginUpdate} and {@link endUpdate} calls, so that
   * events will be fired if this execute is an individual transaction, that
   * is, if no previous {@link beginUpdate} calls have been made without calling
   * {@link endUpdate}. This implementation fires an {@link execute} event before
   * executing the given change.
   *
   * @param change  Object that described the change.
   */
  execute(change: UndoableChange) {
    change.execute();
    this.beginUpdate();
    this.currentEdit.add(change);
    this.fireEvent(new mxEventObject(mxEvent.EXECUTE, 'change', change));
    // New global executed event
    this.fireEvent(new mxEventObject(mxEvent.EXECUTED, 'change', change));
    this.endUpdate();
  }

  /**
   * Increments the {@link updateLevel} by one. The event notification
   * is queued until {@link updateLevel} reaches 0 by use of
   * {@link endUpdate}.
   *
   * All changes on {@link mxGraphModel} are transactional,
   * that is, they are executed in a single undoable change
   * on the model (without transaction isolation).
   * Therefore, if you want to combine any
   * number of changes into a single undoable change,
   * you should group any two or more API calls that
   * modify the graph model between {@link beginUpdate}
   * and {@link endUpdate} calls as shown here:
   *
   * ```javascript
   * var model = graph.getModel();
   * var parent = graph.getDefaultParent();
   * var index = model.getChildCount(parent);
   * model.beginUpdate();
   * try
   * {
   *   model.add(parent, v1, index);
   *   model.add(parent, v2, index+1);
   * }
   * finally
   * {
   *   model.endUpdate();
   * }
   * ```
   *
   * Of course there is a shortcut for appending a
   * sequence of cells into the default parent:
   *
   * ```javascript
   * graph.addCells([v1, v2]).
   * ```
   */
  beginUpdate() {
    this.updateLevel += 1;
    this.fireEvent(new mxEventObject(mxEvent.BEGIN_UPDATE));

    if (this.updateLevel === 1) {
      this.fireEvent(new mxEventObject(mxEvent.START_EDIT));
    }
  }

  /**
   * Decrements the {@link updateLevel} by one and fires an {@link undo}
   * event if the {@link updateLevel} reaches 0. This function
   * indirectly fires a {@link change} event by invoking the notify
   * function on the {@link currentEdit} und then creates a new
   * {@link currentEdit} using {@link createUndoableEdit}.
   *
   * The {@link undo} event is fired only once per edit, whereas
   * the {@link change} event is fired whenever the notify
   * function is invoked, that is, on undo and redo of
   * the edit.
   */
  endUpdate() {
    this.updateLevel -= 1;

    if (this.updateLevel === 0) {
      this.fireEvent(new mxEventObject(mxEvent.END_EDIT));
    }

    if (!this.endingUpdate) {
      this.endingUpdate = this.updateLevel === 0;
      this.fireEvent(
        new mxEventObject(mxEvent.END_UPDATE, 'edit', this.currentEdit)
      );

      try {
        if (this.endingUpdate && !this.currentEdit.isEmpty()) {
          this.fireEvent(
            new mxEventObject(mxEvent.BEFORE_UNDO, 'edit', this.currentEdit)
          );
          const tmp = this.currentEdit;
          this.currentEdit = this.createUndoableEdit();
          tmp.notify();
          this.fireEvent(new mxEventObject(mxEvent.UNDO, 'edit', tmp));
        }
      } finally {
        this.endingUpdate = false;
      }
    }
  }

  /**
   * Creates a new {@link mxUndoableEdit} that implements the
   * notify function to fire a {@link change} and {@link notify} event
   * through the {@link mxUndoableEdit}'s source.
   *
   * @param significant  Optional boolean that specifies if the edit to be created is
   * significant. Default is true.
   */
  createUndoableEdit(significant = true) {
    const edit = new mxUndoableEdit(this, significant);

    edit.notify = () => {
      // LATER: Remove changes property (deprecated)
      edit.source.fireEvent(
        new mxEventObject(mxEvent.CHANGE, 'edit', edit, 'changes', edit.changes)
      );
      edit.source.fireEvent(
        new mxEventObject(mxEvent.NOTIFY, 'edit', edit, 'changes', edit.changes)
      );
    };

    return edit;
  }

  /**
   * Merges the children of the given cell into the given target cell inside
   * this model. All cells are cloned unless there is a corresponding cell in
   * the model with the same id, in which case the source cell is ignored and
   * all edges are connected to the corresponding cell in this model. Edges
   * are considered to have no identity and are always cloned unless the
   * cloneAllEdges flag is set to false, in which case edges with the same
   * id in the target model are reconnected to reflect the terminals of the
   * source edges.
   */
  mergeChildren(from: mxCell, to: mxCell, cloneAllEdges = true) {
    this.beginUpdate();
    try {
      const mapping: { [k: string]: mxCell } = {};
      this.mergeChildrenImpl(from, to, cloneAllEdges, mapping);

      // Post-processes all edges in the mapping and
      // reconnects the terminals to the corresponding
      // cells in the target model
      for (const key in mapping) {
        const cell = mapping[key];
        let terminal = cell.getTerminal(true);

        if (terminal) {
          terminal = mapping[mxCellPath.create(terminal)];
          this.setTerminal(cell, terminal, true);
        }

        terminal = cell.getTerminal(false);

        if (terminal) {
          terminal = mapping[mxCellPath.create(terminal)];
          this.setTerminal(cell, terminal, false);
        }
      }
    } finally {
      this.endUpdate();
    }
  }

  /**
   * Clones the children of the source cell into the given target cell in
   * this model and adds an entry to the mapping that maps from the source
   * cell to the target cell with the same id or the clone of the source cell
   * that was inserted into this model.
   */
  // mergeChildrenImpl(from: mxGraphModel, to: mxGraphModel, cloneAllEdges: boolean, mapping: any): void;
  mergeChildrenImpl(
    from: mxCell,
    to: mxCell,
    cloneAllEdges: boolean,
    mapping: { [k: string]: mxCell } = {}
  ) {
    this.beginUpdate();
    try {
      const childCount = from.getChildCount();

      for (let i = 0; i < childCount; i += 1) {
        const cell = from.getChildAt(i);

        if (typeof cell.getId === 'function') {
          const id = cell.getId();

          let target =
            id !== null && (!cell.isEdge() || !cloneAllEdges)
              ? this.getCell(id)
              : null;

          // Clones and adds the child if no cell exists for the id
          if (!target && id) {
            const clone = cell.clone();
            clone.setId(id);

            // Sets the terminals from the original cell to the clone
            // because the lookup uses strings not cells in JS
            clone.setTerminal(cell.getTerminal(true), true);
            clone.setTerminal(cell.getTerminal(false), false);

            // Do *NOT* use model.add as this will move the edge away
            // from the parent in updateEdgeParent if maintainEdgeParent
            // is enabled in the target model
            target = to.insert(clone);
            this.cellAdded(target);
          }

          if (target) {
            // Stores the mapping for later reconnecting edges
            mapping[mxCellPath.create(cell)] = target;

            // Recurses
            this.mergeChildrenImpl(cell, target, cloneAllEdges, mapping);
          }
        }
      }
    } finally {
      this.endUpdate();
    }
  }

  getParents(cells: mxCell[]) {
    // SLATED FOR DELETION
    return new mxCells(...cells).getParents();
  }

  //
  // Cell Cloning
  //

  /**
   * Returns a deep clone of the given {@link mxCell}` (including
   * the children) which is created using {@link cloneCells}`.
   *
   * @param {mxCell} cell  to be cloned.
   */
  cloneCell(cell: mxCell | null, includeChildren: boolean) {
    if (cell) {
      return this.cloneCells([cell], includeChildren)[0];
    }
    return null;
  }

  cloneCells(cells: mxCell[], includeChildren = true, mapping: CellMap = {}) {
    // SLATED FOR DELETION
    return new mxCells(...cells).cloneCells(includeChildren, mapping);
  }

  /**
   * Hook for cloning the cell. This returns cell.clone() or
   * any possible exceptions.
   */
  cellCloned(cell: mxCell) {
    // SLATED FOR DELETION
    return cell.clone();
  }
}

export default mxGraphModel;
