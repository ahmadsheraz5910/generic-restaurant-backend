import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../helpers/create-admin-user";

jest.setTimeout(60000 * 1000);

medusaIntegrationTestRunner({
  testSuite: ({ api, dbConnection, getContainer }) => {
    let baseProduct;
    let baseAddon;
    let baseAddonGroup;
    let baseCart;
    let storeHeaders;
    let salesChannel;
    let region;
    let shippingProfile;
    beforeAll(async () => {
      await createAdminUser(dbConnection, adminHeaders, getContainer());
      const publishableKey = await generatePublishableKey(getContainer());
      storeHeaders = generateStoreHeaders({ publishableKey });

      shippingProfile = (
        await api.post(
          `/admin/shipping-profiles`,
          { name: "default", type: "default" },
          adminHeaders
        )
      ).data.shipping_profile;

      salesChannel = (
        await api.post(
          "/admin/sales-channels",
          { name: "Webshop", description: "channel" },
          adminHeaders
        )
      ).data.sales_channel;

      region = (
        await api.post(
          "/admin/regions",
          { name: "NZD", currency_code: "nzd", countries: ["nz"] },
          adminHeaders
        )
      ).data.region;

      baseAddonGroup = (
        await api.post(
          "/admin/addon-groups",
          {
            title: "Addon Group 1",
          },
          adminHeaders
        )
      ).data.addon_group;

      baseAddon = (
        await api.post(
          "/admin/addons",
          {
            title: "Addon 1",
            status: "published",
            thumbnail: "addon-image.png",
            addon_group_id: baseAddonGroup.id,
            variants: [
              {
                title: "Addon Variant 1",
                prices: [
                  {
                    amount: 5,
                    currency_code: "nzd",
                  },
                ],
              },
            ],
          },
          adminHeaders
        )
      ).data.addon;

      baseProduct = (
        await api.post(
          "/admin/products",
          {
            title: "Product 1",
            status: "published",
            options: [
              {
                title: "Size",
                values: ["small", "medium", "large"],
              },
            ],
            shipping_profile_id: shippingProfile.id,
            variants: [
              {
                title: "Variant 1",
                options: {
                  Size: "small",
                },
                manage_inventory: false,
                prices: [
                  {
                    amount: 10,
                    currency_code: "nzd",
                  },
                ],
              },
            ],
          },
          adminHeaders
        )
      ).data.product;

      await api.post(
        `/admin/products/${baseProduct.id}/addon-groups`,
        {
          add: [baseAddonGroup.id],
        },
        adminHeaders
      );

      baseCart = (
        await api.post(
          "/store/carts",
          {
            sales_channel_id: salesChannel.id,
            region_id: region.id,
          },
          storeHeaders
        )
      ).data.cart;
    });
    describe("/store/carts/:id/addon-line-items", () => {
      it("should add addon line items to a cart", async () => {
        const res = await api
          .post(
            `/store/carts/${baseCart.id}/addon-line-items`,
            {
              addon_variant_ids: [baseAddon.variants[0].id],
              variant_id: baseProduct.variants[0].id,
              quantity: 1,
            },
            storeHeaders
          )
          .catch((err) => {
            console.log(err);
          });
        expect(res.status).toEqual(200);
        expect(res.data.cart).toEqual(
          expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                unit_price: 5,
                quantity: 1,
                adjustments: [],
              }),
            ]),
          })
        );
      });
    });
  },
});
