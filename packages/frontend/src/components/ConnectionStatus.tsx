import type { ConnectionStatus as Status } from '../store/sessionStore'

interface Props {
  status: Status
}

const STATUS_CONFIG: Record<Status, { color: string; label: string }> = {
  connecting: { color: 'bg-amber-400', label: 'Connecting' },
  connected: { color: 'bg-emerald-400', label: 'Connected' },
  disconnected: { color: 'bg-slate-500', label: 'Disconnected' },
  error: { color: 'bg-red-400', label: 'Error' },
}

export function ConnectionStatus({ status }: Props) {
  const config = STATUS_CONFIG[status]

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${config.color} ${
        status === 'connecting' ? 'animate-pulse' : ''
      }`} />
      <span className="text-[10px] text-slate-500 font-medium">{config.label}</span>
    </div>
  )
}
