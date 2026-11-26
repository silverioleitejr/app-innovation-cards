import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';

interface PasswordModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function PasswordModal({ onClose, onSuccess }: PasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      onSuccess(res.message);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Alterar senha"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white border border-[#dbd6d1] rounded-[6px] shadow-agile-lift overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-[#dbd6d1] bg-agile-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#0b41cd]" />
            <h2 className="font-editorial text-[20px] font-normal text-black">Alterar minha senha</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de senha"
            className="p-1 text-[#544f4f] hover:text-black hover:bg-[#f5f5f2] rounded-[6px] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-[#544f4f] leading-relaxed">
            Ao definir uma senha própria, sua credencial fica protegida contra sobrescrita em
            futuras reexecuções da carga inicial (RN-02.2).
          </p>

          {error && (
            <div className="p-3 bg-[#ffd2d4] border border-[#ff1f26] rounded-[6px] text-xs text-[#b8002c] font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#544f4f] mb-1">Senha atual</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="og1-input w-full px-3 py-2 text-sm text-[#21201f] border border-[#dbd6d1] rounded-[6px]"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#544f4f] mb-1">
              Nova senha (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="og1-input w-full px-3 py-2 text-sm text-[#21201f] border border-[#dbd6d1] rounded-[6px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#21201f] bg-[#f5f5f2] hover:bg-[#d7e0f7] border border-[#dbd6d1] hover:border-[#aec0ee] rounded-[6px] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] rounded-[6px] transition-colors cursor-pointer"
            >
              {loading ? 'Salvando...' : 'Atualizar senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
