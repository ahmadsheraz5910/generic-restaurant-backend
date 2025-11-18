type UpsertEntityInput<Entity, EntityName extends string> = {
  [P in EntityName]: (Entity & { id: string })[];
};

type UpdateEntityInput<Entity, Selector> = {
  selector: Selector;
  update: Entity;
};

export const transformUpdateInput = <E, S, N extends string>(
  data: UpdateEntityInput<E, S> | UpsertEntityInput<E, N>,
  entityName: N,
  transform: (data: E) => E
) => {
  if (entityName in data) {
    const upsertData = data as UpsertEntityInput<E, N>;
    return {
      [entityName]: upsertData[entityName].map(transform),
    } as UpsertEntityInput<E, N>;
  }
  const updateData = data as UpdateEntityInput<E, S>;
  return {
    selector: updateData.selector,
    update: transform(updateData.update),
  };
};

export const normalizeUpdateInput = <E, S, N extends string>(
  data: UpdateEntityInput<E, S> | UpsertEntityInput<E, N>,
  entityName: N
): {
  data: E[];
  selector?: S;
} => {
  if (entityName in data) {
    const upsertData = data as UpsertEntityInput<E, N>;
    return {
      data: upsertData[entityName],
    };
  }
  const updateData = data as UpdateEntityInput<E, S>;
  return { data: [updateData.update], selector: updateData.selector };
};
