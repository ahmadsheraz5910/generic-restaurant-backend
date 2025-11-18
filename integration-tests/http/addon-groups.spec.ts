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
    const deletedAddonGroupData = {
      ...baseAddonGroupData,
      title: "Deleted Addon Group",
    };
    let baseAddon;
    let baseAddonGroup;

    let deletedAddonGroup;

    beforeAll(async () => {
      await createAdminUser(dbConnection, adminHeaders, getContainer());
      baseAddon = (await api.post("/admin/addons", baseAddonData, adminHeaders))
        .data.addon;

      baseAddonGroup = (
        await api.post("/admin/addon-groups", baseAddonGroupData, adminHeaders)
      ).data.addon_group;

      deletedAddonGroup = (
        await api.post(
          "/admin/addon-groups",
          deletedAddonGroupData,
          adminHeaders
        )
      ).data.addon_group;
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
      //[Todo]: Add test for addon group association with addons
      describe("POST /admin/addon-groups/:id/addons", () => {
        it("should link addons to an addon-group", async () => {
          const res = await api
            .post(
              `/admin/addon-groups/${baseAddonGroup.id}/addons`,
              {
                add: [baseAddon.id],
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
              addons: expect.arrayContaining([
                expect.objectContaining({
                  id: baseAddon.id,
                }),
              ]),
            })
          );
        });
        it("should unlink addons from an addon-group", async () => {
          const res = await api
            .post(
              `/admin/addon-groups/${baseAddonGroup.id}/addons`,
              {
                remove: [baseAddon.id],
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
              addons: expect.arrayContaining([]),
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
  },
});
