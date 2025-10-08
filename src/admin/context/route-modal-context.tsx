import { PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { Path, useNavigate } from "react-router-dom";
import { createContext } from "react";

type RouteModalProviderProps = PropsWithChildren<{
  prev: string | Partial<Path>;
}>;

export const RouteModalProvider = ({
  prev,
  children,
}: RouteModalProviderProps) => {
  const navigate = useNavigate();

  const [closeOnEscape, setCloseOnEscape] = useState(true);

  const handleSuccess = useCallback(
    (path?: string) => {
      const to = path || prev;
      navigate(to, { replace: true, state: { isSubmitSuccessful: true } });
    },
    [navigate, prev]
  );

  const value = useMemo(
    () => ({
      handleSuccess,
      setCloseOnEscape,
      __internal: { closeOnEscape },
    }),
    [handleSuccess, setCloseOnEscape, closeOnEscape]
  );

  return (
    <RouteModalProviderContext.Provider value={value}>
      {children}
    </RouteModalProviderContext.Provider>
  );
};

type RouteModalProviderState = {
  handleSuccess: (path?: string) => void;
  setCloseOnEscape: (value: boolean) => void;
  __internal: {
    closeOnEscape: boolean;
  };
};

export const RouteModalProviderContext =
  createContext<RouteModalProviderState | null>(null);

export const useRouteModal = () => {
  const context = useContext(RouteModalProviderContext);

  if (!context) {
    throw new Error("useRouteModal must be used within a RouteModalProvider");
  }

  return context;
};
