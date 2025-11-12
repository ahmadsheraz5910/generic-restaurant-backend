import {
  DataTable as UiDataTable,
  DataTableColumnDef,
  DataTableCommand,
  DataTableEmptyStateProps,
  DataTableFilter,
  DataTableRow,
  DataTableRowSelectionState,
  useDataTable,
  DataTableFilteringState,
  DataTablePaginationState,
  DataTableSortingState,
} from "@medusajs/ui";
import React, { PropsWithChildren, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryParams } from "../../../hooks/use-query-params";
import DataTableContextProvider, { useDataTableContext } from "./context";
import { DataTableFilterBar } from "./data-table-filter-bar";

function transformSortingState(value: DataTableSortingState) {
  return value.desc ? `-${value.id}` : value.id;
}

function parseSortingState(value: string) {
  return value.startsWith("-")
    ? { id: value.slice(1), desc: true }
    : { id: value, desc: false };
}

function transformPaginationState(value: DataTablePaginationState) {
  return value.pageIndex * value.pageSize;
}

function parsePaginationState(value: string, pageSize: number) {
  const offset = parseInt(value);

  return {
    pageIndex: Math.floor(offset / pageSize),
    pageSize,
  };
}

function parseFilterState(
  filterIds: string[],
  value: Record<string, string | undefined>
) {
  if (!value) {
    return {};
  }

  const filters: DataTableFilteringState = {};

  for (const id of filterIds) {
    const filterValue = value[id];

    if (filterValue !== undefined) {
      filters[id] = filterValue;
    }
  }

  return filters;
}

function getQueryParamKey(key: string, prefix?: string) {
  return prefix ? `${prefix}_${key}` : key;
}

const useDataTableTranslations = () => {
  const { t } = useTranslation();

  const paginationTranslations = {
    of: t("general.of"),
    results: t("general.results"),
    pages: t("general.pages"),
    prev: t("general.prev"),
    next: t("general.next"),
  };

  const toolbarTranslations = {
    clearAll: t("actions.clearAll"),
    sort: t("filters.sortLabel"),
    columns: "Columns",
  };

  return {
    pagination: paginationTranslations,
    toolbar: toolbarTranslations,
  };
};

// Types for column visibility and ordering
type VisibilityState = Record<string, boolean>;

interface DataTableProps<TData> {
  data?: TData[];
  columns: DataTableColumnDef<TData, any>[];
  filters?: DataTableFilter[];
  commands?: DataTableCommand[];
  rowCount?: number;
  getRowId: (row: TData) => string;
  rowHref?: (row: TData) => string;
  enablePagination?: boolean;
  enableSearch?: boolean;
  prefix?: string;
  pageSize?: number;

