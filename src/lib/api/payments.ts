import { apiDelete, apiGet, apiGetPaginated, apiPost } from '../api-client'
import type {
  PaymentDto,
  TransactionDto,
  StartCheckoutDto,
  CheckoutDto,
  PaymentVerificationDto,
  GatewayAvailabilityDto,
  ListPaymentsQueryDto,
  ListTransactionsQueryDto,
  ListInvoicesQueryDto,
  InvoiceSummaryDto,
  InvoiceDto,
  RefundPaymentDto,
  FailPaymentDto,
  LedgerSummaryQueryDto,
  LedgerSummaryDto,
  WebhookEventDto,
  ListWebhookEventsQueryDto,
} from '@/types/payment'
import type { Paginated } from '@/types/api'

export const paymentApi = {
  // Customer checkout
  getPaymentMethods: () => apiGet<GatewayAvailabilityDto[]>('/payments/methods'),

  startCheckout: (orderId: string, data: StartCheckoutDto) =>
    apiPost<CheckoutDto>(`/payments/orders/${orderId}/checkout`, data),

  verifyPayment: (paymentId: string) =>
    apiPost<PaymentVerificationDto>(`/payments/${paymentId}/verify`, {}),

  cancelPayment: (paymentId: string) =>
    apiPost<PaymentDto>(`/payments/${paymentId}/cancel`, {}),

  getPayments: (query?: ListPaymentsQueryDto) =>
    apiGetPaginated<PaymentDto>('/payments', query),

  getTransactions: (query?: ListTransactionsQueryDto) =>
    apiGetPaginated<TransactionDto>('/payments/transactions', query),

  getInvoices: (query?: ListInvoicesQueryDto) =>
    apiGetPaginated<InvoiceSummaryDto>('/payments/invoices', query),

  getInvoice: (orderId: string) =>
    apiGet<InvoiceDto>(`/payments/invoices/${orderId}`),

  getOrderTransactions: (orderId: string) =>
    apiGet<TransactionDto[]>(`/payments/orders/${orderId}/transactions`),

  getPayment: (id: string) => apiGet<PaymentDto>(`/payments/${id}`),

  // Admin management
  listPaymentsAdmin: (query?: ListPaymentsQueryDto) =>
    apiGetPaginated<PaymentDto>('/payment-management/payments', query),

  getOutstandingCash: () =>
    apiGetPaginated<PaymentDto>('/payment-management/payments/outstanding-cash'),

  refundPayment: (id: string, data: RefundPaymentDto) =>
    apiPost('/payment-management/payments/{id}/refund', data),

  markCollected: (id: string) =>
    apiPost<PaymentDto>(`/payment-management/payments/${id}/mark-collected`, {}),

  failPayment: (id: string, data: FailPaymentDto) =>
    apiPost<PaymentDto>(`/payment-management/payments/${id}/fail`, data),

  expirePayments: () =>
    apiPost<{ expired: number; settled: number }>('/payment-management/payments/expire', {}),

  listTransactionsAdmin: (query?: ListTransactionsQueryDto) =>
    apiGetPaginated<TransactionDto>('/payment-management/transactions', query),

  getLedgerSummary: (query?: LedgerSummaryQueryDto) =>
    apiGet<LedgerSummaryDto>('/payment-management/transactions/summary', query),

  listInvoicesAdmin: (query?: ListInvoicesQueryDto) =>
    apiGetPaginated<InvoiceSummaryDto>('/payment-management/invoices', query),

  getInvoiceAdmin: (orderId: string) =>
    apiGet<InvoiceDto>(`/payment-management/invoices/${orderId}`),

  listWebhookEvents: (query?: ListWebhookEventsQueryDto) =>
    apiGetPaginated<WebhookEventDto>('/payment-management/webhooks', query),

  replayWebhook: (id: string) =>
    apiPost<WebhookEventDto>(`/payment-management/webhooks/${id}/replay`, {}),
}
