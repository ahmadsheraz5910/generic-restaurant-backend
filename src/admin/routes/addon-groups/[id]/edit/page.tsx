import { defineRouteConfig } from "@medusajs/admin-sdk";
import AddonGroupDetailPage from "../_pages/addon-group-detail-page";
import AddonGroupEditPage from "../_pages/addon-group-edit-page";

const AddonGroupEditDetail = () => {
  return (
    <>
      <AddonGroupDetailPage />
      <AddonGroupEditPage />
    </>
  );
};

export const config = defineRouteConfig({});

export default AddonGroupEditDetail;
