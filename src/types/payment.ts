import { PaymentMethod, PaymentStatus, TransactionType, TransactionStatus } from './enums'

export interface PaymentDto {
  id: string
  orderId: string
  orderNumber: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  reference?: string
  failureReason?: string
  collectedAt?: string
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

export interface TransactionDto {
  id: string
  orderId?: string
  userId?: string
  amount: number
  type: TransactionType
  method: PaymentMethod
  status: TransactionStatus
  reference?: string
  description?: string
  createdAt: string
}

export interface StartCheckoutDto {
  method: PaymentMethod
}

export interface CheckoutDto {
  payment: PaymentDto
  action: 'REDIRECT' | 'SETTLED' | 'ON_DELIVERY'
  message: string
  checkout?: CheckoutFieldsDto
}

export interface CheckoutFieldsDto {
  formFields?: Record<string, unknown>
  redirectUrl?: string
}

export interface PaymentVerificationDto {
  payment: PaymentDto
  settled: boolean
  message: string
  source: 'LOCAL' | 'GATEWAY'
}

export interface GatewayAvailabilityDto {
  name: string
  method: PaymentMethod
  available: boolean
}

export interface ListPaymentsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}

export interface ListTransactionsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  from?: string
  to?: string
}

export interface ListInvoicesQueryDto {
  page?: number
  limit?: number
  from?: string
  to?: string
}

export interface InvoiceSummaryDto {
  orderId: string
  orderNumber: string
  total: number
  method: PaymentMethod
  status: PaymentStatus
  issuedAt: string
}

export interface InvoiceDto {
  orderId: string
  orderNumber: string
  restaurant: { id: string; name: string; phone?: string }
  customer: { id: string; fullName: string; phone: string }
  items: Array<{ name: string; quantity: number; price: number; total: number }>
  totals: {
    subtotal: number
    discount: number
    delivery: number
    service: number
    tax: number
    tip: number
    total: number
  }
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  deliveryAddress: string
  issuedAt: string
  notes?: string
}

export interface RefundPaymentDto {
  amount?: number
  reason: string
  destination?: 'SOURCE' | 'WALLET'
}

export interface FailPaymentDto {
  reason: string
}

export interface LedgerSummaryQueryDto {
  from?: string
  to?: string
}

export interface LedgerSummaryDto {
  period: { from: string; to: string }
  totalPayments: number
  totalRefunds: number
  totalFees: number
  netAmount: number
  byMethod: Record<string, number>
}

export interface WebhookEventDto {
  id: string
  gateway: string
  payload: Record<string, unknown>
  status: 'RECEIVED' | 'PROCESSED' | 'DUPLICATE' | 'INVALID' | 'FAILED'
  processedAt?: string
  error?: string
  createdAt: string
}

export interface ListWebhookEventsQueryDto {
  page?: number
  limit?: number
  gateway?: string
  status?: string
  from?: string
  to?: string
}
