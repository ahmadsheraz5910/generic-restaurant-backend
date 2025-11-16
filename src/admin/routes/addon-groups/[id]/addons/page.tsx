import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { useAddonGroup } from "../../../../hooks/api/addon-groups";
import { useProduct } from "../../../../hooks/api/products";
import { useParams } from "react-router";

const AddonGroupAddonsPage = () => {
  const { id } = useParams();
  const { addon_group, isError, error, isLoading } = useAddonGroup(id as string);

  if (isError) {
    throw error;
  }

  return (
    <RouteFocusModal>
      {addon_group && !isLoading ? (
        <ProductAddOnsForm
          productId={id as string}
          addOnCollectionIds={addOnCollectionIds}
        />
      ) : null}
    </RouteFocusModal>
  );
};

export default AddonGroupAddonsPage;
