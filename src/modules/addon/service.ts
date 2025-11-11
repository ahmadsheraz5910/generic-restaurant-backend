import {
  arrayDifference,
  buildQuery,
  deepCopy,
  InjectManager,
  InjectTransactionManager,
  isString,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils";
import AddonGroup from "./models/addon-group";
import Addon from "./models/addon";
import AddonVariant from "./models/addon-variant";
import { AddonModuleTypes } from ".";
import { Context, DAL, InferEntityType } from "@medusajs/framework/types";
import { EntityManager, wrap } from "@mikro-orm/core";

type Addon = InferEntityType<typeof Addon>;
type AddonVariant = InferEntityType<typeof AddonVariant>;
type AddonGroup = InferEntityType<typeof AddonGroup>;
type InjectedDependencies = {
  addonRepository: DAL.RepositoryService<Addon>;
  addonVariantRepository: DAL.RepositoryService<AddonVariant>;
  addonGroupRepository: DAL.RepositoryService<AddonGroup>;
};

/**
 * TODO: upsertAddons should be a service level method, an idea for contribution to Medusa.js
 */
export default class AddonModuleService extends MedusaService({
  AddonGroup,
  AddonVariant,
  Addon,
}) {
  protected addonRepository_: DAL.RepositoryService<Addon>;
  protected addonVariantRepository_: DAL.RepositoryService<AddonVariant>;
  protected addonGroupRepository_: DAL.RepositoryService<AddonGroup>;

  constructor({
    addonRepository,
    addonVariantRepository,
    addonGroupRepository,
  }: InjectedDependencies) {
    super(...arguments);
    this.addonRepository_ = addonRepository;
    this.addonVariantRepository_ = addonVariantRepository;
    this.addonGroupRepository_ = addonGroupRepository;
  }

  static #getProductDeepUpdateRelationsToLoad(addonsToUpdate: any[]): string[] {
    const relationsToLoad = new Set<string>();
    addonsToUpdate.forEach((addonToUpdate) => {
      if (addonToUpdate.variants) {
        relationsToLoad.add("variants");
      }
    });
    return Array.from(relationsToLoad);
  }

  @InjectTransactionManager()
  protected async updateAddonsDeep_(
    data: AddonModuleTypes.UpsertAddonDTO[],
    @MedusaContext() context?: Context<EntityManager>
  ) {
    const addonsToUpdate_ = deepCopy(data);
    const relationsToLoad =
      AddonModuleService.#getProductDeepUpdateRelationsToLoad(addonsToUpdate_);
    const addonToUpdateIds = data.map((addon) => addon.id);
    const findOptions = buildQuery(
      { id: addonToUpdateIds },
      {
        relations: relationsToLoad,
        take: addonToUpdateIds.length,
      }
    );

    const addons = await this.addonRepository_.find(findOptions, context);
    const addonsMap = new Map(addons.map((p) => [p.id, p]));
    const addonIds = [...addonsMap.keys()];
    const addonsNotFound = arrayDifference(addonToUpdateIds, addonIds);

    if (addonsNotFound.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Unable to update the addons with ids: ${addonsNotFound.join(", ")}`
      );
    }

    for (const addonToUpdate of addonsToUpdate_) {
      const addon = addonsMap.get(addonToUpdate.id)!;
      const wrappedAddon = wrap(addon);
      wrappedAddon.assign(addonToUpdate);
    }

    // Doing this to ensure updates are returned in the same order they were provided,
    // since some core flows rely on this.
    // This is a high level of coupling though.
    return addonsToUpdate_.map(
      (addonToUpdate) => addonsMap.get(addonToUpdate.id)!
    );
  }

  @InjectManager()
  async updateAddonsDeep(
    idOrSelector: string | Record<string, any>,
    data: AddonModuleTypes.UpsertAddonDTO[] | AddonModuleTypes.UpdateAddonDTO,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    let normalizedInput: AddonModuleTypes.UpdateAddonDTO & { id: string }[] =
      [];
    if (isString(idOrSelector)) {
      await this.retrieveAddon(idOrSelector, {}, sharedContext);
      normalizedInput = [{ id: idOrSelector, ...data }];
    } else {
      const addons = await this.listAddons(idOrSelector, {}, sharedContext);

      normalizedInput = addons.map((product) => ({
        id: product.id,
        ...data,
      }));
    }
    return await this.updateAddonsDeep_(normalizedInput, sharedContext);
  }

  async upsertAddons(data: AddonModuleTypes.UpsertAddonDTO[]) {
    const forUpdate = data.filter((addon) => !!addon.id);
    const forCreate = data.filter((addon) => !addon.id);

    let created: InferEntityType<typeof Addon>[] = [];
    let updated: InferEntityType<typeof Addon>[] = [];

    if (forCreate.length) {
      created = await this.createAddons(forCreate);
    }
    if (forUpdate.length) {
      updated = await this.updateAddonsDeep_(forUpdate);
    }
    return [...created, ...updated];
  }

  async upsertAddonVariants(data: AddonModuleTypes.UpsertAddonVariantDTO[]) {
    const forUpdate = data.filter((addon) => !!addon.id);
    const forCreate = data.filter((addon) => !addon.id);

    let created: InferEntityType<typeof AddonVariant>[] = [];
    let updated: InferEntityType<typeof AddonVariant>[] = [];

    if (forCreate.length) {
      created = await this.createAddonVariants(forCreate);
    }
    if (forUpdate.length) {
      updated = await this.updateAddonVariants(forUpdate);
    }
    return [...created, ...updated];
  }
}
