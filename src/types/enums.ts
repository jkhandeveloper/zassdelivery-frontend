/**
 * Every domain enum, mirroring `prisma/schema.prisma` exactly.
 *
 * Written as const objects rather than TS `enum`s so the values are plain
 * strings on the wire and the types stay structural. If the schema gains a
 * member, add it here — the status→tone map below is exhaustive on purpose and
 * will fail to compile until it is handled.
 */

export const AddressLabel = {
  HOME: "HOME",
  WORK: "WORK",
  OTHER: "OTHER",
} as const;
export type AddressLabel = (typeof AddressLabel)[keyof typeof AddressLabel];

export const DayOfWeek = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const;
export type DayOfWeek = (typeof DayOfWeek)[keyof typeof DayOfWeek];

export const RestaurantStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  TEMPORARILY_CLOSED: "TEMPORARILY_CLOSED",
  REJECTED: "REJECTED",
} as const;
export type RestaurantStatus = (typeof RestaurantStatus)[keyof typeof RestaurantStatus];

export const PriceRange = {
  BUDGET: "BUDGET",
  MODERATE: "MODERATE",
  PREMIUM: "PREMIUM",
} as const;
export type PriceRange = (typeof PriceRange)[keyof typeof PriceRange];

export const MenuItemStatus = {
  AVAILABLE: "AVAILABLE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  HIDDEN: "HIDDEN",
} as const;
export type MenuItemStatus = (typeof MenuItemStatus)[keyof typeof MenuItemStatus];

export const SpiceLevel = {
  NONE: "NONE",
  MILD: "MILD",
  MEDIUM: "MEDIUM",
  HOT: "HOT",
  EXTRA_HOT: "EXTRA_HOT",
} as const;
export type SpiceLevel = (typeof SpiceLevel)[keyof typeof SpiceLevel];

export const OrderType = {
  DELIVERY: "DELIVERY",
  PICKUP: "PICKUP",
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const OrderStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  PICKED_UP: "PICKED_UP",
  ON_THE_WAY: "ON_THE_WAY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REJECTED: "REJECTED",
  FAILED: "FAILED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ActorType = {
  CUSTOMER: "CUSTOMER",
  RESTAURANT: "RESTAURANT",
  DRIVER: "DRIVER",
  ADMIN: "ADMIN",
  SYSTEM: "SYSTEM",
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];

export const PaymentMethod = {
  CASH_ON_DELIVERY: "CASH_ON_DELIVERY",
  WALLET: "WALLET",
  CARD: "CARD",
  JAZZCASH: "JAZZCASH",
  EASYPAISA: "EASYPAISA",
  BANK_TRANSFER: "BANK_TRANSFER",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const PaymentStatus = {
  PENDING: "PENDING",
  AUTHORIZED: "AUTHORIZED",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED",
  PARTIALLY_REFUNDED: "PARTIALLY_REFUNDED",
  CANCELLED: "CANCELLED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const TransactionType = {
  PAYMENT: "PAYMENT",
  REFUND: "REFUND",
  PAYOUT: "PAYOUT",
  COMMISSION: "COMMISSION",
  ADJUSTMENT: "ADJUSTMENT",
  FEE: "FEE",
} as const;
export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

export const TransactionStatus = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  REVERSED: "REVERSED",
} as const;
export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

export const WalletTransactionType = {
  CREDIT: "CREDIT",
  DEBIT: "DEBIT",
} as const;
export type WalletTransactionType =
  (typeof WalletTransactionType)[keyof typeof WalletTransactionType];

export const WalletTransactionReason = {
  ORDER_PAYMENT: "ORDER_PAYMENT",
  ORDER_REFUND: "ORDER_REFUND",
  TOPUP: "TOPUP",
  CASHBACK: "CASHBACK",
  REFERRAL_BONUS: "REFERRAL_BONUS",
  DRIVER_EARNING: "DRIVER_EARNING",
  WITHDRAWAL: "WITHDRAWAL",
  ADJUSTMENT: "ADJUSTMENT",
} as const;
export type WalletTransactionReason =
  (typeof WalletTransactionReason)[keyof typeof WalletTransactionReason];

export const CouponType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
  FREE_DELIVERY: "FREE_DELIVERY",
} as const;
export type CouponType = (typeof CouponType)[keyof typeof CouponType];

