import type { LinkWorkflowInput } from "@medusajs/framework/types";
import {
  WorkflowData,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";
import { batchLinkAddonsToAddonGroupStep } from "./steps/batch-link-addons-addon-group";

export const batchLinkAddonsToAddonGroupWorkflowId =
  "batch-link-addons-to-addon-group";

/**
 * This workflow manages the links between a addonGroup and addons. It's used by the
 *
 * @example
 * const { result } = await batchLinkAddonsToAddonGroupWorkflow(container)
 * .run({
 *   input: {
 *     id: "aGroupId_123",
 *     add: ["addon_123"],
 *     remove: ["addon_456"],
 *   }
 * })
 *
 * @summary
 *
 * Manage the links between a addonGroup and addons.
 */
export const batchLinkAddonsToAddonGroupWorkflow = createWorkflow(
  batchLinkAddonsToAddonGroupWorkflowId,
  (input: WorkflowData<LinkWorkflowInput>): WorkflowData<void> => {
    return batchLinkAddonsToAddonGroupStep(input);
  }
);
