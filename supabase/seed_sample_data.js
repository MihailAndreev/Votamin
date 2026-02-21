/**
 * ================================================================
 * Votamin – Seed Sample Data Script
 * ================================================================
 *
 * Purpose: Insert sample data into the Supabase database for testing.
 *
 * What this script inserts:
 *   - 3 main users:  mihail@abv.bg, ivan@abv.bg, pesho@abv.bg
 *   - 7 voter users:  voter1@example.com … voter7@example.com
 *     (needed to reach 10 unique votes per poll due to UNIQUE(poll_id, voter_user_id) constraint)
 *   - 6 polls (2 per main user) — all sport-related, status = 'open', visibility = 'public'
 *   - 4 options per poll (24 options total)
 *   - 10 votes per poll (60 votes total) — randomly distributed across options
 *
 * Shared password for ALL seed users:  Password123!
 *
 * Execution: via Supabase MCP `execute_sql` (admin privileges, bypasses RLS).
 * ================================================================
 */

// ────────────────────────────────────────────────────────────────
// 1. USER DEFINITIONS
// ────────────────────────────────────────────────────────────────

const USERS = [
  // Main registered users
  { id: 'a0000000-0000-0000-0000-000000000001', email: 'mihail@abv.bg',        name: 'Михаил Андреев' },
  { id: 'a0000000-0000-0000-0000-000000000002', email: 'ivan@abv.bg',          name: 'Иван Петров'    },
  { id: 'a0000000-0000-0000-0000-000000000003', email: 'pesho@abv.bg',         name: 'Пешо Георгиев'  },
  // Additional voters (to fullfil 10 votes per poll)
  { id: 'a0000000-0000-0000-0000-000000000004', email: 'voter1@example.com',   name: 'Стоян Колев'    },
  { id: 'a0000000-0000-0000-0000-000000000005', email: 'voter2@example.com',   name: 'Мария Иванова'  },
  { id: 'a0000000-0000-0000-0000-000000000006', email: 'voter3@example.com',   name: 'Георги Тодоров' },
  { id: 'a0000000-0000-0000-0000-000000000007', email: 'voter4@example.com',   name: 'Елена Димитрова'},
  { id: 'a0000000-0000-0000-0000-000000000008', email: 'voter5@example.com',   name: 'Николай Стоянов'},
  { id: 'a0000000-0000-0000-0000-000000000009', email: 'voter6@example.com',   name: 'Десислава Маркова'},
  { id: 'a0000000-0000-0000-0000-00000000000a', email: 'voter7@example.com',   name: 'Красимир Василев'},
];

// ────────────────────────────────────────────────────────────────
// 2. POLL DEFINITIONS (2 per main user, sport-related)
// ────────────────────────────────────────────────────────────────

