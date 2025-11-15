import { defineRouteConfig } from "@medusajs/admin-sdk";
import { PlusMini } from "@medusajs/icons";
import { AddonGroupsListTable } from "./_components/addon-groups-list-table";

const AddonGroupsPage = () => {
  return <AddonGroupsListTable />;
};

export const config = defineRouteConfig({
  label: "Addon Groups",
  icon: PlusMini,
});

export default AddonGroupsPage;
