import { HttpTypes } from "../../../../types/addons"
import { useQueryParams } from "../../use-query-params"

type UseAddonTableQueryProps = {
  prefix?: string
  pageSize?: number
}

const DEFAULT_FIELDS =
  "id,title,handle,status,thumbnail"

export const useAddonTableQuery = ({
  prefix,
  pageSize = 20,
}: UseAddonTableQueryProps) => {
  const queryObject = useQueryParams(
    [
      "offset",
      "order",
      "q",
      "created_at",
      "updated_at",
      "status",
      "id",
    ],
    prefix
  )

  const {
    offset,
    created_at,
    updated_at,
    status,
    order,
    q,
  } = queryObject

  const searchParams: HttpTypes.AdminAddonListParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    created_at: created_at ? JSON.parse(created_at) : undefined,
    updated_at: updated_at ? JSON.parse(updated_at) : undefined,
    order: order,
    status: status?.split(",") as HttpTypes.AdminAddonStatus[],
    q,
    fields: DEFAULT_FIELDS,
  }

  return {
    searchParams,
    raw: queryObject,
  }
}