import { useCallback, useEffect, useState } from 'react';
import { axiosInstance } from '@/lib/axios';

interface TopupPlan {
  id: number;
  key: string;
  name: string;
  priceCents: number;
  dodoProductId: string;
  currency: string;
  interval: 'ONETIME';
}

interface CheckoutSession {
  checkout_url: string;
  session_id: string;
}

export function useFiatTopupCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topupPlans, setTopupPlans] = useState<TopupPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPlans = async () => {
      try {
        setIsLoadingPlans(true);
        const response = await axiosInstance.get<{
          data: TopupPlan[];
        }>("/api/v1/plans/topup");

        if (isMounted) {
          setTopupPlans(response.data.data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load topup plans");
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlans(false);
        }
      }
    };

    void loadPlans();

    return () => {
      isMounted = false;
    };
  }, []);

  const createCheckout = useCallback(
    async (planId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axiosInstance.post<{
          message: string;
          data: CheckoutSession;
          error: unknown;
        }>('/api/v1/vault/topup-checkout', {
          planId,
        });

        const checkoutSession = response.data.data;

        if (!checkoutSession?.checkout_url) {
          throw new Error('No checkout URL received from server');
        }

        // Redirect to Dodo checkout
        window.location.href = checkoutSession.checkout_url;

        return checkoutSession;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create checkout session';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    topupPlans,
    isLoadingPlans,
    isLoading,
    error,
    createCheckout,
  };
}
