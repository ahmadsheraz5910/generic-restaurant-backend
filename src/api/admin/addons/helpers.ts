import {
  MedusaContainer,
  PriceDTO,
  ProductDTO,
  ProductVariantDTO,
} from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@medusajs/framework/utils";
import { HttpTypes } from "../../../types/addons";
import { AddonDTO, AddonVariantDTO } from "../../../modules/addon/types";

const isPricing = (fieldName: string) =>
  fieldName.startsWith("variants.prices") ||
  fieldName.startsWith("*variants.prices") ||
  fieldName.startsWith("prices") ||
  fieldName.startsWith("*prices");

/**
 * Medusa at it's core uses price_sets under the hood, but the query fields are defined as prices
 * Thus the following remappings
*/
export const remapKeysForAddon = (selectFields: string[]) => {
  const addonFields = selectFields.filter(
    (fieldName: string) => !isPricing(fieldName)
  );

  const pricingFields = selectFields
    .filter((fieldName: string) => isPricing(fieldName))
    .map((fieldName: string) =>
      fieldName.replace("variants.prices.", "variants.price_set.prices.")
    );

  return [...addonFields, ...pricingFields];
};

export const remapKeysForVariant = (selectFields: string[]) => {
  const variantFields = selectFields.filter(
    (fieldName: string) => !isPricing(fieldName)
  );

  const pricingFields = selectFields
    .filter((fieldName: string) => isPricing(fieldName))
    .map((fieldName: string) =>
      fieldName.replace("prices.", "price_set.prices.")
    );

  return [...variantFields, ...pricingFields];
};

export const remapAddonResponse = (
  product: AddonDTO
): HttpTypes.AdminAddon => {
  return {
    ...product,
    variants: product.variants?.map(remapVariantResponse),
    // TODO: Remove any once all typings are cleaned up
  } as any;
};

export const remapVariantResponse = (
  variant: AddonVariantDTO
) => {
  if (!variant) {
    return variant;
  }

  const resp = {
    ...variant,
    prices: (variant as any).price_set?.prices?.map((price) => ({
      id: price.id,
      amount: price.amount,
      currency_code: price.currency_code,
      min_quantity: price.min_quantity,
      max_quantity: price.max_quantity,
      variant_id: variant.id,
      created_at: price.created_at,
      updated_at: price.updated_at,
      rules: buildRules(price),
    })),
  };

  delete (resp as any).price_set;

  // TODO: Remove any once all typings are cleaned up
  return resp as any;
};

export const buildRules = (price: PriceDTO) => {
  const rules: Record<string, string> = {};

  for (const priceRule of price.price_rules || []) {
    const ruleAttribute = priceRule.attribute;

    if (ruleAttribute) {
      rules[ruleAttribute] = priceRule.value;
    }
  }

  return rules;
};

export const refetchVariant = async (
  variantId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY);
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "product_variant",
    variables: {
      filters: { id: variantId },
    },
    fields: remapKeysForVariant(fields ?? []),
  });

  const [variant] = await remoteQuery(queryObject);

  return remapVariantResponse(variant);
};
