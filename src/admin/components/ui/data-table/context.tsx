"use client";
import * as React from "react";
import { UseDataTableReturn } from "@medusajs/ui";

type DataTableContextProviderProps<TData> = {
  instance: UseDataTableReturn<TData>;
  children: React.ReactNode;
};
interface DataTableContextValue<TData> {
  instance: UseDataTableReturn<TData>;
  enableColumnVisibility: boolean;
  enableColumnOrder: boolean;
}

const DataTableContext = React.createContext<DataTableContextValue<any> | null>(
  null
);

const DataTableContextProvider = <TData,>({
  instance,
  children,
}: DataTableContextProviderProps<TData>) => {
  return (
    <DataTableContext.Provider
      value={{
        instance,
        enableColumnVisibility: instance.enableColumnVisibility,
        enableColumnOrder: instance.enableColumnOrder,
      }}
    >
      {children}
    </DataTableContext.Provider>
  );
};

const useDataTableContext = <TData,>(): DataTableContextValue<TData> => {
  const context = React.useContext(DataTableContext);

  if (!context) {
    throw new Error(
      "useDataTableContext must be used within a DataTableContextProvider"
    );
  }

  return context;
};

export default DataTableContextProvider;
export { useDataTableContext };
