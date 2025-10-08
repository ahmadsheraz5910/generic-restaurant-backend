import { defineWidgetConfig } from "@medusajs/admin-sdk";
import {
  DetailWidgetProps,
  AdminProduct,
  HttpTypes,
} from "@medusajs/framework/types";
import { PencilSquare, Plus, Trash } from "@medusajs/icons";
import {
  Checkbox,
  Container,
  DataTable,
  DataTablePaginationState,
  DataTableSortingState,
  Heading,
  toast,
  useDataTable,
  usePrompt,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/table-core";
import { useCollections } from "../hooks/api/collections";
import { useCollectionTableColumns } from "../hooks/table/columns/use-collection-table-columns";
import { ActionMenu } from "../components/ActionMenu";
import { useTranslation } from "react-i18next";
import { useUpdateProduct } from "../hooks/api/products";

type Props = DetailWidgetProps<AdminProduct>;
const PAGE_SIZE = 10;
const columnHelper = createColumnHelper<HttpTypes.AdminCollection>();

const ProductAddonWidget = ({ data: product }: Props) => {
  let addOnCollectionsIds: string[] = [];
  if (Array.isArray(product.metadata?.addOnCollectionIds)) {
    addOnCollectionsIds = product.metadata.addOnCollectionIds ?? [];
  }
  const { collections, count, isLoading, isError, error } = useCollections(
    {
      limit: PAGE_SIZE,
      id: addOnCollectionsIds,
    },
    {
      enabled: !!addOnCollectionsIds.length,
    }
  );

  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: PAGE_SIZE,
    pageIndex: 0,
  });
  const columns = useColumns({
    productId: product.id,
    addOnCollectionsIds,
  });
  const [search, setSearch] = useState<string>("");
  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);
  const table = useDataTable({
    data: collections ?? [],
    columns,
    getRowId: (row) => row.id,
    rowCount: count,
    isLoading: isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    search: {
      state: search,
      onSearchChange: setSearch,
    },
    sorting: {
      state: sorting,
      onSortingChange: setSorting,
    },
  });

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
                  label: "Add collection",
                  to: "add-on",
                },
              ],
            },
          ]}
        />
      </div>
      <DataTable instance={table}>
        <div className="px-6 py-4 border-t flex flex-col justify-end gap-2 md:flex-row md:items-center">
          <DataTable.Search placeholder="Search..." />
        </div>
        <DataTable.Table
          emptyState={{
            empty: {
              heading: "No add-ons found",
            },
          }}
        />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

const useColumns = ({
  productId,
  addOnCollectionsIds,
}: {
  productId: string;
  addOnCollectionsIds: Array<string>;
}) => {
  const baseColumns = useCollectionTableColumns();
  return useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => {
          return (
            <Checkbox
              checked={
                table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : table.getIsAllPageRowsSelected()
              }
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(!!value)
              }
            />
          );
        },
        cell: ({ row }) => {
          return (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          );
        },
      }),
      ...baseColumns,
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return (
            <AddonActions
              collectionId={row.original.id}
              addOnCollectionIds={addOnCollectionsIds}
              productId={productId}
            />
          );
        },
      }),
    ],
    [baseColumns]
  );
};

const AddonActions = ({
  addOnCollectionIds,
  productId,
  collectionId,
}: {
  productId: string;
  addOnCollectionIds: string[];
  collectionId: string;
}) => {
  const { t } = useTranslation();
  const prompt = usePrompt();
  const { mutateAsync } = useUpdateProduct(productId);

  const handleRemove = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("collections.removeSingleProductWarning", {
        title: "Product",
      }),
      confirmText: t("actions.remove"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }
    await mutateAsync(
      {
        metadata: {
          addOnCollectionIds: addOnCollectionIds.filter(
            (id) => id !== collectionId
          ),
        },
      },
      {
        onSuccess: () => {
          toast.success(
            t("collections.products.remove.successToast", {
              count: 1,
            })
          );
        },
        onError: (e) => {
          toast.error(e.message);
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
              to: `/collections/${collectionId}/edit`,
            },
          ],
        },
        {
          actions: [
            {
              icon: <Trash />,
              label: t("actions.remove"),
              onClick: handleRemove,
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
export default ProductAddonWidget;
