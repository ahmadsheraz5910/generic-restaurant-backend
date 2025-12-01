import {
  AddToCartWorkflowInputDTO,
  CreateCartCreateLineItemDTO,
  UpdateLineItemWithoutSelectorDTO,
} from "@medusajs/framework/types";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  addToCartWorkflow,
  updateLineItemInCartWorkflow,
  updateLineItemsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { getAddonVariantPricingStep } from "./steps/get-addon-variant-prices";
import AddonGroupProductLink from "../links/addon-group_product";
import { validateAddonVariantLineItemStep } from "./steps/validate-addon-variant-item";
import { groupBy } from "lodash";
/**
 * Workflow to add addon items to a cart.
 * It takes in an array of items, each item being a line item with a product-variant and an array of addon variant ids.
 * It will then ensure that that addon variants are valid for the given product variant, and then add the line items to the cart.
 * It will then calculate the price of the addon variants and make them seperate line item using unit_price and quantity 1.
 * It will then add the base line item for the product variant.
 * Run the existing add-to-cart workflow to add the line items to the cart.
 */
interface AddAddonItemToCartWorkflowInputDTO extends AddToCartWorkflowInputDTO {
  items: (CreateCartCreateLineItemDTO & {
    variant_id: string;
    addon_variant_ids: string[];
  })[];
}
export const addAddonItemToCartWorkflowId = "add-addon-item-to-cart";
export const addAddonItemToCartWorkflow = createWorkflow(
  {
    name: addAddonItemToCartWorkflowId,
    idempotent: false,
  },
  (input: AddAddonItemToCartWorkflowInputDTO) => {
    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: [
        "id",
        "sales_channel_id",
        "currency_code",
        "region_id",
        "shipping_address.city",
        "shipping_address.country_code",
        "shipping_address.province",
        "shipping_address.postal_code",
        "item_total",
        "total",
        "customer.id",
        "email",
        "customer.groups.id",
        "items.id",
        "items.metadata",
        "items.quantity",
      ],
      options: { throwIfKeyNotFound: true, isList: false },
    }).config({ name: "get-cart" });

    const variantIds = transform(input, (data) => {
      return {
        variantIds: data.items.map((i) => i.variant_id),
        addonVariantIds: data.items.map((i) => i.addon_variant_ids).flat(),
      };
    });

    const { data: productVariants } = useQueryGraphStep({
      entity: "variants",
      filters: { id: variantIds.variantIds },
      fields: ["id", "product_id"],
      options: { isList: true, throwIfKeyNotFound: true },
    }).config({ name: "get-product-variants" });

    const { data: addonVariants } = useQueryGraphStep({
      entity: "addon_variants",
      filters: { id: variantIds.addonVariantIds },
      fields: [
        "id",
        "title",
        "addon.id",
        "addon.title",
        "addon.addon_group_id",
      ],
      options: { isList: true, throwIfKeyNotFound: true },
    }).config({ name: "get-addon-variants" });

    const addonGroupIds = transform(
      { addonVariants: addonVariants as any },
      (data) => {
        return data.addonVariants
          .map((av) => av.addon?.addon_group_id)
          .filter((a) => !!a) as unknown as string[];
      }
    );
    const { data: productAddonGroupLinks } = useQueryGraphStep({
      entity: AddonGroupProductLink.entryPoint,
      fields: ["*", "product_id", "addon_group_id"],
      filters: {
        addon_group_id: addonGroupIds,
      },
      options: { isList: true, throwIfKeyNotFound: true },
    }).config({ name: "get-product-addon-groups" });

    const items = transform(
      { input, productVariants, productAddonGroupLinks, addonVariants },
      (data) =>
        data.input.items.map((item) => {
          return {
            ...item,
            //It should be safe to assume that the variant exists
            variant: data.productVariants.find((v) => v.id === item.variant_id),
            addonVariants: data.addonVariants
              .filter((av) => item.addon_variant_ids.includes(av.id))
              .map((av) => ({
                ...av,
                addon: {
                  ...av.addon,
                  addonGroup: {
                    id: av.addon?.addon_group_id,
                    products: data.productAddonGroupLinks
                      .filter(
                        (link) =>
                          link.addon_group_id === av.addon?.addon_group_id
                      )
                      .map((pag) => ({ id: pag.product_id })),
                  },
                },
              })),
          };
        })
    );

    validateAddonVariantLineItemStep({
      //@ts-ignore
      items,
    });

    const cartPricingContext = {
      currency_code: cart.currency_code ?? cart.region?.currency_code,
      region_id: cart.region_id,
      region: cart.region,
      customer_id: cart.customer_id,
      customer: cart.customer,
    } as unknown as Record<string, string | number>;

    const addonVariantsWithCalculatedPrice = getAddonVariantPricingStep({
      addon_variant_ids: variantIds.addonVariantIds,
      context: cartPricingContext,
    });

    const prepareCartItems = transform(
      { cart, addonVariantsWithCalculatedPrice, items },
      (data) => {
        const newItems = [] as CreateCartCreateLineItemDTO[];
        const existingItems = [] as UpdateLineItemWithoutSelectorDTO[];
        for (const item of data.items) {
          const {
            addon_variant_ids,
            variant,
            addonVariants,
            variant_id,
            ...rest
          } = item;
          const addonVariantsGroupByAddonGroups = groupBy(
            addonVariants,
            "addon.addon_group_id"
          );

          // Currently addon_group_id is not necessary, since one addon can only be added to one addon group
          const uniqueVariantAddonId = `${variant?.id}_${Object.entries(
            addonVariantsGroupByAddonGroups
          )
            .map(([key, avs]) => `${key}-${avs.map((av) => av.id).join(",")}`)
            .join(",")}`;

          const existingLItems = data.cart.items.filter(
            (i) => i?.metadata?.uniqueVariantAddonId === uniqueVariantAddonId
          );

          if (existingLItems.length) {
            existingItems.push(
              ...existingLItems.map((i) => ({
                id: i?.id ?? "",
                quantity: (i?.quantity ?? 0) + 1,
              }))
            );
            continue;
          }
          // Creating line items for each addon variant with the calculated price
          const addonItems = addonVariants.map((av) => {
            const avCalculatedPrice =
              data.addonVariantsWithCalculatedPrice.find(
                (avcp) => avcp.id === av.id
              );

            return {
              ...rest,
              unit_price: avCalculatedPrice?.calculated_price.calculated_amount,
              title: av?.addon?.title,
              thumbnail: av?.addon?.thumbnail,
              product_id: variant?.product_id,
              metadata: {
                uniqueVariantAddonId,
                linked_variant_id: variant?.id,
                addon_variant_id: av.id,
                addon_variant_title: av.title,
                addon_id: av?.addon?.id,
                addon_title: av?.addon?.title,
                addon_group_id: av?.addon?.addon_group_id,
              },
            } as CreateCartCreateLineItemDTO;
          });
          newItems.push(...addonItems);

          // Adding the base line item for the variant
          newItems.push({
            ...rest,
            variant_id: variant?.id,
            metadata: {
              ...rest.metadata,
              uniqueVariantAddonId,
            },
          });
        }
        return {
          newItems,
          existingItems,
        };
      }
    );

    addToCartWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        items: prepareCartItems.newItems,
      },
    });

    updateLineItemsStep({
      id: input.cart_id,
      items: prepareCartItems.existingItems,
    });

    return new WorkflowResponse(void 0);
  }
);
