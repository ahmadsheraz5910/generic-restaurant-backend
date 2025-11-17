import { defineRouteConfig } from "@medusajs/admin-sdk";
import { useParams } from "react-router-dom";
import { useAddonGroup } from "../../../hooks/api/addon-groups";
import {
  SingleColumnPage,
  SingleColumnPageSkeleton,
} from "../../../components/ui/single-column-page";
import { AddonGroupGeneralSection } from "./_components/addon-group-general-section";
import AddonGroupAddonsSection from "./_components/addon-group-addons-section";

const AddonGroupDetail = () => {
  const { id } = useParams();
  const { addon_group, isLoading, isError, error } = useAddonGroup(id!);
  if (isLoading || !addon_group) {
    return <SingleColumnPageSkeleton sections={2} />;
  }

  if (isError) {
    throw error;
  }
  return (
    <SingleColumnPage>
      <AddonGroupGeneralSection addonGroup={addon_group} />
      <AddonGroupAddonsSection addonGroup_id={addon_group.id} />
    </SingleColumnPage>
  );
};

export const config = defineRouteConfig({});

export default AddonGroupDetail;
