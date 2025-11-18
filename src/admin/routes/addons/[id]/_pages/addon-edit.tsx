import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useAddon } from "../../../../hooks/api/addons";
import { RouteDrawer } from "../../../../components/route-drawer";
import { EditAddonForm } from "../_components/addon-edit-form";

const AddonEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { addon, isPending, isError, error } = useAddon(id!);

  const ready = !isPending && !!addon;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("products.variant.edit.header")}</Heading>
      </RouteDrawer.Header>
      {ready ? <EditAddonForm addon={addon} /> : null}
    </RouteDrawer>
  );
};

export default AddonEditPage;
