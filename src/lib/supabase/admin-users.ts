import type { SupabaseClient } from "@supabase/supabase-js";

type AuthUserLite = {
  id: string;
  email: string | null;
  created_at: string;
};

const LIST_USERS_PAGE_SIZE = 200;
const MAX_LIST_USERS_PAGES = 50;

function toLiteUser(user: {
  id: string;
  email?: string;
  created_at?: string;
}): AuthUserLite {
  return {
    id: user.id,
    email: user.email ?? null,
    created_at: user.created_at ?? new Date(0).toISOString(),
  };
}

export async function getAuthUsersByIds(
  adminClient: SupabaseClient,
  userIds: string[],
): Promise<Record<string, AuthUserLite>> {
  const uniqueIds = Array.from(new Set(userIds));
  if (uniqueIds.length === 0) return {};

  const remainingIds = new Set(uniqueIds);
  const usersById: Record<string, AuthUserLite> = {};

  for (let page = 1; page <= MAX_LIST_USERS_PAGES; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: LIST_USERS_PAGE_SIZE,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data.users ?? [];
    for (const user of users) {
      if (remainingIds.has(user.id)) {
        usersById[user.id] = toLiteUser(user);
        remainingIds.delete(user.id);
      }
    }

    if (remainingIds.size === 0 || users.length < LIST_USERS_PAGE_SIZE) {
      break;
    }
  }

  return usersById;
}

export async function findAuthUserByEmail(
  adminClient: SupabaseClient,
  email: string,
): Promise<AuthUserLite | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return null;

  for (let page = 1; page <= MAX_LIST_USERS_PAGES; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: LIST_USERS_PAGE_SIZE,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data.users ?? [];
    const matchedUser = users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    );

    if (matchedUser) {
      return toLiteUser(matchedUser);
    }

    if (users.length < LIST_USERS_PAGE_SIZE) {
      break;
    }
  }

  return null;
}

export async function getAuthUserById(
  adminClient: SupabaseClient,
  userId: string,
): Promise<AuthUserLite | null> {
  const { data, error } = await adminClient.auth.admin.getUserById(userId);

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    return null;
  }

  return toLiteUser(data.user);
}
