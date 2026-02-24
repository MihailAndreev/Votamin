export default {
  common: {
    appName: 'Votamin',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout'
  },
  navbar: {
    home: 'Home',
    dashboard: 'Dashboard',
    polls: 'Polls',
    admin: 'Admin',
    login: 'Login',
    register: 'Sign Up',
    logout: 'Logout'
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
    registerAutoLoginFailed: 'Registration succeeded, but automatic login was not possible.'
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
        responses: 'Responses',
        deadline: 'Deadline',
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
      closed: 'Closed'
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
    myResponse: {
      yes: 'Yes',
      no: 'No'
    },
    account: {
      title: 'Account',
      emailLabel: 'Email',
      changePassword: 'Change Password',
      currentPassword: 'Current password',
      newPassword: 'New password',
      confirmPassword: 'Confirm new password',
      savePassword: 'Save Password',
      passwordChanged: 'Password changed successfully.',
      passwordError: 'Failed to change password.'
    },
    confirmDelete: 'Are you sure you want to delete this poll?',
    error: 'Error loading polls',
    noDeadline: '—'
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
      uptime: 'Uptime'
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
      customization: {
        title: 'Customization',
        description: 'Customize your poll — colors, fonts, logo.'
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
      viewPolls: 'View sample polls',
      notice: 'Free registration • No credit card • Cancel anytime'
    }
  },
  createPoll: {
    wizard: {
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
      after_close: 'After Close',
      owner_only: 'Owner Only',
      after_voteDesc: 'Voters see results immediately',
      after_closeDesc: 'Results visible when poll closes',
      owner_onlyDesc: 'Only you can see the results'
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
      noEndDate: 'No end date'
    },
    publish: {
      draftSaved: 'Poll saved as draft',
      published: 'Poll published successfully!',
      error: 'Failed to save poll'
    },
    share: {
      title: 'Share Your Poll',
      subtitle: 'Copy the link below and share it with participants',
      linkLabel: 'Poll Link',
      copySuccess: 'Link copied to clipboard!',
      copyError: 'Failed to copy link'
    }
  }
};
