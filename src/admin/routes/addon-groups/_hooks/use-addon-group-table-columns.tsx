import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TextCell } from "../../../components/table/table-cells/common/text-cell";
import { HttpTypes } from "../../../../types/addons";

const columnHelper = createColumnHelper<HttpTypes.AdminAddonGroup>();

export const useAddonGroupTableColumns = () => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      columnHelper.accessor("title", {
        header: t("fields.title"),
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor("handle", {
        header: t("fields.handle"),
        cell: ({ getValue }) => <TextCell text={`/${getValue()}`} />,
      }),
    ],
    [t]
  );
};
