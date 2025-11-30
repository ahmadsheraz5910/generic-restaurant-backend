import { medusaIntegrationTestRunner } from "@medusajs/test-utils";
import {
  adminHeaders,
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../helpers/create-admin-user";
import { fakeAddon, fakeAddonGroup, fakeProduct } from "../helpers/faker-data";

jest.setTimeout(700000 * 1000);

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
        await api.post("/admin/addon-groups", fakeAddonGroup(), adminHeaders)
      ).data.addon_group;

      baseAddon = (
        await api.post(
          "/admin/addons",
          fakeAddon({
            addon_group_id: baseAddonGroup.id,
          }),
          adminHeaders
        )
      ).data.addon;

      baseProduct = (
        await api.post(
          "/admin/products",
          fakeProduct({ shipping_profile_id: shippingProfile.id }),
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
            return err;
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

      it("shouldn't add addon line item to a cart if the addon variant is not linked to the product variant", async () => {
        const newProduct = (await api.post(
          "/admin/products",
          fakeProduct({
            title: "Product2",
            shipping_profile_id: shippingProfile.id,
          }),
          adminHeaders
        )).data.product;

        const res = await api
          .post(
            `/store/carts/${baseCart.id}/addon-line-items`,
            {
              addon_variant_ids: [baseAddon.variants[0].id],
              variant_id: newProduct.variants[0].id,
              quantity: 1,
            },
            storeHeaders
          )
          .catch((err) => {
            console.log(err);
            return err;
          });

        expect(res.response.status).toEqual(400);
        expect(res.response.data.message).toContain("Combinations");
      });
    });
  },
});
