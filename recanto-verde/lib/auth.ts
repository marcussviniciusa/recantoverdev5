import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import User, { IUser } from '../models/User';
import connectDB from './db';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não está definido no arquivo .env.local');
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'garcom' | 'recepcionista';
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: 'garcom' | 'recepcionista';
  isActive: boolean;
}

/**
 * Gera um token JWT para o usuário
 */
export function generateToken(user: IUser): string {
  const payload: AuthPayload = {
    userId: (user._id as string).toString(),
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Verifica e decodifica um token JWT
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    
    return decoded;
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

/**
 * Extrai o token do header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Middleware para autenticar requisições da API
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    await connectDB();
    
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return null;
    }
    
    const decoded = verifyToken(token);
    if (!decoded) {
      return null;
    }
    
    // Buscar o usuário no banco para garantir que ainda existe e está ativo
    const user = await User.findById(decoded.userId).select('-password');
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };
    
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return null;
  }
}

/**
 * Verifica se o usuário tem permissão para a operação
 */
export function hasPermission(user: AuthUser, requiredRole?: 'garcom' | 'recepcionista'): boolean {
  if (!user.isActive) return false;
  
  // Se não especificar role, qualquer usuário autenticado tem permissão
  if (!requiredRole) return true;
  
  // Recepcionista tem acesso a tudo
  if (user.role === 'recepcionista') return true;
  
  // Verificar role específico
  return user.role === requiredRole;
}

/**
 * Cria resposta de erro de autenticação
 */
export function createAuthErrorResponse(message: string = 'Não autorizado') {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }),
    { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Cria resposta de erro de permissão
 */
export function createPermissionErrorResponse(message: string = 'Acesso negado') {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: message 
    }),
    { 
      status: 403,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Hash da senha usando bcrypt (helper para testes)
 */
export async function hashPassword(password: string): Promise<string> {
  const bcrypt = (await import('bcryptjs')).default;
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compara senha com hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.compare(password, hash);
}

/**
 * Validação de email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validação de senha
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

/**
 * Sanitizar dados do usuário para resposta
 */
export function sanitizeUser(user: IUser): AuthUser {
  return {
    id: (user._id as string).toString(),
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  };
}

/**
 * Gera um token de refresh (para futuras implementações)
 */
export function generateRefreshToken(user: IUser): string {
  const payload = {
    userId: (user._id as string).toString(),
    type: 'refresh'
  };

  return jwt.sign(payload, JWT_SECRET);
} 