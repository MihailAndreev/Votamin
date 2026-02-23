export default {
  common: {
    appName: 'Votamin',
    login: 'Вход',
    register: 'Регистрация',
    logout: 'Изход'
  },
  navbar: {
    home: 'Начало',
    dashboard: 'Табло',
    polls: 'Анкети',
    admin: 'Админ',
    login: 'Вход',
    register: 'Регистрация',
    logout: 'Изход'
  },
  footer: {
    home: 'Начало',
    dashboard: 'Табло',
    login: 'Вход',
    register: 'Регистрация',
    logout: 'Изход',
    rights: 'Всички права запазени.'
  },
  notifications: {
    userCreated: 'Потребителят е създаден успешно.',
    pollCreated: 'Анкетата е създадена.',
    pollClosed: 'Анкетата е затворена.',
    pollDeleted: 'Анкетата е изтрита.',
    linkCopied: 'Линкът е копиран.',
    linkCopyFailed: 'Неуспешно копиране на линк.',
    logoutFailed: 'Неуспешен изход от профила.',
    selectOption: 'Моля, избери опция',
    fillAllFields: 'Попълни всички полета',
    passwordMinLength: 'Паролата трябва да е минимум 6 символа',
    passwordsMismatch: 'Паролите не съвпадат',
    registerAutoLoginFailed: 'Регистрацията е успешна, но автоматичният вход не беше възможен.'
  },
  auth: {
    fields: {
      email: 'Имейл',
      password: 'Парола',
      confirmPassword: 'Потвърди парола'
    },
    placeholders: {
      email: 'name@example.com',
      password: '••••••••',
      passwordMin: 'Минимум 6 символа'
    },
    actions: {
      login: 'Вход',
      register: 'Регистрация',
      loginLoading: 'Вход...',
      registerLoading: 'Регистрация...',
      showPassword: 'Покажи парола',
      hidePassword: 'Скрий парола'
    },
    login: {
      title: 'Вход',
      subtitle: 'Влез в акаунта си и продължи',
      noAccount: 'Нямаш акаунт?',
      forgotPassword: 'Забравена парола?'
    },
    register: {
      title: 'Създай акаунт',
      subtitle: 'Безплатно и бързо — започни за секунди',
      haveAccount: 'Вече имаш акаунт?'
    }
  },
  dashboard: {
    sidebar: {
      myPolls: 'Моите анкети',
      sharedWithMe: 'Споделени с мен',
      account: 'Акаунт',
      logout: 'Изход',
      adminUsers: 'Админ — Потребители',
      adminPolls: 'Админ — Анкети',
      collapse: 'Свий менюто'
    },
    table: {
      columns: {
        title: 'Заглавие',
        type: 'Тип',
        responses: 'Отговори',
        deadline: 'Краен срок',
        status: 'Статус',
        myResponse: 'Мой отговор',
        actions: 'Действия',
        owner: 'Автор'
      }
    },
    filters: {
      all: 'Всички',
      draft: 'Чернова',
      open: 'Отворена',
      closed: 'Затворена'
    },
    status: {
      draft: 'Чернова',
      open: 'Отворена',
      closed: 'Затворена'
    },
    kind: {
      single_choice: 'Единичен избор',
      multiple_choice: 'Множествен избор',
      rating: 'Рейтинг',
      image: 'С изображения',
      slider: 'Плъзгач',
      numeric: 'Числов вход'
    },
    empty: {
      myPolls: {
        title: 'Все още нямаш анкети.',
        cta: 'Създай първата си анкета'
      },
      shared: {
        title: 'Все още не си участвал в чужди анкети.',
        subtitle: 'Когато гласуваш в анкета на друг потребител, тя ще се появи тук.'
      }
    },
    actions: {
      view: 'Преглед',
      edit: 'Редактирай',
      share: 'Сподели',
      delete: 'Изтрий',
      viewResults: 'Виж резултати',
      createPoll: '+ Нова анкета'
    },
    myResponse: {
      yes: 'Да',
      no: 'Не'
    },
    account: {
      title: 'Акаунт',
      emailLabel: 'Имейл',
      changePassword: 'Смяна на парола',
      currentPassword: 'Текуща парола',
      newPassword: 'Нова парола',
      confirmPassword: 'Потвърди нова парола',
      savePassword: 'Запази парола',
      passwordChanged: 'Паролата е сменена успешно.',
      passwordError: 'Неуспешна смяна на парола.'
    },
    noDeadline: '—'
  },
  home: {
    hero: {
      title: 'Зареди',
      titleHighlight: 'енергия',
      titleEnd: 'за твоите решения',
      subtitle: 'Votamin е платформа за бързи и лесни анкети — създавай, споделяй и анализирай гласувания само с няколко клика.',
      ctaStart: 'Започни безплатно',
      ctaLogin: 'Вече имам акаунт',
      features: {
        noCard: '✓ Без кредитна карта',
        freePlan: '✓ Безплатен план',
        unlimited: '✓ Неограничени анкети'
      }
    },
    stats: {
      users: 'Активни потребители',
      polls: 'Създадени анкети',
      votes: 'Отдадени гласове',
      uptime: 'Uptime'
    },
    features: {
      title: 'Защо',
      subtitle: 'Всичко, от което се нуждаеш за ефективни анкети',
      speed: {
        title: 'Бърза настройка',
        description: 'Създай анкета за секунди — без сложни формуляри и настройки.'
      },
      realtime: {
        title: 'Резултати в реално време',
        description: 'Следи гласуването на живо с красиви графики и статистики.'
      },
      sharing: {
        title: 'Лесно споделяне',
        description: 'Генерирай кратък линк и сподели с приятели, колеги или общност.'
      },
      security: {
        title: 'Сигурност',
        description: 'Твоите данни са защитени с най-високи стандарти за сигурност.'
      },
      mobile: {
        title: 'Мобилна версия',
        description: 'Работи безупречно на всички устройства — телефон, таблет, компютър.'
      },
      customization: {
        title: 'Персонализация',
        description: 'Настрой анкетата по твой вкус — цветове, шрифтове, лого.'
      }
    },
    howItWorks: {
      title: 'Как работи?',
      subtitle: 'Три прости стъпки до твоята анкета',
      step1: {
        title: 'Създай анкета',
        description: 'Въведи въпрос и опции за отговор'
      },
      step2: {
        title: 'Сподели линк',
        description: 'Изпрати на хора, които искаш да гласуват'
      },
      step3: {
        title: 'Виж резултатите',
        description: 'Анализирай гласуванията в реално време'
      }
    },
    cta: {
      title: 'Готов ли си да започнеш?',
      subtitle: 'Присъедини се към хиляди потребители, които вече използват Votamin',
      register: 'Създай акаунт безплатно',
      viewPolls: 'Виж примерни анкети',
      notice: 'Безплатна регистрация • Без кредитна карта • Отмени по всяко време'
    }
  }
};
