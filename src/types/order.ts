import { OrderStatus, OrderType, PaymentMethod, PaymentStatus, ActorType } from './enums'

export interface OrderDto {
  id: string
  orderNumber: string
  status: OrderStatus
  statusText: string
  type: OrderType
  restaurant: OrderPartyDto
  driver: OrderPartyDto | null
  items: OrderItemDto[]
  totals: OrderTotalsDto
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  couponCode?: string
  deliveryAddress: string
  deliveryLandmark?: string
  deliveryNotes?: string
  distanceKm: number
  estimatedDeliveryAt?: string
  placedAt: string
  deliveredAt?: string
  cancelledAt?: string
  cancelledBy?: ActorType
  cancellationReason?: string
  allowedTransitions: OrderStatus[]
  canCancel: boolean
  timeline: OrderTimelineEntryDto[]
  transactions?: OrderTransactionDto[]
  createdAt: string
}

export interface OrderPartyDto {
  id: string
  name: string
  phone?: string
  avatarUrl?: string
  rating?: number
}

export interface OrderItemDto {
  id: string
  itemId: string
  itemName: string
  quantity: number
  variantName?: string
  basePrice: number
  discountedPrice?: number
  itemPrice: number
  addOns: OrderAddOnDto[]
  notes?: string
  lineTotal: number
}

export interface OrderAddOnDto {
  id: string
  name: string
  price?: number
  quantity: number
}

export interface OrderTotalsDto {
  subtotal: number
  discount: number
  delivery: number
  service: number
  tax: number
  tip: number
  total: number
  commission?: number
}

export interface OrderTimelineEntryDto {
  id: string
  orderId: string
  status: OrderStatus
  message: string
  actor: ActorType
  timestamp: string
}

export interface OrderTransactionDto {
  id: string
  orderId: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference?: string
  timestamp: string
}

export interface PlaceOrderDto {
  paymentMethod?: PaymentMethod
  customerNote?: string
}

export interface ListOrdersQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: OrderStatus
  activeOnly?: boolean
  from?: string
  to?: string
}

export interface ListOrdersAdminQueryDto extends ListOrdersQueryDto {
  restaurantId?: string
  driverId?: string
  customerId?: string
}

export interface CancelOrderDto {
  reason?: string
}

export interface RejectOrderDto {
  reason: string
}

export interface AdvanceOrderDto {
  status: OrderStatus
  note?: string
}

export interface RefundOrderDto {
  amount?: number
  reason: string
}

export interface RefundOutcome {
  message: string
  refunded: boolean
  totalRefunded: number
}
