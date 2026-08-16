export interface GlobalSearchDto {
  restaurants: RestaurantHitDto[]
  dishes: FoodHitDto[]
  categories: CategoryHitDto[]
  totalResults: number
}

export interface RestaurantHitDto {
  id: string
  name: string
  slug: string
  logoUrl?: string
  rating: number
  distance?: number
  minOrderAmount: number
  deliveryTime: number
  isOpenNow: boolean
}

export interface FoodHitDto {
  id: string
  name: string
  itemId: string
  restaurantId: string
  restaurantName: string
  price: number
  imageUrl?: string
  rating: number
  isVegetarian: boolean
}

export interface CategoryHitDto {
  id: string
  name: string
  slug: string
  imageUrl?: string
}

export interface TrendingHitDto extends FoodHitDto {
  orders: number
}

export interface PopularFoodHitDto extends FoodHitDto {
  orders: number
}

export interface AutocompleteHitDto {
  type: 'restaurant' | 'dish' | 'category'
  id: string
  label: string
  slug?: string
  imageUrl?: string
  score: number
}

export interface SearchRestaurantsDto {
  q?: string
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'rating' | 'distance' | 'preparation'
  sortOrder?: 'asc' | 'desc'
  cityId?: string
  zoneId?: string
  category?: string
  priceRange?: string
  minRating?: number
  openNow?: boolean
  latitude?: number
  longitude?: number
  radiusMeters?: number
}

export interface SearchFoodDto {
  q?: string
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating'
  sortOrder?: 'asc' | 'desc'
  restaurantId?: string
  category?: string
  isVegetarian?: boolean
  minPrice?: number
  maxPrice?: number
  latitude?: number
  longitude?: number
  radiusMeters?: number
}

export interface SearchCategoriesDto {
  q?: string
  limit?: number
}

export interface NearbySearchDto {
  latitude: number
  longitude: number
  radiusMeters?: number
  limit?: number
  page?: number
}

export interface TrendingDto {
  days?: number
  limit?: number
  cityId?: string
  page?: number
}

export interface PopularDto {
  limit?: number
  cityId?: string
  page?: number
}

export interface AutocompleteDto {
  q: string
  limit?: number
}
