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
import {
  createColumnHelper,
  OnChangeFn,
  RowSelectionState,
} from "@tanstack/react-table";
import * as zod from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouteModal } from "../../../../context/route-modal-context";
import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { KeyboundForm } from "../../../../components/keyboard-form";
import { useAddons } from "../../../../hooks/api/addons";
import { HttpTypes } from "../../../../../types/addons";
import { useAddonTableColumns } from "../../../addons/_hooks/use-addon-table-columns";
import { useUpdateAddonGroupAddons } from "../../../../hooks/api/addon-groups";

const PAGE_SIZE = 10;
const AddAddonsToAddonGroupSchema = zod.object({
  add: zod.array(zod.string()).min(1),
});
interface Props {
  addonGroupId: string;
  addonGroupAddonIds: string[];
}
const AddonGroupAddonsForm = ({ addonGroupId, addonGroupAddonIds }: Props) => {
  const { mutateAsync, isPending: isMutating } = useUpdateAddonGroupAddons(
    addonGroupId as string
  );
  const form = useForm<zod.infer<typeof AddAddonsToAddonGroupSchema>>({
    defaultValues: {
      add: [],
    },
    resolver: zodResolver(AddAddonsToAddonGroupSchema),
  });
  const { setValue } = form;
  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        add: addonGroupAddonIds.concat(values.add),
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
  const { handleSuccess } = useRouteModal();

  /** Table  */
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: PAGE_SIZE,
    pageIndex: 0,
  });
  const [search, setSearch] = useState<string>("");
  const [sorting, setSorting] = useState<DataTableSortingState | null>(null);
  const { addons, count } = useAddons({
    limit: PAGE_SIZE,
    q: search,
  });
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
  const columns = useColumns(addonGroupAddonIds);
  const table = useDataTable({
    data: addons ?? [],
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
              <Heading>Addons</Heading>
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

const columnHelper = createColumnHelper<HttpTypes.AdminAddon>();

const useColumns = (addonGroupAddonIds: string[]) => {
  const base = useAddonTableColumns();
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
          const isAdded = addonGroupAddonIds.includes(rowData.id);
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

export default AddonGroupAddonsForm;
