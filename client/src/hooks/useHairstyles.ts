import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as hairstylesApi from "../api/hairstyles";

export function useHairstyles(params?: { category?: string; gender?: string }) {
  return useQuery({
    queryKey: ["hairstyles", params],
    queryFn: () => hairstylesApi.getHairstyles(params),
    staleTime: 60_000,
  });
}

export function useHairstyle(id: string) {
  return useQuery({
    queryKey: ["hairstyle", id],
    queryFn: () => hairstylesApi.getHairstyleById(id),
    enabled: !!id,
  });
}

export function useGenerateHairstyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ hairstyleId, image, hairMask }: { hairstyleId: string; image: File; hairMask?: string }) =>
      hairstylesApi.generateHairstyle(hairstyleId, image, hairMask),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hairstyle-results"] });
      if (data.credits) {
        localStorage.setItem("hairstyle_credits", String(data.credits.balance));
      }
    },
  });
}

export function useResults() {
  return useQuery({
    queryKey: ["hairstyle-results"],
    queryFn: () => hairstylesApi.getResults(),
  });
}

export function useSaveFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (resultId: string) => hairstylesApi.saveFavorite(resultId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hairstyle-results"] });
      queryClient.invalidateQueries({ queryKey: ["hairstyle-favorites"] });
    },
  });
}

export function useFavoriteResults() {
  return useQuery({
    queryKey: ["hairstyle-favorites"],
    queryFn: () => hairstylesApi.getFavoriteResults(),
  });
}

export function useDeleteResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => hairstylesApi.deleteResult(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hairstyle-results"] });
      queryClient.invalidateQueries({ queryKey: ["hairstyle-favorites"] });
    },
  });
}
