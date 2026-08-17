import { useMutation, useQuery } from "@tanstack/react-query";

import { paymentApi } from "@/lib/api/payments";
import type { StartCheckoutDto } from "@/types/payment";

export const paymentKeys = {
  all: ["payments"] as const,
  methods: () => [...paymentKeys.all, "methods"] as const,
};

/**
 * Which gateways are live right now. The list is server-driven — an option the
 * API reports as unavailable must not be offered at checkout.
 */
export function usePaymentMethods(enabled = true) {
  return useQuery({
    queryKey: paymentKeys.methods(),
    queryFn: () => paymentApi.getPaymentMethods(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStartCheckout() {
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: StartCheckoutDto }) =>
      paymentApi.startCheckout(orderId, data),
  });
}