  rowSelection?: {
    state: DataTableRowSelectionState;
    onRowSelectionChange: (value: DataTableRowSelectionState) => void;
    enableRowSelection?: boolean | ((row: DataTableRow<TData>) => boolean);
  };
  isLoading?: boolean;
  layout?: "fill" | "auto";
  initialColumnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
}
const Root = <TData,>({
  data = [],
  columns,
  filters,
  commands,
  rowCount = 0,
  getRowId,
  rowHref,
  enablePagination = true,
  enableSearch = true,
  prefix,
  pageSize = 10,
  rowSelection,
  isLoading = false,
  layout = "auto",
  initialColumnVisibility = {},
  onColumnVisibilityChange,
  children,
}: PropsWithChildren<DataTableProps<TData>>) => {
  const navigate = useNavigate();
  const enableFiltering = filters && filters.length > 0;
  const enableSorting = columns.some((column) => column.enableSorting);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>(initialColumnVisibility);

  // Update column visibility when initial visibility changes
  React.useEffect(() => {
    // Deep compare to check if the visibility has actually changed
    const currentKeys = Object.keys(columnVisibility).sort();
    const newKeys = Object.keys(initialColumnVisibility).sort();

    const hasChanged =
      currentKeys.length !== newKeys.length ||
      currentKeys.some((key, index) => key !== newKeys[index]) ||
      Object.entries(initialColumnVisibility).some(
        ([key, value]) => columnVisibility[key] !== value
      );

    if (hasChanged) {
      setColumnVisibility(initialColumnVisibility);
    }
  }, [initialColumnVisibility]);

  // Wrapper function to handle column visibility changes
  const handleColumnVisibilityChange = React.useCallback(
    (visibility: VisibilityState) => {
      setColumnVisibility(visibility);
      onColumnVisibilityChange?.(visibility);
    },
    [onColumnVisibilityChange]
  );

  // Extract filter IDs for query param management
  const filterIds = useMemo(() => filters?.map((f) => f.id) ?? [], [filters]);
  const prefixedFilterIds = filterIds.map((id) => getQueryParamKey(id, prefix));

  const { offset, order, q, ...filterParams } = useQueryParams(
    [
      ...filterIds,
      ...(enableSorting ? ["order"] : []),
      ...(enableSearch ? ["q"] : []),
      ...(enablePagination ? ["offset"] : []),
    ],
    prefix
  );
  const [_, setSearchParams] = useSearchParams();

  const search = useMemo(() => {
    return q ?? "";
  }, [q]);

  const handleSearchChange = (value: string) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set(getQueryParamKey("q", prefix), value);
      } else {
        prev.delete(getQueryParamKey("q", prefix));
      }

      return prev;
    });
  };

  const pagination: DataTablePaginationState = useMemo(() => {
    return offset
      ? parsePaginationState(offset, pageSize)
      : { pageIndex: 0, pageSize };
  }, [offset, pageSize]);

  const handlePaginationChange = (value: DataTablePaginationState) => {
    setSearchParams((prev) => {
      if (value.pageIndex === 0) {
        prev.delete(getQueryParamKey("offset", prefix));
      } else {
        prev.set(
          getQueryParamKey("offset", prefix),
          transformPaginationState(value).toString()
        );
      }
      return prev;
    });
  };

  const filtering: DataTableFilteringState = useMemo(
    () => parseFilterState(filterIds, filterParams),
    [filterIds, filterParams]
  );

  const handleFilteringChange = (value: DataTableFilteringState) => {
    setSearchParams((prev) => {
      // Remove filters that are no longer in the state
      Array.from(prev.keys()).forEach((key) => {
        if (prefixedFilterIds.includes(key)) {
          // Extract the unprefixed key
          const unprefixedKey = prefix ? key.replace(`${prefix}_`, "") : key;
          if (!(unprefixedKey in value)) {
            prev.delete(key);
          }
        }
      });
      // Add or update filters in the state
      Object.entries(value).forEach(([key, filter]) => {
        const prefixedKey = getQueryParamKey(key, prefix);
        if (filter !== undefined) {
          if (Array.isArray(filter)) {
            prev.set(prefixedKey, filter.join(","));
          } else if (typeof filter === "object") {
            prev.set(prefixedKey, JSON.stringify(filter));
          } else {
            prev.set(prefixedKey, filter.toString());
          }
        } else {
          prev.delete(prefixedKey);
        }
      });
      return prev;
    });
  };
  const sorting: DataTableSortingState | null = useMemo(() => {
    return order ? parseSortingState(order) : null;
  }, [order]);

  const handleSortingChange = (value: DataTableSortingState) => {
    setSearchParams((prev) => {
      if (value) {
        const valueToStore = transformSortingState(value);

        prev.set(getQueryParamKey("order", prefix), valueToStore);
      } else {
        prev.delete(getQueryParamKey("order", prefix));
      }

      return prev;
    });
  };

  const onRowClick = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>, row: TData) => {
      if (!rowHref) {
        return;
      }

      const href = rowHref(row);

      if (event.metaKey || event.ctrlKey || event.button === 1) {
        window.open(href, "_blank", "noreferrer");
        return;
      }

      if (event.shiftKey) {
        window.open(href, undefined, "noreferrer");
        return;
      }

      navigate(href);
    },
    [navigate, rowHref]
  );
  const instance = useDataTable({
    data,
    columns,
    filters,
    commands,
    rowCount,
    getRowId,
    onRowClick: rowHref ? onRowClick : undefined,
    pagination: enablePagination
      ? {
          state: pagination,
          onPaginationChange: handlePaginationChange,
        }
      : undefined,
    filtering: enableFiltering
      ? {
          state: filtering,
          onFilteringChange: handleFilteringChange,
        }
      : undefined,
    sorting: enableSorting
      ? {
          state: sorting,
          onSortingChange: handleSortingChange,
        }
      : undefined,
    search: enableSearch
      ? {
          state: search,
          onSearchChange: handleSearchChange,
        }
      : undefined,
    rowSelection,
    isLoading,
    columnVisibility: {
      state: columnVisibility,
      onColumnVisibilityChange: handleColumnVisibilityChange,
    },
  });

  return (
    <DataTableContextProvider instance={instance}>
      <UiDataTable
        instance={instance}
        className={
          layout === "fill" ? "h-full [&_tr]:last-of-type:!border-b" : undefined
        }
      >
        {children}
      </UiDataTable>
    </DataTableContextProvider>
  );
};
const Pagination = () => {
  const { instance } = useDataTableContext();
  const { pagination: paginationTranslations } = useDataTableTranslations();
  const isPaginationEnabled = instance.enablePagination;
  if (!isPaginationEnabled) {
    return null;
  }
  return <UiDataTable.Pagination translations={paginationTranslations} />;
};
const CommandBar = () => {
  const { instance } = useDataTableContext();
  const isCommandBarEnabled = instance.getCommands().length > 0;

  if (!isCommandBarEnabled) {
    return null;
  }
  return (
    <UiDataTable.CommandBar selectedLabel={(count) => `${count} selected`} />
  );
};
const SortingMenu = () => {
  const { instance } = useDataTableContext();

  // Check if sorting is enabled
  const sortableColumns = instance
    .getAllColumns()
    .filter((column) => column.getCanSort());
  const hasSorting = instance.enableSorting && sortableColumns.length > 0;
  if (!hasSorting) {
    return null;
  }
  return <UiDataTable.SortingMenu />;
};

interface DataTableSearchProps {
  autoFocusSearch?: boolean;
}
const Search = ({ autoFocusSearch = false }: DataTableSearchProps) => {
  const { t } = useTranslation();
  return (
    <UiDataTable.Search
      placeholder={t("filters.searchLabel")}
      autoFocus={autoFocusSearch}
    />
  );
};

interface DataTableTableProps {
  emptyState?: DataTableEmptyStateProps;
}
const Table = ({ emptyState }: DataTableTableProps) => {
  return <UiDataTable.Table emptyState={emptyState} />;
};

const FilterBar = () => {
  const { instance } = useDataTableContext();
  return <DataTableFilterBar instance={instance} />;
};
export const DataTable = Object.assign(Root, {
  Pagination,
  CommandBar,
  Search,
  Table,
  FilterBar,
  SortingMenu,
});
