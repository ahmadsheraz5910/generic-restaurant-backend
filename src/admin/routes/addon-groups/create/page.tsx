import { defineRouteConfig } from "@medusajs/admin-sdk";
import { RouteFocusModal } from "../../../components/route-focus-modal";
import { CreateAddonGroupForm } from "../_components/create-addon-group-form";

export const AddonGroupCreate = () => {
  return (
    <RouteFocusModal>
      <CreateAddonGroupForm />
    </RouteFocusModal>
  );
};

export const config = defineRouteConfig({});

export default AddonGroupCreate;
