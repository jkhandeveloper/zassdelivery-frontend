import { TicketStatus, TicketPriority, TicketCategory, AuditAction } from './enums'

export interface TicketDto {
  id: string
  number: string
  userId: string
  category: TicketCategory
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  orderId?: string
  assignedToId?: string
  assignedTo?: { id: string; fullName: string }
  attachmentUrl?: string
  internalNotes?: SupportTicketMessageDto[]
  messages: SupportTicketMessageDto[]
  isRead: boolean
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  closedAt?: string
}

export interface SupportTicketMessageDto {
  id: string
  ticketId: string
  authorId: string
  author: { id: string; fullName: string; role: string }
  message: string
  attachmentUrl?: string
  isInternal: boolean
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
