import { PencilSquare, Trash } from "@medusajs/icons";
import { Button, Container, Heading, toast, usePrompt } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router-dom";
import { useAddonTableFilters } from "../../../hooks/table/filters/use-addon-table-filters";
import { ActionMenu } from "../../../components/common/action-menu";
import { useAddonTableColumns } from "../_hooks/use-addon-table-columns";
import { DataTable } from "../../../components/ui/data-table";
import { useAddons, useDeleteAddon } from "../../../hooks/api/addons";
import { useAddonTableQuery } from "../../../hooks/table/query/use-addon-table-query";
import { HttpTypes } from "../../../../types/addons";

const PAGE_SIZE = 20;

export const AddonListTable = () => {
  const { searchParams } = useAddonTableQuery({ pageSize: PAGE_SIZE });
  const { addons, count, isLoading, isError, error } = useAddons(
    {
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    }
  );
  const filters = useAddonTableFilters();
  const columns = useColumns();

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{"Addons"}</Heading>
        <div className="flex items-center justify-center gap-x-2">
          <Button size="small" variant="secondary" asChild>
            <Link to="create">{"Create"}</Link>
          </Button>
        </div>
      </div>
      <DataTable
        data={addons ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        rowCount={count}
        pageSize={PAGE_SIZE}
        filters={filters}
        enableSearch
        enablePagination
        isLoading={isLoading}
      >
        <div className="px-6 py-4 flex flex-wrap justify-between items-center gap-2">
          <DataTable.FilterBar />
          <div>
            <DataTable.Search />
            <DataTable.SortingMenu />
          </div>
        </div>
        <DataTable.Table />
      </DataTable>
      <Outlet />
    </Container>
  );
};

const AddonActions = ({ addon }: { addon: HttpTypes.AdminAddon }) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useDeleteAddon(addon.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: addon.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(t("products.toasts.delete.success.header"), {
          description: t("products.toasts.delete.success.description", {
            title: addon.title,
          }),
        });
      },
      onError: (e) => {
        toast.error(t("products.toasts.delete.error.header"), {
          description: e.message,
        });
      },
    });
  };

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              to: `/addons/${addon.id}/edit`,
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

const columnHelper = createColumnHelper<HttpTypes.AdminAddon>();

const useColumns = () => {
  const base = useAddonTableColumns();
  const columns = useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <AddonActions addon={row.original} />;
        },
      }),
    ],
    [base]
  );

  return columns;
};
