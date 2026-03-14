/* ============================================================
   Dashboard – Account sub-page (MVP)
   ============================================================ */
import { getCurrentUser } from '@utils/auth.js';
import { supabaseClient } from '@utils/supabase.js';
import { i18n } from '../../i18n/index.js';
import { showToast } from '@utils/toast.js';
import { emitProfileUpdated, fetchProfile, getAvatarInitials, removeAvatar, resolveDisplayName, resolveEditableFullName, updateProfile, uploadAvatar } from '@utils/profile.js';
import { showAvatarCropModal } from '@components/avatarCropModal.js';

export default async function render(container) {
  const user = getCurrentUser();
  const email = user?.email || '';
  const userId = user?.id;

  const { data: profileData } = userId
    ? await fetchProfile(userId)
    : { data: { full_name: '', avatar_url: null } };

  const profileState = {
    fullName: resolveEditableFullName(profileData?.full_name, email),
    avatarUrl: profileData?.avatar_url || null,
    isAvatarUploading: false
  };

  function withAvatarCacheBust(url) {
    if (!url) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${Date.now()}`;
  }

  const getDisplayName = () => resolveDisplayName(profileState.fullName, email);

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('avatar_preview_failed'));
      reader.readAsDataURL(blob);
    });
  }

  function setAvatarUploading(isUploading) {
    profileState.isAvatarUploading = isUploading;

    const uploadAvatarBtn = container.querySelector('#account-upload-avatar-btn');
    const removeAvatarBtn = container.querySelector('#account-remove-avatar-btn');
    if (uploadAvatarBtn) {
      uploadAvatarBtn.disabled = isUploading;
    }
    if (removeAvatarBtn) {
      removeAvatarBtn.disabled = isUploading;
    }
  }

  function renderAvatar() {
    if (profileState.avatarUrl) {
      return `<img src="${profileState.avatarUrl}" alt="${getDisplayName()}" class="vm-account-avatar-image">`;
    }
    return `<span class="vm-account-avatar-initials">${getAvatarInitials(getDisplayName())}</span>`;
  }

  function renderContent() {
    return `
    <div class="vm-dash-header">
      <h3>${i18n.t('dashboard.account.title')}</h3>
    </div>
    <div class="vm-account-section">
      <div class="vm-account-field">
        <label>${i18n.t('dashboard.account.photoLabel')}</label>
        <div class="vm-account-avatar-row">
          <div id="account-avatar-preview" class="vm-account-avatar-preview">${renderAvatar()}</div>
          <div class="vm-account-avatar-actions">
            <button type="button" class="btn btn-votamin-outline btn-sm" id="account-upload-avatar-btn">${i18n.t('dashboard.account.uploadPhoto')}</button>
            <button type="button" class="btn btn-votamin-outline btn-sm${profileState.avatarUrl ? '' : ' d-none'}" id="account-remove-avatar-btn">${i18n.t('dashboard.account.removePhoto')}</button>
            <input id="account-avatar-input" type="file" accept="image/*" class="d-none" />
          </div>
        </div>
      </div>

      <div class="vm-account-field">
        <label for="account-full-name">${i18n.t('dashboard.account.fullNameLabel')}</label>
        <form id="account-full-name-form" class="vm-account-inline-form" autocomplete="off">
          <input
            type="text"
            id="account-full-name"
            class="vm-input"
            placeholder="${i18n.t('dashboard.account.fullNamePlaceholder')}"
            maxlength="120"
          />
          <button type="submit" class="btn btn-votamin btn-sm" id="account-save-name-btn" disabled>${i18n.t('dashboard.account.saveName')}</button>
        </form>
      </div>

      <div class="vm-account-field">
        <label>${i18n.t('dashboard.account.emailLabel')}</label>
        <div class="vm-account-value">${email}</div>
      </div>

      <hr>

      <h5 class="fw-bold mb-3">${i18n.t('dashboard.account.changePassword')}</h5>
      <form id="change-password-form" autocomplete="off">
        <div class="mb-3">
          <label for="new-password">${i18n.t('dashboard.account.newPassword')}</label>
          <input type="password" id="new-password" class="vm-input" minlength="6"
                 placeholder="${i18n.t('auth.placeholders.passwordMin')}" required />
        </div>
        <div class="mb-3">
          <label for="confirm-password">${i18n.t('dashboard.account.confirmPassword')}</label>
          <input type="password" id="confirm-password" class="vm-input" minlength="6"
                 placeholder="${i18n.t('auth.placeholders.password')}" required />
        </div>
        <button type="submit" class="btn btn-votamin" id="account-save-password-btn" disabled>${i18n.t('dashboard.account.savePassword')}</button>
      </form>
    </div>`;
  }

  container.innerHTML = renderContent();

  function syncFullNameInputValue() {
    const fullNameInput = container.querySelector('#account-full-name');
    if (fullNameInput) {
      fullNameInput.value = profileState.fullName || '';
    }
  }

  function syncNameSaveState() {
    const fullNameInput = container.querySelector('#account-full-name');
    const saveNameBtn = container.querySelector('#account-save-name-btn');
    if (!fullNameInput || !saveNameBtn) return;

    const currentValue = fullNameInput.value.trim();
    const initialValue = (profileState.fullName || '').trim();
    const isValid = currentValue.length > 0;
    const isChanged = currentValue !== initialValue;

    saveNameBtn.disabled = !isValid || !isChanged;
  }

  function syncPasswordSaveState() {
    const newPasswordInput = container.querySelector('#new-password');
    const confirmPasswordInput = container.querySelector('#confirm-password');
    const savePasswordBtn = container.querySelector('#account-save-password-btn');
    if (!newPasswordInput || !confirmPasswordInput || !savePasswordBtn) return;

    const newPw = newPasswordInput.value;
    const confirmPw = confirmPasswordInput.value;

    const hasValue = newPw.length > 0 || confirmPw.length > 0;
    const minLengthOk = newPw.length >= 6;
    const matches = newPw === confirmPw;

    savePasswordBtn.disabled = !(hasValue && minLengthOk && matches);
  }

  syncFullNameInputValue();
  syncNameSaveState();
  syncPasswordSaveState();

  function refreshAvatarPreview() {
    const avatarPreview = container.querySelector('#account-avatar-preview');
    const removeAvatarBtn = container.querySelector('#account-remove-avatar-btn');
    const uploadAvatarBtn = container.querySelector('#account-upload-avatar-btn');

    if (avatarPreview) {
      avatarPreview.innerHTML = renderAvatar();
      avatarPreview.title = getDisplayName();
    }

    if (removeAvatarBtn) {
      removeAvatarBtn.classList.toggle('d-none', !profileState.avatarUrl);
      removeAvatarBtn.disabled = profileState.isAvatarUploading;
    }

    if (uploadAvatarBtn) {
      uploadAvatarBtn.disabled = profileState.isAvatarUploading;
    }
  }

  function renderAvatarPreviewImmediate(avatarUrl) {
    const avatarPreview = container.querySelector('#account-avatar-preview');
    const removeAvatarBtn = container.querySelector('#account-remove-avatar-btn');

    if (avatarPreview && avatarUrl) {
      avatarPreview.innerHTML = `<img src="${avatarUrl}" alt="${getDisplayName()}" class="vm-account-avatar-image">`;
      avatarPreview.title = getDisplayName();
    }

    if (removeAvatarBtn) {
      removeAvatarBtn.classList.remove('d-none');
      removeAvatarBtn.disabled = profileState.isAvatarUploading;
    }
  }

  function attachEventListeners() {
    /* Edit full name */
    const fullNameInput = container.querySelector('#account-full-name');
    fullNameInput?.addEventListener('input', syncNameSaveState);

    container.querySelector('#account-full-name-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!userId) return;

      const nextName = fullNameInput?.value?.trim() || '';
      if (!nextName) {
        showToast(i18n.t('notifications.fullNameRequired'), 'error');
        return;
      }

      if (nextName === (profileState.fullName || '').trim()) {
        syncNameSaveState();
        return;
      }

      const { data, error } = await updateProfile(userId, { full_name: nextName });
      if (error) {
        showToast(i18n.t('dashboard.account.nameUpdateError'), 'error');
        return;
      }

      profileState.fullName = resolveEditableFullName(data?.full_name || nextName, email);
      profileState.avatarUrl = data?.avatar_url || null;
      syncFullNameInputValue();
      syncNameSaveState();
      refreshAvatarPreview();
      emitProfileUpdated({ full_name: profileState.fullName, avatar_url: profileState.avatarUrl });
      showToast(i18n.t('dashboard.account.nameUpdated'), 'success');
    });

    /* Upload avatar */
    const avatarInput = container.querySelector('#account-avatar-input');
    container.querySelector('#account-upload-avatar-btn')?.addEventListener('click', () => {
      avatarInput?.click();
    });

    avatarInput?.addEventListener('change', async (event) => {
      const file = event.currentTarget?.files?.[0];
      if (!file || !userId) return;

      const previousAvatarUrl = profileState.avatarUrl;

      try {
        setAvatarUploading(true);

        const croppedBlob = await showAvatarCropModal(file);
        if (!croppedBlob) return;

        const localPreviewUrl = await blobToDataUrl(croppedBlob);
        profileState.avatarUrl = localPreviewUrl;
        renderAvatarPreviewImmediate(localPreviewUrl);
        emitProfileUpdated({ full_name: profileState.fullName, avatar_url: localPreviewUrl });

        const croppedFile = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
        const avatarUrl = await uploadAvatar(userId, croppedFile);

        const { data, error } = await updateProfile(userId, { avatar_url: avatarUrl });
        if (error) {
          profileState.avatarUrl = previousAvatarUrl;
          refreshAvatarPreview();
          emitProfileUpdated({ full_name: profileState.fullName, avatar_url: previousAvatarUrl });
          showToast(i18n.t('dashboard.account.avatarUpdateError'), 'error');
          return;
        }

        const { data: syncedProfile } = await fetchProfile(userId);
        const persistedAvatarUrl = syncedProfile?.avatar_url || data?.avatar_url || avatarUrl;
        const nextAvatarUrl = withAvatarCacheBust(persistedAvatarUrl);

        profileState.fullName = data?.full_name || profileState.fullName;
        profileState.fullName = resolveEditableFullName(profileState.fullName, email);
        profileState.avatarUrl = nextAvatarUrl;
        refreshAvatarPreview();
        emitProfileUpdated({ full_name: profileState.fullName, avatar_url: nextAvatarUrl });
        showToast(i18n.t('dashboard.account.avatarUpdated'), 'success');
      } catch (error) {
        profileState.avatarUrl = previousAvatarUrl;
        refreshAvatarPreview();
        emitProfileUpdated({ full_name: profileState.fullName, avatar_url: previousAvatarUrl });
        const message = error?.message;
        if (message === 'invalid_file_type') {
          showToast(i18n.t('notifications.avatarInvalidType'), 'error');
        } else if (message === 'file_too_large') {
          showToast(i18n.t('notifications.avatarFileTooLarge'), 'error');
        } else if (message === 'avatar_bucket_not_configured') {
          showToast(i18n.t('notifications.avatarStorageNotConfigured'), 'error');
        } else if (message === 'avatar_upload_forbidden') {
          showToast(i18n.t('notifications.avatarUploadForbidden'), 'error');
        } else {
          showToast(i18n.t('dashboard.account.avatarUpdateError'), 'error');
        }
      } finally {
        setAvatarUploading(false);
        refreshAvatarPreview();
        avatarInput.value = '';
      }
    });

    container.querySelector('#account-remove-avatar-btn')?.addEventListener('click', async () => {
      if (!userId || !profileState.avatarUrl) return;
      if (profileState.isAvatarUploading) return;

      try {
        const { data, error } = await removeAvatar(userId, profileState.avatarUrl);
        if (error) {
          showToast(i18n.t('dashboard.account.avatarRemoveError'), 'error');
          return;
        }

        profileState.fullName = resolveEditableFullName(data?.full_name || profileState.fullName, email);
        profileState.avatarUrl = null;
        refreshAvatarPreview();
        emitProfileUpdated({ full_name: profileState.fullName, avatar_url: null });
        showToast(i18n.t('dashboard.account.avatarRemoved'), 'success');
      } catch (error) {
        if (error?.message === 'avatar_delete_forbidden') {
          showToast(i18n.t('notifications.avatarDeleteForbidden'), 'error');
        } else {
          showToast(i18n.t('dashboard.account.avatarRemoveError'), 'error');
        }
      }
    });

    /* Change password */
    const newPasswordInput = container.querySelector('#new-password');
    const confirmPasswordInput = container.querySelector('#confirm-password');
    newPasswordInput?.addEventListener('input', syncPasswordSaveState);
    confirmPasswordInput?.addEventListener('input', syncPasswordSaveState);

    container.querySelector('#change-password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const savePasswordBtn = container.querySelector('#account-save-password-btn');
      const newPw = newPasswordInput?.value || '';
      const confirmPw = confirmPasswordInput?.value || '';

      if (newPw.length < 6) {
        showToast(i18n.t('notifications.passwordMinLength'), 'error');
        return;
      }
      if (newPw !== confirmPw) {
        showToast(i18n.t('notifications.passwordsMismatch'), 'error');
        return;
      }

      if (savePasswordBtn) {
        savePasswordBtn.disabled = true;
      }

      const { error } = await supabaseClient.auth.updateUser({ password: newPw });
      if (error) {
        showToast(i18n.t('dashboard.account.passwordError'), 'error');
      } else {
        showToast(i18n.t('dashboard.account.passwordChanged'), 'success');
        if (newPasswordInput) {
          newPasswordInput.value = '';
        }
        if (confirmPasswordInput) {
          confirmPasswordInput.value = '';
        }
      }

      syncPasswordSaveState();
    });
  }

  attachEventListeners();
  refreshAvatarPreview();

  /* Listen for language changes */
  window.addEventListener('votamin:language-changed', () => {
    container.innerHTML = renderContent();
    syncFullNameInputValue();
    attachEventListeners();
    refreshAvatarPreview();
  });
}
