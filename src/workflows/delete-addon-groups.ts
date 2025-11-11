import { Modules } from "@medusajs/framework/utils";
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";
import { deleteAddonGroupsStep } from "./steps/delete-addon-groups";
import { removeRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { ADDON_MODULE } from "../modules/addon";

export type DeleteAddonGroupsWorkflowInput = {
  ids: string[];
};

export const deleteAddonGroupsWorkflowId = "delete-addon-groups";
export const deleteAddonGroupsWorkflow = createWorkflow(
  deleteAddonGroupsWorkflowId,
  (input: WorkflowData<DeleteAddonGroupsWorkflowInput>) => {
    const deletedAddonGroups = deleteAddonGroupsStep(input.ids);

    return new WorkflowResponse(deletedAddonGroups);
  }
);
