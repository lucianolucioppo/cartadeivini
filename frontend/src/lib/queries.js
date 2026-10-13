import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { api } from "@/lib/api";

const clean = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined));

export const useWines = (params = {}) =>
  useQuery({
    queryKey: ["wines", clean(params)],
    queryFn: async () => (await api.get("/wines", { params: clean(params) })).data,
    placeholderData: keepPreviousData,
  });

export const useFacets = () =>
  useQuery({ queryKey: ["facets"], queryFn: async () => (await api.get("/wines/facets")).data });

export const useStats = (name) =>
  useQuery({ queryKey: ["stats", name], queryFn: async () => (await api.get(`/stats/${name}`)).data });

export function useInvalidateWines() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["wines"] });
    qc.invalidateQueries({ queryKey: ["facets"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
  };
}
