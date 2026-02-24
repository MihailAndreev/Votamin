/* ============================================================
   Dashboard – Account sub-page (MVP)
   ============================================================ */
import { getCurrentUser, logout } from '@utils/auth.js';
import { supabaseClient } from '@utils/supabase.js';
import { i18n } from '../../i18n/index.js';
import { showToast } from '@utils/toast.js';
import { navigateTo } from '../../router.js';
import { emitProfileUpdated, fetchProfile, getAvatarInitials, resolveDisplayName, updateProfile, uploadAvatar } from '@utils/profile.js';

export default async function render(container) {
  const user = getCurrentUser();
  const email = user?.email || '';
  const userId = user?.id;

  const { data: profileData } = userId
    ? await fetchProfile(userId)
    : { data: { full_name: '', avatar_url: null } };

  const profileState = {
    fullName: profileData?.full_name || '',
    avatarUrl: profileData?.avatar_url || null
  };

  const getDisplayName = () => resolveDisplayName(profileState.fullName, email);

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
          <div>
            <button type="button" class="btn btn-votamin-outline btn-sm" id="account-upload-avatar-btn">${i18n.t('dashboard.account.uploadPhoto')}</button>
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
          <button type="submit" class="btn btn-votamin btn-sm">${i18n.t('dashboard.account.saveName')}</button>
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
        <button type="submit" class="btn btn-votamin">${i18n.t('dashboard.account.savePassword')}</button>
      </form>

      <hr class="mt-4">
      <button class="btn btn-votamin-outline mt-2" id="account-logout-btn">${i18n.t('dashboard.sidebar.logout')}</button>
    </div>`;
  }

  container.innerHTML = renderContent();

  function syncFullNameInputValue() {
    const fullNameInput = container.querySelector('#account-full-name');
    if (fullNameInput) {
      fullNameInput.value = profileState.fullName || '';
    }
  }

  syncFullNameInputValue();

  function refreshAvatarPreview() {
    const avatarPreview = container.querySelector('#account-avatar-preview');
    if (avatarPreview) {
      avatarPreview.innerHTML = renderAvatar();
      avatarPreview.title = getDisplayName();
    }
  }

  function attachEventListeners() {
    /* Edit full name */
    container.querySelector('#account-full-name-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!userId) return;

      const fullNameInput = container.querySelector('#account-full-name');
      const nextName = fullNameInput?.value?.trim() || '';
      if (!nextName) {
        showToast(i18n.t('notifications.fullNameRequired'), 'error');
        return;
      }

      const { data, error } = await updateProfile(userId, { full_name: nextName });
      if (error) {
        showToast(i18n.t('dashboard.account.nameUpdateError'), 'error');
        return;
      }

      profileState.fullName = data?.full_name || nextName;
      profileState.avatarUrl = data?.avatar_url || null;
      syncFullNameInputValue();
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
      const file = event.target.files?.[0];
      if (!file || !userId) return;

      try {
        const avatarUrl = await uploadAvatar(userId, file);
        const { data, error } = await updateProfile(userId, { avatar_url: avatarUrl });
        if (error) {
          showToast(i18n.t('dashboard.account.avatarUpdateError'), 'error');
          return;
        }

        profileState.fullName = data?.full_name || profileState.fullName;
        profileState.avatarUrl = data?.avatar_url || avatarUrl;
        refreshAvatarPreview();
        emitProfileUpdated({ full_name: profileState.fullName, avatar_url: profileState.avatarUrl });
        showToast(i18n.t('dashboard.account.avatarUpdated'), 'success');
      } catch (error) {
        const message = error?.message;
        if (message === 'invalid_file_type') {
          showToast(i18n.t('notifications.avatarInvalidType'), 'error');
        } else if (message === 'file_too_large') {
          showToast(i18n.t('notifications.avatarFileTooLarge'), 'error');
        } else {
          showToast(i18n.t('dashboard.account.avatarUpdateError'), 'error');
        }
      } finally {
        avatarInput.value = '';
      }
    });

    /* Change password */
    container.querySelector('#change-password-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const newPw = container.querySelector('#new-password').value;
      const confirmPw = container.querySelector('#confirm-password').value;

      if (newPw.length < 6) {
        showToast(i18n.t('notifications.passwordMinLength'), 'error');
        return;
      }
      if (newPw !== confirmPw) {
        showToast(i18n.t('notifications.passwordsMismatch'), 'error');
        return;
      }

      const { error } = await supabaseClient.auth.updateUser({ password: newPw });
      if (error) {
        showToast(i18n.t('dashboard.account.passwordError'), 'error');
      } else {
        showToast(i18n.t('dashboard.account.passwordChanged'), 'success');
        container.querySelector('#new-password').value = '';
        container.querySelector('#confirm-password').value = '';
      }
    });

    /* Logout */
    container.querySelector('#account-logout-btn')?.addEventListener('click', async () => {
      const { error } = await logout();
      if (!error) {
        navigateTo('/');
      } else {
        showToast(error?.message || i18n.t('notifications.logoutFailed'), 'error');
      }
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
