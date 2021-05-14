/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import mxResources from '../../util/mxResources';
import { isNode } from '../../util/mxDomUtils';
import mxGraph from '../graph/mxGraph';
import mxCell from '../cell/mxCell';

/**
 * @class mxMultiplicity
 *
 * Defines invalid connections along with the error messages that they produce.
 * To add or remove rules on a graph, you must add/remove instances of this
 * class to {@link mxGraph.multiplicities}.
 *
 * ### Example
 *
 * @example
 * ```javascript
 * graph.multiplicities.push(new mxMultiplicity(
 *   true, 'rectangle', null, null, 0, 2, ['circle'],
 *   'Only 2 targets allowed',
 *   'Only circle targets allowed'));
 * ```
 *
 * Defines a rule where each rectangle must be connected to no more than 2
 * circles and no other types of targets are allowed.
 */
class mxMultiplicity {
  constructor(
    source: boolean,
    type: string,
    attr: string | null = null,
    value: string | null = null,
    min: number = 0,
    max: number | 'n' = 'n',
    validNeighbors: string[] = [],
    countError: string | null = null,
    typeError: string | null = null,
    validNeighborsAllowed: boolean = true
  ) {
    this.source = source;
    this.type = type;
    this.attr = attr;
    this.value = value;
    this.min = min != null ? min : 0;
    this.max = max != null ? max : 'n';
    this.validNeighbors = validNeighbors;
    this.countError = mxResources.get(countError) || countError;
    this.typeError = mxResources.get(typeError) || typeError;
    this.validNeighborsAllowed =
      validNeighborsAllowed != null ? validNeighborsAllowed : true;
  }

  /**
   * Defines the type of the source or target terminal. The type is a string
   * passed to {@link mxUtils.isNode} together with the source or target vertex
   * value as the first argument.
   */
  type: string;

  /**
   * Optional string that specifies the attributename to be passed to
   * {@link mxUtils.isNode} to check if the rule applies to a cell.
   */
  attr: string | null;

  /**
   * Optional string that specifies the value of the attribute to be passed
   * to {@link mxUtils.isNode} to check if the rule applies to a cell.
   */
  value: string | null;

  /**
   * Boolean that specifies if the rule is applied to the source or target
   * terminal of an edge.
   */
  source: boolean;

  /**
   * Defines the minimum number of connections for which this rule applies.
   *
   * @default 0
   */
  min: number = 0;

  /**
   * Defines the maximum number of connections for which this rule applies.
   * A value of 'n' means unlimited times.
   * @default 'n'
   */
  max: number | 'n' = 'n';

  /**
   * Holds an array of strings that specify the type of neighbor for which
   * this rule applies. The strings are used in {@link mxCell.is} on the opposite
   * terminal to check if the rule applies to the connection.
   */
  validNeighbors: string[] = [];

  /**
   * Boolean indicating if the list of validNeighbors are those that are allowed
   * for this rule or those that are not allowed for this rule.
   */
  validNeighborsAllowed: boolean;

  /**
   * Holds the localized error message to be displayed if the number of
   * connections for which the rule applies is smaller than {@link min} or greater
   * than {@link max}.
   */
  countError: string | null;

  /**
   * Holds the localized error message to be displayed if the type of the
   * neighbor for a connection does not match the rule.
   */
  typeError: string | null;

  /**
   * Checks the multiplicity for the given arguments and returns the error
   * for the given connection or null if the multiplicity does not apply.
   *
   * @param graph Reference to the enclosing {@link mxGraph} instance.
   * @param edge {@link mxCell} that represents the edge to validate.
   * @param source {@link mxCell} that represents the source terminal.
   * @param target {@link mxCell} that represents the target terminal.
   * @param sourceOut Number of outgoing edges from the source terminal.
   * @param targetIn Number of incoming edges for the target terminal.
   */
  check(
    graph: mxGraph,
    edge: mxCell | null,
    source: mxCell,
    target: mxCell,
    sourceOut: number,
    targetIn: number
  ) {
    let error = '';

    if (
      (this.source && this.checkTerminal(graph, source, edge)) ||
      (!this.source && this.checkTerminal(graph, target, edge))
    ) {
      if (
        this.countError != null &&
        ((this.source && (this.max === 0 || sourceOut >= this.max)) ||
          (!this.source && (this.max === 0 || targetIn >= this.max)))
      ) {
        error += `${this.countError}\n`;
      }

      if (
        this.validNeighbors != null &&
        this.typeError != null &&
        this.validNeighbors.length > 0
      ) {
        const isValid = this.checkNeighbors(graph, edge, source, target);

        if (!isValid) {
          error += `${this.typeError}\n`;
        }
      }
    }

    return error.length > 0 ? error : null;
  }

  /**
   * Checks if there are any valid neighbours in {@link validNeighbors}. This is only
   * called if {@link validNeighbors} is a non-empty array.
   */
  checkNeighbors(
    graph: mxGraph,
    edge: mxCell | null,
    source: mxCell,
    target: mxCell
  ) {
    const sourceValue = source.getValue();
    const targetValue = target.getValue();
    let isValid = !this.validNeighborsAllowed;
    const valid = this.validNeighbors;

    for (let j = 0; j < valid.length; j++) {
      if (this.source && this.checkType(graph, targetValue, valid[j])) {
        isValid = this.validNeighborsAllowed;
        break;
      } else if (!this.source && this.checkType(graph, sourceValue, valid[j])) {
        isValid = this.validNeighborsAllowed;
        break;
      }
    }

    return isValid;
  }

  /**
   * Checks the given terminal cell and returns true if this rule applies. The
   * given cell is the source or target of the given edge, depending on
   * {@link source}. This implementation uses {@link checkType} on the terminal's value.
   */
  checkTerminal(graph: mxGraph, terminal: mxCell, edge: mxCell | null) {
    const value = terminal.getValue();

    return this.checkType(graph, value, this.type, this.attr, this.value);
  }

  /**
   * Checks the type of the given value.
   */
  checkType(
    graph: mxGraph,
    value: any,
    type: string,
    attr: string | null = null,
    attrValue: any = null
  ) {
    if (value != null) {
      if (!Number.isNaN(value.nodeType)) {
        // Checks if value is a DOM node
        return isNode(value, type, attr, attrValue);
      }
      return value === type;
    }
    return false;
  }
}

export default mxMultiplicity;
