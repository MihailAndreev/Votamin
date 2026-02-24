import { supabaseClient } from './supabase.js';

const AVATAR_BUCKET = 'avatars';
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

export function getAvatarInitials(nameOrEmail) {
  const value = nameOrEmail?.trim();
  if (!value) return '?';

  if (value.includes('@')) {
    return value.charAt(0).toUpperCase();
  }

  const nameParts = value.split(/\s+/).filter(Boolean);
  if (!nameParts.length) return '?';
  if (nameParts.length === 1) {
    return nameParts[0].charAt(0).toUpperCase();
  }

  return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
}

export function resolveDisplayName(fullName, fallbackEmail = '') {
  const trimmed = fullName?.trim();
  return trimmed || fallbackEmail || '';
}

export async function fetchProfile(userId) {
  return supabaseClient
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();
}

export async function updateProfile(userId, patch) {
  return supabaseClient
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('full_name, avatar_url')
    .maybeSingle();
}

export async function uploadAvatar(userId, file) {
  if (!file?.type?.startsWith('image/')) {
    throw new Error('invalid_file_type');
  }

  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    throw new Error('file_too_large');
  }

  const originalName = file?.name || 'avatar.jpg';
  const extension = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : 'jpg';
  const safeExtension = extension && extension.length <= 5 ? extension : 'jpg';
  const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExtension}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(AVATAR_BUCKET)
    .upload(filePath, file, { upsert: false, cacheControl: '3600' });

  if (uploadError) {
    const msg = String(uploadError?.message || '').toLowerCase();
    if (msg.includes('bucket') && msg.includes('not')) {
      throw new Error('avatar_bucket_not_configured');
    }
    if (msg.includes('row-level security') || msg.includes('policy')) {
      throw new Error('avatar_upload_forbidden');
    }
    throw uploadError;
  }

  const { data: publicData } = supabaseClient.storage
    .from(AVATAR_BUCKET)
    .getPublicUrl(filePath);

  return publicData?.publicUrl || null;
}

export function emitProfileUpdated(profile) {
  window.dispatchEvent(new CustomEvent('votamin:profile-updated', { detail: profile }));
}
