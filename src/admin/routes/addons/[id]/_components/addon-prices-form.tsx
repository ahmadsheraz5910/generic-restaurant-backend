import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@medusajs/ui";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as zod from "zod";
import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { KeyboundForm } from "../../../../components/keyboard-form";
import { useRouteModal } from "../../../../context/route-modal-context";
import { HttpTypes } from "../../../../../types/addons";
import {
  createDataGridPriceColumns,
  DataGrid,
} from "../../../../components/data-grid";
import { useStore } from "../../../../hooks/api/store";
import { useRegions } from "../../../../hooks/api/regions";
import { usePricePreferences } from "../../../../hooks/api/price-preferences";
import { useMemo } from "react";
import { castNumber } from "../../../../lib/cast-number";
import { useUpdateAddon } from "../../../../hooks/api/addons";

/**
 * [Todo]: Extend this to accomade multiple variants as well, backend is established
 * but currently I am assuming just one variant, and handling it that way from UX perspective.
 */
export const UpdateVariantPricesSchema = zod.object({
  variants: zod.array(
    zod.object({
      prices: zod
        .record(zod.string(), zod.string().or(zod.number()).optional())
        .optional(),
    })
  ),
});

export type UpdateVariantPricesSchemaType = zod.infer<
  typeof UpdateVariantPricesSchema
>;

export const AddonPricesForm = ({
  addonId,
  variants,
}: {
  addonId: string;
  variants: HttpTypes.AdminAddonVariant[];
}) => {
  const { t } = useTranslation();
  const { handleSuccess, setCloseOnEscape } = useRouteModal();
  const { mutateAsync, isPending } = useUpdateAddon(addonId);
  //const { mutateAsync, isPending } = useUpdateProductVariantsBatch(product.id)
  const { regions } = useRegions({ limit: 9999 });
  const regionsCurrencyMap = useMemo(() => {
    if (!regions?.length) {
      return {};
    }
    return regions.reduce((acc, reg) => {
      acc[reg.id] = reg.currency_code;
      return acc;
    }, {} as Record<string, string>);
  }, [regions]);

  const form = useForm<UpdateVariantPricesSchemaType>({
    defaultValues: {
      variants: variants?.map((variant: any) => ({
        title: variant.title,
        prices: variant.prices.reduce((acc: any, price: any) => {
          if (price.rules?.region_id) {
            acc[price.rules.region_id] = price.amount;
          } else {
            acc[price.currency_code] = price.amount;
          }
          return acc;
        }, {}),
      })) as any,
    },

    resolver: zodResolver(UpdateVariantPricesSchema, {}),
  });
  const handleSubmit = form.handleSubmit(async (values) => {
    const reqData = values.variants.map((variant, ind) => ({
      id: variants[ind].id,
      prices: Object.entries(variant.prices || {})
        .filter(
          ([_, value]) => value !== "" && typeof value !== "undefined" // deleted cells
        )
        .map(([currencyCodeOrRegionId, value]: any) => {
          const regionId = currencyCodeOrRegionId.startsWith("reg_")
            ? currencyCodeOrRegionId
            : undefined;
          const currencyCode = currencyCodeOrRegionId.startsWith("reg_")
            ? regionsCurrencyMap[regionId]
            : currencyCodeOrRegionId;
          let existingId = undefined;
          if (regionId) {
            existingId = variants?.[ind]?.prices?.find(
              (p: any) => p.rules["region_id"] === regionId
            )?.id;
          } else {
            existingId = variants?.[ind]?.prices?.find(
              (p: any) =>
                p.currency_code === currencyCode &&
                Object.keys(p.rules ?? {}).length === 0
            )?.id;
          }
          const amount = castNumber(value);
          return {
            id: existingId,
            currency_code: currencyCode,
            amount,
            ...(regionId ? { rules: { region_id: regionId } } : {}),
          };
        }),
    }));
    await mutateAsync(
      {
        variants: reqData,
      },
      {
        onSuccess: () => {
          handleSuccess("..");
        },
      }
    );
  });
  const columns = useVariantPriceGridColumns();

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm onSubmit={handleSubmit} className="flex size-full flex-col">
        <RouteFocusModal.Header />
        <RouteFocusModal.Body className="flex flex-col overflow-hidden">
          <Controller
            {...form.register("variants")}
            render={({ field }) => {
              return (
                <DataGrid
                  columns={columns}
                  data={field.value}
                  state={form}
                  onEditingChange={(editing) => setCloseOnEscape(!editing)}
                />
              );
            }}
          />
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <div className="flex w-full items-center justify-end gap-x-2">
            <RouteFocusModal.Close asChild>
              <Button variant="secondary" size="small">
                {t("actions.cancel")}
              </Button>
            </RouteFocusModal.Close>
            <Button
              type="submit"
              variant="primary"
              size="small"
              isLoading={isPending}
            >
              {t("actions.save")}
            </Button>
          </div>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

const useVariantPriceGridColumns = () => {
  const { store } = useStore();
  const { regions } = useRegions({ limit: 9999 });
  const { price_preferences: pricePreferences } = usePricePreferences({});
  const currencies = store?.supported_currencies ?? [];
  const { t } = useTranslation();

  return useMemo(() => {
    return [
      ...createDataGridPriceColumns<
        HttpTypes.AdminAddonVariant,
        UpdateVariantPricesSchemaType
      >({
        currencies: currencies.map((c) => c.currency_code),
        regions,
        pricePreferences,
        getFieldName: (context, value) => {
          if (context.column.id?.startsWith("currency_prices")) {
            return `variants.${context.row.index}.prices.${value}`;
          }
          return `variants.${context.row.index}.prices.${value}`;
        },
        t,
      }),
    ];
  }, [t, currencies, regions, pricePreferences]);
};
