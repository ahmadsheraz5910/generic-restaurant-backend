import { Heading } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { RouteDrawer } from "../../../../components/route-drawer";
import { EditAddonGroupForm } from "../_components/addon-group-edit-form";
import { useAddonGroup } from "../../../../hooks/api/addon-groups";

const AddonGroupEditPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { addon_group, isPending, isError, error } = useAddonGroup(id!);

  const ready = !isPending && !!addon_group;

  if (isError) {
    throw error;
  }

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>{t("addonGroups.edit.header")}</Heading>
      </RouteDrawer.Header>
      {ready ? <EditAddonGroupForm addonGroup={addon_group} /> : null}
    </RouteDrawer>
  );
};

export default AddonGroupEditPage;
