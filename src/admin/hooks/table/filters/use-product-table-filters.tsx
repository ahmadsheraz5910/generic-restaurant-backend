import { useTranslation } from "react-i18next";
import { useProductTypes } from "../../api/product-types";
import { DataTableFilteringState } from "@medusajs/ui";
const excludeableFields = [
  "sales_channel_id",
  "collections",
  "categories",
  "product_types",
  "product_tags",
] as const;

export const useProductTableFilters = (
  exclude?: (typeof excludeableFields)[number][]
) => {
  const { t } = useTranslation();

  const isProductTypeExcluded = exclude?.includes("product_types");

  const { product_types } = useProductTypes(
    {
      limit: 1000,
      offset: 0,
    },
    {
      enabled: !isProductTypeExcluded,
    }
  );

  let filters: DataTableFilteringState[] = [];

  if (product_types && !isProductTypeExcluded) {
    const typeFilter = {
      key: "type_id",
      label: t("fields.type"),
      type: "select",
      multiple: true,
      searchable: true,
      options: product_types.map((t) => ({
        label: t.value,
        value: t.id,
      })),
    };

    filters = [...filters, typeFilter];
  }

  const statusFilter: DataTableFilteringState = {
    key: "status",
    label: t("fields.status"),
    type: "select",
    multiple: true,
    options: [
      {
        label: t("products.productStatus.draft"),
        value: "draft",
      },
      {
        label: t("products.productStatus.proposed"),
        value: "proposed",
      },
      {
        label: t("products.productStatus.published"),
        value: "published",
      },
      {
        label: t("products.productStatus.rejected"),
        value: "rejected",
      },
    ],
  };

  const dateFilters: DataTableFilteringState[] = [
    { label: t("fields.createdAt"), key: "created_at" },
    { label: t("fields.updatedAt"), key: "updated_at" },
  ].map((f) => ({
    key: f.key,
    label: f.label,
    type: "date",
  }));

  filters = [...filters, statusFilter, ...dateFilters];

  return filters;
};
