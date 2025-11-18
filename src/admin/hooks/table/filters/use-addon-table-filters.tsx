import { createDataTableFilterHelper } from "@medusajs/ui";
import { HttpTypes } from "../../../../types/addons";

const filterHelper = createDataTableFilterHelper<HttpTypes.AdminAddon>();

export const useAddonTableFilters = () => {
  const statusFilter = filterHelper.accessor("status", {
    type: "number",
    label: "Status",
    // options: [
    //   {
    //     label: t("products.productStatus.draft"),
    //     value: "draft",
    //   },
    //   {
    //     label: t("products.productStatus.proposed"),
    //     value: "proposed",
    //   },
    //   {
    //     label: t("products.productStatus.published"),
    //     value: "published",
    //   },
    //   {
    //     label: t("products.productStatus.rejected"),
    //     value: "rejected",
    //   },
    // ],
  });
  const createdAtFilter = filterHelper.accessor("created_at", {
    type: "date",
    label: "Created At",
    options: [],
  });

  return [statusFilter, createdAtFilter];
};
