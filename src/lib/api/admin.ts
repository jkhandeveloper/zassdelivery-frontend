import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost, apiPut } from '../api-client'
import type {
  DashboardDto,
  SalesReportDto,
  LeaderboardRowDto,
  ZoneReportRowDto,
  CouponReportRowDto,
  CancellationReportRowDto,
  ReportWindowDto,
  LeaderboardQueryDto,
  CouponDto,
  CreateCouponDto,
  UpdateCouponDto,
  ListCouponsQueryDto,
  BannerDto,
  CreateBannerDto,
  UpdateBannerDto,
  ListBannersQueryDto,
  ReorderBannersDto,
  SettingDto,
  SettingGroupDto,
  UpsertSettingsDto,
} from '@/types/admin'

export const adminApi = {
  // Dashboard & Reports
  getDashboard: () => apiGet<DashboardDto>('/admin/dashboard'),

  getSalesReport: (query?: ReportWindowDto) =>
    apiGet<SalesReportDto>('/admin/reports/sales', { params: query }),

  getRestaurantLeaderboard: (query?: LeaderboardQueryDto) =>
    apiGetPaginated<LeaderboardRowDto>('/admin/reports/restaurants', { params: query }),

  getRiderLeaderboard: (query?: LeaderboardQueryDto) =>
    apiGetPaginated<LeaderboardRowDto>('/admin/reports/riders', { params: query }),

  getCustomerLeaderboard: (query?: LeaderboardQueryDto) =>
    apiGetPaginated<LeaderboardRowDto>('/admin/reports/customers', { params: query }),

  getZoneReport: (query?: ReportWindowDto) =>
    apiGetPaginated<ZoneReportRowDto>('/admin/reports/zones', { params: query }),

  getCouponReport: (query?: ReportWindowDto) =>
    apiGetPaginated<CouponReportRowDto>('/admin/reports/coupons', { params: query }),

  getCancellationReport: (query?: ReportWindowDto) =>
    apiGetPaginated<CancellationReportRowDto>('/admin/reports/cancellations', { params: query }),

  // Coupons
  listCouponsPublic: (query?: ListCouponsQueryDto) =>
    apiGetPaginated<CouponDto>('/coupons/available', { params: query }),

  listCoupons: (query?: ListCouponsQueryDto) =>
    apiGetPaginated<CouponDto>('/coupons', { params: query }),

  getCoupon: (id: string) =>
    apiGet<CouponDto>(`/coupons/${id}`),

  createCoupon: (data: CreateCouponDto) =>
    apiPost<CouponDto>('/coupons', data),

  updateCoupon: (id: string, data: UpdateCouponDto) =>
    apiPatch<CouponDto>(`/coupons/${id}`, data),

  deactivateCoupon: (id: string) =>
    apiPost<CouponDto>(`/coupons/${id}/deactivate`, {}),

  activateCoupon: (id: string) =>
    apiPost<CouponDto>(`/coupons/${id}/activate`, {}),

  deleteCoupon: (id: string) =>
    apiDelete(`/coupons/${id}`),

  // Banners
  listBannersPublic: (query?: ListBannersQueryDto) =>
    apiGetPaginated<BannerDto>('/banners', { params: query }),

  listBanners: (query?: ListBannersQueryDto) =>
    apiGetPaginated<BannerDto>('/banner-management', { params: query }),

  createBanner: (data: CreateBannerDto) =>
    apiPost<BannerDto>('/banner-management', data),

  updateBanner: (id: string, data: UpdateBannerDto) =>
    apiPatch<BannerDto>(`/banner-management/${id}`, data),

  reorderBanners: (data: ReorderBannersDto) =>
    apiPut<BannerDto[]>('/banner-management/order', data),

  deleteBanner: (id: string) =>
    apiDelete(`/banner-management/${id}`),

  // Settings
  getPublicSettings: (query?: { group?: string }) =>
    apiGet<SettingDto[]>('/settings/public', { params: query }),

  getSettings: (query?: { group?: string }) =>
    apiGet<SettingGroupDto[]>('/settings', { params: query }),

  upsertSettings: (data: UpsertSettingsDto) =>
    apiPut<SettingDto[]>('/settings', data),

  deleteSetting: (key: string) =>
    apiDelete(`/settings/${key}`),
}
