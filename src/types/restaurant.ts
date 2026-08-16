import { RestaurantStatus, PriceRange } from './enums'

export interface RestaurantDto {
  id: string
  name: string
  nameUr?: string
  slug: string
  description?: string
  logoUrl?: string
  coverUrl?: string
  phone?: string
  addressLine: string
  landmark?: string
  latitude: number
  longitude: number
  city: { id: string; name: string; slug: string }
  zone: { id: string; name: string; slug: string }
  categories: Array<{ id: string; name: string; slug?: string }>
  status: RestaurantStatus
  priceRange?: PriceRange
  isAcceptingOrders: boolean
  isFeatured: boolean
  isOpenNow: boolean
  canOrderNow: boolean
  opensInMinutes?: number
  rating: number
  ratingCount: number
  minOrderAmount: number
  avgPreparationMinutes: number
  deliveryRadiusMeters: number
  distanceMeters?: number
  images?: RestaurantImageDto[]
  hours?: BusinessHourResponseDto[]
  createdAt: string
}

export interface RestaurantAdminDto extends RestaurantDto {
  ownerId: string
  commissionRate: number
  submittedAt?: string
  approvedAt?: string
  approvedById?: string
  rejectionReason?: string
  deletedAt?: string
}

export interface CategoryDto {
  id: string
  name: string
  nameUr?: string
  slug: string
  iconUrl?: string
  sortOrder?: number
  isActive: boolean
}

export interface RestaurantImageDto {
  id: string
  restaurantId: string
  url: string
  caption?: string
  sortOrder?: number
  createdAt: string
}

export interface BusinessHourResponseDto {
  id: string
  restaurantId: string
  dayOfWeek: string
  opensAt: string
  closesAt: string
  isClosed: boolean
  createdAt: string
}

export interface OpenState {
  isOpenNow: boolean
  opensInMinutes?: number
  closesInMinutes?: number
}

export interface RegisterRestaurantDto {
  name: string
  nameUr?: string
  description?: string
  phone: string
  email?: string
  addressLine: string
  landmark?: string
  latitude: number
  longitude: number
  categoryIds: string[]
  priceRange?: PriceRange
  minOrderAmount?: number
  avgPreparationMinutes?: number
  deliveryRadiusMeters?: number
}

export interface UpdateRestaurantDto {
  name?: string
  nameUr?: string
  description?: string
  phone?: string
  email?: string
  addressLine?: string
  landmark?: string
  latitude?: number
  longitude?: number
  categoryIds?: string[]
  priceRange?: PriceRange
  minOrderAmount?: number
  avgPreparationMinutes?: number
  deliveryRadiusMeters?: number
}

export interface SetBusinessHoursDto {
  hours: BusinessHourDto[]
}

export interface BusinessHourDto {
  dayOfWeek: string
  opensAt: string
  closesAt: string
  isClosed?: boolean
}

export interface AddRestaurantImageDto {
  url: string
  caption?: string
}

export interface ReorderImagesDto {
  imageIds: string[]
}

export interface RegisterRestaurantStaffDto {
  phone: string
  fullName: string
  password: string
  email?: string
}

export interface RestaurantStaffDto {
  id: string
  phone: string
  fullName: string
  email?: string
  role: 'VENDOR_STAFF'
  status: string
  createdAt: string
}

export interface SetAcceptingOrdersDto {
  isAcceptingOrders: boolean
}

export interface RejectRestaurantDto {
  reason: string
}

export interface ChangeRestaurantStatusDto {
  status: RestaurantStatus
  reason?: string
}
