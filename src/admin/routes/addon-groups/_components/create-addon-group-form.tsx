"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Heading, Input, toast } from "@medusajs/ui";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { useRouteModal } from "../../../context/route-modal-context";
import { RouteFocusModal } from "../../../components/route-focus-modal";
import { KeyboundForm } from "../../../components/keyboard-form";
import { Form } from "../../../components/Form";
import { HandleInput } from "../../../components/HandleInput";
import { useCreateAddonGroup } from "../../../hooks/api/addon-groups";

const CreateAddonSchema = zod.object({
  title: zod.string().min(1),
  handle: zod.string().optional(),
});

export const CreateAddonGroupForm = () => {
  const { t } = useTranslation();
  const { handleSuccess } = useRouteModal();

  const form = useForm<zod.infer<typeof CreateAddonSchema>>({
    resolver: zodResolver(CreateAddonSchema),
  });

  const { mutateAsync, isPending } = useCreateAddonGroup();

  const handleSubmit = form.handleSubmit(async (data) => {
    mutateAsync(
      {
        title: data.title,
        handle: data.handle,
      },
      {
        onSuccess: ({ addon_group }) => {
          handleSuccess(`/addon-groups/${addon_group.id}`);
          toast.success(t("addonGroups.createSuccess"));
        },
        onError: (error) => {
          toast.error(error.message);
        },
      }
    );
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
            <Heading>{"Create Addon Group"}</Heading>
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
