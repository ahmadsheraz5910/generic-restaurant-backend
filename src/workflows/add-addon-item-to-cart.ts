import {
  AddToCartWorkflowInputDTO,
  CreateCartCreateLineItemDTO,
} from "@medusajs/framework/types";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  addToCartWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import { getAddonVariantPricingStep } from "./steps/get-addon-variant-prices";
import AddonGroupProductLink from "../links/addon-group_product";
import { validateAddonVariantLineItemStep } from "./steps/validate-addon-variant-item";
import { isPresent } from "@medusajs/framework/utils";
import { randomUUID } from "crypto";

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

    const prepareCartInput = transform(
      { addonVariantsWithCalculatedPrice, items },
      (data) => {
        return data.items
          .map((item) => {
            const {
              addon_variant_ids,
              variant,
              addonVariants,
              variant_id,
              ...rest
            } = item;
            const addonVariantsPrices =
              data.addonVariantsWithCalculatedPrice.filter((av) =>
                addon_variant_ids.includes(av.id)
              );
            const uniqueVariantAddonId = `${variant?.id}-${randomUUID()}`;
            // Creating line items for each addon variant with the calculated price
            const items = addonVariantsPrices.map((av) => {
              const addonVariantData = addonVariants.find(
                (av) => av.id === av.id
              );
              return {
                ...rest,
                unit_price: av.calculated_price.calculated_amount,
                title: addonVariantData?.addon?.title,
                thumbnail: addonVariantData?.addon?.thumbnail,
                product_id: variant?.product_id,
                metadata: {
                  uniqueVariantAddonId,
                  linked_variant_id: variant?.id,
                  addon_variant_id: av.id,
                  addon_variant_title: av.title,
                  addon_id: addonVariantData?.addon?.id,
                  addon_title: addonVariantData?.addon?.title,
                  addon_group_id: addonVariantData?.addon?.addon_group_id,
                },
              } as CreateCartCreateLineItemDTO;
            });

            // Adding the base line item for the variant
            items.push({
              ...rest,
              variant_id: variant?.id,
              metadata: {
                ...rest.metadata,
                uniqueVariantAddonId,
              },
            } as CreateCartCreateLineItemDTO);

            return items;
          })
          .flat();
      }
    );

    const response = addToCartWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        items: prepareCartInput,
      },
    });

    return new WorkflowResponse(response);
  }
);
