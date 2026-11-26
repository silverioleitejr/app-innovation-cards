import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Plus,
  Upload,
  UserCheck,
  UserX,
} from 'lucide-react';
import { api, ApiError } from '../lib/api';
import {
  ROLE_LABELS,
  ROLES,
  SPECIALTIES,
  type Role,
  type Specialty,
  type User,
} from '../types';

interface UsersAdminViewProps {
  users: User[];
  currentUser: User;
  onRefreshUsers: () => Promise<void>;
}

const VALID_JSON_SAMPLE = JSON.stringify(
  [
    {
      name: 'Rafael Mendes',
      email: 'rafael.mendes@og1.com.br',
      role: 'FACILITATOR',
      specialty: 'IA / GenAI',
      cursorColor: '#6d28d9',
    },
    {
      name: 'Fernanda Alves',
      email: 'fernanda.alves@og1.com.br',
      role: 'MEMBER',
      specialty: 'Engenharia de Dados',
      cursorColor: '#0284c7',
    },
    {
      name: 'Thiago Barros',
      email: 'thiago.barros@og1.com.br',
      role: 'VIEWER',
      specialty: 'Analytics / BI',
      cursorColor: '#059669',
    },
  ],
  null,
  2
);

const INVALID_JSON_SAMPLE = JSON.stringify(
  [
    {
      name: 'Usuário Válido (não deve ser salvo)',
      email: 'nao.salvar@og1.com.br',
      role: 'MEMBER',
      specialty: 'Analytics / BI',
      cursorColor: '#0b41cd',
    },
    {
      name: 'Registro Malformado',
      email: 'email-invalido-sem-arroba',
      role: 'SUPER_ROOT',
      specialty: 'Área Inexistente',
      cursorColor: 'azul',
    },
  ],
  null,
  2
);

const VALID_CSV_SAMPLE = `name,email,role,specialty,cursorColor
Eduardo Lima,eduardo.lima@og1.com.br,MEMBER,Engenharia de Dados,#0b41cd
Juliana Prado,juliana.prado@og1.com.br,FACILITATOR,Governança / FinOps,#0f766e`;

