import { defineRouteConfig } from "@medusajs/admin-sdk";
import { PlusMini } from "@medusajs/icons";
import { AddonListTable } from "./_components/addon-list-table";

const AddonPage = () => {
  return <AddonListTable />;
};

export const config = defineRouteConfig({
  label: "Addons",
  icon: PlusMini,
});

export default AddonPage;
