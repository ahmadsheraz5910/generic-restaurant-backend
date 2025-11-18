import { defineRouteConfig } from "@medusajs/admin-sdk";
import AddonEditPage from "../_pages/addon-edit";
import AddonDetailPage from "../_pages/addon-detail";

const AddonEditDetail = () => {
  return (
    <>
      <AddonDetailPage />
      <AddonEditPage />
    </>
  );
};

export const config = defineRouteConfig({});

export default AddonEditDetail;
