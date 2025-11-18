import { createDataTableFilterHelper } from "@medusajs/ui";
import { HttpTypes } from "../../../../types/addons";

const filterHelper = createDataTableFilterHelper<HttpTypes.AdminAddonGroup>();

export const useAddonGroupTableFilters = () => {
  
  const createdAtFilter = filterHelper.accessor("created_at", {
    type: "date",
    label: "Created At",
    options: [],
  });

  return [createdAtFilter];
};
