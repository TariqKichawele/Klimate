import { useLocalStorage } from "./useLocalStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";


export interface FavoriteCity {
    id: string;
    name: string;
    lat: number;
    lon: number;
    country: string;
    state?: string
    addedAt: number;
}

export function useFavorites() {
    const [ favorites, setFavorites ] = useLocalStorage<FavoriteCity[]>("favorites", []);

    const queryClient = useQueryClient();

    const favoritesQuery = useQuery({
        queryKey: ['favorites'],
        queryFn: () => favorites,
        initialData: favorites,
        staleTime: Infinity
    });

    const addFavorite = useMutation({
        mutationFn: async (city: Omit<FavoriteCity, "id" | 'addedAt'>) => {
            const newFavorite = {
                ...city,
                id: `${city.lat}-${city.lon}`,
                addedAt: Date.now()
            };

            const exists = favorites.some(favorite => favorite.id === newFavorite.id);
            if(exists) return favorites;

            const newFavorites = [...favorites, newFavorite];
            setFavorites(newFavorites);

            return newFavorites;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        }
    });

    const removeFavorite = useMutation({
        mutationFn: async (id: string) => {
            const newFavorites = favorites.filter(favorite => favorite.id !== id);
            setFavorites(newFavorites);
            return newFavorites;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        }
    });

    return {
        favorites: favoritesQuery.data,
        addFavorite,
        removeFavorite,
        isFavorite: (lat: number, lon: number) => favorites.some((city) => city.lat === lat && city.lon === lon)
    }
}