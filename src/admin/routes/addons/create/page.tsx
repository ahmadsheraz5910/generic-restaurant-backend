import { defineRouteConfig } from "@medusajs/admin-sdk";
import { RouteFocusModal } from "../../../components/route-focus-modal";
import { CreateAddonForm } from "../_components/create-addon-form";
import { useStore } from "../../../hooks/api/store";
import { useMemo } from "react";

export const AddonCreate = () => {
  const {
    store,
    isPending: isStorePending,
    isError: isStoreError,
    error: storeError,
  } = useStore({
    fields: "+default_sales_channel",
  });

  if (isStoreError) {
    throw storeError;
  }

  const currencyCodes = useMemo(
    () => store?.supported_currencies.map((c) => c.currency) || [],
    [store]
  );

  return (
    <RouteFocusModal>
      {!isStorePending ? (
        <CreateAddonForm currencyInfo={currencyCodes} />
      ) : null}
    </RouteFocusModal>
  );
};

export const config = defineRouteConfig({});

export default AddonCreate;
