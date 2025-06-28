import * as db from "../database/database.js";
import { normalizeUserId } from "./userService.js";

export async function setProfileProperty(groupId, userId, property, value) {
  const normalizedId = normalizeUserId(userId);

  const existingProfile = (await db.profiles.get(normalizedId, groupId)) || {};

  const profileData = {
    userId: normalizedId,
    groupId,
    nickname: existingProfile.nickname || null,
    description: existingProfile.description || null,
    [property]: value,
  };

  db.profiles.save(profileData);
}

export async function getProfile(groupId, userId) {
  const normalizedId = normalizeUserId(userId);
  return db.profiles.get(normalizedId, groupId);
}
