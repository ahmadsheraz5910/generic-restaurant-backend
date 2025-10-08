import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { useProduct } from "../../../../hooks/api/products";
import ProductAddOnsForm from "./ProductAddOnForm";
import { useParams } from "react-router";

const AddOnPage = () => {
  const { id } = useParams();
  const { product, isError, error, isLoading } = useProduct(id as string);

  if (isError) {
    throw error;
  }
  let addOnCollectionIds = [] as string[];
  if (Array.isArray(product?.metadata?.addOnCollectionIds)) {
    addOnCollectionIds = product.metadata.addOnCollectionIds ?? [];
  }

  return (
    <RouteFocusModal>
      {product && !isLoading ? (
        <ProductAddOnsForm
          productId={id as string}
          addOnCollectionIds={addOnCollectionIds}
        />
      ) : null}
    </RouteFocusModal>
  );
};

export default AddOnPage;
