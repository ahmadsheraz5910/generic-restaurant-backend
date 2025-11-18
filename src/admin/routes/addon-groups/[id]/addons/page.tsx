import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { useAddonGroup } from "../../../../hooks/api/addon-groups";
import { useParams } from "react-router";
import AddonGroupAddonsForm from "../_components/addon-group-addons-form";

const AddonGroupAddonsPage = () => {
  const { id } = useParams();
  const { addon_group, isError, error, isLoading } = useAddonGroup(
    id as string
  );

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal>
      {addon_group && !isLoading ? (
        <AddonGroupAddonsForm
          addonGroupId={id as string}
          addonGroupAddonIds={addon_group.addons.map((a) => a.id)}
        />
      ) : null}
    </RouteFocusModal>
  );
};

export default AddonGroupAddonsPage;
