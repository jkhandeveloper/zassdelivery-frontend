import { DriverStatus, DriverAvailability, VehicleType, DriverDocumentType, DriverDocumentStatus, AssignmentStatus, PayoutStatus, PayoutMethod } from './enums'

export interface RiderDto {
  id: string
  userId: string
  cnic: string
  licenseNumber?: string
  status: DriverStatus
  availability: DriverAvailability
  zoneId: string
  currentLat?: number
  currentLng?: number
  onlineSince?: string
  rating: number
  ratingCount: number
  totalDeliveries: number
  payout?: PayoutDetailsDto
  wallet?: RiderWalletDto
  createdAt: string
  updatedAt: string
}

export interface PayoutDetailsDto {
  bankName?: string
  accountTitle?: string
  accountNumber?: string
}

export interface RiderWalletDto {
  userId: string
  balance: number
  currency: string
  isLocked: boolean
  pendingWithdrawals: number
  availableToWithdraw: number
}

export interface RegisterRiderDto {
  cnic: string
  licenseNumber?: string
  zoneId?: string
  vehicle: RiderVehicleDto
  payout?: PayoutDetailsDto
}

export interface RiderVehicleDto {
  type: VehicleType
  make?: string
  model?: string
  year?: number
  color?: string
  plateNumber?: string
}

export interface UpdateRiderDto {
  licenseNumber?: string
  zoneId?: string
  payout?: PayoutDetailsDto
}

export interface RiderDocumentDto {
  id: string
  riderId: string
  type: DriverDocumentType
  fileUrl: string
  number?: string
  expiresAt?: string
  status: DriverDocumentStatus
  rejectionReason?: string
  verifiedAt?: string
  createdAt: string
}

export interface UploadDocumentDto {
  type: DriverDocumentType
  fileUrl: string
  number?: string
  expiresAt?: string
}

export interface SetAvailabilityDto {
  availability: DriverAvailability
  latitude?: number
  longitude?: number
}

export interface UpdateLocationDto {
  latitude: number
  longitude: number
}

export interface AssignmentDto {
  id: string
  orderId: string
  orderNumber: string
  driverId: string
  status: AssignmentStatus
  offerExpiresAt?: string
  acceptedAt?: string
  rejectionReason?: string
  completedAt?: string
  createdAt: string
}

export interface ListAssignmentsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: AssignmentStatus
  liveOnly?: boolean
  from?: string
  to?: string
}

export interface RejectOfferDto {
  reason?: string
}

export interface DeliveryCodeIssuedDto {
  message: string
  codeSent: boolean
  codeLength: number
}

export interface ConfirmDeliveryDto {
  code: string
}

export interface DeliveryCompletedDto {
  message: string
  earned: number
  breakdown: EarningDto[]
}

export interface EarningDto {
  id: string
  type: string
  amount: number
  orderId?: string
  orderNumber?: string
  description?: string
  earnedAt: string
}

export interface ListEarningsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  from?: string
  to?: string
}

export interface EarningsSummaryDto {
  today: number
  thisWeek: number
  thisMonth: number
  lifetime: number
  deliveriesToday: number
  deliveriesThisWeek: number
  deliveriesLifetime: number
  averagePerDelivery: number
}

export interface WalletTransactionDto {
  id: string
  userId: string
  amount: number
  type: string
  reason: string
  balance: number
  reference?: string
  createdAt: string
}

export interface RequestPayoutDto {
  amount: number
  method: PayoutMethod
}

export interface PayoutRequestDto {
  id: string
  userId: string
  amount: number
  method: PayoutMethod
  status: PayoutStatus
  bankName?: string
  accountTitle?: string
  accountNumber?: string
  rejectionReason?: string
  processedAt?: string
  createdAt: string
}

export interface ListPayoutsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: PayoutStatus
  from?: string
  to?: string
}

export interface ListRidersQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
  status?: DriverStatus
  availability?: DriverAvailability
  zoneId?: string
}

export interface RejectRiderDto {
  reason: string
}

export interface SuspendRiderDto {
  reason: string
}

export interface AssignOrderDto {
  driverId?: string
  timeoutSeconds?: number
}

export interface CancelAssignmentDto {
  reason: string
}

export interface RejectDocumentDto {
  reason: string
}
