import React from 'react'
import { CheckSquare, Square, Power, PowerOff, Trash2, Ban, AlertTriangle, Loader2 } from 'lucide-react'

export type BatchOperationType = 'activate' | 'deactivate' | 'delete' | 'suspend'

interface BatchOperationsPanelProps {
  selectedIds: string[]
  totalItems: number
  onSelectAll: () => void
  onClearSelection: () => void
  onBatchOperation: (operation: BatchOperationType, reason?: string) => Promise<void>
  isLoading: boolean
  entityType: 'users' | 'tenants'
}

export function BatchOperationsPanel({
  selectedIds,
  totalItems,
  onSelectAll,
  onClearSelection,
  onBatchOperation,
  isLoading,
  entityType
}: BatchOperationsPanelProps) {
  const [showConfirm, setShowConfirm] = React.useState<BatchOperationType | null>(null)
  const [reason, setReason] = React.useState('')

  const handleOperation = async (operation: BatchOperationType) => {
    if (operation === 'delete' || operation === 'suspend' || operation === 'deactivate') {
      setShowConfirm(operation)
    } else {
      await onBatchOperation(operation)
    }
  }

  const confirmOperation = async () => {
    if (showConfirm) {
      await onBatchOperation(showConfirm, reason || undefined)
      setShowConfirm(null)
      setReason('')
    }
  }

  if (selectedIds.length === 0) return null

  const operationLabels: Record<BatchOperationType, string> = {
    activate: 'Activate',
    deactivate: 'Deactivate',
    delete: 'Delete',
    suspend: 'Suspend'
  }

  return (
    <>
      {/* Batch Actions Bar */}
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-900 dark:text-purple-100">
              {selectedIds.length} of {totalItems} selected
            </span>
            <button
              onClick={selectedIds.length === totalItems ? onClearSelection : onSelectAll}
              className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
            >
              {selectedIds.length === totalItems ? 'Clear selection' : 'Select all'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Activate Button */}
            <button
              onClick={() => handleOperation('activate')}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 disabled:opacity-50 transition-colors"
            >
              <Power className="w-4 h-4" />
              Activate
            </button>

            {/* Deactivate Button */}
            <button
              onClick={() => handleOperation('deactivate')}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 disabled:opacity-50 transition-colors"
            >
              <PowerOff className="w-4 h-4" />
              {entityType === 'tenants' ? 'Suspend' : 'Deactivate'}
            </button>

            {/* Delete Button (Users only) */}
            {entityType === 'users' && (
              <button
                onClick={() => handleOperation('delete')}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}

            {/* Clear Selection */}
            <button
              onClick={onClearSelection}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <Square className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm {operationLabels[showConfirm]}
              </h3>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to {showConfirm} {selectedIds.length} {entityType}?
              {showConfirm === 'delete' && ' This action cannot be undone.'}
            </p>

            {(showConfirm === 'suspend' || showConfirm === 'deactivate') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowConfirm(null); setReason('') }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmOperation}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirm {operationLabels[showConfirm]}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Checkbox component for table rows
interface SelectCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function SelectCheckbox({ checked, onChange, disabled }: SelectCheckboxProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
        checked
          ? 'bg-purple-600 border-purple-600 text-white'
          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {checked && (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  )
}

