import {
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  acquireLockStep,
  createLineItemsStep,
  deleteLineItemsStep,
  releaseLockStep,
  updateLineItemInCartWorkflow,
  updateLineItemsStep,
  useQueryGraphStep,
  validateCartStep,
} from "@medusajs/medusa/core-flows";
import { cartFieldsForPricingContext } from "./utils/fields";
import {
  arrayDifference,
  isDefined,
  MathBN,
  MedusaError,
} from "@medusajs/framework/utils";
import { StoreCart } from "@medusajs/framework/types";
import { buildItemSignature } from "./utils/variant-addon-signature";
import { getAddonVariantPricingStep } from "../steps/get-addon-variant-prices";
import { validateAddonLineItemsStep } from "./steps/validate-addon-line-items";
import {
  createAddonVariantLinkedEntityMap,
  prepareAddonVariantItem,
  requiredFieldForAddonVariantLinkedEntityMap,
} from "./utils/helpers";

interface UpdateVariantAddonGroupInCartWorkflowInputDTO {
  cart_id: string;
  item: {
    id: string;
    quantity?: number;
    addon_variants?: Array<{
      id: string;
      quantity?: number;
    }>;
  };
}
const cartFields = cartFieldsForPricingContext.concat(["completed", "items.*"]);
export const updateVariantAddonGroupInCartWorkflowId =
  "update-variant-addon-group-to-cart";
