export const buildItemSignature = (item: {
  variant_id: string;
  addon_variants:
    | Array<{
        id: string;
      }>
    | string[];
}) => {
  return `${item.variant_id}-${item.addon_variants
    .map((av) => (typeof av === "string" ? av : av.id))
    .sort()
    .join(",")}`;
};
