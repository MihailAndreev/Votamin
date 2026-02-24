export default {
  common: {
    appName: 'Votamin',
    login: 'Вход',
    register: 'Регистрация',
    logout: 'Изход',
    confirm: 'Потвърди',
    cancel: 'Отказ',
    confirmAction: 'Потвърждение'
  },
  navbar: {
    home: 'Начало',
    dashboard: 'Табло',
    polls: 'Анкети',
    admin: 'Админ',
    login: 'Вход',
    register: 'Регистрация',
    logout: 'Изход',
    account: 'Акаунт',
    accountMenu: 'Акаунт меню'
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
    registerAutoLoginFailed: 'Регистрацията е успешна, но автоматичният вход не беше възможен.',
    fullNameRequired: 'Моля, въведи име.',
    avatarInvalidType: 'Моля, избери изображение.',
    avatarFileTooLarge: 'Снимката трябва да е до 2MB.',
    avatarStorageNotConfigured: 'Качването на снимка не е конфигурирано (липсва bucket avatars).',
    avatarUploadForbidden: 'Нямаш права за качване на снимка в аватара.',
    avatarDeleteForbidden: 'Нямаш права за изтриване на снимката.'
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
        responses: 'Участници',
        deadline: 'Модификация',
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
      closed: 'Затворена',
      searchPlaceholder: 'Търси по заглавие...',
      selectAll: 'Избери всички',
      reset: 'Изчисти филтри'
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
    shareModal: {
      title: 'Споделяне на анкета',
      subtitle: 'Копирай линка и го изпрати на участниците.',
      linkLabel: 'Линк към анкета',
      copy: 'Копирай линк',
      copied: 'Копирано ✓',
      close: 'Затвори'
    },
    myResponse: {
      yes: 'Да',
      no: 'Не'
    },
    pagination: {
      prev: 'Назад',
      next: 'Напред',
      page: 'Страница',
      of: 'от',
      showing: 'Показани'
    },
    account: {
      title: 'Акаунт',
      emailLabel: 'Имейл',
      photoLabel: 'Снимка',
      uploadPhoto: 'Качи снимка',
      removePhoto: 'Премахни снимка',
      cropTitle: 'Позиционирай снимката',
      cropSubtitle: 'Премести снимката и избери подходящ кадър за аватар.',
      cropZoom: 'Мащаб',
      fullNameLabel: 'Име',
      fullNamePlaceholder: 'Въведи име и фамилия',
      saveName: 'Запази име',
      fullNamePrompt: 'Въведи ново име',
      nameUpdated: 'Името е обновено успешно.',
      nameUpdateError: 'Неуспешно обновяване на името.',
      avatarUpdated: 'Снимката е обновена успешно.',
      avatarUpdateError: 'Неуспешно качване на снимка.',
      avatarRemoved: 'Снимката е премахната успешно.',
      avatarRemoveError: 'Неуспешно премахване на снимката.',
      changePassword: 'Смяна на парола',
      currentPassword: 'Текуща парола',
      newPassword: 'Нова парола',
      confirmPassword: 'Потвърди нова парола',
      savePassword: 'Запази парола',
      passwordChanged: 'Паролата е сменена успешно.',
      passwordError: 'Неуспешна смяна на парола.'
    },
    confirmDelete: 'Сигурен ли си, че искаш да изтриеш тази анкета?',
    shareError: 'Неуспешно генериране на линк за споделяне.',
    error: 'Грешка при зареждане на анкетите',
    noDeadline: '—',
    noModifiedDate: '—'
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
      openPolls: 'Активни анкети'
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
      pollTypes: {
        title: 'Различни типове анкети',
        description: 'Използвай единичен избор, множествен избор, рейтинг и числов вход.'
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
      notice: 'Безплатна регистрация • Без кредитна карта • Отмени по всяко време'
    }
  },
  publicPoll: {
    fallbackDescription: 'Избери своя отговор.',
    notAccessibleTitle: 'Анкетата не е достъпна',
    numericLabel: 'Въведи стойност',
    numericPlaceholder: 'Например: 10',
    closedAlert: 'Тази анкета е затворена.',
    voteButton: 'Гласувай',
    submitting: 'Изпращане...',
    thanksTitle: 'Благодарим ти!',
    thanksText: 'Гласът ти е получен.',
    returnToDashboard: 'Към Dashboard',
    poweredBy: 'Задвижвано от',
    errors: {
      missingCode: 'Липсва код за споделяне.',
      invalidLink: 'Невалиден линк за анкета.',
      expiredLink: 'Този линк за анкета е изтекъл.',
      loadFailed: 'Възникна грешка при зареждане.',
      voteFailed: 'Неуспешно гласуване. Моля, опитай отново.',
      alreadyVoted: 'Вече си гласувал в тази анкета.',
      noPermission: 'Нямаш права да гласуваш. Влез в профила си и опитай пак.',
      pollNotOpen: 'Анкетата вече не приема гласове.',
      invalidOptionCount: 'Избран е невалиден брой опции за тази анкета.',
      invalidNumeric: 'Въведи валидна числова стойност.'
    },
    info: {
      loginToVote: 'Моля, влез в профила си, за да гласуваш.'
    },
    success: {
      voteSaved: 'Гласът ти е записан успешно.'
    }
  },
  createPoll: {
    wizard: {
      title: 'Създай нова анкета',
      subtitle: 'Следвай стъпките, за да създадеш анкетата си',
      steps: {
        create: 'Създаване',
        preview: 'Преглед',
        publish: 'Публикуване',
        share: 'Споделяне'
      },
      stepDescription: {
        create: 'Конфигурирай анкетата',
        preview: 'Прегледай преди публикуване',
        publish: 'Запази или публикувай анкетата',
        share: 'Сподели с участниците'
      }
    },
    fields: {
      question: 'Въпрос',
      description: 'Описание (по избор)',
      pollType: 'Тип анкета',
      options: 'Опции за отговор',
      minValue: 'Минимална стойност',
      maxValue: 'Максимална стойност',
      visibility: 'Видимост',
      resultsVisibility: 'Видимост на резултатите',
      endDate: 'Краен срок (по избор)',
      theme: 'Тема'
    },
    placeholders: {
      question: 'Какво искаш да попиташ?',
      description: 'Добави контекст или инструкции за анкетата...',
      option: 'Опция {number}',
      minValue: 'напр. 0',
      maxValue: 'напр. 100'
    },
    pollTypes: {
      single_choice: {
        title: 'Единичен избор',
        description: 'Участниците могат да изберат само една опция'
      },
      multiple_choice: {
        title: 'Множествен избор',
        description: 'Участниците могат да изберат няколко опции'
      },
      rating: {
        title: 'Рейтинг',
        description: 'Скала с 5 звезди'
      },
      numeric: {
        title: 'Числов вход',
        description: 'Участниците въвеждат число'
      }
    },
    visibility: {
      public: 'Публична',
      private: 'Частна',
      publicDesc: 'Всеки с линка може да достъпи',
      privateDesc: 'Само споделени участници могат да достъпят'
    },
    resultsVisibility: {
      after_vote: 'След гласуване',
      always: 'Винаги',
      creator_only: 'Само автор',
      after_voteDesc: 'Гласувалите виждат резултатите веднага',
      alwaysDesc: 'Резултатите са видими за всички',
      creator_onlyDesc: 'Само ти можеш да видиш резултатите'
    },
    themes: {
      default: 'По подразбиране',
      blue: 'Синя',
      green: 'Зелена',
      purple: 'Лилава',
      orange: 'Оранжева'
    },
    actions: {
      addOption: '+ Добави опция',
      removeOption: 'Премахни',
      next: 'Напред',
      back: 'Назад',
      saveAsDraft: 'Запази като чернова',
      publish: 'Публикувай',
      copyLink: 'Копирай линк',
      viewPoll: 'Виж анкета',
      createAnother: 'Създай друга анкета',
      advancedSettings: 'Разширени настройки'
    },
    validation: {
      questionRequired: 'Въпросът е задължителен',
      minTwoOptions: 'Необходими са поне 2 опции',
      optionEmpty: 'Опцията не може да е празна',
      minLessThanMax: 'Минималната стойност трябва да е по-малка от максималната',
      maxRequired: 'Максималната стойност се препоръчва за числови анкети'
    },
    preview: {
      title: 'Преглед на анкетата',
      subtitle: 'Така ще изглежда анкетата за участниците',
      closesOn: 'Затваря на {date}',
      noEndDate: 'Без краен срок',
      questionFallback: 'Тук ще се покаже въпросът ти',
      rangeLabel: 'Диапазон:',
      noRangeLimits: 'Без ограничения за диапазон',
      to: 'до'
    },
    publish: {
      draftSaved: 'Анкетата е запазена като чернова',
      published: 'Анкетата е публикувана успешно!',
      error: 'Неуспешно запазване на анкета',
      readyTitle: 'Готово за публикуване?',
      readySubtitle: 'Анкетата е готова. Можеш да я запазиш като чернова или да я публикуваш сега.',
      summaryTitle: 'Обобщение на анкетата',
      summaryQuestion: 'Въпрос',
      summaryType: 'Тип',
      summaryVisibility: 'Видимост',
      summaryResults: 'Резултати',
      summaryHint: 'Използвай бутоните отдолу, за да запазиш като чернова или да публикуваш анкетата.'
    },
    ratingEditor: {
      info: 'Участниците ще оценяват от 1 до 5 звезди.',
      autoOptions: '5 опции ще бъдат създадени автоматично.'
    },
    numericEditor: {
      optionalMinHint: 'По избор: Остави празно, ако няма минимум',
      optionalMaxHint: 'По избор: Остави празно, ако няма максимум',
      rangeLabel: 'Диапазон:',
      info: 'Участниците ще въвеждат числова стойност.',
      constraintsInfo: 'Задай по избор минимум/максимум за валидация.',
      to: 'до'
    },
    advancedSettings: {
      endDateHint: 'Анкетата ще се затвори автоматично на тази дата и час'
    },
    share: {
      title: 'Сподели анкетата',
      subtitle: 'Копирай линка по-долу и го сподели с участниците',
      linkLabel: 'Линк към анкета',
      copySuccess: 'Линкът е копиран!',
      copyError: 'Неуспешно копиране на линк'
    }
  },
  pollDetail: {
    status: {
      open: 'Активна',
      draft: 'Чернова',
      closed: 'Затворена'
    },
    noAnswersYet: 'Все още няма подадени отговори.',
    avg: 'Средно',
    min: 'Минимум',
    max: 'Максимум',
    noOptions: 'Няма налични опции за тази анкета.',
    copyLink: 'Копирай линк',
    copied: 'Копирано ✓',
    editCancel: 'Откажи',
    editAction: 'Редактирай',
    backToMyPolls: '← Обратно към моите анкети',
    noDescription: 'Без описание',
    shareCode: 'Код за споделяне:',
    editTitle: 'Редакция',
    titleLabel: 'Заглавие',
    descriptionLabel: 'Описание',
    statusLabel: 'Статус',
    visibilityLabel: 'Видимост',
    visibility: {
      public: 'Публична',
      private: 'Частна'
    },
    saveChanges: 'Запази промените',
    editHint: 'Използвай "Редактирай", за да промениш заглавие, описание и статус.',
    resultsTitle: 'Резултати',
    votesSuffix: 'гласа',
    closePoll: 'Затвори анкетата',
    deletePoll: 'Изтрий',
    missingPollId: 'Липсва ID на анкета.',
    loadFailed: 'Неуспешно зареждане на анкетата.',
    titleRequired: 'Заглавието е задължително.',
    updated: 'Анкетата е обновена.',
    updateFailed: 'Неуспешно обновяване на анкетата.',
    closeFailed: 'Неуспешно затваряне на анкетата.',
    deleteConfirm: 'Сигурен ли си, че искаш да изтриеш тази анкета?',
    deleteFailed: 'Неуспешно изтриване на анкетата.',
    sidebar: {
      metricsTitle: 'Метрики',
      participants: 'Участници',
      status: 'Статус',
      modified: 'Модификация',
      lastActivity: 'Последна активност',
      created: 'Създадена',
      adminTitle: 'Администрация',
      shareCode: 'Код за споделяне',
      visibility: 'Видимост',
      kind: 'Тип',
      justNow: 'току-що',
      minutesAgo: 'мин. назад',
      hoursAgo: 'ч. назад',
      daysAgo: 'дни назад'
    },
    voters: {
      title: 'Гласували',
      noVoters: 'Все още няма гласували.',
      showMore: 'Покажи още',
      export: 'Експорт',
      csv: 'CSV',
      json: 'JSON',
      excel: 'Excel',
      exportNoData: 'Няма данни за експорт.',
      exportSuccess: 'Експортът е готов.',
      exportFailed: 'Неуспешен експорт.'
    }
  },
  pollsList: {
    title: 'Анкети',
    subtitle: 'Всички твои анкети на едно място',
    loading: 'Зареждане на анкети...',
    status: {
      open: 'Активна',
      closed: 'Затворена',
      draft: 'Чернова'
    },
    empty: {
      noPollsForFilter: 'Нямаш анкети за този филтър.'
    },
    stats: {
      votes: 'гласа',
      options: 'опции'
    },
    code: 'Код:',
    actions: {
      view: 'Виж',
      edit: 'Редакция',
      delete: 'Изтрий'
    },
    errors: {
      loadFailed: 'Грешка при зареждане на анкетите.',
      deleteFailed: 'Грешка при изтриване на анкетата.',
      deleteConfirm: 'Сигурен ли си, че искаш да изтриеш тази анкета?'
    }
  }
};