export const updateVariantAddonGroupInCartWorkflow = createWorkflow(
  {
    name: updateVariantAddonGroupInCartWorkflowId,
    idempotent: false,
  },
  (input: UpdateVariantAddonGroupInCartWorkflowInputDTO) => {
    acquireLockStep({
      key: input.cart_id,
      timeout: 2,
      ttl: 10,
    });

    const { data: cart } = useQueryGraphStep({
      entity: "cart",
      filters: {
        id: input.cart_id,
      },
      fields: cartFields,
      options: {
        throwIfKeyNotFound: true,
        isList: false,
      },
    }).config({ name: "get-cart" });

    validateCartStep({ cart: cart as any });

    const cartItem = transform(
      { inputItem: input.item, cart: cart as unknown as StoreCart },
      (data) => {
        const cartItem = data.cart?.items?.find(
          (item) => item.id === data.inputItem.id && isDefined(item.variant_id)
        );
        if (!cartItem) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Items with id not found in cart: ${data.inputItem.id}`
          );
        }
        return cartItem;
      }
    );

    const addonVariantsMap = when(
      "should-validate-addon-variants",
      input.item,
      (data) => !!data.addon_variants?.length
    ).then(() => {
      const { data: variantsData } = useQueryGraphStep({
        entity: "variant",
        filters: {
          id: cartItem.variant_id,
        },
        fields: requiredFieldForAddonVariantLinkedEntityMap,
        options: {
          throwIfKeyNotFound: true,
          isList: true,
        },
      });
      const addonVariantsMap = transform(variantsData, (data) =>
        createAddonVariantLinkedEntityMap(data as any)
      );
      validateAddonLineItemsStep({
        addonVariantsMap,
        items: [
          {
            variant_id: cartItem.variant_id!,
            addon_variants: input.item.addon_variants!,
          },
        ],
      });
      return addonVariantsMap;
    });

    const { variantItemToUpdate, itemsToCreate, itemsToUpdate, itemsToDelete } =
      transform(
        {
          cartItem,
          cart: cart as unknown as StoreCart,
          inputItem: input.item,
          addonVariantsMap,
        },
        (data) => {
          const item = data.cartItem;
          const variantQuantity =
            data.inputItem.quantity ?? item?.quantity ?? 1;
          const variantItemToUpdate = {
            id: data.inputItem.id,
            quantity: variantQuantity,
          };
          const itemExistingAddonItems =
            data.cart.items?.filter(
              (item) =>
                typeof item.metadata?.variant_addon_sig === "string" &&
                !item.metadata?.variant_addon_sig.includes(
                  item?.variant_id as string
                )
            ) ?? [];

          const inputAddons = data.inputItem.addon_variants;
          const inputAddonIds = inputAddons?.map((av) => av.id);
          const existingAddonIds = itemExistingAddonItems.map(
            (eai) => eai.metadata?.addon_variant_id as string
          );

          if (
            variantQuantity === 0 ||
            (inputAddons && inputAddons.length === 0)
          ) {
            // Delete all existing addon items
            return {
              itemsToUpdate: [],
              itemsToDelete: itemExistingAddonItems?.map((eai) => eai.id),
              itemsToCreate: [],
              variantItemToUpdate,
            };
          }

          const signature = buildItemSignature({
            variant_id: item?.variant_id as string,
            addon_variants: inputAddons ?? existingAddonIds,
          });

          const itemsToDelete = inputAddonIds
            ? arrayDifference(existingAddonIds, inputAddonIds)
            : [];

          const itemsToCreate = (
            inputAddonIds
              ? arrayDifference(inputAddonIds, existingAddonIds)
              : []
          ).map((addonId) => {
            const addonInputData = inputAddons?.find(
              (addon) => addon.id === addonId
            );
            const addonQuantity = addonInputData?.quantity ?? 1;
            const addonVariantData = data.addonVariantsMap?.[addonId];
            if (!addonVariantData) {
              // This should never happen, but just in case
              throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                `Addon variant ${addonId} not found`
              );
            }
            return prepareAddonVariantItem({
              item: {
                quantity: MathBN.mult(variantQuantity, addonQuantity),
                cart_id: data.cart.id,
                unit_price: 0,
              },
              addonVariantData,
              signature: signature,
              addonQuantity: addonQuantity,
            });
          });

          const itemsToUpdate = itemExistingAddonItems.map(
            (existingAddonItem) => {
              const updatedData = inputAddons?.find(
                (addon) =>
                  addon.id === existingAddonItem.metadata?.addon_variant_id
              );
              const addonQuantity =
                updatedData?.quantity ??
                (existingAddonItem?.metadata
                  ?.addon_variant_quantity as number) ??
                1;
              return {
                id: existingAddonItem.id,
                quantity: MathBN.mult(variantQuantity, addonQuantity),
                metadata: {
                  ...existingAddonItem.metadata,
                  addon_variant_id:
                    existingAddonItem.metadata?.addon_variant_id,
                  variant_addon_sig: signature,
                  addon_variant_quantity: addonQuantity,
                },
              };
            }
          );

          console.log(itemsToCreate);

          return {
            itemsToUpdate,
            itemsToDelete,
            itemsToCreate,
            variantItemToUpdate,
          };
        }
      );

    const cartPricingContext = {
      currency_code: cart.currency_code ?? cart.region?.currency_code,
      region_id: cart.region_id,
      region: cart.region,
      customer_id: cart.customer_id,
      customer: cart.customer,
    } as unknown as Record<string, string | number>;

    const itemsToCreateWithPrice = when(
      "should-calculate-addon-prices",
      { itemsToCreate },
      (data) => !!data.itemsToCreate.length
    ).then(() => {
      const addonVariantIds = transform(itemsToCreate, (data) =>
        data.map((i) => i.metadata?.addon_variant_id as string)
      );
      const addonVariants = getAddonVariantPricingStep({
        addon_variant_ids: addonVariantIds,
        context: cartPricingContext,
      });
      return transform({ addonVariants, itemsToCreate }, (data) =>
        data.itemsToCreate.map((i) => {
          const unit_price = data.addonVariants.find(
            (avp) => avp.id === i.metadata?.addon_variant_id
          )?.calculated_price?.calculated_amount;
          return {
            ...i,
            unit_price: unit_price ?? 0,
          };
        })
      );
    });

    // Also validate cart and inventory for the variant
    updateLineItemInCartWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        item_id: variantItemToUpdate.id,
        update: {
          quantity: variantItemToUpdate.quantity,
        },
      },
    });

    parallelize(
      when(
        "should-update-addon-items",
        itemsToUpdate,
        (data) => !!data.length
      ).then(() =>
        updateLineItemsStep({
          id: input.cart_id,
          items: itemsToUpdate,
        })
      ),
      when(
        "should-create-addon-items",
        { itemsToCreateWithPrice },
        (data) => !!data.itemsToCreateWithPrice?.length
      ).then(() =>
        createLineItemsStep({
          id: input.cart_id,
          items: itemsToCreateWithPrice ?? [],
        })
      ),
      when(
        "should-delete-addon-items",
        itemsToDelete,
        (data) => !!data.length
      ).then(() => deleteLineItemsStep(itemsToDelete))
    );

    releaseLockStep({
      key: input.cart_id,
    });

    return new WorkflowResponse(void 0);
  }
);
