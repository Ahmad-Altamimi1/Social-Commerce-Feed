import type { QueryClient, QueryKey } from "@tanstack/react-query";

type Likeable = {
  id: number;
  likes: number;
  isLikedByMe?: boolean;
};

type QuerySnapshot = Array<[QueryKey, unknown]>;

const LIKE_QUERY_PREFIXES: QueryKey[] = [
  ["/api/feed"],
  ["/api/products"],
  ["/api/merchant/products"],
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLikeable(value: unknown): value is Likeable {
  return (
    isObject(value) &&
    typeof value.id === "number" &&
    typeof value.likes === "number"
  );
}

function patchLikeDeep(
  value: unknown,
  productId: number,
  liked: boolean,
  likeCount: number,
): unknown {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const patched = patchLikeDeep(item, productId, liked, likeCount);
      if (patched !== item) changed = true;
      return patched;
    });
    return changed ? next : value;
  }

  if (!isObject(value)) return value;

  let changed = false;
  let next: Record<string, unknown> = value;

  if (isLikeable(value) && value.id === productId) {
    changed = true;
    next = { ...value, likes: likeCount, isLikedByMe: liked };
  }

  const keys = Object.keys(next);
  for (const key of keys) {
    const prevChild = next[key];
    const patchedChild = patchLikeDeep(prevChild, productId, liked, likeCount);
    if (patchedChild !== prevChild) {
      if (!changed) {
        changed = true;
        next = { ...next };
      }
      next[key] = patchedChild;
    }
  }

  return changed ? next : value;
}

export function takeLikeCacheSnapshot(queryClient: QueryClient): QuerySnapshot {
  const snapshot: QuerySnapshot = [];
  for (const queryKey of LIKE_QUERY_PREFIXES) {
    snapshot.push(...queryClient.getQueriesData({ queryKey }));
  }
  return snapshot;
}

export function restoreLikeCacheSnapshot(
  queryClient: QueryClient,
  snapshot: QuerySnapshot,
): void {
  for (const [queryKey, data] of snapshot) {
    queryClient.setQueryData(queryKey, data);
  }
}

export function patchLikeInCaches(
  queryClient: QueryClient,
  productId: number,
  liked: boolean,
  likeCount: number,
): void {
  for (const queryKey of LIKE_QUERY_PREFIXES) {
    queryClient.setQueriesData({ queryKey }, (oldData) =>
      patchLikeDeep(oldData, productId, liked, likeCount),
    );
  }
}
