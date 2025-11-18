import { Button, Checkbox, Heading, Hint, toast, Tooltip } from "@medusajs/ui";
import { useMemo, useState } from "react";
import { createColumnHelper, RowSelectionState } from "@tanstack/react-table";
import * as zod from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouteModal } from "../../../../context/route-modal-context";
import { RouteFocusModal } from "../../../../components/route-focus-modal";
import { KeyboundForm } from "../../../../components/keyboard-form";
import { HttpTypes } from "../../../../../types/addons";
import { useUpdateProductAddonGroups } from "../../../../hooks/api/products";
import { DataTable } from "../../../../components/ui/data-table";
import { useAddonGroups } from "../../../../hooks/api/addon-groups";
import { useAddonGroupTableColumns } from "../../../addon-groups/_hooks/use-addon-group-table-columns";
import { useAddonGroupTableQuery } from "../../../addon-groups/_hooks/use-addon-group-table-query";

const PAGE_SIZE = 10;
const AddAddonGroupsToProductSchema = zod.object({
  add: zod.array(zod.string()).min(1),
});
interface Props {
  productId: string;
  existingAddonGroupIds: string[];
}
const LinkAddonGroupToProductForm = ({
  productId,
  existingAddonGroupIds,
}: Props) => {
  const { mutateAsync, isPending: isMutating } =
    useUpdateProductAddonGroups(productId);
  const { searchParams } = useAddonGroupTableQuery({
    pageSize: PAGE_SIZE,
  });
  const { addon_groups, count, isLoading } = useAddonGroups({
    limit: PAGE_SIZE,
    ...searchParams,
  });
  const form = useForm<zod.infer<typeof AddAddonGroupsToProductSchema>>({
    defaultValues: {
      add: [],
    },
    resolver: zodResolver(AddAddonGroupsToProductSchema),
  });
  const { setValue } = form;
  const handleSubmit = form.handleSubmit(async (values) => {
    await mutateAsync(
      {
        add: existingAddonGroupIds.concat(values.add),
      },
      {
        onSuccess: () => {
          toast.success("Addon groups added successfully");
          handleSuccess();
        },
        onError: (e) => {
          toast.error(e.message);
        },
      }
    );
  });
  const { handleSuccess } = useRouteModal();
  const columns = useColumns(existingAddonGroupIds);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
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
            data={addon_groups}
            isLoading={isLoading}
            rowCount={count}
            enableRowSelection
            columns={columns}
            enableSearch
            enablePagination
            rowSelection={{
              state: rowSelection,
              updater: (newSelection) => {
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
              },
            }}
          >
            <div className="px-6 py-4 flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
              <Heading>Addons</Heading>
              <DataTable.Search />
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

const columnHelper = createColumnHelper<HttpTypes.AdminAddonGroup>();

const useColumns = (productAddonGroupIds: string[]) => {
  const base = useAddonGroupTableColumns();
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
          const isAdded = productAddonGroupIds.includes(rowData.id);
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
    [base,productAddonGroupIds]
  );
};

export default LinkAddonGroupToProductForm;
