/**
 * Schema Composition Utilities
 *
 * Utilities for merging, extending, and modifying Zod schemas.
 */

import { z } from "zod";

/**
 * Schema composition utilities for merging and transforming schemas.
 */
export const schemaComposition = {
  /**
   * Merge two Zod object schemas, with the second schema taking precedence.
   */
  merge: <A extends z.ZodRawShape, B extends z.ZodRawShape>(
    schemaA: z.ZodObject<A>,
    schemaB: z.ZodObject<B>,
  ) => {
    return schemaA.merge(schemaB);
  },

  /**
   * Create optional version of a schema that allows undefined.
   */
  makeOptional: <T extends z.ZodTypeAny>(schema: T): z.ZodOptional<T> => {
    return schema.optional();
  },

  /**
   * Create nullable version of a schema that allows null.
   */
  makeNullable: <T extends z.ZodTypeAny>(schema: T): z.ZodNullable<T> => {
    return schema.nullable();
  },
};
