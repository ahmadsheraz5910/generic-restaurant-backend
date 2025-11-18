import {
  TwoColumnPage,
  TwoColumnPageSkeleton,
} from "../../../../components/ui/two-column-page";
import AddonGeneralSection from "../_components/addon-general-section";
import { useParams } from "react-router-dom";
import { useAddon } from "../../../../hooks/api/addons";
import { AddonVariantPricesSection } from "../_components/addon-prices-section";

const AddonDetailPage = () => {
  const { id } = useParams();
  const { addon, isLoading, isError, error } = useAddon(id!);
  if (isLoading || !addon) {
    return <TwoColumnPageSkeleton mainSections={4} sidebarSections={3} />;
  }

  if (isError) {
    throw error;
  }
  return (
    <TwoColumnPage>
      <TwoColumnPage.Main>
        <AddonGeneralSection addon={addon} />
      </TwoColumnPage.Main>
      <TwoColumnPage.Sidebar>
        {addon.variants?.[0] ? (
          <AddonVariantPricesSection variant={addon.variants[0]} />
        ) : null}
      </TwoColumnPage.Sidebar>
    </TwoColumnPage>
  );
};
export default AddonDetailPage;
