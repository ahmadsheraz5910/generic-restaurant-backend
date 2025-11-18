import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";
import { createAddonGroupStep } from "./steps/create-addon-groups";
import { AddonModuleTypes } from "../modules/addon";

export type CreateAddonGroupsWorkflowInput = {
  addonGroups: AddonModuleTypes.CreateAddonGroupDTO[];
};

export const createAddonGroupsWorkflowId = "create-addon-groups";

export const createAddonGroupsWorkflow = createWorkflow(
  createAddonGroupsWorkflowId,
  (input: WorkflowData<CreateAddonGroupsWorkflowInput>) => {
    const addonGroups = createAddonGroupStep(input.addonGroups);
    return new WorkflowResponse(addonGroups);
  }
);
