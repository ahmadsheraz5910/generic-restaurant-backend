// - Prerequisites: seed-once.ts is executed
// - This will only used to seed the demo data
import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import data from "../../seed/restaurants-data.json";

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);

  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  const shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;
  if (!shippingProfile) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Could not find default shipping profile."
    );
  }

  const defaultSalesChannel = await salesChannelModuleService.listSalesChannels(
    {
      name: "Default Sales Channel",
    }
  );
  if (!defaultSalesChannel.length) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Could not find default sales channel."
    );
  }

  const stockLocations = await stockLocationModuleService.listStockLocations({
    name: "Default Warehouse",
  });
  const stockLocation = stockLocations.length ? stockLocations[0] : null;
  if (!stockLocation) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Could not find default stock location."
    );
  }

  logger.info("Seeding product data...");

  const collections = await createCollectionsWorkflow(container).run({
    input: {
      collections: data.collections.map((collection) => ({
        title: collection.name,
      })),
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: data.products.map((product) => ({
        title: product.title,
        collection: collections.result.find(
          (collection) => collection.title === product.collection
        )?.id,
        description: product.description,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile.id,
        images: product.images.map((image) => ({
          url: image,
        })),
        options: product.options,
        variants: product.variants,
        sales_channels: [
          {
            id: defaultSalesChannel[0].id,
          },
        ],
      })),
    },
  });

  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels data.");
}
