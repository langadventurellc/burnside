import z from "zod";

/**
 * Check if a schema is a Zod schema instance
 */
export default function isZodSchema(schema: unknown): schema is z.ZodTypeAny {
  return schema instanceof z.ZodType;
}
