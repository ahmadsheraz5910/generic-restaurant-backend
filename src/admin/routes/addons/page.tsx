import { defineRouteConfig } from "@medusajs/admin-sdk";
import { SquaresPlusSolid } from "@medusajs/icons";
import { AddonListTable } from "./_components/addon-list-table";

const AddonPage = () => {
  return <AddonListTable />;
};

export const config = defineRouteConfig({
  label: "Addons",
  icon: SquaresPlusSolid,
});

export default AddonPage;
