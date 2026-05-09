'use client'

import { useToast } from './toast-context'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6" />
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6" />
      case 'info':
      default:
        return <InformationCircleIcon className="h-6 w-6" />
    }
  }

  const getStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'warning':
        return 'text-yellow-600'
      case 'info':
      default:
        return 'text-blue-600'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-md pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`border-2 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 shadow-lg pointer-events-auto ${getStyles(
            toast.type
          )}`}
        >
          <div className={getIconColor(toast.type)}>{getIcon(toast.type)}</div>
          <div className="flex-1">
            <p className="font-semibold">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 hover:opacity-70 transition"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
