"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { useRouteModal } from "../../../context/route-modal-context";
import { useCreateAddon } from "../../../hooks/api/addons";
import { RouteFocusModal } from "../../../components/route-focus-modal";
import { KeyboundForm } from "../../../components/keyboard-form";
import { Form } from "../../../components/Form";
import { HandleInput } from "../../../components/HandleInput";
import {
  ImageUploadField,
  MediaSchema,
} from "../../../components/ImageUploadField";
import { CurrencyInputField } from "./currency-input-field";
import { AdminCurrency, HttpTypes } from "@medusajs/framework/types";
import { sdk } from "../../../lib/sdk";
import { castNumber } from "../../../lib/cast-number";

const CreateAddonSchema = zod.object({
  title: zod.string().min(1),
  handle: zod.string().optional(),
  thumbnail: MediaSchema.refine((v) => v !== null, "Please upload an image"),
  price: zod.union([zod.number(), zod.string()]),
});

interface Props {
  currencyInfo: AdminCurrency[];
}

export const CreateAddonForm = ({ currencyInfo }: Props) => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof CreateAddonSchema>>({
    resolver: zodResolver(CreateAddonSchema),
  });

  const { mutateAsync, isPending } = useCreateAddon();

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
    mutateAsync({
      title: data.title,
      handle: data.handle,
      variants:[{
        title: data.title,
        prices:[{
          amount: castNumber(data.price),
          currency_code: currencyInfo[0].code,
        }]
      }]
    }, {
      onSuccess: ({ addon }) => {
        //handleSuccess(`/addons/${addon.id}`)
        toast.success(t("addons.createSuccess"))
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  });

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex h-full flex-col overflow-hidden"
      >
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex size-full flex-col items-center p-16 overflow-y-auto">
          <div className="flex w-full max-w-[720px] flex-col gap-y-8">
            <div>
              <Heading>{"Create Addon"}</Heading>
            </div>
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-4">
                <Form.Field
                  control={form.control}
                  name="title"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{t("fields.title")}</Form.Label>
                        <Form.Control>
                          <Input autoComplete="off" {...field} />
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
                        <Form.Label
                          optional
                          tooltip={t("collections.handleTooltip")}
                        >
                          {t("fields.handle")}
                        </Form.Label>
                        <Form.Control>
                          <HandleInput {...field} />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />
                <Form.Field
                  control={form.control}
                  name="price"
                  render={({ field }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{t("fields.price")}</Form.Label>
                        <Form.Control>
                          <CurrencyInputField
                            currencyInfo={currencyInfo[0]}
                            field={field}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />
              </div>
              <div className="grid md:grid-cols-2">
                <Form.Field
                  control={form.control}
                  name="thumbnail"
                  render={({ field, fieldState }) => {
                    return (
                      <Form.Item>
                        <Form.Label>{"Thumbnail"}</Form.Label>
                        <Form.Control>
                          <ImageUploadField
                            clearError={() => form.clearErrors("thumbnail")}
                            setError={(type, message) =>
                              form.setError("thumbnail", { type, message })
                            }
                            onChange={field.onChange}
                            value={field.value}
                            error={fieldState.error?.message}
                          />
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    );
                  }}
                />
              </div>
            </div>
          </div>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button
            size="small"
            variant="primary"
            type="submit"
            isLoading={isPending}
          >
            {t("actions.create")}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};
