import React, { useEffect, useState } from 'react';
import { ArrowRight, KeyRound, ShieldCheck, UserPlus } from 'lucide-react';
import { api, ApiError, type DemoAccountSummary } from '../lib/api';
import { ROLE_LABELS, SPECIALTIES, type Specialty, type User } from '../types';

interface AuthScreenProps {
  onAuthenticated: (token: string, user: User, notice?: string) => void;
}

type AuthTab = 'local' | 'federated' | 'register';

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [tab, setTab] = useState<AuthTab>('local');
  const [email, setEmail] = useState('silverio.leitejr@og1.com.br');
  const [password, setPassword] = useState('og1@2026');
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState<Specialty>('Engenharia de Dados');
  const [provider, setProvider] = useState<'Microsoft Entra ID' | 'Google Workspace'>(
    'Microsoft Entra ID'
  );
  const [federatedEmail, setFederatedEmail] = useState('camila.rocha@og1.com.br');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccountSummary[]>([]);

  useEffect(() => {
    api
      .getDemoAccounts()
      .then((res) => setDemoAccounts(res.accounts))
      .catch(() => {});
  }, []);

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      onAuthenticated(token, user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleFederatedLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user, unifiedMessage } = await api.federatedLogin({
        email: federatedEmail,
        provider,
      });
      onAuthenticated(token, user, unifiedMessage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha no login federado.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.register({
        name,
        email,
        password,
        specialty,
      });
      onAuthenticated(token, user, 'Conta criada com papel inicial Membro Colaborador (MEMBER).');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPersona = async (account: DemoAccountSummary) => {
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await api.login(account.email, 'og1@2026');
      onAuthenticated(token, user);
    } catch {
      // If user changed password, prefill email in local login tab
      setTab('local');
      setEmail(account.email);
      setPassword('');
      setError('A senha desta conta foi alterada pelo usuário. Informe a nova senha abaixo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fff7f5] text-[#21201f] flex flex-col">
      {/* Global Editorial Header */}
      <header className="h-14 bg-white border-b border-[#dbd6d1] px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-editorial text-[20px] font-semibold tracking-tight text-black whitespace-nowrap">
            Innovation Board
          </span>
        </div>
        <span className="text-xs text-[#706b69] whitespace-nowrap">
          OG1 TI · Dados &amp; Analytics
        </span>
      </header>

      {/* Main Editorial Split Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Atmospheric Brand & Funnel Context */}
        <section className="lg:col-span-6 bg-agile-hero border-b lg:border-b-0 lg:border-r border-[#dbd6d1] px-8 py-12 lg:px-16 lg:py-16 flex flex-col justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold text-[#0b41cd] tracking-wide uppercase mb-4">
              Funil Colaborativo de Inovação
            </p>
            <h1 className="font-editorial text-[48px] leading-[58px] font-extralight tracking-[-0.03em] text-black text-balance mb-6">
              Do pitch ao backlog validado em tempo real.
            </h1>
            <p className="text-[18px] leading-[30px] text-[#21201f] mb-10">
              Conduza dinâmicas colaborativas de Dados, Analytics e IA com presença simultânea,
              matriz Esforço × Benefício, trava obrigatória de refinamento técnico e trilha de
              auditoria imutável.
            </p>

            {/* Clean Editorial 3-Step Index (No cards-in-cards, hairline dividers) */}
            <div className="border-t border-[#dbd6d1] divide-y divide-[#dbd6d1]">
              {[
                ['01', 'Pitch & Ideia', 'Registro ágil de dores, soluções e esforço inicial'],
                [
                  '02',
                  'Avaliação Técnica & Valor',
                  'Matriz 2×2 ao vivo, pins de voto e critérios técnicos',
                ],
                ['03', 'Backlog & Priorização', 'Promoção protegida por trava de qualidade e papel'],
              ].map(([num, title, desc]) => (
                <div key={num} className="py-3.5 flex items-baseline gap-4">
                  <span className="font-mono text-xs text-[#0b41cd] font-semibold tabular-nums shrink-0">
                    {num}
                  </span>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-black">{title}</span>
                    <span className="text-sm text-[#544f4f]"> — {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-10 text-xs text-[#706b69]">
            Governança RBAC · Unificação de identidade por e-mail corporativo · Auditoria append-only
          </div>
        </section>

        {/* Right Authentication Surface */}
        <section className="lg:col-span-6 bg-white px-6 py-10 lg:px-16 lg:py-14 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <h2 className="font-editorial text-[26px] leading-[32px] font-normal text-black mb-1.5">
              Acessar espaço de inovação
            </h2>
            <p className="text-sm text-[#544f4f] mb-6">
              Entre com credencial local, identidade corporativa federada ou crie sua conta.
            </p>

            {/* Segmented Mode Control */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#f5f5f2] border border-[#dbd6d1] rounded-[6px] mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('local');
                  setError(null);
                }}
                className={`py-2 px-2 text-xs font-medium rounded-[3px] transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'local'
                    ? 'bg-white text-[#0b41cd] font-semibold shadow-xs'
                    : 'text-[#544f4f] hover:text-black'
                }`}
              >
                Login local
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('federated');
                  setError(null);
                }}
                className={`py-2 px-2 text-xs font-medium rounded-[3px] transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'federated'
                    ? 'bg-white text-[#0b41cd] font-semibold shadow-xs'
                    : 'text-[#544f4f] hover:text-black'
                }`}
              >
                SSO Corporativo
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`py-2 px-2 text-xs font-medium rounded-[3px] transition-colors whitespace-nowrap cursor-pointer ${
                  tab === 'register'
                    ? 'bg-white text-[#0b41cd] font-semibold shadow-xs'
                    : 'text-[#544f4f] hover:text-black'
                }`}
              >
                Auto-registro
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-5 px-3.5 py-2.5 bg-[#ffd2d4] border border-[#ff1f26] rounded-[6px] text-xs text-[#b8002c] font-medium"
              >
                {error}
              </div>
            )}

            {tab === 'local' && (
              <form onSubmit={handleLocalLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                    E-mail corporativo
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nome.sobrenome@og1.com.br"
                    className="og1-input w-full px-3 py-2.5 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#544f4f] mb-1.5">Senha</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="og1-input w-full px-3 py-2.5 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] text-white text-sm font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? 'Autenticando...' : 'Entrar no painel'}</span>
                </button>
              </form>
            )}

            {tab === 'federated' && (
              <form onSubmit={handleFederatedLogin} className="space-y-4">
                <p className="text-xs text-[#544f4f] leading-relaxed bg-[#fbfbfa] border border-[#dbd6d1] rounded-[6px] p-3">
                  Unificação automática por e-mail (RN-01.2): se o e-mail já existir na carga
                  inicial, sua identidade externa é vinculada à conta existente preservando papel e
                  especialidade.
                </p>
                <div>
                  <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                    Provedor de identidade
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Microsoft Entra ID', 'Google Workspace'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProvider(p)}
                        className={`py-2 px-3 text-xs font-medium border rounded-[6px] transition-colors cursor-pointer ${
                          provider === p
                            ? 'border-[#0b41cd] text-[#052066] bg-[#d7e0f7] font-semibold'
                            : 'border-[#dbd6d1] bg-[#f5f5f2] text-[#21201f] hover:bg-[#d7e0f7] hover:border-[#aec0ee]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#544f4f] mb-1.5">
                    E-mail corporativo federado
                  </label>
                  <input
                    type="email"
                    required
                    value={federatedEmail}
                    onChange={(e) => setFederatedEmail(e.target.value)}
                    placeholder="usuario@og1.com.br"
                    className="og1-input w-full px-3 py-2.5 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] text-white text-sm font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {loading ? 'Validando identidade...' : `Continuar com ${provider}`}
                  </span>
                </button>
              </form>
            )}

            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#544f4f] mb-1">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Ana Paula Ferreira"
                    className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
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
                    placeholder="ana.ferreira@og1.com.br"
                    className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f] placeholder:text-[#9d948e]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#544f4f] mb-1">
                    Especialidade técnica
                  </label>
                  <select
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value as Specialty)}
                    className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
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
                    Senha (mínimo 6 caracteres)
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="og1-input w-full px-3 py-2 text-sm bg-white border border-[#dbd6d1] rounded-[6px] text-[#21201f]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-5 bg-[#0b41cd] hover:bg-[#052066] active:bg-[#5c80de] disabled:bg-[#eae8e5] disabled:text-[#706b69] disabled:opacity-[0.62] text-white text-sm font-semibold rounded-[6px] transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{loading ? 'Criando conta...' : 'Criar conta (Membro)'}</span>
                </button>
              </form>
            )}

            {/* Quick Persona Access for Evaluating RBAC Roles */}
            {demoAccounts.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#dbd6d1]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#544f4f]">
                    Acesso rápido por perfil (carga inicial)
                  </span>
                  <span className="font-mono text-[11px] text-[#706b69]">senha: og1@2026</span>
                </div>
                <div className="divide-y divide-[#eae8e5] border border-[#dbd6d1] rounded-[6px] overflow-hidden">
                  {demoAccounts.slice(0, 4).map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickPersona(acc)}
                      className="w-full px-3.5 py-2.5 bg-white hover:bg-[#f5f5f2] flex items-center justify-between text-left transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: acc.cursorColor }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-black truncate">{acc.name}</div>
                          <div className="text-[11px] text-[#544f4f] truncate">
                            {ROLE_LABELS[acc.role]} · {acc.specialty}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-[#706b69] group-hover:text-[#0b41cd] shrink-0 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
