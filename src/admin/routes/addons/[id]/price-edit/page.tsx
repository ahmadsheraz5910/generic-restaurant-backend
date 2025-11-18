import { useParams } from "react-router-dom";
import { useAddon } from "../../../../hooks/api/addons";
import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { AddonPricesForm } from "../_components/addon-prices-form";

const AddonPrices = () => {
  const { id } = useParams();
  const { addon, isPending, isError, error } = useAddon(id!);
  const isReady = !isPending && !!addon;
  
  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal>
      {isReady ? (
        <AddonPricesForm addonId={addon.id} variants={addon.variants ?? []} />
      ) : null}
    </RouteFocusModal>
  );
};
export default AddonPrices;
