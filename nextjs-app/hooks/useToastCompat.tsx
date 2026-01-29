"use client"

import { useToast as useShadcnToast } from "@/hooks/use-toast"
import { ToastAction } from "@/components/ui/toast"

export function useToast() {
  const { toast } = useShadcnToast()

  return {
    showSuccess: (message: string) => {
      toast({
        variant: "success",
        title: message,
        duration: 3000,
      })
    },
    showError: (message: string, options?: { onRetry?: () => void }) => {
      toast({
        variant: "destructive",
        title: message,
        duration: 5000,
        action: options?.onRetry ? (
          <ToastAction altText="Retry" onClick={options.onRetry}>
            Retry
          </ToastAction>
        ) : undefined,
      })
    },
    showInfo: (message: string) => {
      toast({
        variant: "default",
        title: message,
        duration: 3000,
      })
    },
  }
}
