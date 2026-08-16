export interface CartDto {
  id: string
  restaurantId: string
  restaurant: CartRestaurantDto
  items: CartLineDto[]
  totals: CartTotalsDto
  delivery: CartDeliveryDto
  couponCode?: string
  notes?: string
  issues: CartIssueDto[]
  canCheckout: boolean
  expiresAt: string
}

export interface EmptyCartDto {
  id: string
  restaurantId?: string
  items: []
  totals: { subtotal: number; discount: number; delivery: number; service: number; tax: number; tip: number; total: number }
}

export interface CartRestaurantDto {
  id: string
  name: string
  logoUrl?: string
  minOrderAmount: number
  avgPreparationMinutes: number
  isAcceptingOrders: boolean
}

export interface CartLineDto {
  id: string
  itemId: string
  itemName: string
  quantity: number
  variantId?: string
  variantName?: string
  basePrice: number
  discountedPrice?: number
  itemPrice: number
  addOns: CartAddOnDto[]
  notes?: string
  lineTotal: number
}

export interface CartAddOnDto {
  id: string
  groupId: string
  groupName: string
  name: string
  price?: number
  quantity: number
}

export interface CartTotalsDto {
  subtotal: number
  discount: number
  delivery: number
  service: number
  tax: number
  tip: number
  total: number
}

export interface CartDeliveryDto {
  addressId: string
  zoneId: string
  eta: number
  fee: number
}

export interface CartIssueDto {
  severity: 'info' | 'warning' | 'error'
  code: string
  message: string
  affectedItemIds?: string[]
}

export interface AddCartItemDto {
  menuItemId: string
  variantId?: string
  quantity?: number
  notes?: string
  addOns?: CartAddOnSelectionDto[]
}

export interface CartAddOnSelectionDto {
  addOnId: string
  quantity?: number
}

export interface UpdateCartItemDto {
  quantity: number
}

export interface ApplyCouponDto {
  code: string
}

export interface SetCartAddressDto {
  addressId: string
}

export interface SetTipDto {
  tipAmount: number
}
