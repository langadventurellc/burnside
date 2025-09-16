/**
 * Echo Tool Output Type
 *
 * TypeScript type definition for Echo tool output structure.
 */

import type { z } from "zod";
import type { EchoOutputSchema } from "./echoOutputSchema.js";

/**
 * TypeScript type for Echo tool output structure
 */
export type EchoOutput = z.infer<typeof EchoOutputSchema>;
