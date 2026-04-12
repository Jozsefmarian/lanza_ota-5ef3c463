// ============================================
// Admin Authentication - Isolated from user auth
// ============================================
import { supabase, callEdgeFunction } from "@/lib/supabase";

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'superadmin';
  createdAt: string;
}

export interface AdminAuthResponse {
  success: boolean;
  admin?: AdminUser;
  token?: string;
  message?: string;
  error?: string;
}

// Separate localStorage keys for admin
const ADMIN_USER_KEY = 'lanza_admin_user';
const ADMIN_TOKEN_KEY = 'lanza_admin_token';
const ADMIN_DB_KEY = 'lanza_admin_users_db';

// Simple hash function for admin passwords
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'lanza_admin_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateId(): string {
  return 'admin-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateToken(): string {
  return 'adm_' + btoa(Date.now().toString() + Math.random().toString(36));
}

// Get admin users database
function getAdminDB(): Record<string, any> {
  const db = localStorage.getItem(ADMIN_DB_KEY);
  return db ? JSON.parse(db) : {};
}

// Save admin users database
function saveAdminDB(db: Record<string, any>): void {
  localStorage.setItem(ADMIN_DB_KEY, JSON.stringify(db));
}

// Get stored admin user
export function getStoredAdmin(): AdminUser | null {
  const userStr = localStorage.getItem(ADMIN_USER_KEY);
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
  return null;
}

// Get stored admin token
export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

// Store admin user
function storeAdmin(admin: AdminUser, token: string): void {
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(admin));
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

// Clear stored admin
export function clearStoredAdmin(): void {
  localStorage.removeItem(ADMIN_USER_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// Check if admin is authenticated
export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    // 1) Van-e Supabase session?
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (!session) {
      // takarítsunk: ha nincs session, ne maradjon “admin” localban sem
      clearStoredAdmin();
      return false;
    }

    // 2) Backend allowlist check (user módban)
    const { data: checkData, error: checkError } = await callEdgeFunction<{ ok: boolean }>(
      'admin-check',
      {},
      { auth: 'user' }
    );

    if (checkError || !checkData?.ok) {
      await supabase.auth.signOut();
      clearStoredAdmin();
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

// Admin Logout
export async function adminSignOut(): Promise<void> {
  clearStoredAdmin();
  await supabase.auth.signOut();
}

// Get all admin users (for superadmin)
export function getAllAdmins(): AdminUser[] {
  const db = getAdminDB();
  return Object.values(db).map((u: any) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    createdAt: u.createdAt,
  }));
}

// =============================
// Admin Login (Supabase Auth + allowlist check)
// =============================
export async function adminSignIn(
  email: string,
  password: string
): Promise<AdminAuthResponse> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // 1) Supabase Auth login
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (signInError || !signInData?.user) {
      return {
        success: false,
        error: signInError?.message || 'Invalid login credentials',
      };
    }

    // ✅ Famous/Vite alatt néha kell: a kliens auth state frissítése,
// különben a functions.invoke anonként mehet ki
if (signInData.session?.access_token && signInData.session?.refresh_token) {
  await supabase.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });
}
const accessToken = signInData.session?.access_token;

if (!accessToken) {
  await supabase.auth.signOut();
  clearStoredAdmin();
  return { success: false, error: 'No access token received from auth. Please try again.' };
}

const { data: checkData, error: checkError } =
  await callEdgeFunction<{ ok: boolean; error?: string }>(
    'admin-check',
    {},
    { auth: 'user', accessToken }
  );

    if (checkError || !checkData?.ok) {
      await supabase.auth.signOut();
      clearStoredAdmin();
      return { success: false, error: 'This account is not allowed to access admin.' };
    }

    // 3) UI kompatibilitás miatt maradhat a local admin “cache”
    const token = generateToken();
    const admin: AdminUser = {
      id: signInData.user.id,
      email: (signInData.user.email || '').toLowerCase(),
      fullName:
        (signInData.user.user_metadata?.full_name ||
          signInData.user.user_metadata?.name ||
          'Admin') as string,
      role: 'admin',
      createdAt: signInData.user.created_at || new Date().toISOString(),
    };

    storeAdmin(admin, token);

    return { success: true, admin, token, message: 'Login successful' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================
// Admin Signup (Edge Function allowlist + Supabase signup)
// =============================
export async function adminSignUp(
  email: string,
  password: string,
  fullName: string
): Promise<AdminAuthResponse> {
  try {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    // 1) Allowlist + signup backendben (admin-signup Edge Function)
    const { data: signUpData, error: signUpError } = await callEdgeFunction<{ ok: boolean; error?: string }>(
      'admin-signup',
      { email: email.trim().toLowerCase(), password, fullName },
      { auth: 'anon' }
    );

    if (signUpError || !signUpData?.ok) {
      return { success: false, error: signUpData?.error || signUpError?.message || 'Registration failed' };
    }

    // 2) Ne navigáljunk azonnal dashboardra, mert lehet, hogy email confirm kell.
    // Inkább: login képernyő + "Most már be tudsz lépni" üzenet.
    return { success: true, message: 'Account created. You can now log in.' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

