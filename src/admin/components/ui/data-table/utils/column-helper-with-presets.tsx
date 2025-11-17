import { createColumnHelper } from "@tanstack/react-table";
import { Checkbox } from "@medusajs/ui";
export const createColumnHelperWithPresets = <T,>() => {
  const columnHelper = createColumnHelper<T>();
  return Object.assign(columnHelper, {
    displayRowSelection: () => {
      return columnHelper.display({
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
      });
    },
  });
};
