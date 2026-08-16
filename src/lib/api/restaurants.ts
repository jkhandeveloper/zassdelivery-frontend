import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../api-client'
import type { RestaurantDto, RestaurantAdminDto, CategoryDto, RegisterRestaurantDto, UpdateRestaurantDto, SetBusinessHoursDto, AddRestaurantImageDto, ReorderImagesDto, RegisterRestaurantStaffDto, RestaurantStaffDto, SetAcceptingOrdersDto, RejectRestaurantDto, ChangeRestaurantStatusDto, BusinessHourResponseDto, RestaurantImageDto } from '@/types/restaurant'
import type { Paginated } from '@/types/api'
import type { OpenState } from '@/types/restaurant'

export const restaurantApi = {
  // Public storefront
  listRestaurants: (query?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    cityId?: string
    zoneId?: string
    category?: string
    priceRange?: string
    minRating?: number
    acceptingOnly?: boolean
    latitude?: number
    longitude?: number
  }) => apiGetPaginated<RestaurantDto>('/restaurants', query),

  getRestaurantCategories: (query?: { sortBy?: string; sortOrder?: 'asc' | 'desc'; activeOnly?: boolean }) =>
    apiGetPaginated<CategoryDto>('/restaurants/categories', query),

  getRestaurantBySlug: (slug: string) => apiGet<RestaurantDto>(`/restaurants/${slug}`),

  getRestaurantHours: (id: string) =>
    apiGet<{ hours: BusinessHourResponseDto[]; current: OpenState }>(`/restaurants/${id}/hours`),

  getRestaurantImages: (id: string) => apiGet<RestaurantImageDto[]>(`/restaurants/${id}/images`),

  // Restaurant owner/staff management
  registerRestaurant: (data: RegisterRestaurantDto) =>
    apiPost<RestaurantAdminDto>('/restaurant-management', data),

  getOwnRestaurants: (query?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' }) =>
    apiGetPaginated<RestaurantAdminDto>('/restaurant-management/mine', query),

  listRestaurantsAdmin: (query?: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    status?: string
    ownerId?: string
    includeDeleted?: boolean
  }) => apiGetPaginated<RestaurantAdminDto>('/restaurant-management', query),

  getRestaurantAdmin: (id: string) => apiGet<RestaurantAdminDto>(`/restaurant-management/${id}`),

  updateRestaurant: (id: string, data: UpdateRestaurantDto) =>
    apiPatch<RestaurantAdminDto>(`/restaurant-management/${id}`, data),

  deleteRestaurant: (id: string) => apiDelete(`/restaurant-management/${id}`),

  approveRestaurant: (id: string) => apiPost<RestaurantAdminDto>(`/restaurant-management/${id}/approve`, {}),

  rejectRestaurant: (id: string, data: RejectRestaurantDto) =>
    apiPost<RestaurantAdminDto>(`/restaurant-management/${id}/reject`, data),

  resubmitRestaurant: (id: string) =>
    apiPost<RestaurantAdminDto>(`/restaurant-management/${id}/resubmit`, {}),

  changeRestaurantStatus: (id: string, data: ChangeRestaurantStatusDto) =>
    apiPatch<RestaurantAdminDto>(`/restaurant-management/${id}/status`, data),

  setAcceptingOrders: (id: string, data: SetAcceptingOrdersDto) =>
    apiPatch<RestaurantAdminDto>(`/restaurant-management/${id}/accepting-orders`, data),

  setBusinessHours: (id: string, data: SetBusinessHoursDto) =>
    apiPatch<BusinessHourResponseDto[]>(`/restaurant-management/${id}/hours`, data),

  addRestaurantImage: (id: string, data: AddRestaurantImageDto) =>
    apiPost<RestaurantImageDto>(`/restaurant-management/${id}/images`, data),

  reorderRestaurantImages: (id: string, data: ReorderImagesDto) =>
    apiPatch<RestaurantImageDto[]>(`/restaurant-management/${id}/images/order`, data),

  deleteRestaurantImage: (id: string, imageId: string) =>
    apiDelete(`/restaurant-management/${id}/images/${imageId}`),

  registerRestaurantStaff: (id: string, data: RegisterRestaurantStaffDto) =>
    apiPost<RestaurantStaffDto>(`/restaurant-management/${id}/staff`, data),

  getRestaurantStaff: (id: string) =>
    apiGet<RestaurantStaffDto[]>(`/restaurant-management/${id}/staff`),
}
