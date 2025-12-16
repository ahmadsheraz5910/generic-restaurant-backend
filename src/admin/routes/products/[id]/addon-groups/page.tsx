import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { useProduct } from "../../../../hooks/api/products";
import { useParams } from "react-router";
import LinkAddonGroupToProductForm from "./link-addon-group-form";

const LinkAddonGroupPage = () => {
  const { id } = useParams();
  const { product, isError, error, isLoading } = useProduct(id as string, {
    fields: "+addon_groups.id",
  });
  const addonGroupIds =
    (product as any)?.addon_groups?.map((a: any) => a.id) ?? [];

  if (isError) {
    throw error;
  }
  return (
    <RouteFocusModal>
      {product && !isLoading ? (
        <LinkAddonGroupToProductForm
          productId={id as string}
          existingAddonGroupIds={addonGroupIds}
        />
      ) : null}
    </RouteFocusModal>
  );
};

export default LinkAddonGroupPage;
