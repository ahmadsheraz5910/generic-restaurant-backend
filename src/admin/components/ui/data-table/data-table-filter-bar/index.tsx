"use client";
import * as React from "react";
import { UseDataTableReturn } from "@medusajs/ui";
import { DataTableFilter } from "./data-table-filter";
import { DataTableFilterMenu } from "./data-table-filter-menu";

interface DataTableFilterBarProps<TData> {
  instance: UseDataTableReturn<TData>;
}

interface LocalFilter {
  id: string;
  value: unknown;
  isNew: boolean;
}

const DataTableFilterBar = <TData,>({
  instance,
}: DataTableFilterBarProps<TData>) => {
  // Local state for managing intermediate filters
  const [localFilters, setLocalFilters] = React.useState<LocalFilter[]>([]);
  const parentFilterState = instance.getFiltering();
  const availableFilters = instance.getFilters();
  // Sync parent filters with local state
  React.useEffect(() => {
    setLocalFilters((prevLocalFilters) => {
      const parentIds = Object.keys(parentFilterState);
      const localIds = prevLocalFilters.map((f) => f.id);

      // Remove local filters that have been removed from parent
      const updatedLocalFilters = prevLocalFilters.filter(
        (f) => parentIds.includes(f.id) || f.isNew
      );

      // Add parent filters that don't exist locally
      parentIds.forEach((id) => {
        if (!localIds.includes(id)) {
          updatedLocalFilters.push({
            id,
            value: parentFilterState[id],
            isNew: false,
          });
        }
      });

      // Only update if there's an actual change
      if (
        updatedLocalFilters.length !== prevLocalFilters.length ||
        updatedLocalFilters.some((f, i) => f.id !== prevLocalFilters[i]?.id)
      ) {
        return updatedLocalFilters;
      }
      return prevLocalFilters;
    });
  }, [parentFilterState]);

  // Add a new filter locally
  const addLocalFilter = React.useCallback((id: string, value: unknown) => {
    setLocalFilters((prev) => [...prev, { id, value, isNew: true }]);
  }, []);

  // Update a local filter's value
  const updateLocalFilter = React.useCallback(
    (id: string, value: unknown) => {
      setLocalFilters((prev) =>
        prev.map((f) => (f.id === id ? { ...f, value, isNew: false } : f))
      );

      // If the filter has a meaningful value, propagate to parent
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !(Array.isArray(value) && value.length === 0)
      ) {
        instance.updateFilter({ id, value });
      }
    },
    [instance]
  );

  // Remove a local filter
  const removeLocalFilter = React.useCallback(
    (id: string) => {
      setLocalFilters((prev) => prev.filter((f) => f.id !== id));
      // Also remove from parent if it exists there
      if (parentFilterState[id] !== undefined) {
        instance.removeFilter(id);
      }
    },
    [instance, parentFilterState]
  );

  const filterCount = localFilters.length;
  const hasAvailableFilters = availableFilters.length > 0;

  if (filterCount === 0 && !hasAvailableFilters) {
    return null;
  }

  return (
    <div className="flex flex-nowrap items-center gap-2 md:flex-wrap">
      {localFilters.map((localFilter) => (
        <DataTableFilter
          instance={instance}
          key={localFilter.id}
          id={localFilter.id}
          filter={localFilter.value}
          isNew={localFilter.isNew}
          onUpdate={(value) => updateLocalFilter(localFilter.id, value)}
          onRemove={() => removeLocalFilter(localFilter.id)}
        />
      ))}
      {hasAvailableFilters && (
        <DataTableFilterMenu instance={instance} onAddFilter={addLocalFilter} />
      )}
    </div>
  );
};
DataTableFilterBar.displayName = "DataTable.FilterBar";

export { DataTableFilterBar };
export type { DataTableFilterBarProps };
