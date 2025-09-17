/**
 * Echo Tool Input Type
 *
 * TypeScript type definition for Echo tool input parameters.
 */

import type { z } from "zod";
import type { EchoInputSchema } from "./echoInputSchema";

/**
 * TypeScript type for Echo tool input parameters
 */
export type EchoInput = z.infer<typeof EchoInputSchema>;
