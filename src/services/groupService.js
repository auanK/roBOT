import * as db from "../database/database.js";

export async function registerGroup(groupId, name = "Grupo sem nome") {
  const existingGroup = await db.groups.get(groupId);

  if (!existingGroup) {
    const groupData = {
      id: groupId,
      name,
      isAuthorized: false,
      aliasFor: null,
      createdAt: new Date().toISOString(),
    };
    await db.groups.save(groupData);
    console.log(`[Grupo Registrado] Nome: ${name}, ID: ${groupId}`);
  }
}

export async function isGroupAuthorized(groupId) {
  const group = await db.groups.get(groupId);
  if (!group) return false;

  if (group.aliasFor) {
    const mainGroup = await db.groups.get(group.aliasFor);
    return mainGroup?.isAuthorized || false;
  }

  return group.isAuthorized;
}

export async function getGroupAlias(groupId) {
  const group = await db.groups.get(groupId);
  return group?.aliasFor || groupId;
}
