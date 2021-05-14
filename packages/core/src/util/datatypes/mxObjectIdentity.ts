/**
 * Copyright (c) 2006-2015, JGraph Ltd
 * Copyright (c) 2006-2015, Gaudenz Alder
 * Updated to ES9 syntax by David Morrissey 2021
 * Type definitions from the typed-mxgraph project
 */

import { getFunctionName } from '../mxStringUtils';
import { isNullish } from '../mxUtils';

const FIELD_NAME = 'mxObjectId';

type IdentityObject = {
  [FIELD_NAME]?: string;
  [k: string]: any;
};

type IdentityFunction = {
  (): any;
  [FIELD_NAME]?: string;
};

/**
 * @class
 *
 * Identity for JavaScript objects and functions. This is implemented using
 * a simple incrementing counter which is stored in each object under
 * {@link FIELD_NAME}.
 *
 * The identity for an object does not change during its lifecycle.
 */
class mxObjectIdentity {
  /**
   * Name of the field to be used to store the object ID. Default is
   * <code>mxObjectId</code>.
   */
  static FIELD_NAME = FIELD_NAME;

  /**
   * Current counter.
   */
  static counter = 0;

  /**
   * Returns the ID for the given object or function.
   */
  static get(obj: IdentityObject | IdentityFunction) {
    if (isNullish(obj[FIELD_NAME])) {
      if (typeof obj === 'object') {
        const ctor = getFunctionName(obj.constructor);
        obj[FIELD_NAME] = `${ctor}#${mxObjectIdentity.counter++}`;
      } else if (typeof obj === 'function') {
        obj[FIELD_NAME] = `Function#${mxObjectIdentity.counter++}`;
      }
    }

    return obj[FIELD_NAME] as string;
  }

  /**
   * Deletes the ID from the given object or function.
   */
  static clear(obj: IdentityObject | IdentityFunction) {
    delete obj[FIELD_NAME];
  }
}

export default mxObjectIdentity;