const POLLS = [
  // ── Mihail's polls ──
  {
    id:       'b0000000-0000-0000-0000-000000000001',
    ownerId:  'a0000000-0000-0000-0000-000000000001', // mihail
    title:    'Кой е най-добрият футболен отбор в България?',
    descHtml: '<p>Гласувайте за любимия си български футболен клуб!</p>',
    options: [
      { id: 'c0000000-0000-0000-0001-000000000001', text: 'Лудогорец',          pos: 1 },
      { id: 'c0000000-0000-0000-0001-000000000002', text: 'ЦСКА София',         pos: 2 },
      { id: 'c0000000-0000-0000-0001-000000000003', text: 'Левски София',       pos: 3 },
      { id: 'c0000000-0000-0000-0001-000000000004', text: 'Ботев Пловдив',      pos: 4 },
    ],
    // Which option index (0-3) each of the 10 users votes for
    voteMap: [0, 1, 2, 0, 1, 2, 3, 0, 1, 2],
    //        mihail ivan pesho v1 v2 v3 v4 v5 v6 v7
    // Result: Лудогорец(3), ЦСКА(3), Левски(3), Ботев(1)
  },
  {
    id:       'b0000000-0000-0000-0000-000000000002',
    ownerId:  'a0000000-0000-0000-0000-000000000001', // mihail
    title:    'Кой спорт е най-подходящ за деца?',
    descHtml: '<p>Споделете мнението си кой спорт е идеален за подрастващите.</p>',
    options: [
      { id: 'c0000000-0000-0000-0002-000000000001', text: 'Футбол',    pos: 1 },
      { id: 'c0000000-0000-0000-0002-000000000002', text: 'Плуване',   pos: 2 },
      { id: 'c0000000-0000-0000-0002-000000000003', text: 'Тенис',     pos: 3 },
      { id: 'c0000000-0000-0000-0002-000000000004', text: 'Баскетбол', pos: 4 },
    ],
    voteMap: [0, 0, 1, 0, 1, 2, 3, 0, 1, 2],
    // Result: Футбол(4), Плуване(3), Тенис(2), Баскетбол(1)
  },

  // ── Ivan's polls ──
  {
    id:       'b0000000-0000-0000-0000-000000000003',
    ownerId:  'a0000000-0000-0000-0000-000000000002', // ivan
    title:    'Коя е най-вълнуващата олимпийска дисциплина?',
    descHtml: '<p>Изберете дисциплината, която ви кара да ставате от стола!</p>',
    options: [
      { id: 'c0000000-0000-0000-0003-000000000001', text: '100 м спринт',         pos: 1 },
      { id: 'c0000000-0000-0000-0003-000000000002', text: 'Маратон',              pos: 2 },
      { id: 'c0000000-0000-0000-0003-000000000003', text: 'Плуване 100 м свободен стил', pos: 3 },
      { id: 'c0000000-0000-0000-0003-000000000004', text: 'Спортна гимнастика',   pos: 4 },
    ],
    voteMap: [0, 0, 2, 0, 1, 3, 2, 0, 1, 3],
    // Result: 100м спринт(4), Маратон(2), Плуване(2), Гимнастика(2)
  },
  {
    id:       'b0000000-0000-0000-0000-000000000004',
    ownerId:  'a0000000-0000-0000-0000-000000000002', // ivan
    title:    'Предпочитан зимен спорт?',
    descHtml: '<p>Кой зимен спорт ви вълнува най-много?</p>',
    options: [
      { id: 'c0000000-0000-0000-0004-000000000001', text: 'Ски алпийски',  pos: 1 },
      { id: 'c0000000-0000-0000-0004-000000000002', text: 'Сноуборд',      pos: 2 },
      { id: 'c0000000-0000-0000-0004-000000000003', text: 'Кънки на лед',  pos: 3 },
      { id: 'c0000000-0000-0000-0004-000000000004', text: 'Биатлон',       pos: 4 },
    ],
    voteMap: [1, 0, 1, 0, 1, 3, 2, 1, 0, 3],
    // Result: Ски(3), Сноуборд(4), Кънки(1), Биатлон(2)
  },

  // ── Pesho's polls ──
  {
    id:       'b0000000-0000-0000-0000-000000000005',
    ownerId:  'a0000000-0000-0000-0000-000000000003', // pesho
    title:    'Най-добрият баскетболен играч в историята?',
    descHtml: '<p>Кой заслужава титлата GOAT в баскетбола?</p>',
    options: [
      { id: 'c0000000-0000-0000-0005-000000000001', text: 'Michael Jordan',  pos: 1 },
      { id: 'c0000000-0000-0000-0005-000000000002', text: 'LeBron James',    pos: 2 },
      { id: 'c0000000-0000-0000-0005-000000000003', text: 'Kobe Bryant',     pos: 3 },
      { id: 'c0000000-0000-0000-0005-000000000004', text: 'Magic Johnson',   pos: 4 },
    ],
    voteMap: [0, 0, 1, 0, 1, 0, 2, 0, 1, 3],
    // Result: Jordan(5), LeBron(3), Kobe(1), Magic(1)
  },
  {
    id:       'b0000000-0000-0000-0000-000000000006',
    ownerId:  'a0000000-0000-0000-0000-000000000003', // pesho
    title:    'Кой е най-добрият тенисист на всички времена?',
    descHtml: '<p>Изберете легендата, която доминира кортовете!</p>',
    options: [
      { id: 'c0000000-0000-0000-0006-000000000001', text: 'Roger Federer',     pos: 1 },
      { id: 'c0000000-0000-0000-0006-000000000002', text: 'Rafael Nadal',      pos: 2 },
      { id: 'c0000000-0000-0000-0006-000000000003', text: 'Novak Djokovic',    pos: 3 },
      { id: 'c0000000-0000-0000-0006-000000000004', text: 'Григор Димитров',   pos: 4 },
    ],
    voteMap: [2, 1, 3, 0, 1, 2, 3, 0, 2, 1],
    // Result: Federer(2), Nadal(3), Djokovic(3), Димитров(2)
  },
];

// ────────────────────────────────────────────────────────────────
// 3. SQL GENERATION
// ────────────────────────────────────────────────────────────────

