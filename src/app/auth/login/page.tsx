'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-completar credenciais baseado no role
  useEffect(() => {
    if (role === 'recepcionista') {
      setFormData({
        email: 'admin@recantoverde.com',
        password: 'admin123'
      });
    } else if (role === 'garcom') {
      setFormData({
        email: 'joao@recantoverde.com',
        password: 'garcom123'
      });
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        // Salvar token e dados do usuário
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userRole', data.data.user.role);
        localStorage.setItem('userName', data.data.user.username);
        localStorage.setItem('userEmail', data.data.user.email);

        // Redirecionar baseado no role
        if (data.data.user.role === 'recepcionista') {
          router.push('/admin/dashboard');
        } else if (data.data.user.role === 'garcom') {
          router.push('/garcom/mesas');
        }
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (error) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const roleInfo = {
    recepcionista: {
      title: 'Recepcionista',
      subtitle: 'Acesso administrativo completo',
      color: 'blue',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    garcom: {
      title: 'Garçom',
      subtitle: 'Interface mobile otimizada',
      color: 'green',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  };

  const currentRole = role && roleInfo[role as keyof typeof roleInfo] 
    ? roleInfo[role as keyof typeof roleInfo] 
    : { title: 'Login', subtitle: 'Sistema Recanto Verde', color: 'green', icon: null };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6 group">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-3">
              <span className="text-white text-xl font-bold">RV</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
              Recanto Verde
            </span>
          </Link>

          <div className={`w-16 h-16 bg-${currentRole.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
            <div className={`text-${currentRole.color}-600`}>
              {currentRole.icon}
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentRole.title}
          </h1>
          <p className="text-gray-600">
            {currentRole.subtitle}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="Sua senha"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-${currentRole.color}-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-${currentRole.color}-700 focus:ring-2 focus:ring-${currentRole.color}-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </form>

          {/* Credenciais de Teste */}
          {role && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                💡 Credenciais de Teste
              </h3>
              <div className="text-xs text-gray-600">
                <div><strong>Email:</strong> {formData.email}</div>
                <div><strong>Senha:</strong> {formData.password}</div>
              </div>
            </div>
          )}

          {/* Links */}
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              ← Voltar para página inicial
            </Link>
          </div>
        </div>

        {/* Switch de Tipo de Usuário */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-4">Ou acesse como:</p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/auth/login?role=recepcionista"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                role === 'recepcionista' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'
              }`}
            >
              👨‍💼 Recepcionista
            </Link>
            <Link
              href="/auth/login?role=garcom"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                role === 'garcom' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'
              }`}
            >
              👨‍🍳 Garçom
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 