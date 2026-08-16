import { MenuItemStatus, SpiceLevel } from './enums'

export interface MenuDto {
  id: string
  restaurantId: string
  name: string
  description?: string
  sortOrder?: number
  isActive: boolean
  createdAt: string
}

export interface MenuCategoryDto {
  id: string
  menuId: string
  name: string
  nameUr?: string
  description?: string
  imageUrl?: string
  sortOrder?: number
  isActive: boolean
  createdAt: string
}

export interface MenuItemDto {
  id: string
  name: string
  nameUr?: string
  description?: string
  imageUrl?: string
  basePrice: number
  discountedPrice?: number
  effectivePrice: number
  status: MenuItemStatus
  isVegetarian: boolean
  spiceLevel?: SpiceLevel
  calories?: number
  preparationMinutes?: number
  isFeatured: boolean
  sortOrder?: number
  rating: number
  ratingCount: number
  isAvailable: boolean
  availabilityReason?:
    | 'available'
    | 'hidden'
    | 'out_of_stock'
    | 'outside_window'
    | 'sold_out'
  stockRemaining?: number
  availableDays?: string[]
  availableFrom?: string
  availableTo?: string
  variants: MenuVariantDto[]
  addOnGroups: AddOnGroupDto[]
  images: MenuItemImageDto[]
  menuCategoryId: string
  createdAt: string
}

export interface MenuItemAdminDto extends MenuItemDto {
  basePrice: number
  discountedPrice?: number
  trackInventory?: boolean
  stockQuantity?: number
  lowStockThreshold?: number
  deletedAt?: string
}

export interface MenuVariantDto {
  id: string
  itemId: string
  name: string
  price: number
  isDefault: boolean
  isAvailable: boolean
  sortOrder?: number
  trackInventory?: boolean
  stockQuantity?: number
  createdAt: string
}

export interface AddOnGroupDto {
  id: string
  itemId: string
  name: string
  minSelect?: number
  maxSelect?: number
  isRequired: boolean
  sortOrder?: number
  addOns: AddOnDto[]
  createdAt: string
}

export interface AddOnDto {
  id: string
  groupId: string
  name: string
  price?: number
  isAvailable: boolean
  sortOrder?: number
  createdAt: string
}

export interface MenuItemImageDto {
  id: string
  itemId: string
  url: string
  caption?: string
  sortOrder?: number
  createdAt: string
}

export interface CreateMenuDto {
  name: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateMenuDto {
  name?: string
  description?: string
  sortOrder?: number
  isActive?: boolean
}

export interface CreateMenuCategoryDto {
  name: string
  nameUr?: string
  description?: string
  imageUrl?: string
  sortOrder?: number
  isActive?: boolean
}

export interface UpdateMenuCategoryDto {
  name?: string
  nameUr?: string
  description?: string
  imageUrl?: string
  sortOrder?: number
  isActive?: boolean
}

export interface CreateMenuItemDto {
  menuCategoryId: string
  name: string
  nameUr?: string
  description?: string
  imageUrl?: string
  basePrice: number
  discountedPrice?: number
  status?: MenuItemStatus
  isVegetarian?: boolean
  spiceLevel?: SpiceLevel
  calories?: number
  preparationMinutes?: number
  isFeatured?: boolean
  sortOrder?: number
  availableDays?: string[]
  availableFrom?: string
  availableTo?: string
  trackInventory?: boolean
  stockQuantity?: number
  lowStockThreshold?: number
}

export interface UpdateMenuItemDto {
  name?: string
  nameUr?: string
  description?: string
  imageUrl?: string
  basePrice?: number
  discountedPrice?: number
  status?: MenuItemStatus
  isVegetarian?: boolean
  spiceLevel?: SpiceLevel
  calories?: number
  preparationMinutes?: number
  isFeatured?: boolean
  sortOrder?: number
  availableDays?: string[]
  availableFrom?: string
  availableTo?: string
  trackInventory?: boolean
  stockQuantity?: number
  lowStockThreshold?: number
}

export interface AddMenuItemImageDto {
  url: string
  caption?: string
}

export interface CreateVariantDto {
  name: string
  price: number
  isDefault?: boolean
  isAvailable?: boolean
  sortOrder?: number
  trackInventory?: boolean
  stockQuantity?: number
}

export interface UpdateVariantDto {
  name?: string
  price?: number
  isDefault?: boolean
  isAvailable?: boolean
  sortOrder?: number
  trackInventory?: boolean
  stockQuantity?: number
}

export interface CreateAddOnGroupDto {
  name: string
  minSelect?: number
  maxSelect?: number
  isRequired?: boolean
  sortOrder?: number
}

export interface UpdateAddOnGroupDto {
  name?: string
  minSelect?: number
  maxSelect?: number
  isRequired?: boolean
  sortOrder?: number
}

export interface CreateAddOnDto {
  name: string
  price?: number
  isAvailable?: boolean
  sortOrder?: number
}

export interface UpdateAddOnDto {
  name?: string
  price?: number
  isAvailable?: boolean
  sortOrder?: number
}

export interface AdjustStockDto {
  delta: number
}

export interface BulkUpdateItemsDto {
  items: BulkItemUpdateEntryDto[]
}

export interface BulkItemUpdateEntryDto {
  id: string
  basePrice?: number
  discountedPrice?: number
  status?: MenuItemStatus
  isVegetarian?: boolean
  spiceLevel?: SpiceLevel
  stockQuantity?: number
}

export interface BulkStatusDto {
  itemIds: string[]
  status: MenuItemStatus
}

export interface BulkResultDto {
  updated: number
  message: string
}

export interface ListMenuItemsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  menuCategoryId?: string
  status?: MenuItemStatus
  spiceLevel?: SpiceLevel
  isVegetarian?: boolean
  featuredOnly?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface ListMenuItemsAdminQueryDto extends ListMenuItemsQueryDto {
  lowStockOnly?: boolean
  includeDeleted?: boolean
}

export interface ListMenusQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}
