import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger

export function DialogContent({ children, className, title, description, side = false }: {
  children: ReactNode
  className?: string
  title: string
  description?: string
  side?: boolean
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
      <DialogPrimitive.Content className={cn(
        'fixed z-50 overflow-auto border-border bg-card text-card-foreground shadow-2xl outline-none',
        side
          ? 'inset-y-0 right-0 h-dvh w-[min(440px,100%)] border-l p-5 max-md:inset-x-0 max-md:top-auto max-md:h-[85dvh] max-md:w-full max-md:rounded-t-xl max-md:border-l-0 max-md:border-t'
          : 'left-1/2 top-1/2 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border p-5',
        className,
      )}>
        <div className="mb-4 pr-8">
          <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
          {description && <DialogPrimitive.Description className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</DialogPrimitive.Description>}
        </div>
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 cursor-pointer rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring" aria-label="Закрыть">
          <X size={18} />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
