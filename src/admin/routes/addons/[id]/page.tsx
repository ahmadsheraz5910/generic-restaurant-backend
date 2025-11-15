import { defineRouteConfig } from "@medusajs/admin-sdk";
import AddonDetailPage from "./_pages/addon-detail";

const AddonDetail = () => {
  return <AddonDetailPage />;
};

export const config = defineRouteConfig({});

export default AddonDetail;
