import api from "./axios";

export const getFavorites = async () => {
  const res = await api.get("/favorites");
  return res.data.data.favorites;
};

export const checkFavorite = async (stylistId: string) => {
  const res = await api.get(`/favorites/check/${stylistId}`);
  return res.data.data.isFollowing;
};

export const addFavorite = async (stylistId: string) => {
  const res = await api.post("/favorites", { stylistId });
  return res.data.data.favorites;
};

export const removeFavorite = async (stylistId: string) => {
  const res = await api.delete(`/favorites/${stylistId}`);
  return res.data.data.favorites;
};