function generateSQL() {
  const lines = [];

  lines.push(`-- ================================================================`);
  lines.push(`-- Votamin – Seed Sample Data`);
  lines.push(`-- Generated: ${new Date().toISOString()}`);
  lines.push(`-- Password for ALL users: Password123!`);
  lines.push(`-- ================================================================`);
  lines.push(``);

  // ── 3a. Create auth.users ──
  lines.push(`-- Step 1: Create auth.users (10 users)`);
  lines.push(`DO $$`);
  lines.push(`DECLARE`);
  lines.push(`  hashed_pw TEXT;`);
  lines.push(`BEGIN`);
  lines.push(`  hashed_pw := crypt('Password123!', gen_salt('bf'));`);
  lines.push(``);
  lines.push(`  INSERT INTO auth.users (`);
  lines.push(`    instance_id, id, aud, role, email, encrypted_password,`);
  lines.push(`    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,`);
  lines.push(`    created_at, updated_at, confirmation_token, recovery_token,`);
  lines.push(`    is_sso_user, is_anonymous`);
  lines.push(`  ) VALUES`);

  const userRows = USERS.map((u, i) => {
    const comma = i < USERS.length - 1 ? ',' : ';';
    return [
      `    (`,
      `      '00000000-0000-0000-0000-000000000000',`,
      `      '${u.id}',`,
      `      'authenticated', 'authenticated',`,
      `      '${u.email}',`,
      `      hashed_pw,`,
      `      now(),`,
      `      '{"provider":"email","providers":["email"]}',`,
      `      '{"full_name":"${u.name}"}',`,
      `      now(), now(), '', '',`,
      `      false, false`,
      `    )${comma}`,
    ].join('\n');
  });
  lines.push(userRows.join('\n'));

  lines.push(`END $$;`);
  lines.push(``);

  // ── 3b. Create auth.identities (required for Supabase Auth login) ──
  lines.push(`-- Step 2: Create auth.identities (so users can log in)`);
  lines.push(`INSERT INTO auth.identities (`);
  lines.push(`  id, user_id, provider_id, provider, identity_data, email,`);
  lines.push(`  last_sign_in_at, created_at, updated_at`);
  lines.push(`) VALUES`);

  const identityRows = USERS.map((u, i) => {
    const comma = i < USERS.length - 1 ? ',' : ';';
    return [
      `  (`,
      `    gen_random_uuid(),`,
      `    '${u.id}',`,
      `    '${u.id}',`,
      `    'email',`,
      `    jsonb_build_object('sub', '${u.id}', 'email', '${u.email}', 'email_verified', true, 'phone_verified', false),`,
      `    '${u.email}',`,
      `    now(), now(), now()`,
      `  )${comma}`,
    ].join('\n');
  });
  lines.push(identityRows.join('\n'));
  lines.push(``);

  // ── 3c. Update profiles (trigger auto-creates them, we update full_name) ──
  lines.push(`-- Step 3: Update profiles with full names`);
  lines.push(`-- (profiles are auto-created by the signup trigger)`);
  USERS.forEach(u => {
    lines.push(`UPDATE profiles SET full_name = '${u.name}', updated_at = now() WHERE user_id = '${u.id}';`);
  });
  lines.push(``);

  // ── 3d. Insert user_roles ──
  lines.push(`-- Step 4: Assign 'user' role to all users`);
  lines.push(`INSERT INTO user_roles (user_id, role) VALUES`);
  const roleRows = USERS.map((u, i) => {
    const comma = i < USERS.length - 1 ? ',' : ';';
    return `  ('${u.id}', 'user')${comma}`;
  });
  lines.push(roleRows.join('\n'));
  lines.push(``);

  // ── 3e. Insert polls ──
  lines.push(`-- Step 5: Create 6 polls (2 per main user)`);
  lines.push(`INSERT INTO polls (`);
  lines.push(`  id, owner_id, title, description_html, visibility, status,`);
  lines.push(`  allow_multiple_choices, response_count, created_at, updated_at`);
  lines.push(`) VALUES`);

  const pollRows = POLLS.map((p, i) => {
    const comma = i < POLLS.length - 1 ? ',' : ';';
    const escapedTitle = p.title.replace(/'/g, "''");
    const escapedDesc = p.descHtml.replace(/'/g, "''");
    // Stagger creation dates so they appear in different order
    const daysAgo = 14 - i * 2; // 14, 12, 10, 8, 6, 4 days ago
    return [
      `  (`,
      `    '${p.id}',`,
      `    '${p.ownerId}',`,
      `    '${escapedTitle}',`,
      `    '${escapedDesc}',`,
      `    'public', 'open',`,
      `    false,`,
      `    10,`,
      `    now() - interval '${daysAgo} days',`,
      `    now() - interval '${daysAgo} days'`,
      `  )${comma}`,
    ].join('\n');
  });
  lines.push(pollRows.join('\n'));
  lines.push(``);

  // ── 3f. Insert poll_options ──
  lines.push(`-- Step 6: Create poll options (4 per poll = 24 total)`);
  lines.push(`INSERT INTO poll_options (id, poll_id, text, position) VALUES`);

  const allOptions = [];
  POLLS.forEach(p => {
    p.options.forEach(opt => {
      allOptions.push({ pollId: p.id, ...opt });
    });
  });

  const optionRows = allOptions.map((o, i) => {
    const comma = i < allOptions.length - 1 ? ',' : ';';
    const escapedText = o.text.replace(/'/g, "''");
    return `  ('${o.id}', '${o.pollId}', '${escapedText}', ${o.pos})${comma}`;
  });
  lines.push(optionRows.join('\n'));
  lines.push(``);

  // ── 3g. Insert votes ──
  lines.push(`-- Step 7: Insert votes (10 per poll = 60 total)`);
  lines.push(`INSERT INTO votes (id, poll_id, option_id, voter_user_id, created_at) VALUES`);

  const allVotes = [];
  let voteCounter = 1;

  POLLS.forEach((p, pollIdx) => {
    p.voteMap.forEach((optIdx, userIdx) => {
      const voterId = USERS[userIdx].id;
      const optionId = p.options[optIdx].id;
      // Stagger vote timestamps within the poll's lifetime
      const hoursAgo = (POLLS.length - pollIdx) * 48 - userIdx * 3;
      const voteIdHex = voteCounter.toString(16).padStart(3, '0');

      allVotes.push({
        id: `d0000000-0000-0000-0000-0000000000${voteIdHex}`,
        pollId: p.id,
        optionId: optionId,
        voterId: voterId,
        hoursAgo: hoursAgo,
      });
      voteCounter++;
    });
  });

  const voteRows = allVotes.map((v, i) => {
    const comma = i < allVotes.length - 1 ? ',' : ';';
    return `  ('${v.id}', '${v.pollId}', '${v.optionId}', '${v.voterId}', now() - interval '${v.hoursAgo} hours')${comma}`;
  });
  lines.push(voteRows.join('\n'));
  lines.push(``);

  // ── 3h. Create share codes for each poll ──
  lines.push(`-- Step 8: Create share codes for polls`);
  lines.push(`INSERT INTO poll_shares (id, poll_id, share_code, created_by, created_at) VALUES`);

  const shareCodes = ['SPrt01', 'SPrt02', 'SPrt03', 'SPrt04', 'SPrt05', 'SPrt06'];
  const shareRows = POLLS.map((p, i) => {
    const comma = i < POLLS.length - 1 ? ',' : ';';
    return `  (gen_random_uuid(), '${p.id}', '${shareCodes[i]}', '${p.ownerId}', now())${comma}`;
  });
  lines.push(shareRows.join('\n'));

  return lines.join('\n');
}

// ────────────────────────────────────────────────────────────────
// 4. SUMMARY
// ────────────────────────────────────────────────────────────────

function printSummary() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          Votamin – Seed Data Summary                    ║');
  console.log('╠══════════════════════════════════════════════════════════╣');
  console.log('║  Users:                                                 ║');
  USERS.slice(0, 3).forEach(u => {
    console.log(`║   👤 ${u.email.padEnd(25)} ${u.name.padEnd(20)}  ║`);
  });
  console.log(`║   + 7 voter accounts (voter1-7@example.com)             ║`);
  console.log('║                                                         ║');
  console.log('║  Polls:                                                 ║');
  POLLS.forEach(p => {
    const owner = USERS.find(u => u.id === p.ownerId).email;
    const optTexts = p.options.map(o => o.text);
    console.log(`║   📊 ${p.title.substring(0, 50).padEnd(50)} ║`);
    console.log(`║      Owner: ${owner.padEnd(43)} ║`);
    console.log(`║      Options: ${optTexts.join(', ').substring(0, 41).padEnd(41)} ║`);
    console.log(`║      Votes: 10                                        ║`);
  });
  console.log('║                                                         ║');
  console.log('║  Password (all users): Password123!                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
}

// ────────────────────────────────────────────────────────────────
// 5. OUTPUT
// ────────────────────────────────────────────────────────────────

printSummary();
console.log('\n--- Generated SQL ---\n');
console.log(generateSQL());

// Export for programmatic use
export { USERS, POLLS, generateSQL };
