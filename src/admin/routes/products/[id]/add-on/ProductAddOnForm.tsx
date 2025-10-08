import {
  Button,
  Checkbox,
  DataTable,
  DataTablePaginationState,
  DataTableSortingState,
  Heading,
  Hint,
  toast,
  Tooltip,
  useDataTable,
} from "@medusajs/ui";
import { useMemo, useState } from "react";
import { HttpTypes } from "@medusajs/framework/types";
import {
  createColumnHelper,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import * as zod from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouteModal } from "../../../../context/route-modal-context";
import { useUpdateProduct } from "../../../../hooks/api/products";
import { useCollections } from "../../../../hooks/api/collections";
import { useCollectionTableColumns } from "../../../../hooks/table/columns/use-collection-table-columns";
import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { KeyboundForm } from "../../../../components/keyboard-form";

const PAGE_SIZE = 10;
const AddProductsToCollectionSchema = zod.object({
  add: zod.array(zod.string()).min(1),
});
interface Props {
  productId: string;
  addOnCollectionIds: string[];
}
const ProductAddOnForm = ({ productId, addOnCollectionIds }: Props) => {
  const { handleSuccess } = useRouteModal();
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: PAGE_SIZE,
    pageIndex: 0,
  });
  const [search, setSearch] = useState<string>("");
  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);
  const { mutateAsync, isPending: isMutating } = useUpdateProduct(
    productId as string
  );
  const { collections, count } = useCollections({
    limit: PAGE_SIZE,
    q: search,
  });
  const form = useForm<zod.infer<typeof AddProductsToCollectionSchema>>({
    defaultValues: {
      add: [],
    },
    resolver: zodResolver(AddProductsToCollectionSchema),
  });
  const { setValue } = form;
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const updater: OnChangeFn<RowSelectionState> = (newSelection) => {
    const update =
      typeof newSelection === "function"
        ? newSelection(rowSelection)
        : newSelection;

    setValue(
      "add",
      Object.keys(update).filter((k) => update[k]),
      {
        shouldDirty: true,
        shouldTouch: true,
      }
    );

    setRowSelection(update);
  };

  const columns = useColumns(addOnCollectionIds);
  const table = useDataTable({
    data:
      collections?.filter(
        (collection) => !addOnCollectionIds.includes(collection.id)
      ) ?? [],
    columns,
    getRowId: (row) => row.id,
    rowCount: count,
    rowSelection: {
      state: rowSelection,
      onRowSelectionChange: updater,
    },
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

  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        metadata: {
          addOnCollectionIds: addOnCollectionIds.concat(values.add),
        },
      },
      {
        onSuccess: () => {
          toast.success("Collections added successfully");
          handleSuccess();
        },
        onError: (e) => {
          toast.error(e.message);
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
        <RouteFocusModal.Header>
          <div className="flex items-center justify-end gap-x-2">
            {form.formState.errors.add && (
              <Hint variant="error">{form.formState.errors.add.message}</Hint>
            )}
          </div>
        </RouteFocusModal.Header>
        <RouteFocusModal.Body className="size-full overflow-hidden">
          <DataTable
            instance={table}
            className={"h-full [&_tr]:last-of-type:!border-b"}
          >
            <div className="px-6 py-4 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <Heading>Collections</Heading>
              <DataTable.Search placeholder="Search..." />
            </div>

            <DataTable.Table />
            <DataTable.Pagination />
          </DataTable>
        </RouteFocusModal.Body>
        <RouteFocusModal.Footer>
          <RouteFocusModal.Close asChild>
            <Button size="small" variant="secondary">
              {"Cancel"}
            </Button>
          </RouteFocusModal.Close>
          <Button size="small" type="submit" isLoading={isMutating}>
            {"Save"}
          </Button>
        </RouteFocusModal.Footer>
      </KeyboundForm>
    </RouteFocusModal.Form>
  );
};

const columnHelper = createColumnHelper<HttpTypes.AdminCollection>();

const useColumns = (addOnCollectionIds: string[]) => {
  const base = useCollectionTableColumns();

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
        cell: ({ row, table }) => {
          const rowData = table.options.data[row.index];
          const isAdded = addOnCollectionIds.includes(rowData.id);
          const isSelected = row.getIsSelected() || isAdded;

          const Component = (
            <Checkbox
              checked={isSelected}
              disabled={isAdded}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          );

          if (isAdded) {
            return (
              <Tooltip content={"Already added"} side="right">
                {Component}
              </Tooltip>
            );
          }

          return Component;
        },
      }),
      ...base,
    ],
    [base]
  );
};

export default ProductAddOnForm;