export const DeliveryFeeType = {
  FLAT: "FLAT",
  PER_KM: "PER_KM",
  TIERED: "TIERED",
} as const;
export type DeliveryFeeType = (typeof DeliveryFeeType)[keyof typeof DeliveryFeeType];

export const DriverStatus = {
  PENDING_APPROVAL: "PENDING_APPROVAL",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  REJECTED: "REJECTED",
} as const;
export type DriverStatus = (typeof DriverStatus)[keyof typeof DriverStatus];

export const DriverAvailability = {
  OFFLINE: "OFFLINE",
  ONLINE: "ONLINE",
  ON_DELIVERY: "ON_DELIVERY",
  ON_BREAK: "ON_BREAK",
} as const;
export type DriverAvailability = (typeof DriverAvailability)[keyof typeof DriverAvailability];

export const VehicleType = {
  MOTORCYCLE: "MOTORCYCLE",
  BICYCLE: "BICYCLE",
  CAR: "CAR",
  RICKSHAW: "RICKSHAW",
  ON_FOOT: "ON_FOOT",
} as const;
export type VehicleType = (typeof VehicleType)[keyof typeof VehicleType];

export const DriverDocumentType = {
  CNIC_FRONT: "CNIC_FRONT",
  CNIC_BACK: "CNIC_BACK",
  DRIVING_LICENSE: "DRIVING_LICENSE",
  VEHICLE_REGISTRATION: "VEHICLE_REGISTRATION",
  PROFILE_PHOTO: "PROFILE_PHOTO",
} as const;
export type DriverDocumentType = (typeof DriverDocumentType)[keyof typeof DriverDocumentType];

export const DriverDocumentStatus = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
} as const;
export type DriverDocumentStatus = (typeof DriverDocumentStatus)[keyof typeof DriverDocumentStatus];

export const AssignmentStatus = {
  OFFERED: "OFFERED",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
} as const;
export type AssignmentStatus = (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

export const DriverEarningType = {
  BASE_FARE: "BASE_FARE",
  DISTANCE: "DISTANCE",
  TIP: "TIP",
  BONUS: "BONUS",
  ADJUSTMENT: "ADJUSTMENT",
} as const;
export type DriverEarningType = (typeof DriverEarningType)[keyof typeof DriverEarningType];

export const PayoutStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  PAID: "PAID",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

export const PayoutMethod = {
  BANK_TRANSFER: "BANK_TRANSFER",
  JAZZCASH: "JAZZCASH",
  EASYPAISA: "EASYPAISA",
} as const;
export type PayoutMethod = (typeof PayoutMethod)[keyof typeof PayoutMethod];

export const NotificationType = {
  ORDER_UPDATE: "ORDER_UPDATE",
  PROMOTION: "PROMOTION",
  WALLET: "WALLET",
  SUPPORT: "SUPPORT",
  SYSTEM: "SYSTEM",
} as const;
export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export const NotificationChannel = {
  IN_APP: "IN_APP",
  PUSH: "PUSH",
  SMS: "SMS",
  EMAIL: "EMAIL",
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const TicketStatus = {
  OPEN: "OPEN",
  IN_PROGRESS: "IN_PROGRESS",
  WAITING_ON_CUSTOMER: "WAITING_ON_CUSTOMER",
  RESOLVED: "RESOLVED",
  CLOSED: "CLOSED",
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const TicketPriority = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const;
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority];

export const TicketCategory = {
  ORDER_ISSUE: "ORDER_ISSUE",
  PAYMENT_ISSUE: "PAYMENT_ISSUE",
  DELIVERY_ISSUE: "DELIVERY_ISSUE",
  ACCOUNT: "ACCOUNT",
  RESTAURANT_COMPLAINT: "RESTAURANT_COMPLAINT",
  OTHER: "OTHER",
} as const;
export type TicketCategory = (typeof TicketCategory)[keyof typeof TicketCategory];

export const BannerPlacement = {
  HOME_TOP: "HOME_TOP",
  HOME_MIDDLE: "HOME_MIDDLE",
  CATEGORY_PAGE: "CATEGORY_PAGE",
  CHECKOUT: "CHECKOUT",
} as const;
export type BannerPlacement = (typeof BannerPlacement)[keyof typeof BannerPlacement];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  APPROVE: "APPROVE",
  REJECT: "REJECT",
  REFUND: "REFUND",
  STATUS_CHANGE: "STATUS_CHANGE",
  PERMISSION_CHANGE: "PERMISSION_CHANGE",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
