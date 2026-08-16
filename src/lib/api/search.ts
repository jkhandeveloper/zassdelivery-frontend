import { apiGet, apiGetPaginated } from '../api-client'
import type {
  GlobalSearchDto,
  RestaurantHitDto,
  FoodHitDto,
  CategoryHitDto,
  TrendingHitDto,
  PopularFoodHitDto,
  AutocompleteHitDto,
  SearchRestaurantsDto,
  SearchFoodDto,
  SearchCategoriesDto,
  NearbySearchDto,
  TrendingDto,
  PopularDto,
  AutocompleteDto,
} from '@/types/search'
import type { Paginated } from '@/types/api'

export const searchApi = {
  globalSearch: (query?: { q?: string; limit?: number }) =>
    apiGet<GlobalSearchDto>('/search', query),

  searchRestaurants: (query?: SearchRestaurantsDto) =>
    apiGetPaginated<RestaurantHitDto>('/search/restaurants', query),

  searchFood: (query?: SearchFoodDto) =>
    apiGetPaginated<FoodHitDto>('/search/food', query),

  searchCategories: (query?: SearchCategoriesDto) =>
    apiGet<CategoryHitDto[]>('/search/categories', query),

  searchNearby: (query?: NearbySearchDto) =>
    apiGetPaginated<RestaurantHitDto>('/search/nearby', query),

  getTrending: (query?: TrendingDto) =>
    apiGetPaginated<TrendingHitDto>('/search/trending', query),

  getPopular: (query?: PopularDto) =>
    apiGetPaginated<PopularFoodHitDto>('/search/popular', query),

  autocomplete: (query: AutocompleteDto) =>
    apiGet<AutocompleteHitDto[]>('/search/autocomplete', query),
}
