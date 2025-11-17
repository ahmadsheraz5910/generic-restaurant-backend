import { PencilSquare, Plus, Trash } from "@medusajs/icons";
import { Container, Heading, toast, usePrompt } from "@medusajs/ui";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAddons } from "../../../../hooks/api/addons";
import { ActionMenu } from "../../../../components/ActionMenu";
import { useAddonTableColumns } from "../../../addons/_hooks/use-addon-table-columns";
import { HttpTypes } from "../../../../../types/addons";
import { useUpdateAddonGroupAddons } from "../../../../hooks/api/addon-groups";
import { DataTable } from "../../../../components/ui/data-table";
import { createColumnHelperWithPresets } from "../../../../components/ui/data-table/utils/column-helper-with-presets";
import { useAddonTableQuery } from "../../../../hooks/table/query/use-addon-table-query";
import { keepPreviousData } from "@tanstack/react-query";

const PAGE_SIZE = 10;

interface AddonGroupAddonsSectionProps {
  addonGroup_id: string;
}
const AddonGroupAddonsSection = ({
  addonGroup_id,
}: AddonGroupAddonsSectionProps) => {
  const { searchParams } = useAddonTableQuery({
    pageSize: PAGE_SIZE,
  });
  const { addons, count, isLoading, isError, error } = useAddons(
    {
      limit: PAGE_SIZE,
      ...searchParams,
      addon_group_id: addonGroup_id,
    },
    {
      placeholderData: keepPreviousData,
    }
  );
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useUpdateAddonGroupAddons(addonGroup_id);
  const columns = useColumns(addonGroup_id);
  const handleRemove = async (selection: Record<string, boolean>) => {
    const ids = Object.keys(selection);

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("collections.removeProductsWarning", {
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
            t("collections.products.remove.successToast", {
              count: ids.length,
            })
          );
        },
        onError: (e) => {
          toast.error(e.message);
        },
      }
    );
  };

  if (isError) {
    throw error;
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{"Addons"}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <Plus />,
                  label: "Add",
                  to: "addons",
                },
              ],
            },
          ]}
        />
      </div>
      <DataTable
        data={addons}
        columns={columns}
        rowCount={count}
        isLoading={isLoading}
        enableSearch
        enablePagination
        commands={[
          {
            action: handleRemove,
            label: t("actions.remove"),
            shortcut: "r",
          },
        ]}
      >
        <div className="px-6 py-4 flex flex-wrap justify-between items-center gap-2 border-t">
          <DataTable.FilterBar />
          <div className="ml-auto">
            <DataTable.Search />
            <DataTable.SortingMenu />
          </div>
        </div>
        <DataTable.Table />
        <DataTable.Pagination />
        <DataTable.CommandBar />
      </DataTable>
    </Container>
  );
};

const columnHelper = createColumnHelperWithPresets<HttpTypes.AdminAddon>();
const useColumns = (addonGroupId: string) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useUpdateAddonGroupAddons(addonGroupId);
  const baseColumns = useAddonTableColumns();

  const handleRemove = async (selection: Record<string, boolean>) => {
    const ids = Object.keys(selection);

    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("collections.removeProductsWarning", {
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
            t("collections.products.remove.successToast", {
              count: ids.length,
            })
          );
        },
        onError: (e) => {
          toast.error(e.message);
        },
      }
    );
  };

  return useMemo(
    () => [
      columnHelper.displayRowSelection(),
      ...baseColumns,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          const addonId = row.original.id;
          return (
            <ActionMenu
              groups={[
                {
                  actions: [
                    {
                      icon: <PencilSquare />,
                      label: t("actions.edit"),
                      to: `/addons/${addonId}/edit`,
                    },
                  ],
                },
                {
                  actions: [
                    {
                      icon: <Trash />,
                      label: t("actions.remove"),
                      onClick: () => handleRemove({ [addonId]: true }),
                    },
                  ],
                },
              ]}
            />
          );
        },
      }),
    ],
    [baseColumns]
  );
};
export default AddonGroupAddonsSection;
