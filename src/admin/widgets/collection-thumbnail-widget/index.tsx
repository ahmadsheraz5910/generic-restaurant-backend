import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { Drawer, Button } from "@medusajs/ui";
import { DetailWidgetProps, AdminCollection } from "@medusajs/framework/types";
import EditCollectionForm from "./EditCollectionForm";

type Props = DetailWidgetProps<AdminCollection>;
const ProductWidget = ({ data }: Props) => {
  const collectionId = data.id;
  const thumbnail =
    typeof data.metadata?.thumbnail === "string"
      ? data.metadata.thumbnail
      : undefined;
  return (
    <div className="flex justify-end">
      <Drawer>
        <Drawer.Trigger asChild>
          <Button variant="primary">Edit Thumbnail</Button>
        </Drawer.Trigger>
        <Drawer.Content>
          <EditCollectionForm
            collectionId={collectionId}
            thumbnail={thumbnail}
          />
        </Drawer.Content>
      </Drawer>
    </div>
  );
};

export const config = defineWidgetConfig({
  zone: "product_collection.details.before",
});

export default ProductWidget;
