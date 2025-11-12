import * as React from "react";
import { Funnel } from "@medusajs/icons";
import {
  DropdownMenu,
  IconButton,
  Skeleton,
  Tooltip,
  UseDataTableReturn,
} from "@medusajs/ui";

interface DataTableFilterMenuProps<TData> {
  instance: UseDataTableReturn<TData>;
  tooltip?: string;
  onAddFilter?: (id: string, value: unknown) => void;
}

/**
 * This component adds a filter menu to the data table, allowing users
 * to filter the table's data.
 */
const DataTableFilterMenu = <TData,>({
  instance,
  tooltip,
  onAddFilter,
}: DataTableFilterMenuProps<TData>) => {
  const enabledFilters = Object.keys(instance.getFiltering());

  const filterOptions = instance
    .getFilters()
    .filter((filter) => !enabledFilters.includes(filter.id));

  if (!enabledFilters.length && !filterOptions.length) {
    throw new Error(
      "DataTable.FilterMenu was rendered but there are no filters to apply. Make sure to pass filters to 'useDataTable'"
    );
  }

  const Wrapper = tooltip ? Tooltip : React.Fragment;
  const wrapperProps = tooltip
    ? { content: tooltip, hidden: filterOptions.length === 0 }
    : ({} as any);

  if (instance.showSkeleton) {
    return <DataTableFilterMenuSkeleton />;
  }

  return (
    <DropdownMenu>
      <Wrapper {...wrapperProps}>
        <DropdownMenu.Trigger asChild disabled={filterOptions.length === 0}>
          <IconButton size="small">
            <Funnel />
          </IconButton>
        </DropdownMenu.Trigger>
      </Wrapper>
      <DropdownMenu.Content side="bottom" align="start">
        {filterOptions.map((filter) => {
          const getDefaultValue = () => {
            switch (filter.type) {
              case "select":
              case "multiselect":
                return [];
              case "string":
                return "";
              case "number":
                return null;
              case "date":
                return null;
              case "radio":
                return null;
              case "custom":
                return null;
              default:
                return null;
            }
          };

          return (
            <DropdownMenu.Item
              key={filter.id}
              onClick={(e) => {
                // Prevent any bubbling that might interfere
                e.stopPropagation();
                if (onAddFilter) {
                  onAddFilter(filter.id, getDefaultValue());
                } else {
                  instance.addFilter({
                    id: filter.id,
                    value: getDefaultValue(),
                  });
                }
              }}
            >
              {filter.label}
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};
DataTableFilterMenu.displayName = "DataTable.FilterMenu";

const DataTableFilterMenuSkeleton = () => {
  return <Skeleton className="size-7" />;
};

export { DataTableFilterMenu };
export type { DataTableFilterMenuProps };
