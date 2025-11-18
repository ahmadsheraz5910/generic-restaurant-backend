import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import { PencilSquare, Plus, Trash } from "@medusajs/icons";
import { Container, Heading, toast, usePrompt } from "@medusajs/ui";
import { useMemo } from "react";
import { ActionMenu } from "../components/ActionMenu";
import { useTranslation } from "react-i18next";
import { useAddonGroups } from "../hooks/api/addon-groups";
import { DataTable } from "../components/ui/data-table";
import { HttpTypes } from "../../types/addons";
import { createColumnHelperWithPresets } from "../components/ui/data-table/utils/column-helper-with-presets";
import { useAddonGroupTableColumns } from "../routes/addon-groups/_hooks/use-addon-group-table-columns";
import { useUpdateProductAddonGroups } from "../hooks/api/products";

type Props = DetailWidgetProps<AdminProduct>;
const PAGE_SIZE = 10;

const ProductAddonWidgetT = ({ data: product }: Props) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { addon_groups, count, isLoading, isError, error } = useAddonGroups({
    limit: PAGE_SIZE,
    product_id: product.id,
  });
  const { mutateAsync } = useUpdateProductAddonGroups(product.id);
  const columns = useColumns(product.id);

  const handleRemove = async (selection: Record<string, boolean>) => {
    const ids = Object.keys(selection);

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("product.removeAddonGroupsWarning", {
        count: ids.length,
      }),
      confirmText: t("actions.remove"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(
      {
        remove: ids,
      },
      {
        onSuccess: () => {
          toast.success(
            t("products.addonGroups.remove.successToast", {
              count: ids.length,
            })
          );
        },
        onError: () => {
          toast.error(
            t("products.addonGroups.remove.errorToast", {
              count: ids.length,
            })
          );
        },
      }
    );
  };
  if (isError) {
    throw error;
  }
  return (
    <Container className="p-0">
      <DataTable
        data={addon_groups ?? []}
        columns={columns}
        rowCount={count}
        isLoading={isLoading}
        enableSearch
        enablePagination
        enableRowSelection
        commands={[
          {
            action: handleRemove,
            label: t("actions.remove"),
            shortcut: "r",
          },
        ]}
      >
        <div className="flex items-center justify-between px-6 py-4">
          <Heading level="h2">{"Addon Groups"}</Heading>
          <div className="flex gap-2">
            <DataTable.Search />
            <ActionMenu
              variant="primary"
              groups={[
                {
                  actions: [
                    {
                      icon: <Plus />,
                      label: "Add Addon Group",
                      to: "addon-groups",
                    },
                  ],
                },
              ]}
            />
          </div>
        </div>
        <DataTable.Table />
        <DataTable.Pagination />
        <DataTable.CommandBar />
      </DataTable>
    </Container>
  );
};

const columnHelper = createColumnHelperWithPresets<HttpTypes.AdminAddonGroup>();
const useColumns = (productId: string) => {
  const base = useAddonGroupTableColumns();
  const columns = useMemo(
    () => [
      columnHelper.displayRowSelection(),
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return (
            <AddonGroupActions
              addonGroup={row.original}
              productId={productId}
            />
          );
        },
      }),
    ],
    [base]
  );

  return columns;
};

type AddonGroupActionsProps = {
  addonGroup: HttpTypes.AdminAddonGroup;
  productId: string;
};
const AddonGroupActions = ({
  addonGroup,
  productId,
}: AddonGroupActionsProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useUpdateProductAddonGroups(productId);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("addonGroups.removeSingleProductWarning", {
        title: addonGroup.title,
      }),
      confirmText: t("actions.remove"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(
      {
        remove: [addonGroup.id],
      },
      {
        onSuccess: () => {
          toast.success(t("addonGroups.toasts.delete.success.header"), {
            description: t("addonGroups.toasts.delete.success.description", {
              title: addonGroup.title,
            }),
          });
        },
        onError: (e) => {
          toast.error(t("addonGroups.toasts.delete.error.header"), {
            description: e.message,
          });
        },
      }
    );
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/addon-groups/${addonGroup.id}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.delete"),
              onClick: handleDelete,
            },
          ],
        },
      ]}
    />
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});
export default ProductAddonWidgetT;
