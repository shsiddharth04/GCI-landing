import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

interface ToastProps {
  message: string
  type?: 'success' | 'error'
  onDone: () => void
}

export function Toast({ message, type = 'success', onDone }: ToastProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300) }, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-xl transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } ${
        type === 'success'
          ? 'bg-[#141414] border-[#E8DEFA]/20 text-[#E8DEFA]'
          : 'bg-[#141414] border-red-500/30 text-red-400'
      }`}
    >
      {type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
      {message}
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
  }

  function ToastEl() {
    if (!toast) return null
    return <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
  }

  return { showToast, ToastEl }
}
