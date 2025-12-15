// This workflow should be a step, but since a step cannot have another step inside,
// therefore this is a workflow
import {
  CartDTO,
  CreateLineItemForCartDTO,
  CustomerDTO,
  ProductVariantDTO,
  RegionDTO,
} from "@medusajs/framework/types";
import {
  filterObjectByKeys,
  MedusaError,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { cartFieldsForPricingContext } from "../utils/fields";
import {
  prepareLineItemData,
  PrepareLineItemDataInput,
} from "../utils/prepare-line-item-data";
import { getVariantPriceSetsStep } from "@medusajs/medusa/core-flows";

interface GetVariantsWithPricesStepInput {
  cart: Partial<CartDTO> & {
    region?: Partial<RegionDTO>;
    region_id?: string;
    customer?: Partial<CustomerDTO>;
    customer_id?: string;
  };
  inputVariantItems: Array<{
    variant_id: string;
    quantity: number;
    metadata?: Record<string, unknown> | null;
  }>;
  variants: Array<
    Partial<ProductVariantDTO> & {
      id: string;
    }
  >;
}

export const getVariantItemsWithPricesWorkflowId =
  "get-variant-items-with-prices-2-workflow";
export const getVariantItemsWithPricesWorkflow = createWorkflow(
  getVariantItemsWithPricesWorkflowId,
  (input: GetVariantsWithPricesStepInput) => {
    const calculatedPriceSets = getVariantPriceSetsStep({
      data: transform(input, (data) => {
        const cart = data.cart;
        const baseContext = {
          ...filterObjectByKeys(cart, cartFieldsForPricingContext),
          customer: cart.customer,
          region: cart.region,
          currency_code: cart.currency_code ?? cart.region?.currency_code,
          region_id: cart.region_id,
          customer_id: cart.customer_id,
        };
        return data.variants.map((variant) => {
          return {
            variantId: variant.id,
            context: baseContext,
          };
        });
      }),
    });

    const items = transform({ input, calculatedPriceSets }, (data) => {
      const priceNotFound: string[] = [];
      const variantNotFoundOrPublished: string[] = [];

      const items = data.input.inputVariantItems.map((inputItem) => {
        const variant = data.input.variants.find(
          (variant) => variant.id === inputItem.variant_id
        );
        if (
          !variant ||
          !variant.product?.status ||
          variant.product.status !== ProductStatus.PUBLISHED
        ) {
          // variant exists but product is not published
          variantNotFoundOrPublished.push(inputItem.variant_id);
          return null;
        }
        const calculatedPriceSet = data.calculatedPriceSets[variant.id];
        if (!calculatedPriceSet) {
          priceNotFound.push(variant.id);
          return null;
        }
        const input: PrepareLineItemDataInput = {
          variant: variant as any,
          cartId: data.input.cart.id,
          item: {
            quantity: inputItem.quantity,
            metadata: inputItem.metadata,
          },
          isTaxInclusive: calculatedPriceSet?.is_calculated_price_tax_inclusive,
        };
        if (variant) {
          //@ts-ignore
          variant.calculated_price = calculatedPriceSet;
          input.unitPrice = calculatedPriceSet.calculated_amount;
        }
        return prepareLineItemData(input) as CreateLineItemForCartDTO;
      });

      if (variantNotFoundOrPublished.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Variants ${variantNotFoundOrPublished.join(
            ", "
          )} do not exist or belong to a product that is not published`
        );
      }
      if (priceNotFound.length > 0) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Variants with IDs ${priceNotFound.join(", ")} do not have a price`
        );
      }
      return items;
    });

    return new WorkflowResponse(items);
  }
);
