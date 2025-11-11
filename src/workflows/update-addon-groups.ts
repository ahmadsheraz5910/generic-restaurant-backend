import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk";
import { updateAddonGroupsStep } from "./steps/update-addon-groups";
import { AddonModuleTypes } from "../modules/addon";

export type UpdateAddonGroupsInput = {
  selector: AddonModuleTypes.FilterableAddonGroupProps;
  update: AddonModuleTypes.UpdateAddonGroupDTO;
};

export const updateAddonGroupsId = "update-addon-groups";

export const updateAddonGroupsWorkflow = createWorkflow(
  updateAddonGroupsId,
  (input: WorkflowData<UpdateAddonGroupsInput>) => {
    const updatedAddonGroups = updateAddonGroupsStep(input);
    return new WorkflowResponse(updatedAddonGroups);
  }
);
