export default {
  common: {
    appName: 'Votamin',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    confirm: 'Confirm',
    cancel: 'Cancel',
    confirmAction: 'Confirmation'
  },
  navbar: {
    home: 'Home',
    dashboard: 'Dashboard',
    polls: 'Polls',
    admin: 'Admin',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    account: 'Account',
    accountMenu: 'Account menu'
  },
  footer: {
    home: 'Home',
    dashboard: 'Dashboard',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout',
    rights: 'All rights reserved.'
  },
  notifications: {
    userCreated: 'User created successfully.',
    pollCreated: 'Poll created.',
    pollClosed: 'Poll closed.',
    pollDeleted: 'Poll deleted.',
    linkCopied: 'Link copied.',
    linkCopyFailed: 'Failed to copy link.',
    logoutFailed: 'Failed to log out.',
    selectOption: 'Please select an option',
    fillAllFields: 'Please fill in all fields',
    passwordMinLength: 'Password must be at least 6 characters',
    passwordsMismatch: 'Passwords do not match',
    registerAutoLoginFailed: 'Registration succeeded, but automatic login was not possible.',
    fullNameRequired: 'Please enter your name.',
    avatarInvalidType: 'Please choose an image file.',
    avatarFileTooLarge: 'Image must be up to 2MB.',
    avatarStorageNotConfigured: 'Avatar upload is not configured (avatars bucket is missing).',
    avatarUploadForbidden: 'You are not allowed to upload avatar images.',
    avatarDeleteForbidden: 'You are not allowed to delete this avatar image.',
    resetPasswordEmailSent: 'A password reset link has been sent successfully.',
    passwordResetSuccess: 'Password updated successfully. You can now log in with your new password.',
    resetPasswordInvalidLink: 'Invalid or expired reset link. Please request a new one.',
    emailNotFound: 'Email does not exist.'
  },
  auth: {
    fields: {
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password'
    },
    placeholders: {
      email: 'name@example.com',
      password: '••••••••',
      passwordMin: 'Minimum 6 characters'
    },
    actions: {
      login: 'Login',
      register: 'Sign Up',
      loginLoading: 'Logging in...',
      registerLoading: 'Signing up...',
      sendResetLink: 'Send reset link',
      sendingResetLink: 'Sending...',
      saveNewPassword: 'Save new password',
      savingNewPassword: 'Saving...',
      showPassword: 'Show password',
      hidePassword: 'Hide password'
    },
    login: {
      title: 'Login',
      subtitle: 'Log into your account and continue',
      noAccount: "Don't have an account?",
      forgotPassword: 'Forgot password?'
    },
    register: {
      title: 'Create account',
      subtitle: 'Free and fast — get started in seconds',
      haveAccount: 'Already have an account?'
    },
    forgotPassword: {
      title: 'Forgot password',
      subtitle: 'Enter your email and we will send you a reset link.',
      backToLogin: 'Back to login'
    },
    resetPassword: {
      title: 'Set new password',
      subtitle: 'Choose a new password for your account.',
      newPassword: 'New password',
      confirmPassword: 'Confirm new password'
    }
  },
  dashboard: {
    sidebar: {
      myPolls: 'My Polls',
      sharedWithMe: 'Shared With Me',
      account: 'Account',
      logout: 'Logout',
      adminUsers: 'Admin — Users',
      adminPolls: 'Admin — Polls',
      collapse: 'Collapse sidebar'
    },
    table: {
      columns: {
        title: 'Title',
        type: 'Type',
        responses: 'Participants',
        deadline: 'Modified Date',
        status: 'Status',
        myResponse: 'My Response',
        actions: 'Actions',
        owner: 'Owner'
      }
    },
    filters: {
      all: 'All',
      draft: 'Draft',
      open: 'Open',
      closed: 'Closed',
      searchPlaceholder: 'Search by title...',
      selectAll: 'Select all',
      reset: 'Clear filters'
    },
    status: {
      draft: 'Draft',
      open: 'Open',
      closed: 'Closed'
    },
    kind: {
      single_choice: 'Single Choice',
      multiple_choice: 'Multiple Choice',
      rating: 'Rating',
      image: 'Image Poll',
      slider: 'Slider',
      numeric: 'Numeric Input'
    },
    empty: {
      myPolls: {
        title: "You don't have any polls yet.",
        cta: 'Create your first poll'
      },
      shared: {
        title: "You haven't participated in any polls yet.",
        subtitle: 'When you vote in a poll created by someone else, it will appear here.'
      }
    },
    actions: {
      view: 'View',
      edit: 'Edit',
      share: 'Share',
      delete: 'Delete',
      viewResults: 'View Results',
      createPoll: '+ New Poll'
    },
    shareModal: {
      title: 'Share poll',
      subtitle: 'Copy the link and send it to participants.',
      linkLabel: 'Poll link',
      copy: 'Copy link',
      copied: 'Copied ✓',
      close: 'Close'
    },
    myResponse: {
      yes: 'Yes',
      no: 'No'
    },
    pagination: {
      prev: 'Previous',
      next: 'Next',
      page: 'Page',
      of: 'of',
      showing: 'Showing'
    },
    account: {
      title: 'Account',
      emailLabel: 'Email',
      photoLabel: 'Photo',
      uploadPhoto: 'Upload photo',
      removePhoto: 'Remove photo',
      cropTitle: 'Position your photo',
      cropSubtitle: 'Drag and zoom to choose the best avatar frame.',
      cropZoom: 'Zoom',
      fullNameLabel: 'Full name',
      fullNamePlaceholder: 'Enter your full name',
      saveName: 'Save name',
      fullNamePrompt: 'Enter your new name',
      nameUpdated: 'Name updated successfully.',
      nameUpdateError: 'Failed to update name.',
      avatarUpdated: 'Photo updated successfully.',
      avatarUpdateError: 'Failed to upload photo.',
      avatarRemoved: 'Photo removed successfully.',
      avatarRemoveError: 'Failed to remove photo.',
      changePassword: 'Change Password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm new password',
      savePassword: 'Save Password',
      passwordChanged: 'Password changed successfully.',
      passwordError: 'Failed to change password.'
    },
    confirmDelete: 'Are you sure you want to delete this poll?',
    shareError: 'Failed to generate share link.',
    error: 'Error loading polls',
    noDeadline: '—',
    noModifiedDate: '—'
  },
  home: {
    hero: {
      title: 'Charge up',
      titleHighlight: 'energy',
      titleEnd: 'for your decisions',
      subtitle: 'Votamin is a platform for quick and easy polls — create, share and analyze votes with just a few clicks.',
      ctaStart: 'Start for free',
      ctaLogin: 'I already have an account',
      features: {
        noCard: '✓ No credit card required',
        freePlan: '✓ Free plan',
        unlimited: '✓ Unlimited polls'
      }
    },
    stats: {
      users: 'Active users',
      polls: 'Polls created',
      votes: 'Votes cast',
      openPolls: 'Active polls'
    },
    features: {
      title: 'Why',
      subtitle: 'Everything you need for effective polls',
      speed: {
        title: 'Quick Setup',
        description: 'Create a poll in seconds — no complex forms or settings.'
      },
      realtime: {
        title: 'Real-time Results',
        description: 'Track voting live with beautiful charts and statistics.'
      },
      sharing: {
        title: 'Easy Sharing',
        description: 'Generate a short link and share with friends, colleagues or community.'
      },
      security: {
        title: 'Security',
        description: 'Your data is protected with the highest security standards.'
      },
      mobile: {
        title: 'Mobile Version',
        description: 'Works flawlessly on all devices — phone, tablet, computer.'
      },
      pollTypes: {
        title: 'Multiple Poll Types',
        description: 'Use single choice, multiple choice, rating, and numeric input.'
      }
    },
    howItWorks: {
      title: 'How does it work?',
      subtitle: 'Three simple steps to your poll',
      step1: {
        title: 'Create a poll',
        description: 'Enter a question and answer options'
      },
      step2: {
        title: 'Share the link',
        description: 'Send to people you want to vote'
      },
      step3: {
        title: 'View results',
        description: 'Analyze votes in real time'
      }
    },
    cta: {
      title: 'Ready to get started?',
      subtitle: 'Join thousands of users already using Votamin',
      register: 'Create free account',
      notice: 'Free registration • No credit card • Cancel anytime'
    }
  },
  publicPoll: {
    fallbackDescription: 'Choose your answer.',
    notAccessibleTitle: 'This poll is not available',
    numericLabel: 'Enter a value',
    numericPlaceholder: 'For example: 10',
    closedAlert: 'This poll is closed.',
    voteButton: 'Vote',
    submitting: 'Submitting...',
    thanksTitle: 'Thank you!',
    thanksText: 'Your vote has been received.',
    returnToDashboard: 'Back to dashboard',
    poweredBy: 'Powered by',
    errors: {
      missingCode: 'Missing share code.',
      invalidLink: 'Invalid poll link.',
      expiredLink: 'This poll link has expired.',
      loadFailed: 'An error occurred while loading.',
      voteFailed: 'Vote failed. Please try again.',
      alreadyVoted: 'You have already voted in this poll.',
      noPermission: 'You do not have permission to vote. Please sign in and try again.',
      pollNotOpen: 'This poll is no longer accepting votes.',
      invalidOptionCount: 'An invalid number of options was selected for this poll.',
      invalidNumeric: 'Enter a valid numeric value.'
    },
    info: {
      loginToVote: 'Please sign in to vote.'
    },
    success: {
      voteSaved: 'Your vote was recorded successfully.'
    }
  },
  createPoll: {
    wizard: {
      title: 'Create New Poll',
      subtitle: 'Follow the steps to create your poll',
      steps: {
        create: 'Create',
        preview: 'Preview',
        publish: 'Publish',
        share: 'Share'
      },
      stepDescription: {
        create: 'Configure your poll',
        preview: 'Review before publishing',
        publish: 'Save or publish your poll',
        share: 'Share with participants'
      }
    },
    fields: {
      question: 'Question',
      description: 'Description (optional)',
      pollType: 'Poll Type',
      options: 'Answer Options',
      minValue: 'Minimum Value',
      maxValue: 'Maximum Value',
      visibility: 'Visibility',
      resultsVisibility: 'Results Visibility',
      endDate: 'End Date (optional)',
      theme: 'Theme'
    },
    placeholders: {
      question: 'What would you like to ask?',
      description: 'Add context or instructions for your poll...',
      option: 'Option {number}',
      minValue: 'e.g., 0',
      maxValue: 'e.g., 100'
    },
    pollTypes: {
      single_choice: {
        title: 'Single Choice',
        description: 'Participants can select only one option'
      },
      multiple_choice: {
        title: 'Multiple Choice',
        description: 'Participants can select multiple options'
      },
      rating: {
        title: 'Rating',
        description: '5-star rating scale'
      },
      numeric: {
        title: 'Numeric Input',
        description: 'Participants enter a number'
      }
    },
    visibility: {
      public: 'Public',
      private: 'Private',
      publicDesc: 'Anyone with the link can access',
      privateDesc: 'Only shared participants can access'
    },
    resultsVisibility: {
      after_vote: 'After Vote',
      always: 'Always',
      creator_only: 'Creator Only',
      after_voteDesc: 'Voters see results immediately',
      alwaysDesc: 'Results are visible to everyone',
      creator_onlyDesc: 'Only you can see the results'
    },
    themes: {
      default: 'Default',
      blue: 'Blue',
      green: 'Green',
      purple: 'Purple',
      orange: 'Orange'
    },
    actions: {
      addOption: '+ Add Option',
      removeOption: 'Remove',
      next: 'Next',
      back: 'Back',
      saveAsDraft: 'Save as Draft',
      publish: 'Publish',
      copyLink: 'Copy Link',
      viewPoll: 'View Poll',
      createAnother: 'Create Another Poll',
      advancedSettings: 'Advanced Settings'
    },
    validation: {
      questionRequired: 'Question is required',
      minTwoOptions: 'At least 2 options are required',
      optionEmpty: 'Option cannot be empty',
      minLessThanMax: 'Minimum must be less than maximum',
      maxRequired: 'Maximum value is recommended for numeric polls'
    },
    preview: {
      title: 'Preview Your Poll',
      subtitle: 'This is how participants will see your poll',
      closesOn: 'Closes on {date}',
      noEndDate: 'No end date',
      questionFallback: 'Your question will appear here',
      rangeLabel: 'Range:',
      noRangeLimits: 'No range limits',
      to: 'to'
    },
    publish: {
      draftSaved: 'Poll saved as draft',
      published: 'Poll published successfully!',
      error: 'Failed to save poll',
      readyTitle: 'Ready to Publish?',
      readySubtitle: 'Your poll is ready. You can save it as a draft or publish it now.',
      summaryTitle: 'Poll Summary',
      summaryQuestion: 'Question',
      summaryType: 'Type',
      summaryVisibility: 'Visibility',
      summaryResults: 'Results',
      summaryHint: 'Use the buttons below to save as draft or publish your poll.'
    },
    ratingEditor: {
      info: 'Participants will rate from 1 to 5 stars.',
      autoOptions: '5 options will be automatically created.'
    },
    numericEditor: {
      optionalMinHint: 'Optional: Leave empty for no minimum',
      optionalMaxHint: 'Optional: Leave empty for no maximum',
      rangeLabel: 'Range:',
      info: 'Participants will enter a numeric value.',
      constraintsInfo: 'Set optional min/max constraints for validation.',
      to: 'to'
    },
    advancedSettings: {
      endDateHint: 'Poll will automatically close at this date and time'
    },
    share: {
      title: 'Share Your Poll',
      subtitle: 'Copy the link below and share it with participants',
      linkLabel: 'Poll Link',
      copySuccess: 'Link copied to clipboard!',
      copyError: 'Failed to copy link'
    }
  },
  pollDetail: {
    status: {
      open: 'Open',
      draft: 'Draft',
      closed: 'Closed'
    },
    noAnswersYet: 'No responses yet.',
    avg: 'Average',
    min: 'Minimum',
    max: 'Maximum',
    noOptions: 'No options available for this poll.',
    copyLink: 'Copy link',
    copied: 'Copied ✓',
    editCancel: 'Cancel',
    editAction: 'Edit',
    backToMyPolls: '← Back to my polls',
    noDescription: 'No description',
    shareCode: 'Share code:',
    editTitle: 'Edit',
    titleLabel: 'Title',
    descriptionLabel: 'Description',
    statusLabel: 'Status',
    visibilityLabel: 'Visibility',
    visibility: {
      public: 'Public',
      private: 'Private'
    },
    saveChanges: 'Save changes',
    editHint: 'Use "Edit" to change title, description, and status.',
    resultsTitle: 'Results',
    votesSuffix: 'votes',
    closePoll: 'Close poll',
    deletePoll: 'Delete',
    missingPollId: 'Missing poll ID.',
    loadFailed: 'Failed to load poll.',
    titleRequired: 'Title is required.',
    updated: 'Poll updated.',
    updateFailed: 'Failed to update poll.',
    closeFailed: 'Failed to close poll.',
    deleteConfirm: 'Are you sure you want to delete this poll?',
    deleteFailed: 'Failed to delete poll.',
    sidebar: {
      metricsTitle: 'Metrics',
      participants: 'Participants',
      status: 'Status',
      modified: 'Modified',
      lastActivity: 'Last Activity',
      created: 'Created',
      adminTitle: 'Administration',
      shareCode: 'Share Code',
      visibility: 'Visibility',
      kind: 'Type',
      justNow: 'just now',
      minutesAgo: 'min ago',
      hoursAgo: 'h ago',
      daysAgo: 'days ago'
    },
    voters: {
      title: 'Voters',
      noVoters: 'No voters yet.',
      showMore: 'Show more',
      export: 'Export',
      csv: 'CSV',
      json: 'JSON',
      excel: 'Excel',
      exportNoData: 'No data to export.',
      exportSuccess: 'Export is ready.',
      exportFailed: 'Export failed.'
    }
  },
  admin: {
    title: 'Administration',
    subtitle: 'Manage users and polls',
    headingUsers: 'Administration - manage users',
    headingPolls: 'Administration - manage polls',
    actions: 'Actions',
    tabs: {
      users: '👥 Users',
      polls: '📊 Polls'
    },
    users: {
      totalUsers: 'Total users',
      adminCount: 'Administrators',
      roleUser: 'User',
      roleAdmin: 'Admin',
      newToday: 'New today',
      newThisWeek: 'New this week',
      active7d: 'Active (7d)',
      active30d: 'Active (30d)',
      inactive30d: 'Inactive (30d)',
      blockedUsers: 'Blocked',
      tableTitle: 'All users',
      searchPlaceholder: 'Search by email or name...',
      allRoles: 'All roles',
      allStatuses: 'All statuses',
      statusActive: 'Active',
      statusBlocked: 'Blocked',
      resetFilters: 'Clear',
      noUsers: 'No users found.',
      colUser: 'User',
      colRole: 'Role',
      colStatus: 'Status',
      colRegistered: 'Registered',
      colLastLogin: 'Last login',
      colPolls: 'Polls',
      colVotes: 'Votes',
      colActions: 'Actions',
      makeAdmin: 'Make Admin',
      removeAdmin: 'Remove Admin',
      blockUser: 'Block user',
      unblockUser: 'Unblock user',
      deleteUser: 'Delete user',
      confirmMakeAdmin: 'Are you sure you want to make this user an administrator?',
      confirmRemoveAdmin: 'Are you sure you want to remove administrator rights?',
      confirmDeleteUser: 'Are you sure you want to delete this user? All their data will be lost.',
      confirmBlock: 'Are you sure you want to block this user? They will not be able to create polls or vote.',
      roleUpdated: 'Role updated successfully.',
      roleError: 'Failed to change role.',
      userDeleted: 'User deleted.',
      userBlocked: 'User has been blocked.',
      userUnblocked: 'User has been unblocked.',
      blockError: 'Failed to change user status.',
      deleteError: 'Failed to delete user.',
      loadError: 'Error loading users.'
    },
    polls: {
      totalPolls: 'Total polls',
      activePolls: 'Active polls',
      closedPolls: 'Closed polls',
      totalVotes: 'Total votes',
      avgVotes: 'Avg votes/poll',
      zeroVotes: 'Zero votes',
      mostVoted: 'Most voted',
      votesLabel: 'votes',
      tableTitle: 'All polls',
      searchPlaceholder: 'Search by title...',
      allStatuses: 'All statuses',
      allVisibility: 'All visibility',
      public: 'Public',
      unlisted: 'Unlisted',
      private: 'Private',
      sortNewest: 'Newest',
      sortMostVotes: 'Most votes',
      sortTitle: 'By title',
      resetFilters: 'Clear',
      noPolls: 'No polls found.',
      colTitle: 'Title',
      colCreator: 'Creator',
      colStatus: 'Status',
      colVisibility: 'Visibility',
      colVotes: 'Votes',
      colCreated: 'Created',
      colExpires: 'Expires',
      colActions: 'Actions',
      viewDetails: 'View details',
      viewVoters: 'View voters',
      closePoll: 'Close poll',
      reopenPoll: 'Reopen poll',
      reopened: 'Poll reopened.',
      makeFeatured: 'Mark as featured',
      removeFeatured: 'Remove featured',
      featuredOn: 'Poll marked as featured.',
      featuredOff: 'Featured status removed.',
      duplicatePoll: 'Duplicate poll',
      confirmDuplicate: 'Are you sure you want to duplicate poll',
      duplicated: 'Poll duplicated successfully.',
      resetVotes: 'Reset votes',
      confirmResetVotes: 'Are you sure you want to reset all votes for',
      votesReset: 'Votes have been reset.',
      deletePoll: 'Delete poll',
      confirmDelete: 'Are you sure you want to delete poll',
      votersFor: 'Voters for',
      voterName: 'Name',
      votedAt: 'Voted at',
      selections: 'Selected options',
      noVoters: 'No voters yet.',
      loadError: 'Error loading polls.'
    }
  },
  pollsList: {
    title: 'Polls',
    subtitle: 'All your polls in one place',
    loading: 'Loading polls...',
    status: {
      open: 'Open',
      closed: 'Closed',
      draft: 'Draft'
    },
    empty: {
      noPollsForFilter: 'You have no polls for this filter.'
    },
    stats: {
      votes: 'votes',
      options: 'options'
    },
    code: 'Code:',
    actions: {
      view: 'View',
      edit: 'Edit',
      delete: 'Delete'
    },
    errors: {
      loadFailed: 'Error loading polls.',
      deleteFailed: 'Error deleting poll.',
      deleteConfirm: 'Are you sure you want to delete this poll?'
    }
  }
};
