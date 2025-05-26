'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se há token de autenticação salvo
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userRole) {
      // Redirecionar baseado no role
      if (userRole === 'recepcionista') {
        router.push('/admin/dashboard');
      } else if (userRole === 'garcom') {
        router.push('/garcom/mesas');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">RV</span>
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">
                Recanto Verde
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              Sistema de Gerenciamento
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Bem-vindo ao
            <span className="text-green-600"> Recanto Verde</span>
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Sistema completo de gerenciamento para restaurantes com interface moderna,
            controle de mesas, pedidos e pagamentos em tempo real.
          </p>

          {/* Cards de Login */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Card Recepcionista */}
            <Link href="/auth/login?role=recepcionista" className="group">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Recepcionista
                </h3>
                <p className="text-gray-600 mb-6">
                  Acesso completo ao sistema: gerenciamento de mesas, cardápio, 
                  relatórios e configurações.
                </p>
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Funcionalidades:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Dashboard executivo</li>
                    <li>• Gerenciamento de produtos</li>
                    <li>• Relatórios e análises</li>
                    <li>• Controle de usuários</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <span className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors">
                    Fazer Login
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>

            {/* Card Garçom */}
            <Link href="/auth/login?role=garcom" className="group">
              <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Garçom
                </h3>
                <p className="text-gray-600 mb-6">
                  Interface otimizada para mobile: controle de mesas, 
                  criação de pedidos e acompanhamento em tempo real.
                </p>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Funcionalidades:</h4>
                  <ul className="text-sm text-green-800 space-y-1">
                    <li>• Abertura e fechamento de mesas</li>
                    <li>• Criação de pedidos</li>
                    <li>• Acompanhamento em tempo real</li>
                    <li>• Registro de pagamentos</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <span className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg group-hover:bg-green-700 transition-colors">
                    Fazer Login
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Credenciais de Teste */}
          <div className="mt-16 bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              🧪 Credenciais para Teste
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-semibold text-blue-900 mb-3">👨‍💼 Recepcionista</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> admin@recantoverde.com</div>
                  <div><strong>Senha:</strong> admin123</div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <h4 className="font-semibold text-green-900 mb-3">👨‍🍳 Garçom</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Email:</strong> joao@recantoverde.com</div>
                  <div><strong>Senha:</strong> garcom123</div>
                </div>
              </div>
            </div>
          </div>

          {/* Status do Sistema */}
          <div className="mt-12">
            <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              Sistema Online e Funcionando
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>© 2025 Recanto Verde - Sistema de Gerenciamento de Restaurante</p>
            <p className="mt-2 text-sm">
              Desenvolvido com Next.js, TypeScript, MongoDB e ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
