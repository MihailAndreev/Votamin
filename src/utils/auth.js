/* ============================================================
   Votamin – Auth Utility (Supabase Auth)
   ============================================================ */
import { supabaseClient } from './supabase.js';

let currentUser = null;

/**
 * Инициализирай auth слушател при app startup
 */
export async function initAuth() {
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;

  supabaseClient.auth.onAuthStateChange((event, session) => {
    currentUser = session?.user || null;
  });
}

export function getCurrentUser() {
  return currentUser;
}

export function isLoggedIn() {
  return currentUser !== null;
}

/**
 * Регистрация със Supabase
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data, error}>}
 */
export async function register(email, password) {
  return supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  });
}

/**
 * Вход със Supabase
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data, error}>}
 */
export async function login(email, password) {
  return supabaseClient.auth.signInWithPassword({ email, password });
}

/**
 * Изход
 */
export async function logout() {
  return supabaseClient.auth.signOut();
}
