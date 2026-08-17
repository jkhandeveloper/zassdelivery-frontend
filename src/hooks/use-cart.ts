import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '@/lib/api/cart'
import { orderApi } from '@/lib/api/orders'
import type { AddCartItemDto, UpdateCartItemDto, ApplyCouponDto, SetCartAddressDto, SetTipDto } from '@/types/cart'

export const cartKeys = {
  all: ['cart'] as const,
  current: () => [...cartKeys.all, 'current'] as const,
}

/**
 * The cart belongs to a session — asking for it while signed out is a
 * guaranteed 401, so callers that render for visitors pass `enabled`.
 */
export function useCart(enabled = true) {
  return useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => cartApi.getCart(),
    enabled,
    staleTime: 0,
  })
}

export function useAddCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AddCartItemDto) => cartApi.addItem(data),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data)
    },
  })
}

export function useUpdateCartItem(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateCartItemDto) => cartApi.updateItem(itemId, data),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data)
    },
  })
}

export function useRemoveCartItem(itemId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cartApi.removeItem(itemId),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data)
    },
  })
}

export function useClearCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cartApi.clearCart(),
    onSuccess: () => {
      queryClient.setQueryData(cartKeys.current(), null)
    },
  })
}

export function useApplyCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ApplyCouponDto) => cartApi.applyCoupon(data),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data)
    },
  })
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cartApi.removeCoupon(),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data)
    },
  })
}

export function useSetDeliveryAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SetCartAddressDto) => cartApi.setDeliveryAddress(data),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data)
    },
  })
}

export function useSetTip() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SetTipDto) => cartApi.setTip(data),
    onSuccess: (data) => {
      queryClient.setQueryData(cartKeys.current(), data)
    },
  })
}

export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Parameters<typeof orderApi.placeOrder>[0]) => orderApi.placeOrder(data),
    onSuccess: () => {
      queryClient.setQueryData(cartKeys.current(), null)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
