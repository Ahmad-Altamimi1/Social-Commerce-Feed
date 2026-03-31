export * from "./generated/api";
export * from "./generated/api.schemas";
export { setBaseUrl, setAuthTokenGetter, customFetch } from "./custom-fetch";
export type { AuthTokenGetter } from "./custom-fetch";

import { useMutation, useQuery } from "@tanstack/react-query";
import type { Product } from "./generated/api.schemas";
import { customFetch } from "./custom-fetch";

export function useGetProductBySlug(slug: string) {
  return useQuery({
    queryKey: ["/api/products/by-slug", slug],
    enabled: !!slug,
    queryFn: async () => customFetch<Product>(`/api/products/by-slug/${slug}`),
  });
}

export function useShareProduct() {
  return useMutation({
    mutationFn: async ({ id }: { id: number }) =>
      customFetch<{ shareCount: number }>(`/api/products/${id}/share`, {
        method: "POST",
      }),
  });
}