export function UsersAdminView({
  users,
  currentUser,
  onRefreshUsers,
}: UsersAdminViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('MEMBER');
  const [specialty, setSpecialty] = useState<Specialty>('Engenharia de Dados');
  const [cursorColor, setCursorColor] = useState('#0b41cd');

  const [batchFormat, setBatchFormat] = useState<'json' | 'csv'>('json');
  const [batchContent, setBatchContent] = useState(VALID_JSON_SAMPLE);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchSuccess, setBatchSuccess] = useState<string | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [batchValidationErrors, setBatchValidationErrors] = useState<string[]>([]);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSaving(true);
    try {
      await api.createUser({ name, email, role, specialty, cursorColor });
      setName('');
      setEmail('');
      setRole('MEMBER');
      setShowAddForm(false);
      await onRefreshUsers();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao cadastrar participante.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleUpdateRole = async (u: User, nextRole: Role) => {
    try {
      await api.updateUser(u.id, { role: nextRole });
      await onRefreshUsers();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao atualizar papel.');
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await api.updateUser(u.id, { active: !u.active });
      await onRefreshUsers();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Erro ao alterar situação.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.toLowerCase().endsWith('.csv')) {
      setBatchFormat('csv');
    } else {
      setBatchFormat('json');
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBatchContent(reader.result);
        setBatchError(null);
        setBatchSuccess(null);
        setBatchValidationErrors([]);
      }
    };
    reader.readAsText(file);
  };

  const handleRunBatchImport = async () => {
    setBatchLoading(true);
    setBatchError(null);
    setBatchSuccess(null);
    setBatchValidationErrors([]);
    try {
      const res = await api.batchImportUsers(batchContent, batchFormat);
      setBatchSuccess(res.message);
      await onRefreshUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        setBatchError(err.message);
        setBatchValidationErrors(err.validationErrors ?? []);
      } else {
        setBatchError('Falha ao processar carga em lote.');
      }
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-6 bg-white text-[#21201f]">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#dbd6d1]">
          <div>
            <h1 className="font-editorial text-[30px] leading-[40px] font-extralight text-black tracking-tight">
              Participantes &amp; Carga Inicial
            </h1>
            <p className="text-sm text-[#544f4f] mt-1">
              Gestão de papéis RBAC, especialidades técnicas, cores de cursor e carga idempotente
              atômica (RN-02.1 · RN-02.2 · RN-02.3).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] rounded-[6px] transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo participante</span>
          </button>
        </div>

        {formError && (
          <div className="p-3.5 bg-[#ffd2d4] border border-[#ff1f26] rounded-[6px] text-xs text-[#b8002c] font-medium">
            {formError}
          </div>
        )}

        {/* Inline Create Participant Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateUser}
            className="bg-[#fbfbfa] border border-[#dbd6d1] rounded-[6px] p-5 space-y-4"
          >
            <h2 className="font-editorial text-[18px] font-semibold text-black">
              Cadastrar participante individual
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
              <div>
                <label className="block text-xs font-medium text-[#544f4f] mb-1">
                  Nome completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome e sobrenome"
                  className="og1-input w-full px-3 py-2 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#544f4f] mb-1">
                  E-mail corporativo
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@og1.com.br"
                  className="og1-input w-full px-3 py-2 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#544f4f] mb-1">Papel</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="og1-input w-full px-3 py-2 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]} ({r})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#544f4f] mb-1">
                  Especialidade
                </label>
                <select
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value as Specialty)}
                  className="og1-input w-full px-3 py-2 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
                >
                  {SPECIALTIES.map((sp) => (
                    <option key={sp} value={sp}>
                      {sp}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#544f4f] mb-1">
                  Cor do cursor
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cursorColor}
                    onChange={(e) => setCursorColor(e.target.value)}
                    className="h-8 w-10 border border-[#dbd6d1] rounded-[6px] cursor-pointer"
                  />
                  <span className="font-mono text-xs text-[#706b69]">{cursorColor}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3.5 py-2 text-xs font-medium text-[#21201f] bg-[#f5f5f2] border border-[#dbd6d1] rounded-[6px] hover:bg-[#d7e0f7] hover:border-[#aec0ee] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={formSaving}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] rounded-[6px] transition-colors cursor-pointer"
              >
                {formSaving ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Directory Table */}
          <div className="lg:col-span-7 bg-white border border-[#dbd6d1] rounded-[6px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#dbd6d1] bg-[#fbfbfa] flex items-center justify-between">
              <h2 className="font-editorial text-[18px] font-semibold text-black">
                Diretório de Participantes ({users.length})
              </h2>
              <span className="text-xs text-[#706b69] tabular-nums">
                {users.filter((u) => u.active).length} ativos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#dbd6d1] text-[11px] font-semibold text-[#544f4f] bg-white">
                    <th className="py-2.5 px-4">Participante</th>
                    <th className="py-2.5 px-3">Papel RBAC</th>
                    <th className="py-2.5 px-3">Especialidade</th>
                    <th className="py-2.5 px-3">Identidade</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eae8e5] text-xs">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser.id;
                    return (
                      <tr key={u.id} className={u.active ? 'hover:bg-[#fbfbfa]' : 'opacity-[0.62] bg-[#f5f5f2]'}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: u.cursorColor }}
                              title={`Cor do cursor: ${u.cursorColor}`}
                            />
                            <div className="min-w-0">
                              <div className="font-semibold text-black truncate">
                                {u.name}{' '}
                                {isSelf && (
                                  <span className="text-[11px] text-[#0b41cd] font-medium">
                                    (você)
                                  </span>
                                )}
                              </div>
                              <div className="font-mono text-[11px] text-[#706b69] truncate">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <select
                            disabled={isSelf}
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u, e.target.value as Role)}
                            className="og1-input px-2 py-1 text-xs bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-3 text-[#544f4f] whitespace-nowrap">
                          {u.specialty}
                        </td>
                        <td className="py-3 px-3 text-[11px] text-[#544f4f] whitespace-nowrap">
                          <div>{u.federatedProvider ?? 'Local'}</div>
                          {u.passwordChangedByUser && (
                            <div className="text-[10px] text-[#00724a] font-medium">Senha própria protegida</div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => handleToggleActive(u)}
                            className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.active
                                ? 'text-[#00724a] hover:text-[#b8002c]'
                                : 'text-[#706b69] hover:text-[#0b41cd]'
                            }`}
                          >
                            {u.active ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Ativo</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Inativo</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Idempotent Atomic Batch Import Panel */}
          <section className="lg:col-span-5 bg-white border border-[#dbd6d1] rounded-[6px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#dbd6d1] bg-agile-header flex items-center justify-between">
              <div>
                <h2 className="font-editorial text-[18px] font-semibold text-black">
                  Carga Inicial em Lote (Idempotente)
                </h2>
                <p className="text-[11px] text-[#544f4f]">
                  Cria novos e-mails, atualiza papéis existentes e preserva senhas alteradas.
                </p>
              </div>
              <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#0b41cd] bg-white border border-[#dbd6d1] hover:bg-[#d7e0f7] hover:border-[#aec0ee] rounded-[6px] transition-colors cursor-pointer shrink-0">
                <FileUp className="w-3.5 h-3.5" />
                <span>Arquivo</span>
                <input
                  type="file"
                  accept=".json,.csv,text/csv,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-5 space-y-4">
              {/* Format & Sample Helpers */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex p-0.5 bg-[#f5f5f2] border border-[#dbd6d1] rounded-[6px]">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchFormat('json');
                      setBatchContent(VALID_JSON_SAMPLE);
                      setBatchError(null);
                      setBatchSuccess(null);
                      setBatchValidationErrors([]);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-[3px] cursor-pointer ${
                      batchFormat === 'json' ? 'bg-white text-[#0b41cd] font-semibold shadow-2xs' : 'text-[#544f4f] hover:text-black'
                    }`}
                  >
                    JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchFormat('csv');
                      setBatchContent(VALID_CSV_SAMPLE);
                      setBatchError(null);
                      setBatchSuccess(null);
                      setBatchValidationErrors([]);
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded-[3px] cursor-pointer ${
                      batchFormat === 'csv' ? 'bg-white text-[#0b41cd] font-semibold shadow-2xs' : 'text-[#544f4f] hover:text-black'
                    }`}
                  >
                    CSV
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setBatchFormat('json');
                    setBatchContent(INVALID_JSON_SAMPLE);
                    setBatchError(null);
                    setBatchSuccess(null);
                    setBatchValidationErrors([]);
                  }}
                  className="text-xs text-[#544f4f] hover:text-[#b8002c] underline cursor-pointer"
                >
                  Carregar teste inválido (RN-02.3)
                </button>
              </div>

              <textarea
                rows={12}
                value={batchContent}
                onChange={(e) => setBatchContent(e.target.value)}
                spellCheck={false}
                className="og1-input w-full p-3 font-mono text-[11px] leading-relaxed bg-[#fff7f5] border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
              />

              {batchSuccess && (
                <div className="p-3 bg-[#d2f3e3] border border-[#00724a]/40 rounded-[6px] text-xs text-[#00724a] font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{batchSuccess}</span>
                </div>
              )}

              {batchError && (
                <div className="p-3 bg-[#ffd2d4] border border-[#ff1f26] rounded-[6px] text-xs text-[#b8002c] space-y-1.5">
                  <div className="font-semibold flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{batchError}</span>
                  </div>
                  {batchValidationErrors.length > 0 && (
                    <ul className="list-disc pl-5 space-y-0.5 font-mono text-[11px]">
                      {batchValidationErrors.map((msg, idx) => (
                        <li key={idx}>{msg}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={batchLoading}
                onClick={handleRunBatchImport}
                className="w-full py-2.5 px-4 bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] text-white text-sm font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{batchLoading ? 'Processando lote...' : 'Executar carga idempotente'}</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
