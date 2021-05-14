/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxEvent from '../event/mxEvent';
import mxEventObject from '../event/mxEventObject';
import mxEventSource from '../event/mxEventSource';

import type { UndoableChange } from '../../types';

/**
 * Class: mxUndoableEdit
 *
 * Implements a composite undoable edit. Here is an example for a custom change
 * which gets executed via the model:
 *
 * (code)
 * function CustomChange(model, name)
 * {
 *   this.model = model;
 *   this.name = name;
 *   this.previous = name;
 * };
 *
 * execute = ()=>
 * {
 *   let tmp = this.model.name;
 *   this.model.name = this.previous;
 *   this.previous = tmp;
 * };
 *
 * let name = prompt('Enter name');
 * graph.model.execute(new CustomChange(graph.model, name));
 * (end)
 *
 * Event: mxEvent.EXECUTED
 *
 * Fires between START_EDIT and END_EDIT after an atomic change was executed.
 * The <code>change</code> property contains the change that was executed.
 *
 * Event: mxEvent.START_EDIT
 *
 * Fires before a set of changes will be executed in <undo> or <redo>.
 * This event contains no properties.
 *
 * Event: mxEvent.END_EDIT
 *
 * Fires after a set of changeswas executed in <undo> or <redo>.
 * This event contains no properties.
 *
 * Constructor: mxUndoableEdit
 *
 * Constructs a new undoable edit for the given source.
 */
class mxUndoableEdit {
  constructor(source: mxEventSource, significant: boolean = true) {
    this.source = source;
    this.changes = [];
    this.significant = significant;
  }

  /**
   * Variable: source
   *
   * Specifies the source of the edit.
   */
  // source: any;
  source: mxEventSource;

  /**
   * Variable: changes
   *
   * Array that contains the changes that make up this edit. The changes are
   * expected to either have an undo and redo function, or an execute
   * function. Default is an empty array.
   */
  changes: UndoableChange[] = [];

  /**
   * Variable: significant
   *
   * Specifies if the undoable change is significant.
   * Default is true.
   */
  significant = true;

  /**
   * Variable: undone
   *
   * Specifies if this edit has been undone. Default is false.
   */
  undone = false;

  /**
   * Variable: redone
   *
   * Specifies if this edit has been redone. Default is false.
   */
  redone = false;

  /**
   * Function: isEmpty
   *
   * Returns true if the this edit contains no changes.
   */
  isEmpty() {
    return this.changes.length === 0;
  }

  /**
   * Function: isSignificant
   *
   * Returns <significant>.
   */
  isSignificant() {
    return this.significant;
  }

  /**
   * Function: add
   *
   * Adds the specified change to this edit. The change is an object that is
   * expected to either have an undo and redo, or an execute function.
   */

  add(change: UndoableChange) {
    this.changes.push(change);
  }

  /**
   * Function: notify
   *
   * Hook to notify any listeners of the changes after an <undo> or <redo>
   * has been carried out. This implementation is empty.
   */
  notify() {}

  /**
   * Function: die
   *
   * Hook to free resources after the edit has been removed from the command
   * history. This implementation is empty.
   */
  die() {}

  /**
   * Function: undo
   *
   * Undoes all changes in this edit.
   */
  undo() {
    if (!this.undone) {
      this.source.fireEvent(new mxEventObject(mxEvent.START_EDIT));
      const count = this.changes.length;

      for (let i = count - 1; i >= 0; i--) {
        const change = this.changes[i];

        if (change.execute) {
          change.execute();
        } else if (change.undo) {
          change.undo();
        }

        // New global executed event
        this.source.fireEvent(
          new mxEventObject(mxEvent.EXECUTED, 'change', change)
        );
      }

      this.undone = true;
      this.redone = false;
      this.source.fireEvent(new mxEventObject(mxEvent.END_EDIT));
    }

    this.notify();
  }

  /**
   * Function: redo
   *
   * Redoes all changes in this edit.
   */
  redo() {
    if (!this.redone) {
      this.source.fireEvent(new mxEventObject(mxEvent.START_EDIT));
      const count = this.changes.length;

      for (let i = 0; i < count; i += 1) {
        const change = this.changes[i];

        if (change.execute != null) {
          change.execute();
        } else if (change.redo != null) {
          change.redo();
        }

        // New global executed event
        this.source.fireEvent(
          new mxEventObject(mxEvent.EXECUTED, 'change', change)
        );
      }

      this.undone = false;
      this.redone = true;
      this.source.fireEvent(new mxEventObject(mxEvent.END_EDIT));
    }

    this.notify();
  }
}

export default mxUndoableEdit;
