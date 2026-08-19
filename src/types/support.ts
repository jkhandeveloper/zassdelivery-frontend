import { TicketStatus, TicketPriority, TicketCategory, AuditAction } from './enums'

/**
 * Support tickets, mirroring the backend's `admin-response.dto.ts`.
 *
 * Transcribed from the source: the identifier is `ticketNumber`, the opening
 * message is the first entry in `messages` rather than a `description` field,
 * and the counterparty is denormalised onto the ticket as `customerName` /
 * `assignedToName` rather than nested objects.
 */
export interface TicketDto {
  id: string
  ticketNumber: string
  category: TicketCategory
  priority: TicketPriority
  status: TicketStatus
  subject: string
  customerName: string
  customerPhone: string
  assignedToName: string | null
  assignedToId: string | null
  orderNumber: string | null
  orderId: string | null
  messageCount: number
  messages: SupportTicketMessageDto[]
  /** Whether it is still awaiting somebody. */
  isOpen: boolean
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface SupportTicketMessageDto {
  id: string
  message: string
  attachmentUrl: string | null
  /** Internal notes are never shown to the customer. */
  isInternal: boolean
  senderName: string
  senderRole: string
  /** Whether the sender was the person who opened the ticket. */
  fromCustomer: boolean
  createdAt: string
}

export interface CreateTicketDto {
  category: TicketCategory
  subject: string
  message: string
  orderId?: string
  priority?: TicketPriority
  attachmentUrl?: string
}

export interface ListTicketsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  status?: TicketStatus
  priority?: TicketPriority
  category?: TicketCategory
  assignedToId?: string
  userId?: string
  openOnly?: boolean
  from?: string
  to?: string
}

export interface AddTicketMessageDto {
  message: string
  attachmentUrl?: string
  isInternal?: boolean
}

export interface ChangeTicketStatusDto {
  status: TicketStatus
}

export interface AssignTicketDto {
  assigneeId?: string
}

export interface ChangeTicketPriorityDto {
  priority: TicketPriority
}

export interface QueueSummaryDto {
  byStatus: Array<{ status: TicketStatus; count: number }>
  open: number
}

export interface AuditLogDto {
  id: string
  entityType: string
  entityId: string
  action: AuditAction
  actorId: string
  actor: { id: string; fullName: string; role: string }
  changes: Record<string, { before: unknown; after: unknown }>
  reason?: string
  createdAt: string
}

export interface ListAuditLogsQueryDto {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  action?: AuditAction
  entityType?: string
  entityId?: string
  actorId?: string
  from?: string
  to?: string
}

export interface EntityTypesDto {
  entityTypes: string[]
}
