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
  BigNumber,
  isDefined,
  MathBN,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  CreateLineItemDTO,
  CreateLineItemForCartDTO,
  StoreCart,
  UpdateLineItemDTO,
} from "@medusajs/framework/types";
import {
  buildItemSignature,
  findAddonItemWithSignature,
  findVariantItemWithSignature,
  getLineItemAddons,
} from "./utils/variant-addon-signature";
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

    const variantLineItem = transform(
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
          id: variantLineItem.variant_id,
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
            variant_id: variantLineItem.variant_id!,
            addon_variants: input.item.addon_variants!,
          },
        ],
      });
      return addonVariantsMap;
    });

    const { variantItemToUpdate, itemsToCreate, itemsToUpdate, itemsToDelete } =
      transform(
        {
          variantLineItem,
          cart: cart as unknown as StoreCart,
          inputItem: input.item,
          addonVariantsMap,
        },
        (data) => {
          const itemsToDelete: string[] = [];
          const itemsToCreate: CreateLineItemForCartDTO[] = [];
          const itemsToUpdate: UpdateLineItemDTO[] = [];
          const inputAddonVariants = data.inputItem.addon_variants;
          const inputAddonVariantIds = inputAddonVariants?.map((av) => av.id);
          const previousAddonItems = getLineItemAddons(
            data.variantLineItem,
            data.cart
          );
          const newAddonVariantIds =
            inputAddonVariantIds ??
            previousAddonItems.map(
              (eai) => eai.metadata?.addon_variant_id as string
            );
          const newSignature = buildItemSignature({
            variant_id: data.variantLineItem?.variant_id as string,
            addon_variants: newAddonVariantIds,
          });

          let variantQuantity =
            data.inputItem.quantity ?? data.variantLineItem?.quantity ?? 1;

          let variantItemToUpdate: any = {
            id: data.inputItem.id,
            quantity: variantQuantity,
            metadata: {
              variant_addon_sig: newSignature,
            },
          };

          // If the new signature matches another variant item other than the input item, 
          // delete the input item and merge the quantity with the existing variant item
          const existingVariantItem = findVariantItemWithSignature(
            data.cart,
            newSignature
          );
          if (
            existingVariantItem &&
            existingVariantItem.id !== data.inputItem.id
          ) {
            //Delete this line item and merge quantity with existing variant item
            variantQuantity = MathBN.sum(
              existingVariantItem.quantity,
              variantQuantity
            ) as any;
            variantItemToUpdate = {
              ...variantItemToUpdate,
              id: existingVariantItem.id,
              quantity: variantQuantity,
            };
            itemsToDelete.push(data.inputItem.id);
          }
          
          // Associated addon items
          if (variantQuantity === 0 || newAddonVariantIds.length === 0) {
            // Delete all existing addon items
            return {
              itemsToUpdate: [],
              itemsToDelete: previousAddonItems.map((eai) => eai.id),
              itemsToCreate: [],
              variantItemToUpdate,
            };
          }

          for (const newAddonVariantId of newAddonVariantIds) {
            const inputAddonData = inputAddonVariants?.find(
              (addon) => addon.id === newAddonVariantId
            );
            const existingAddonItem = findAddonItemWithSignature(
              data.cart,
              newAddonVariantId,
              newSignature
            );

            if (existingAddonItem) {
              // Update existing addon item
              const addonQuantity =
                inputAddonData?.quantity ??
                (existingAddonItem?.metadata
                  ?.addon_variant_quantity as number) ??
                1;
              itemsToUpdate.push({
                id: existingAddonItem.id,
                quantity: MathBN.mult(variantQuantity, addonQuantity),
                metadata: {
                  ...existingAddonItem.metadata,
                  addon_variant_id:
                    existingAddonItem.metadata?.addon_variant_id,
                  variant_addon_sig: newSignature,
                  addon_variant_quantity: addonQuantity,
                },
              });
            } else {
              // New addon item
              const addonQuantity = inputAddonData?.quantity ?? 1;
              const addonVariantData =
                data.addonVariantsMap?.[newAddonVariantId];
              if (!addonVariantData) {
                // This should never happen due to prior validation
                throw new MedusaError(
                  MedusaError.Types.INVALID_DATA,
                  `Addon variant ${newAddonVariantId} not found`
                );
              }
              itemsToCreate.push(
                prepareAddonVariantItem({
                  item: {
                    quantity: MathBN.mult(variantQuantity, addonQuantity),
                    cart_id: data.cart.id,
                    unit_price: 0,
                  },
                  addonVariantData,
                  signature: newSignature,
                  addonQuantity: addonQuantity,
                })
              );
            }
          }

          for (const previousAddon of previousAddonItems) {
            const isUpdating = itemsToUpdate.find(
              (item) => item.id === previousAddon.id
            );
            if (!isUpdating) {
              itemsToDelete.push(previousAddon.id);
            }
          }
          

          return {
            itemsToUpdate,
            itemsToDelete,
            itemsToCreate,
            variantItemToUpdate,
          };
        }
      );

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
        cart: cart as any,
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
