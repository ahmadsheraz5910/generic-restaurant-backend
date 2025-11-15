import { PencilSquare, Trash } from "@medusajs/icons";
import { Button, Container, Heading, toast, usePrompt } from "@medusajs/ui";
import { keepPreviousData } from "@tanstack/react-query";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router-dom";
import {
  useAddonGroups,
  useDeleteAddonGroup,
} from "../../../hooks/api/addon-groups";
import { useAddonGroupTableFilters } from "../_hooks/use-addon-group-table-filters";
import { DataTable } from "../../../components/ui/data-table";
import { HttpTypes } from "../../../../types/addons";
import { ActionMenu } from "../../../components/ActionMenu";
import { TextCell } from "../../../components/table/table-cells/common/text-cell";
import { useAddonGroupTableQuery } from "../_hooks/use-addon-group-table-query";

const PAGE_SIZE = 20;

export const AddonGroupsListTable = () => {
  const { searchParams } = useAddonGroupTableQuery({ pageSize: PAGE_SIZE });
  const { addon_groups, count, isLoading, isError, error } = useAddonGroups(
    {
      ...searchParams,
    },
    {
      placeholderData: keepPreviousData,
    }
  );
  const filters = useAddonGroupTableFilters();
  const columns = useColumns();

  if (isError) {
    throw error;
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{"Addon Groups"}</Heading>
        <div className="flex items-center justify-center gap-x-2">
          <Button size="small" variant="secondary" asChild>
            <Link to="create">{"Create"}</Link>
          </Button>
        </div>
      </div>
      <DataTable
        data={addon_groups ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        rowCount={count}
        pageSize={PAGE_SIZE}
        filters={filters}
        enableSearch
        rowHref={(row) => `/addon-groups/${row.id}`}
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

const columnHelper = createColumnHelper<HttpTypes.AdminAddonGroup>();
const useColumns = () => {
  const { t } = useTranslation();
  const base = useMemo(
    () => [
      columnHelper.accessor("title", {
        header: t("fields.title"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("handle", {
        header: t("fields.handle"),
        cell: ({ getValue }) => <TextCell text={`/${getValue()}`} />,
      }),
    ],
    [t]
  );
  const columns = useMemo(
    () => [
      ...base,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return <AddonGroupActions addonGroup={row.original} />;
        },
      }),
    ],
    [base]
  );

  return columns;
};

type AddonGroupActionsProps = {
  addonGroup: HttpTypes.AdminAddonGroup;
};
const AddonGroupActions = ({ addonGroup }: AddonGroupActionsProps) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useDeleteAddonGroup(addonGroup.id);

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("addonGroups.deleteWarning", {
        title: addonGroup.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    await mutateAsync(undefined, {
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
