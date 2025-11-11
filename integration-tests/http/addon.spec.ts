import { adminHeaders, createAdminUser } from "../helpers/create-admin-user";
import { medusaIntegrationTestRunner } from "@medusajs/test-utils";

jest.setTimeout(60000 * 1000);

medusaIntegrationTestRunner({
  disableAutoTeardown: true,
  testSuite: ({ api, dbConnection, getContainer }) => {
    const baseAddonData = {
      title: "Base Addon",
      thumbnail: "base-image.png",
      status: "published",
      variants: [
        {
          title: "Base Varian",
          prices: [
            {
              amount: 10,
              currency_code: "nzd",
            },
          ],
        },
      ],
    };
    const baseAddonGroupData = {
      title: "Base Addon Group",
    };
    const baseAddonForVariantData = {
      ...baseAddonData,
      title: "Base Addon (Variant)",
    };
    const baseAddonUpdatedData = {
      ...baseAddonData,
      title: "Base Addon (Updated)",
    };
    const deletedAddonData = {
      ...baseAddonData,
      title: "Deleted Addon",
    };
    const deletedAddonGroupData = {
      ...baseAddonGroupData,
      title: "Deleted Addon Group",
    };

    let baseAddon;
    let baseAddonForVariant;
    let baseAddonGroup;

    let deletedAddonGroup;
    let deletedAddon;

    beforeAll(async () => {
      await createAdminUser(dbConnection, adminHeaders, getContainer());
      baseAddon = (await api.post("/admin/addons", baseAddonData, adminHeaders))
        .data.addon;

      baseAddonForVariant = (
        await api.post("/admin/addons", baseAddonForVariantData, adminHeaders)
      ).data.addon;

      baseAddonGroup = (
        await api.post("/admin/addon-groups", baseAddonGroupData, adminHeaders)
      ).data.addon_group;

      deletedAddon = (
        await api.post("/admin/addons", deletedAddonData, adminHeaders)
      ).data.addon;

      deletedAddonGroup = (
        await api.post(
          "/admin/addon-groups",
          deletedAddonGroupData,
          adminHeaders
        )
      ).data.addon_group;
    });

    describe("/admin/addons", () => {
      describe("GET /admin/addons", () => {
        it("should list all addons with default relations/ields", async () => {
          const response = await api.get("/admin/addons", adminHeaders);
          expect(response.status).toEqual(200);
          expect(response.data.addons).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.stringMatching(/^addon_*/),
                title: baseAddonData.title,
                status: baseAddonData.status,
                thumbnail: baseAddonData.thumbnail,
                variants: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.stringMatching(/^addonVariant_*/),
                    title: baseAddonData.variants[0].title,
                    prices: expect.arrayContaining([
                      expect.objectContaining({
                        id: expect.stringMatching(/^price_*/),
                        amount: baseAddonData.variants[0].prices[0].amount,
                        currency_code:
                          baseAddonData.variants[0].prices[0].currency_code,
                      }),
                    ]),
                  }),
                ]),
              }),
            ])
          );
        });
      });
      describe("POST /admin/addons", () => {
        it("should create a new addon", async () => {
          const testAddonData = {
            title: "Test Addon Create",
            status: "published",
            thumbnail: "test-image.png",
            variants: [
              {
                title: "Test Variant Create",
                variant_rank: 0,
                prices: [
                  {
                    amount: 10,
                    currency_code: "nzd",
                  },
                ],
              },
            ],
          };
          const response = await api.post(
            "/admin/addons",
            testAddonData,
            adminHeaders
          );
          expect(response.status).toEqual(200);
          expect(response.data).toEqual({
            addon: expect.objectContaining({
              id: expect.stringMatching(/^addon_*/),
              title: testAddonData.title,
              status: testAddonData.status,
              thumbnail: testAddonData.thumbnail,
              variants: expect.arrayContaining([
                expect.objectContaining({
                  id: expect.stringMatching(/^addonVariant_*/),
                  title: testAddonData.variants[0].title,
                  prices: expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.stringMatching(/^price_*/),
                      amount: testAddonData.variants[0].prices[0].amount,
                      currency_code:
                        testAddonData.variants[0].prices[0].currency_code,
                    }),
                  ]),
                }),
              ]),
            }),
          });
        });
      });

      describe("GET /admin/addons/:id", () => {
        it("should get addon with default relations/fields", async () => {
          const res = await api
            .get(`/admin/addons/${baseAddon.id}`, adminHeaders)
            .catch((err) => {
              console.log(err);
            });

          const keysInResponse = Object.keys(res.data.addon);

          expect(res.status).toEqual(200);
          expect(res.data.addon.id).toEqual(baseAddon.id);
          expect(keysInResponse).toEqual(
            expect.arrayContaining([
              "id",
              "created_at",
              "updated_at",
              "title",
              "handle",
              "status",
              "thumbnail",
              "addon_group_id",
              "addonGroup",
              "variants",
            ])
          );
          const variants = res.data.addon.variants;
          const hasPrices = variants.some((variant) => !!variant.prices);
          expect(hasPrices).toBe(true);
        });
      });

      describe("POST /admin/addons/:id", () => {
        it("should update addon fields, associate with base addon_group, variants and prices", async () => {
          const res = await api
            .post(
              `/admin/addons/${baseAddon.id}`,
              {
                title: baseAddonUpdatedData.title,
                thumbnail: baseAddonUpdatedData.thumbnail,
                addon_group_id: baseAddonGroup.id,
                variants: [
                  {
                    id: baseAddon.variants[0].id,
                    title: baseAddonUpdatedData.variants[0].title,
                    prices: [
                      {
                        amount:
                          baseAddonUpdatedData.variants[0].prices[0].amount,
                        id: baseAddon.variants[0].prices[0].id,
                        currency_code:
                          baseAddonUpdatedData.variants[0].prices[0]
                            .currency_code,
                      },
                    ],
                  },
                ],
              },
              adminHeaders
            )
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon).toEqual(
            expect.objectContaining({
              id: baseAddon.id,
              title: baseAddonUpdatedData.title,
              thumbnail: baseAddonUpdatedData.thumbnail,
              variants: expect.arrayContaining([
                expect.objectContaining({
                  id: baseAddon.variants[0].id,
                  title: baseAddonUpdatedData.variants[0].title,
                  prices: expect.arrayContaining([
                    expect.objectContaining({
                      amount: baseAddonUpdatedData.variants[0].prices[0].amount,
                      id: baseAddon.variants[0].prices[0].id,
                      currency_code:
                        baseAddonUpdatedData.variants[0].prices[0]
                          .currency_code,
                    }),
                  ]),
                }),
              ]),
            })
          );
        });
        it("should add a new price, keeping the existing ones", async () => {
          await api.post(
            `/admin/addons/${baseAddon.id}`,
            {
              variants: [
                {
                  id: baseAddon.variants[0].id,
                  prices: [
                    {
                      id: baseAddon.variants[0].prices[0].id,
                    },
                    {
                      amount: 10,
                      currency_code: "usd",
                    },
                  ],
                },
              ],
            },
            adminHeaders
          );
          const res = await api
            .get(`/admin/addons/${baseAddon.id}`, adminHeaders)
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon.variants[0].prices).toHaveLength(2);
          expect(res.data.addon.variants[0].prices).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.stringMatching(/^price_*/),
                amount: 10,
              }),
              expect.objectContaining({
                id: baseAddon.variants[0].prices[0].id,
              }),
            ])
          );
        });
        it("should add a new price, and remove the existing ones", async () => {
          await api.post(
            `/admin/addons/${baseAddon.id}`,
            {
              variants: [
                {
                  id: baseAddon.variants[0].id,
                  prices: [
                    {
                      amount: 10,
                      currency_code: "usd",
                    },
                  ],
                },
              ],
            },
            adminHeaders
          );
          const res = await api
            .get(`/admin/addons/${baseAddon.id}`, adminHeaders)
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon.variants[0].prices).toHaveLength(1);
          expect(res.data.addon.variants[0].prices).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.stringMatching(/^price_*/),
                amount: 10,
                currency_code: "usd",
              }),
            ])
          );
        });
        it("should add a new variant, keeping the existing ones", async () => {
          await api.post(
            `/admin/addons/${baseAddon.id}`,
            {
              variants: [
                {
                  id: baseAddon.variants[0].id,
                },
                {
                  title: "New Variant",
                  prices: [
                    {
                      amount: 10,
                      currency_code: "usd",
                    },
                  ],
                },
              ],
            },
            adminHeaders
          );
          const res = await api
            .get(`/admin/addons/${baseAddon.id}`, adminHeaders)
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon.variants).toHaveLength(2);
          expect(res.data.addon.variants).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.stringMatching(/^addonVariant_*/),
                title: "New Variant",
              }),
              expect.objectContaining({
                id: baseAddon.variants[0].id,
              }),
            ])
          );
        });
        it("should add a new variant, and remove the existing ones", async () => {
          await api.post(
            `/admin/addons/${baseAddon.id}`,
            {
              variants: [
                {
                  title: "New Variant",
                  prices: [
                    {
                      amount: 10,
                      currency_code: "usd",
                    },
                  ],
                },
              ],
            },
            adminHeaders
          );
          const res = await api
            .get(`/admin/addons/${baseAddon.id}`, adminHeaders)
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon.variants).toHaveLength(1);
          expect(res.data.addon.variants[0].title).toEqual("New Variant");
        });
      });
      describe("DELETE /admin/addons/:id", () => {
        it("should delete an addon", async () => {
          const res = await api
            .delete(`/admin/addons/${deletedAddon.id}`, adminHeaders)
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.id).toEqual(deletedAddon.id);
          expect(res.data.object).toEqual("addon");
          expect(res.data.deleted).toEqual(true);
        });
      });
    });

    describe("/admin/addon-groups", () => {
      describe("GET /admin/addon-groups", () => {
        it("should list all addon-groups with default relations/fields", async () => {
          const response = await api.get("/admin/addon-groups", adminHeaders);
          expect(response.status).toEqual(200);
          expect(response.data.addon_groups).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.stringMatching(/^aGroup_*/),
                title: baseAddonGroupData.title,
              }),
            ])
          );
        });
      });
      describe("POST /admin/addon-groups", () => {
        it("should create a new addon-group", async () => {
          const testAddonGroupData = {
            title: "Test Addon Group Create",
          };
          const response = await api.post(
            "/admin/addon-groups",
            testAddonGroupData,
            adminHeaders
          );
          expect(response.status).toEqual(200);
          expect(response.data).toEqual({
            addon_group: expect.objectContaining({
              id: expect.stringMatching(/^aGroup_*/),
              title: testAddonGroupData.title,
            }),
          });
        });
      });
      describe("GET /admin/addon-groups/:id", () => {
        it("should get addon-group with default relations/fields", async () => {
          const res = await api
            .get(`/admin/addon-groups/${baseAddonGroup.id}`, adminHeaders)
            .catch((err) => {
              console.log(err);
            });

          const keysInResponse = Object.keys(res.data.addon_group);

          expect(res.status).toEqual(200);
          expect(res.data.addon_group.id).toEqual(baseAddonGroup.id);
          expect(keysInResponse).toEqual(
            expect.arrayContaining(["id", "title", "addons"])
          );
        });
      });
      describe("POST /admin/addon-groups/:id", () => {
        it("should update addon-group fields", async () => {
          const res = await api
            .post(
              `/admin/addon-groups/${baseAddonGroup.id}`,
              {
                title: "Base Addon Group (Updated)",
              },
              adminHeaders
            )
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon_group).toEqual(
            expect.objectContaining({
              id: baseAddonGroup.id,
              title: "Base Addon Group (Updated)",
            })
          );
        });
      });
      describe("DELETE /admin/addon-groups/:id", () => {
        it("should delete an addon-group", async () => {
          const res = await api
            .delete(`/admin/addon-groups/${deletedAddonGroup.id}`, adminHeaders)
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.id).toEqual(deletedAddonGroup.id);
          expect(res.data.object).toEqual("addon_group");
          expect(res.data.deleted).toEqual(true);
        });
      });
    });

    describe("/admin/addons/:id/variants", () => {
      describe("GET /admin/addons/:id/variants", () => {
        it("should list all variants for an addon", async () => {
          const response = await api
            .get(
              `/admin/addons/${baseAddonForVariant.id}/variants`,
              adminHeaders
            )
            .catch((err) => {
              console.log(err);
            });
          expect(response.status).toEqual(200);
          expect(response.data.addon_variants).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.stringMatching(/^addonVariant_*/),
                title: baseAddonData.variants[0].title,
              }),
            ])
          );
        });
      });
      describe("POST /admin/addons/:id/variants", () => {
        it("should create a new variant for an addon", async () => {
          const res = await api
            .post(
              `/admin/addons/${baseAddonForVariant.id}/variants`,
              {
                title: "New Variant",
                prices: [
                  {
                    amount: 10,
                    currency_code: "nzd",
                  },
                ],
              },
              adminHeaders
            )
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon.variants).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: expect.stringMatching(/^addonVariant_*/),
                title: "New Variant",
              }),
            ])
          );
        });
      });

      describe("POST /admin/addons/:id/variants/:variant_id", () => {
        it("should update variant fields, and associated price", async () => {
          const res = await api
            .post(
              `/admin/addons/${baseAddonForVariant.id}/variants/${baseAddonForVariant.variants[0].id}`,
              {
                title: "Base Variant (Updated)",
                prices: [
                  {
                    id: baseAddonForVariant.variants[0].prices[0].id,
                    amount: 50,
                    currency_code: "nzd",
                  },
                ],
              },
              adminHeaders
            )
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon.variants).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: baseAddonForVariant.variants[0].id,
                title: "Base Variant (Updated)",
                prices: expect.arrayContaining([
                  expect.objectContaining({
                    id: baseAddonForVariant.variants[0].prices[0].id,
                    amount: 50,
                    currency_code: "nzd",
                  }),
                ]),
              }),
            ])
          );
        });
        it("should add a new price, keeping the existing ones", async () => {
          await api.post(
            `/admin/addons/${baseAddonForVariant.id}/variants/${baseAddonForVariant.variants[0].id}`,
            {
              prices: [
                {
                  id: baseAddonForVariant.variants[0].prices[0].id,
                },
                {
                  amount: 10,
                  currency_code: "nzd",
                },
              ],
            },
            adminHeaders
          );
          const res = await api
            .get(
              `/admin/addons/${baseAddonForVariant.id}/variants/${baseAddonForVariant.variants[0].id}`,
              adminHeaders
            )
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon_variant).toEqual(
            expect.objectContaining({
              id: baseAddonForVariant.variants[0].id,
              prices: expect.arrayContaining([
                expect.objectContaining({
                  id: baseAddonForVariant.variants[0].prices[0].id,
                }),
                expect.objectContaining({
                  amount: 10,
                  currency_code: "nzd",
                }),
              ]),
            })
          );
        });
        it("should add a new price, and remove the existing ones", async () => {
          await api.post(
            `/admin/addons/${baseAddonForVariant.id}/variants/${baseAddonForVariant.variants[0].id}`,
            {
              prices: [
                {
                  amount: 10,
                  currency_code: "nzd",
                },
              ],
            },
            adminHeaders
          );
          const res = await api
            .get(
              `/admin/addons/${baseAddonForVariant.id}/variants/${baseAddonForVariant.variants[0].id}`,
              adminHeaders
            )
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.addon_variant).toEqual(
            expect.objectContaining({
              id: baseAddonForVariant.variants[0].id,
              prices: expect.arrayContaining([
                expect.objectContaining({
                  amount: 10,
                  currency_code: "nzd",
                }),
              ]),
            })
          );
        });
      });

      describe("DELETE /admin/addons/:id/variants/:variant_id", () => {
        it("should delete an variant for an addon", async () => {
          const deletedAddonVariant = (
            await api
              .post(
                `/admin/addons/${baseAddonForVariant.id}/variants`,
                {
                  title: "Variant to be deleted",
                  prices: [
                    {
                      amount: 10,
                      currency_code: "nzd",
                    },
                  ],
                },
                adminHeaders
              )
              .catch((err) => {
                console.log(err);
              })
          ).data.addon.variants[0];
          const res = await api
            .delete(
              `/admin/addons/${baseAddonForVariant.id}/variants/${deletedAddonVariant.id}`,
              adminHeaders
            )
            .catch((err) => {
              console.log(err);
            });
          expect(res.status).toEqual(200);
          expect(res.data.id).toEqual(deletedAddonVariant.id);
          expect(res.data.object).toEqual("addon_variant");
          expect(res.data.deleted).toEqual(true);
        });
      });
    });
  },
});
