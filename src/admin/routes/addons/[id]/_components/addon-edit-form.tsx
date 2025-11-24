import { Button, Input, Select, Text, toast } from "@medusajs/ui";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { useRouteModal } from "../../../../context/route-modal-context";
import { useUpdateAddon } from "../../../../hooks/api/addons";
import { useDocumentDirection } from "../../../../hooks/use-document-direction";
import { RouteDrawer } from "../../../../components/route-drawer";
import { KeyboundForm } from "../../../../components/keyboard-form";
import { Form } from "../../../../components/Form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { HttpTypes } from "../../../../../types/addons";
import { transformNullableFormData } from "../../../../lib/form-helpers";
import {
  ImageUploadField,
  MediaSchema,
} from "../../../../components/ImageUploadField";
import { sdk } from "../../../../lib/sdk";
import { HttpTypes as MedusaHttpTypes } from "@medusajs/framework/types";
type EditAddonFormProps = {
  addon: HttpTypes.AdminAddon;
};

const EditAddonSchema = zod.object({
  title: zod.string().min(1),
  handle: zod.string().optional(),
  status: zod.enum(["draft", "published", "proposed", "rejected"]),
  thumbnail: MediaSchema.optional().nullable(),
});

export const EditAddonForm = ({ addon }: EditAddonFormProps) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();
  const direction = useDocumentDirection();
  const form = useForm({
    defaultValues: {
      title: addon.title,
      status: addon.status,
      handle: addon.handle,
      thumbnail: addon.thumbnail
        ? {
            url: addon.thumbnail,
            file: null,
            id: "1",
          }
        : null,
    },
    resolver: zodResolver(EditAddonSchema),
  });

  const { mutateAsync, isPending } = useUpdateAddon(addon.id);

  const handleSubmit = form.handleSubmit(async (data) => {
    const { title, handle, status, thumbnail, ...optional } = data;
    const nullableData = transformNullableFormData(optional);
    let uploadedMedia: MedusaHttpTypes.AdminFile[] = [];
    if (thumbnail?.file) {
      const { files: uploads } = await sdk.admin.upload
        .create({ files: [thumbnail?.file] })
        .catch(() => {
          form.setError("thumbnail", {
            type: "invalid_file",
            message: t("products.media.failedToUpload"),
          });
          return { files: [] };
        });
      uploadedMedia = uploads;
    }
    
    await mutateAsync(
      {
        title,
        handle,
        status: status,
        thumbnail: uploadedMedia[0]?.url ?? null,
        ...nullableData,
      },
      {
        onSuccess: ({ addon }) => {
          toast.success(
            t("products.edit.successToast", { title: addon.title })
          );
          handleSuccess();
        },
        onError: (e) => {
          toast.error(e.message);
        },
      }
    );
  });

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <RouteDrawer.Body className="flex flex-1 flex-col gap-y-8 overflow-y-auto">
          <div className="flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-4">
              <Form.Field
                control={form.control}
                name="status"
                render={({ field: { onChange, ref, ...field } }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.status")}</Form.Label>
                      <Form.Control>
                        <Select
                          dir={direction}
                          {...field}
                          onValueChange={onChange}
                        >
                          <Select.Trigger ref={ref}>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            {(
                              [
                                "draft",
                                "published",
                                "proposed",
                                "rejected",
                              ] as const
                            ).map((status) => {
                              return (
                                <Select.Item key={status} value={status}>
                                  {t(`products.productStatus.${status}`)}
                                </Select.Item>
                              );
                            })}
                          </Select.Content>
                        </Select>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="title"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.title")}</Form.Label>
                      <Form.Control>
                        <Input {...field} />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
              <Form.Field
                control={form.control}
                name="handle"
                render={({ field }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{t("fields.handle")}</Form.Label>
                      <Form.Control>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center border-r">
                            <Text
                              className="text-ui-fg-muted"
                              size="small"
                              leading="compact"
                              weight="plus"
                            >
                              /
                            </Text>
                          </div>
                          <Input {...field} className="pl-10" />
                        </div>
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />

              <Form.Field
                control={form.control}
                name="thumbnail"
                render={({ field, formState }) => {
                  return (
                    <Form.Item>
                      <Form.Label>{"Thumbnail"}</Form.Label>
                      <Form.Control>
                        <ImageUploadField
                          value={field.value}
                          clearError={() => form.clearErrors("thumbnail")}
                          setError={(error) =>
                            form.setError("thumbnail", {
                              message: error,
                            })
                          }
                          onChange={(value) => field.onChange(value)}
                          error={formState.errors.thumbnail?.message}
                        />
                      </Form.Control>
                      <Form.ErrorMessage />
                    </Form.Item>
                  );
                }}
              />
            </div>
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center justify-end gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  );
};
