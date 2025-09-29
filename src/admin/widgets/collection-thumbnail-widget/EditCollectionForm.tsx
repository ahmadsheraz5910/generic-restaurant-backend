import { useUpdateCollection } from "../../hooks/api/collections";
import { HttpTypes } from "@medusajs/framework/types";
import { sdk } from "../../lib/sdk";
import { Drawer, Button } from "@medusajs/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import {
  UpdateCollectionThumbnailSchema,
  UpdateCollectionThumbnailSchemaType,
} from "./constants";
import { FileUploadFormItem } from "./FileUploadFormItem";
type Props = {
  collectionId: string;
  thumbnail?: string;
};

const EditCollectionForm = ({ collectionId, thumbnail }: Props) => {
  const form = useForm<UpdateCollectionThumbnailSchemaType>({
    resolver: zodResolver(UpdateCollectionThumbnailSchema),
    defaultValues: {
      thumbnail: thumbnail
        ? {
            id: "1",
            url: thumbnail,
            file: null,
          }
        : null,
    },
  });
  const { mutateAsync } = useUpdateCollection(collectionId);
  const handleSubmit = form.handleSubmit(async (data) => {
    let uploadedMedia: HttpTypes.AdminFile[] = [];
    if (data.thumbnail) {
      const thumbnailReq = data.thumbnail;
      const fileReqs = [];
      fileReqs.push(
        sdk.admin.upload
          .create({ files: [thumbnailReq.file] })
          .then((r) => r.files.map((f) => ({ ...f })))
      );
      uploadedMedia = (await Promise.all(fileReqs)).flat();
    }

    await mutateAsync({
      metadata: {
        thumbnail: uploadedMedia[0]?.url ?? null,
      },
    });
    form.reset({
      thumbnail: uploadedMedia[0]?.url
        ? {
            id: "1",
            url: uploadedMedia[0].url,
            file: null,
          }
        : null,
    });
  });
  return (
    <FormProvider {...form}>
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <Drawer.Header>
          <Drawer.Title>Thumbnail (Optional)</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="p-4">
          <FileUploadFormItem form={form} />
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </Drawer.Close>
          <Button
            disabled={!form.formState.isDirty}
            type="submit"
            isLoading={form.formState.isSubmitting}
          >
            Save
          </Button>
        </Drawer.Footer>
      </form>
    </FormProvider>
  );
};

export default EditCollectionForm;
