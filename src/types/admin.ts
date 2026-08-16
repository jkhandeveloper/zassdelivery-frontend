import type { CouponType, BannerPlacement } from './enums'

export interface DashboardDto {
  totals: DashboardTotalsDto
  queues: DashboardQueuesDto
  operations: DashboardOperationsDto
  trend: TimeSeriesPointDto[]
  actionsRequired: DashboardActionsRequiredDto
  generatedAt: string
}

export interface DashboardTotalsDto {
  activeUsers: number
  totalOrders: number
  totalRevenue: number
  pendingPayments: number
  activeRiders: number
  activeRestaurants: number
}

export interface DashboardQueuesDto {
  pendingRestaurantApprovals: number
  pendingRiderApprovals: number
  pendingDocumentVerifications: number
  openSupportTickets: number
  pendingPayoutRequests: number
}

export interface DashboardOperationsDto {
  onlineRiders: number
  activeDeliveries: number
  onlineRestaurants: number
  acceptingOrdersRestaurants: number
}

export interface TimeSeriesPointDto {
  date: string
  orders: number
  revenue: number
  delivery: number
}

export interface DashboardActionsRequiredDto {
  restaurantApprovals: number
  riderApprovals: number
  documentVerifications: number
  supportTickets: number
  payoutRequests: number
}

export interface SalesReportDto {
  period: { from: string; to: string }
  totalOrders: number
  totalRevenue: number
  totalCommission: number
  totalRefunds: number
  averageOrderValue: number
  byPaymentMethod: Record<string, number>
  daily: Array<{ date: string; orders: number; revenue: number }>
}

export interface LeaderboardRowDto {
  rank: number
  id: string
  name: string
  metric: number
  change: number
  trend: 'up' | 'down' | 'stable'
}

export interface ZoneReportRowDto {
  zone: { id: string; name: string }
  orders: number
  revenue: number
  activeRestaurants: number
  activeRiders: number
}

export interface CouponReportRowDto {
  id: string
  code: string
  type: CouponType
  value: number
  uses: number
  revenue: number
  discount: number
}

export interface CancellationReportRowDto {
  reason: string
  count: number
  percentage: number
  revenue: number
}

export interface ReportWindowDto {
  from?: string
  to?: string
}

export interface LeaderboardQueryDto {
  from?: string
  to?: string
  limit?: number
}

export interface CouponDto {
  id: string
  code: string
  type: CouponType
  value: number
  maxDiscountAmount?: number
  minOrderAmount?: number
  description?: string
  startsAt: string
  expiresAt: string
  usageLimit?: number
  perUserLimit?: number
  usageCount: number
  restaurantId?: string
  zoneId?: string
  firstOrderOnly: boolean
  isActive: boolean
  createdAt: string
  createdById: string
}

export interface CreateCouponDto {
  code: string
  type: CouponType
  value: number
  maxDiscountAmount?: number
  minOrderAmount?: number
  description?: string
  startsAt: string
  expiresAt: string
  usageLimit?: number
  perUserLimit?: number
  restaurantId?: string
  zoneId?: string
  firstOrderOnly?: boolean
  isActive?: boolean
}

export interface UpdateCouponDto {
  code?: string
  type?: CouponType
  value?: number
  maxDiscountAmount?: number
  minOrderAmount?: number
  description?: string
  startsAt?: string
  expiresAt?: string
  usageLimit?: number
  perUserLimit?: number
  restaurantId?: string
  zoneId?: string
  firstOrderOnly?: boolean
  isActive?: boolean
}

export interface ListCouponsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  type?: CouponType
  isActive?: boolean
  liveOnly?: boolean
  restaurantId?: string
}

export interface BannerDto {
  id: string
  title: string
  subtitle?: string
  imageUrl: string
  placement: BannerPlacement
  restaurantId?: string
  linkUrl?: string
  cityId?: string
  sortOrder: number
  startsAt?: string
  endsAt?: string
  isActive: boolean
  createdAt: string
}

export interface CreateBannerDto {
  title: string
  subtitle?: string
  imageUrl: string
  placement: BannerPlacement
  restaurantId?: string
  linkUrl?: string
  cityId?: string
  sortOrder?: number
  startsAt?: string
  endsAt?: string
  isActive?: boolean
}

export interface UpdateBannerDto {
  title?: string
  subtitle?: string
  imageUrl?: string
  placement?: BannerPlacement
  restaurantId?: string
  linkUrl?: string
  cityId?: string
  sortOrder?: number
  startsAt?: string
  endsAt?: string
  isActive?: boolean
}

export interface ListBannersQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  placement?: BannerPlacement
  cityId?: string
  isActive?: boolean
}

export interface ReorderBannersDto {
  banners: Array<{ id: string; sortOrder: number }>
}

export interface SettingDto {
  id: string
  key: string
  value: unknown
  valueType: string
  group?: string
  description?: string
  isPublic: boolean
  updatedAt: string
}

export interface SettingGroupDto {
  group: string
  settings: SettingDto[]
}

export interface UpsertSettingDto {
  key: string
  value: unknown
  valueType?: string
  group?: string
  description?: string
  isPublic?: boolean
}

export interface UpsertSettingsDto {
  settings: UpsertSettingDto[]
}
