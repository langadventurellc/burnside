import { z } from "zod";

export default function isOptional<T>(
  value: T | undefined,
  schema: z.ZodObject,
): value is T {
  return schema.safeParse(undefined).success;
}
