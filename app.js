const STORAGE_KEY = 'friends_learning_progress_v2';
const WORDBOOK_KEY = 'friends_wordbook_v1';
const EXPRESSION_RECORDS_KEY = 'friends_expression_records_v1';
const PRACTICE_PROGRESS_KEY = 'friends_practice_progress_v1';
const NOTES_KEY = 'friends_notes_v1';
const ASK_HISTORY_KEY = 'friends_ask_history_v1';
const REVIEW_INTERVALS = [1, 3, 7, 14];
const DEFAULT_EPISODE = 'S01E01';
const DEFAULT_WORD_COUNT = 5;
const DEFAULT_EXPRESSION_COUNT = 5;

let state = {
  page: 'home',
  currentEpisode: null,
  learnTab: 'words', // words, expressions
  wordPage: 0,
  expressionPage: 0,
  practiceMode: null, // 'word' | 'expression'
  wordPracticeType: 'choice', // choice | spelling
  expressionPracticeType: 'translate', // translate | write
  practiceSession: null,
  wordReviewSession: null,
  wordCardSession: null,
  progress: {},
  wordBook: [],
  expressionRecords: [],
  practiceProgress: loadData(PRACTICE_PROGRESS_KEY, {}),
  notes: loadData(NOTES_KEY, []),
  askHistory: loadData(ASK_HISTORY_KEY, []),
  notePanelOpen: false,
  noteTab: 'notes'
};

const ICONS = {
  play: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>',
  refresh: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
  tv: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>',
  book: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
  pencil: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>',
  doc: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>',
  abc: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path><path d="M9 7h6"></path><path d="M9 11h6"></path><path d="M12 7v8"></path></svg>',
  party: '<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path><path d="M6 9l3-3 3 3"></path><path d="M9 6v13"></path><path d="M3 21l6-6"></path><path d="M15 21l6-6"></path></svg>',
  star: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  starFilled: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
  close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
};

// --- Data access ---
function getAllItems() {
  const items = [];
  for (const [ep, data] of Object.entries(EPISODE_CONTENT)) {
    for (const item of data.words) items.push({ ...item, episode: ep });
    for (const item of data.expressions) items.push({ ...item, episode: ep });
  }
  return items;
}

function getEpisodeItems(ep, type = null) {
  const data = EPISODE_CONTENT[ep];
  if (!data) return [];
  let items = [];
  if (!type || type === 'word') items.push(...data.words.map(i => ({ ...i, episode: ep })));
  if (!type || type === 'expression') items.push(...data.expressions.map(i => ({ ...i, episode: ep })));
  return items;
}

function getTranscriptLines(ep) {
  const data = EPISODE_TRANSCRIPTS[ep];
  if (!data) return [];
  return data.lines || [];
}

function getIconicLines(ep) {
  const data = EPISODE_TRANSCRIPTS[ep];
  if (!data) return [];
  return data.iconic || [];
}

function getDefaultItems(ep) {
  const data = EPISODE_CONTENT[ep];
  return [
    ...data.words.slice(0, DEFAULT_WORD_COUNT).map(i => ({ ...i, episode: ep })),
    ...data.expressions.slice(0, DEFAULT_EXPRESSION_COUNT).map(i => ({ ...i, episode: ep }))
  ];
}

function getItemById(id) {
  return getAllItems().find(i => i.id === id);
}

// --- Storage ---
function loadData(key, def = {}) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return def;
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function getPracticeProgress(ep, key) {
  return (state.practiceProgress[ep] && state.practiceProgress[ep][key]) || 0;
}

function savePracticeProgress(ep, key, idx) {
  if (!state.practiceProgress[ep]) state.practiceProgress[ep] = {};
  state.practiceProgress[ep][key] = idx;
  saveData(PRACTICE_PROGRESS_KEY, state.practiceProgress);
}

function clearPracticeProgress(ep, key) {
  if (state.practiceProgress[ep]) {
    delete state.practiceProgress[ep][key];
    saveData(PRACTICE_PROGRESS_KEY, state.practiceProgress);
  }
}

function loadState() {
  state.progress = loadData(STORAGE_KEY, {});
  state.wordBook = loadData(WORDBOOK_KEY, []);
  state.expressionRecords = loadData(EXPRESSION_RECORDS_KEY, []);
}

function saveProgress() { saveData(STORAGE_KEY, state.progress); }
function saveWordBook() { saveData(WORDBOOK_KEY, state.wordBook); }
function saveExpressionRecords() { saveData(EXPRESSION_RECORDS_KEY, state.expressionRecords); }

function getItemProgress(itemId) {
  return state.progress[itemId] || {
    learned: false, level: 0, nextReview: null, lastReviewed: null, correctCount: 0, wrongCount: 0
  };
}

function markLearned(itemId) {
  const p = getItemProgress(itemId);
  p.learned = true;
  if (!p.learnedAt) p.learnedAt = new Date().toISOString();
  if (!p.nextReview) p.nextReview = tomorrow().toISOString();
  p.lastReviewed = new Date().toISOString();
  state.progress[itemId] = p;
  saveProgress();
}

function unmarkLearned(itemId) {
  const p = getItemProgress(itemId);
  p.learned = false;
  p.learnedAt = null;
  p.nextReview = null;
  p.level = 0;
  state.progress[itemId] = p;
  saveProgress();
  render();
}

function recordReview(itemId, known) {
  const p = getItemProgress(itemId);
  p.learned = true;
  p.lastReviewed = new Date().toISOString();
  if (known) {
    p.level = Math.min(p.level + 1, REVIEW_INTERVALS.length);
    p.correctCount = (p.correctCount || 0) + 1;
    const days = REVIEW_INTERVALS[Math.min(p.level - 1, REVIEW_INTERVALS.length - 1)];
    p.nextReview = addDays(days).toISOString();
  } else {
    p.level = 0;
    p.wrongCount = (p.wrongCount || 0) + 1;
    p.nextReview = tomorrow().toISOString();
  }
  state.progress[itemId] = p;
  saveProgress();
}

// result: 'known' | 'fuzzy' | 'forgotten'
function recordWordReview(itemId, result) {
  const p = getItemProgress(itemId);
  p.learned = true;
  p.lastReviewed = new Date().toISOString();
  if (result === 'known') {
    p.level = Math.min(p.level + 1, REVIEW_INTERVALS.length);
    p.correctCount = (p.correctCount || 0) + 1;
    const days = REVIEW_INTERVALS[Math.min(p.level - 1, REVIEW_INTERVALS.length - 1)];
    p.nextReview = addDays(days).toISOString();
  } else if (result === 'fuzzy') {
    // Keep level, review again tomorrow
    p.nextReview = tomorrow().toISOString();
  } else {
    // forgotten
    p.level = 0;
    p.wrongCount = (p.wrongCount || 0) + 1;
    p.nextReview = tomorrow().toISOString();
  }
  state.progress[itemId] = p;
  saveProgress();
}

function tomorrow() { return addDays(1); }
function addDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(8, 0, 0, 0);
  return d;
}

function isDue(nextReview) {
  if (!nextReview) return false;
  return new Date(nextReview) <= new Date();
}

function getDueItems() {
  return getAllItems().filter(item => isDue(getItemProgress(item.id).nextReview));
}

function getDueWords() {
  return getAllItems().filter(item => item.type === 'word' && isDue(getItemProgress(item.id).nextReview));
}

function getDueExpressions() {
  return getAllItems().filter(item => item.type === 'expression' && isDue(getItemProgress(item.id).nextReview));
}

function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

function getTodayLearnedItems() {
  const today = new Date();
  return getAllItems().filter(item => {
    const p = getItemProgress(item.id);
    if (!p.learned) return false;
    const learnedAt = p.learnedAt ? new Date(p.learnedAt) : (p.lastReviewed ? new Date(p.lastReviewed) : null);
    return learnedAt && isSameDay(learnedAt, today);
  });
}

function getEpisodeProgress(ep) {
  const items = getEpisodeItems(ep);
  const learned = items.filter(i => getItemProgress(i.id).learned).length;
  return { total: items.length, learned, percent: Math.round((learned / items.length) * 100) };
}

function getLearnedStats() {
  const all = getAllItems();
  const words = all.filter(i => i.type === 'word' && getItemProgress(i.id).learned);
  const expressions = all.filter(i => i.type === 'expression' && getItemProgress(i.id).learned);
  const today = getTodayLearnedItems();
  return {
    wordCount: words.length,
    expressionCount: expressions.length,
    todayWordCount: today.filter(i => i.type === 'word').length,
    todayExpressionCount: today.filter(i => i.type === 'expression').length
  };
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getLearnedDates() {
  const dates = new Set();
  for (const item of getAllItems()) {
    const p = state.progress[item.id];
    if (p && p.learned && p.learnedAt) {
      dates.add(formatDateKey(new Date(p.learnedAt)));
    }
  }
  return dates;
}

function getCurrentStreak() {
  const dates = getLearnedDates();
  const today = new Date();
  const todayKey = formatDateKey(today);
  let streak = 0;
  let offset = dates.has(todayKey) ? 0 : 1;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - (offset + i));
    if (dates.has(formatDateKey(d))) streak++;
    else break;
  }
  return streak;
}

function renderCalendar() {
  const learnedDates = getLearnedDates();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthNames = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];
  const weekdays = ['日','一','二','三','四','五','六'];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  const todayKey = formatDateKey(now);

  let grid = '';
  for (const wd of weekdays) {
    grid += `<div class="calendar-weekday">${wd}</div>`;
  }
  for (let i = 0; i < startWeekday; i++) {
    grid += `<div class="calendar-day empty"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const key = formatDateKey(date);
    const checked = learnedDates.has(key);
    const isToday = key === todayKey;
    const classes = ['calendar-day'];
    if (checked) classes.push('checked');
    if (isToday) classes.push('today');
    grid += `<div class="${classes.join(' ')}"><span>${d}</span>${checked ? '<div class="check-dot"></div>' : ''}</div>`;
  }

  const streak = getCurrentStreak();
  return `
    <div class="calendar-card">
      <div class="calendar-header">
        <div class="calendar-title">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${year}年${monthNames[month]}</span>
        </div>
        <span class="calendar-streak">${streak > 0 ? '连续 ' + streak + ' 天' : '今日打卡'}</span>
      </div>
      <div class="calendar-grid">${grid}</div>
      <div class="calendar-footer">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>
        <span>Central Perk 学习角 · 每天进步一点点</span>
      </div>
    </div>
  `;
}

function getContinueEpisode() {
  const eps = Object.keys(EPISODE_CONTENT).sort();
  for (const ep of eps) {
    const p = getEpisodeProgress(ep);
    if (p.percent < 100) return ep;
  }
  return eps[0];
}

// --- Word Book ---
function isInWordBook(itemId) {
  return state.wordBook.some(w => w.id === itemId);
}

function addToWordBook(itemId) {
  if (isInWordBook(itemId)) return;
  const item = getItemById(itemId);
  if (!item) return;
  state.wordBook.unshift({ id: itemId, text: item.text, meaning: item.meaning, addedAt: new Date().toISOString() });
  saveWordBook();
  render();
}

function removeFromWordBook(itemId) {
  state.wordBook = state.wordBook.filter(w => w.id !== itemId);
  saveWordBook();
  render();
}

function getWordBookItems() {
  return state.wordBook.map(w => getItemById(w.id)).filter(Boolean);
}

// --- Expression Records ---
function saveExpressionRecord(itemId, sentence, feedback) {
  state.expressionRecords.unshift({
    id: itemId,
    sentence,
    feedback,
    createdAt: new Date().toISOString()
  });
  saveExpressionRecords();
}

function getExpressionRecords(itemId = null) {
  if (itemId) return state.expressionRecords.filter(r => r.id === itemId);
  return state.expressionRecords;
}

function correctExpression(item, sentence) {
  const s = sentence.trim();
  if (!s) {
    return { ok: false, score: 0, message: '请先写一句话。' };
  }
  const lower = s.toLowerCase();
  const expr = item.text.toLowerCase();
  const exprParts = expr.split(/\s+/);
  const usedExpression = exprParts.every(part => lower.includes(part));

  let score = 0;
  const issues = [];

  if (usedExpression) {
    score += 60;
  } else {
    issues.push(`句子中没有出现目标表达「${item.text}」，请尝试把它用进去。`);
  }

  if (/[.!?]$/.test(s)) {
    score += 10;
  } else {
    issues.push('句子结尾建议加上标点符号（. / ! / ?）。');
  }

  if (s.length > expr.length + 5) {
    score += 10;
  } else {
    issues.push('句子可以再完整一点，让表达更清晰。');
  }

  // Check capital letter
  if (/^[A-Z]/.test(s)) {
    score += 10;
  } else {
    issues.push('句子开头建议大写。');
  }

  // Encourage if example-like structure
  if (usedExpression && score >= 70) {
    return {
      ok: true,
      score,
      message: '很好，你正确使用了这个表达！句子结构也不错。',
      issues: issues.length ? issues : [],
      suggestion: `参考例句：${item.example}`
    };
  }

  return {
    ok: false,
    score,
    message: usedExpression ? '表达用对了，但句子还有小地方可以完善。' : '还没有正确使用这个表达哦。',
    issues,
    suggestion: `参考例句：${item.example}`
  };
}

// --- Navigation ---
function navigate(page, params = {}) {
  state.page = page;
  if (params.episode) state.currentEpisode = params.episode;
  updateNav();
  render();
  window.scrollTo(0, 0);
}

function updateNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === state.page);
  });
  document.getElementById('app').classList.toggle('immersive', state.page === 'wordReview' || state.page === 'wordCard');
  const titles = {
    home: '老友记学习台',
    episodes: '选择剧集',
    learn: '本集学习',
    practice: '练习',
    review: '今日复习',
    transcript: '台词搜索',
    wordbook: '单词本',
    expressionRecords: '表达记录',
    wordReview: '单词复习',
    wordCard: '单词卡练习'
  };
  document.getElementById('page-title').textContent = titles[state.page] || '学习台';
  document.getElementById('page-subtitle').textContent = getSubtitle();
}

function getSubtitle() {
  switch (state.page) {
    case 'home': return '每天5分钟，跟着情景喜剧学英语';
    case 'episodes': return '第一季 · 10集';
    case 'learn': return state.currentEpisode ? EPISODE_CONTENT[state.currentEpisode].zh_title : '';
    case 'practice': return '单词与表达分开练习';
    case 'review': return '根据记忆曲线安排复习';
    case 'wordReview': return '一次一个，像不背单词那样过单词';
    case 'wordCard': return '看英文，选择认识 / 模糊 / 忘记';
    case 'wordbook': return `${state.wordBook.length} 个收藏单词`;
    case 'expressionRecords': return '你写过的表达句子';
    default: return '';
  }
}

// --- Renderers ---
function render() {
  const main = document.getElementById('main-content');
  main.innerHTML = '';
  switch (state.page) {
    case 'home': renderHome(main); break;
    case 'episodes': renderEpisodes(main); break;
    case 'learn': renderLearn(main); break;
    case 'practice': renderPractice(main); break;
    case 'review': renderReview(main); break;
    case 'wordReview': renderWordReview(main); break;
    case 'wordCard': renderWordCard(main); break;
    case 'transcript': renderTranscript(main); break;
    case 'wordbook': renderWordBook(main); break;
    case 'expressionRecords': renderExpressionRecords(main); break;
  }
}

function renderHome(container) {
  const dueCount = getDueItems().length;
  const dueWords = getDueWords().length;
  const dueExpressions = getDueExpressions().length;
  const contEp = getContinueEpisode();
  const contProgress = getEpisodeProgress(contEp);
  const stats = getLearnedStats();

  container.innerHTML = `
    <div class="welcome-card">
      <h2>Hey there!</h2>
      <p>刚看完一集老友记？来这里花5分钟记住最实用的表达，让台词真正变成你的口语。</p>
    </div>
    ${renderCalendar()}
    <h3 class="section-title">今日状态</h3>
    <div class="stats-grid">
      <div class="stat-card word">
        <span class="stat-number">${stats.wordCount}</span>
        <span class="stat-label">已学单词</span>
        <span class="stat-today">今日 +${stats.todayWordCount}</span>
      </div>
      <div class="stat-card expression">
        <span class="stat-number">${stats.expressionCount}</span>
        <span class="stat-label">已学表达</span>
        <span class="stat-today">今日 +${stats.todayExpressionCount}</span>
      </div>
    </div>
    <div class="status-summary">
      <span>待复习 <strong>${dueCount}</strong></span>
      <span class="dot">·</span>
      <span>单词复习 <strong>${dueWords}</strong></span>
      <span class="dot">·</span>
      <span>表达复习 <strong>${dueExpressions}</strong></span>
    </div>
    <div class="action-grid home-actions">
      <button class="action-card" onclick="navigate('learn', {episode:'${contEp}'})">
        <div class="action-icon yellow">${ICONS.play}</div>
        <div class="action-text">
          <h3>继续学习</h3>
          <p>${EPISODE_CONTENT[contEp].zh_title}</p>
        </div>
      </button>
      <button class="action-card" onclick="navigate('review')">
        <div class="action-icon coral">${ICONS.refresh}</div>
        <div class="action-text">
          <h3>复习</h3>
          <p>${dueCount} 个待复习</p>
        </div>
      </button>
      <button class="action-card" onclick="navigate('episodes')">
        <div class="action-icon teal">${ICONS.tv}</div>
        <div class="action-text">
          <h3>剧集</h3>
          <p>按集学习</p>
        </div>
      </button>
    </div>
  `;
}

function renderEpisodes(container) {
  const eps = Object.keys(EPISODE_CONTENT).sort();
  let html = `
    <button class="back-btn" onclick="navigate('home')">← 返回首页</button>
    <div class="season-tabs">
      <button class="season-tab active">第一季</button>
      <button class="season-tab" disabled style="opacity:0.5">第二季（即将上线）</button>
    </div>
    <div class="episode-grid">
  `;
  for (const ep of eps) {
    const data = EPISODE_CONTENT[ep];
    const p = getEpisodeProgress(ep);
    html += `
      <button class="episode-card" onclick="navigate('learn', {episode:'${ep}'})">
        <div class="episode-number">${ep}</div>
        <div class="episode-title">${data.zh_title}</div>
        <div class="episode-progress">
          <div class="episode-progress-bar" style="width:${p.percent}%"></div>
        </div>
        <div class="episode-progress-text">${p.learned}/${p.total} 已学</div>
      </button>
    `;
  }
  html += '</div>';
  container.innerHTML = html;
}

function renderLearn(container) {
  const ep = state.currentEpisode;
  if (!ep || !EPISODE_CONTENT[ep]) {
    navigate('episodes');
    return;
  }
  const data = EPISODE_CONTENT[ep];
  const allWords = data.words;
  const allExpressions = data.expressions;

  let html = `
    <button class="back-btn" onclick="navigate('episodes')">← 返回剧集</button>
    <div class="episode-header">
      <h2>${data.title}</h2>
      <p>${data.zh_title} · ${allWords.length} 个单词 · ${allExpressions.length} 个短语</p>
    </div>
    <div class="tab-bar">
      <button class="tab-btn ${state.learnTab === 'words' ? 'active' : ''}" onclick="setLearnTab('words')">单词 ${allWords.length}</button>
      <button class="tab-btn ${state.learnTab === 'expressions' ? 'active' : ''}" onclick="setLearnTab('expressions')">短语 ${allExpressions.length}</button>
      <button class="tab-btn" onclick="navigate('transcript', {episode:'${ep}'})">台词</button>
    </div>
  `;

  if (state.learnTab === 'words') {
    html += renderPaginatedList(allWords, ep, 'word', 10, state.wordPage, 'wordPage');
  } else {
    html += renderPaginatedList(allExpressions, ep, 'expression', 10, state.expressionPage, 'expressionPage');
  }

  container.innerHTML = html;
}

function renderIconicLines(ep) {
  const iconic = getIconicLines(ep);
  if (!iconic.length) return '';
  return `
    <div class="section-label">经典模仿 · ${iconic.length}</div>
    <div class="iconic-card">
      <p class="iconic-hint">点一下卡片，对照中文一起模仿这句经典台词</p>
      ${iconic.map((line, idx) => `
        <div class="iconic-line" onclick="this.classList.toggle('revealed')">
          <p class="iconic-en">${escapeHtml(line.en)}</p>
          <p class="iconic-speaker">${escapeHtml(line.speaker || '')}</p>
          <p class="iconic-zh hidden">${escapeHtml(line.zh)}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderPaginatedList(items, ep, type, perPage, page, stateKey) {
  const totalPages = Math.ceil(items.length / perPage);
  const start = page * perPage;
  const pageItems = items.slice(start, start + perPage);

  let html = `<div class="section-label">${type === 'word' ? '全部单词' : '全部表达'} · ${items.length}</div>`;
  for (const item of pageItems) {
    html += renderItemCard({ ...item, episode: ep });
  }

  if (totalPages > 1) {
    html += `<div class="pagination">`;
    html += `<button class="page-btn" ${page === 0 ? 'disabled' : ''} onclick="setPage('${stateKey}', ${page - 1})">上一页</button>`;
    html += `<span class="page-info">${page + 1} / ${totalPages}</span>`;
    html += `<button class="page-btn" ${page >= totalPages - 1 ? 'disabled' : ''} onclick="setPage('${stateKey}', ${page + 1})">下一页</button>`;
    html += `</div>`;
  }

  const practiceAction = type === 'word'
    ? `startEpisodeWordCards('${ep}')`
    : `startEpisodeExpressionPractice('${ep}')`;
  html += `<button class="btn-primary" onclick="${practiceAction}">练这些${type === 'word' ? '单词' : '短语'}</button>`;
  return html;
}

function renderItemCard(item) {
  const learned = getItemProgress(item.id).learned;
  const inBook = isInWordBook(item.id);
  const detailId = `detail-${item.id}`;
  const records = item.type === 'expression' ? getExpressionRecords(item.id) : [];
  const phoneticHtml = item.phonetic ? `<span class="item-phonetic">${escapeHtml(item.phonetic)}</span>` : '';
  return `
    <div class="item-card ${learned ? 'learned' : ''}" id="card-${item.id}">
      <div class="item-header">
        <p class="item-text">${escapeHtml(item.text)} ${phoneticHtml}</p>
        <span class="item-type">${item.type === 'word' ? '单词' : '短语'}</span>
      </div>
      <p class="item-meaning">${escapeHtml(item.meaning)}</p>
      <div class="item-actions">
        <button class="toggle-btn" onclick="toggleDetail('${item.id}')">查看例句</button>
        ${item.type === 'word' ? `
          <button class="icon-btn ${inBook ? 'active' : ''}" onclick="toggleWordBook('${item.id}')" title="加入单词本">
            ${inBook ? ICONS.starFilled : ICONS.star}
          </button>
        ` : `
          <button class="icon-btn" onclick="openExpressionWrite('${item.id}')" title="用该表达写句子">
            ${ICONS.pencil}
          </button>
        `}
      </div>
      <div class="item-detail hidden" id="${detailId}">
        <div class="detail-row">
          <p class="detail-label">例句</p>
          <div class="example-list">
            <p class="example-item">
              <span class="example-num">1.</span>
              <span class="example-en">${escapeHtml(item.original)}</span>
              <span class="example-zh">${escapeHtml(item.originalZh || '')}</span>
            </p>
            <p class="example-item">
              <span class="example-num">2.</span>
              <span class="example-en">${escapeHtml(item.example)}</span>
              <span class="example-zh">${escapeHtml(item.exampleZh || '')}</span>
            </p>
          </div>
        </div>
        <div class="detail-row">
          <p class="detail-label">使用场景</p>
          <p class="detail-text zh">${escapeHtml(item.scene)}</p>
        </div>
        ${item.type === 'expression' && records.length ? `
          <div class="detail-row">
            <p class="detail-label">我的造句记录</p>
            ${records.slice(0, 2).map(r => `
              <div class="record-line">
                <p>${escapeHtml(r.sentence)}</p>
                <span class="record-score ${r.feedback.ok ? 'good' : 'warn'}">${r.feedback.ok ? '通过' : '待改进'}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${!learned ? `<button class="btn-primary" onclick="markItemLearned('${item.id}')" style="margin-top:12px">标记已学</button>` : `<button class="btn-secondary" onclick="unmarkItemLearned('${item.id}')" style="margin-top:12px">取消已学标记</button>`}
      </div>
    </div>
  `;
}

function unmarkItemLearned(id) {
  unmarkLearned(id);
}

function renderTranscript(container) {
  const ep = state.currentEpisode;
  if (!ep) { navigate('episodes'); return; }
  const lines = getTranscriptLines(ep).filter(l => !l.iconic);
  const iconic = getIconicLines(ep).map(l => ({ ...l, iconic: true }));
  const allLines = [...iconic, ...lines];
  const query = (state.transcriptQuery || '').trim().toLowerCase();

  let filtered = allLines;
  if (query) {
    filtered = allLines.filter(l =>
      l.en.toLowerCase().includes(query) ||
      l.zh.toLowerCase().includes(query)
    );
  }

  let html = `
    <button class="back-btn" onclick="navigate('learn', {episode:'${ep}'})">← 返回学习</button>
    <div class="transcript-search">
      <input type="text" placeholder="搜索台词或中文翻译..." value="${escapeHtml(query)}" oninput="searchTranscript(this.value)">
      <button onclick="searchTranscript(document.querySelector('.transcript-search input').value)">搜索</button>
    </div>
    <div class="transcript-list">
  `;

  if (filtered.length === 0) {
    html += `<div class="empty-state">没找到匹配台词</div>`;
  } else {
    for (const line of filtered.slice(0, 80)) {
      const en = highlightText(line.en, query);
      const zh = highlightText(line.zh, query);
      const isIconic = line.iconic ? 'iconic' : '';
      html += `
        <div class="transcript-line ${isIconic}">
          <p class="transcript-en">${en}${line.iconic ? ' <span class="iconic-tag">经典</span>' : ''}</p>
          ${zh ? `<p class="transcript-zh">${zh}</p>` : ''}
        </div>
      `;
    }
    if (filtered.length > 80) {
      html += `<div class="empty-state">还有 ${filtered.length - 80} 条结果</div>`;
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

function highlightText(text, query) {
  if (!query || !text) return escapeHtml(text);
  const escaped = escapeHtml(text);
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return escaped.replace(regex, '<span class="highlight">$1</span>');
}

// --- Word Book ---
function renderWordBook(container) {
  const items = getWordBookItems();
  if (items.length === 0) {
    container.innerHTML = `
      <div class="review-empty">
        <div class="review-empty-icon">${ICONS.book}</div>
        <h3>单词本还是空的</h3>
        <p>学习时点击星标，把不太熟悉的单词加进来集中复习。</p>
        <button class="btn-primary" style="margin-top:24px" onclick="navigate('episodes')">去选择剧集</button>
      </div>
    `;
    return;
  }

  let html = `
    <button class="back-btn" onclick="navigate('home')">← 返回首页</button>
    <div class="section-label">我的收藏 · ${items.length}</div>
    <div class="action-grid" style="margin-bottom:12px">
      <button class="action-card" onclick="startWordReview(getWordBookItems())">
        <div class="action-icon teal">${ICONS.book}</div>
        <div class="action-text">
          <h3>单词卡复习</h3>
          <p>像不背单词一样过卡</p>
        </div>
      </button>
      <button class="action-card" onclick="startWordBookPractice()">
        <div class="action-icon yellow">${ICONS.pencil}</div>
        <div class="action-text">
          <h3>拼写练习</h3>
          <p>选择/拼写测试</p>
        </div>
      </button>
    </div>
  `;
  for (const item of items) {
    html += renderItemCard(item);
  }
  container.innerHTML = html;
}

// --- Expression Records ---
function renderExpressionRecords(container) {
  const records = state.expressionRecords;
  if (records.length === 0) {
    container.innerHTML = `
      <div class="review-empty">
        <div class="review-empty-icon">${ICONS.doc}</div>
        <h3>还没有表达记录</h3>
        <p>在表达卡片上点击铅笔图标，用学到的短语写一句话并获得批改。</p>
        <button class="btn-primary" style="margin-top:24px" onclick="navigate('episodes')">去学习表达</button>
      </div>
    `;
    return;
  }

  let html = `
    <button class="back-btn" onclick="navigate('home')">← 返回首页</button>
    <div class="section-label">表达造句记录 · ${records.length}</div>
  `;
  for (const r of records.slice(0, 50)) {
    const item = getItemById(r.id);
    if (!item) continue;
    html += `
      <div class="record-card">
        <div class="record-header">
          <span class="record-expression">${escapeHtml(item.text)}</span>
          <span class="record-score ${r.feedback.ok ? 'good' : 'warn'}">${r.feedback.ok ? '通过' : '待改进'}</span>
        </div>
        <p class="record-sentence">${escapeHtml(r.sentence)}</p>
        <p class="record-feedback">${escapeHtml(r.feedback.message)}</p>
        ${r.feedback.issues && r.feedback.issues.length ? `
          <ul class="record-issues">
            ${r.feedback.issues.map(i => `<li>${escapeHtml(i)}</li>`).join('')}
          </ul>
        ` : ''}
        ${r.feedback.suggestion ? `<p class="record-suggestion">${escapeHtml(r.feedback.suggestion)}</p>` : ''}
        <p class="record-date">${formatDate(r.createdAt)}</p>
      </div>
    `;
  }
  container.innerHTML = html;
}

// --- Expression Write Modal / Page ---
function openExpressionWrite(itemId) {
  state.writingExpressionId = itemId;
  state.page = 'expressionWrite';
  updateNav();
  const main = document.getElementById('main-content');
  const item = getItemById(itemId);
  main.innerHTML = `
    <button class="back-btn" onclick="navigate('learn', {episode:'${item.episode}'})">← 返回学习</button>
    <div class="quiz-card">
      <p class="quiz-question">用「${escapeHtml(item.text)}」写一句话</p>
      <p class="quiz-hint">${escapeHtml(item.meaning)}</p>
      <p class="quiz-hint" style="font-style:italic">参考例句：${escapeHtml(item.example)}</p>
      <textarea class="quiz-input" id="expression-sentence" rows="3" placeholder="写一句英文..."></textarea>
      <button class="btn-primary" onclick="submitExpressionSentence('${itemId}')">提交批改</button>
      <div id="write-feedback"></div>
    </div>
  `;
}

function submitExpressionSentence(itemId) {
  const item = getItemById(itemId);
  const input = document.getElementById('expression-sentence');
  const sentence = input.value.trim();
  const feedback = correctExpression(item, sentence);
  saveExpressionRecord(itemId, sentence, feedback);

  const fbEl = document.getElementById('write-feedback');
  fbEl.className = `feedback ${feedback.ok ? 'correct' : 'wrong'}`;
  fbEl.innerHTML = `
    <strong>${feedback.ok ? '写得很棒！' : '还可以更好'}</strong>
    <p>${escapeHtml(feedback.message)}</p>
    ${feedback.issues && feedback.issues.length ? `<ul style="margin:8px 0 0 16px;padding:0">${feedback.issues.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : ''}
    ${feedback.suggestion ? `<p style="margin-top:8px">${escapeHtml(feedback.suggestion)}</p>` : ''}
    <button class="btn-secondary" style="margin-top:12px" onclick="navigate('expressionRecords')">查看表达记录</button>
  `;
}

// --- Practice ---
function startPractice(ep, type = null) {
  if (!ep) {
    state.practiceMode = null;
    state.practiceSession = null;
    navigate('practice');
    return;
  }
  if (type) {
    state.practiceMode = type;
    state.practiceSession = createPracticeSession(type === 'word' ? getEpisodeItems(ep, 'word') : getEpisodeItems(ep, 'expression'), type);
  } else {
    state.practiceMode = 'mixed';
    state.practiceSession = createPracticeSession(getDefaultItems(ep), 'mixed');
  }
  navigate('practice');
}

function quitPractice() {
  state.practiceSession = null;
  if (state.currentEpisode) {
    navigate('learn', { episode: state.currentEpisode });
  } else {
    navigate('home');
  }
}

function startWordBookPractice() {
  const items = getWordBookItems();
  if (items.length === 0) return;
  state.practiceMode = 'word';
  state.practiceSession = createPracticeSession(items, 'word');
  navigate('practice');
}

function createPracticeSession(items, mode) {
  const questions = [];
  const pool = shuffle([...items]).slice(0, Math.min(items.length, 10));
  for (const item of pool) {
    if (mode === 'word' || item.type === 'word') {
      questions.push({ type: 'word-choice', item });
    }
    if (mode === 'word' || item.type === 'word') {
      questions.push({ type: 'word-spelling', item });
    }
    if (mode === 'expression' || item.type === 'expression') {
      questions.push({ type: 'expression-translate', item });
    }
    if (mode === 'expression' || item.type === 'expression') {
      questions.push({ type: 'expression-write', item });
    }
  }
  // Limit mixed sessions
  if (mode === 'mixed') {
    const limited = [];
    for (const item of pool) {
      if (item.type === 'word') limited.push({ type: 'word-choice', item });
      else limited.push({ type: 'expression-translate', item });
    }
    return { questions: shuffle(limited).slice(0, 10), current: 0, answers: [] };
  }
  // Practice all today's learned content: one question per item
  if (mode === 'today') {
    const todayPool = shuffle([...items]);
    const limited = todayPool.map(item => {
      if (item.type === 'word') return { type: 'word-spelling', item };
      return { type: 'expression-translate', item };
    });
    return { questions: limited, current: 0, answers: [] };
  }
  return { questions: shuffle(questions).slice(0, 10), current: 0, answers: [] };
}

function renderPractice(container) {
  if (!state.practiceSession) {
    // Practice mode selector
    container.innerHTML = `
      <button class="back-btn" onclick="navigate('home')">← 返回首页</button>
      <h3 class="section-title" style="margin-top:0">选择练习类型</h3>
      <div class="action-grid">
        <button class="action-card" onclick="setWordPracticeType('choice')">
          <div class="action-icon yellow">${ICONS.abc}</div>
          <div class="action-text">
            <h3>单词：看英文选中文</h3>
            <p>给出英文，选择正确的中文意思</p>
          </div>
        </button>
        <button class="action-card" onclick="setWordPracticeType('spelling')">
          <div class="action-icon teal">${ICONS.pencil}</div>
          <div class="action-text">
            <h3>单词：给中文拼英文</h3>
            <p>根据中文提示拼写英文单词</p>
          </div>
        </button>
        <button class="action-card" onclick="setExpressionPracticeType('translate')">
          <div class="action-icon coral">${ICONS.doc}</div>
          <div class="action-text">
            <h3>表达：句子翻译</h3>
            <p>把中文句子翻译成英文</p>
          </div>
        </button>
        <button class="action-card" onclick="setExpressionPracticeType('write')">
          <div class="action-icon yellow">${ICONS.pencil}</div>
          <div class="action-text">
            <h3>表达：写一句话+批改</h3>
            <p>用短语造句并获得即时反馈</p>
          </div>
        </button>
      </div>
      <h3 class="section-title">按剧集练习</h3>
      <p style="color:var(--text-light);font-size:14px;margin-bottom:12px">选择刚看完的剧集，练习本集推荐内容</p>
      <div class="episode-grid">
        ${Object.keys(EPISODE_CONTENT).sort().map(ep => {
          const data = EPISODE_CONTENT[ep];
          return `
            <button class="episode-card" onclick="startPractice('${ep}')">
              <div class="episode-number">${ep}</div>
              <div class="episode-title">${data.zh_title}</div>
            </button>
          `;
        }).join('')}
      </div>
    `;
    return;
  }

  const session = state.practiceSession;
  if (session.current >= session.questions.length) {
    renderPracticeResult(container);
    return;
  }

  const q = session.questions[session.current];
  const progress = `${session.current + 1}/${session.questions.length}`;

  let html = `
    <button class="back-btn" onclick="quitPractice()">← 退出练习</button>
    <div class="quiz-progress">
      <span>第 ${progress} 题</span>
      <div class="progress-dots">
        ${session.questions.map((_, idx) => {
          let cls = 'dot';
          if (idx < session.current) {
            const ans = session.answers[idx];
            cls += ans.correct ? ' correct' : ' wrong';
          } else if (idx === session.current) {
            cls += ' active';
          }
          return `<div class="${cls}"></div>`;
        }).join('')}
      </div>
    </div>
    <div class="quiz-card" id="quiz-card">
  `;

  if (q.type === 'word-choice') {
    const options = generateWordChoiceOptions(q.item);
    q.options = options;
    html += `
      <p class="quiz-question">${escapeHtml(q.item.text)}</p>
      <p class="quiz-hint">请选择正确的中文意思</p>
      <div id="choice-options">
        ${options.map((opt, idx) => `
          <button class="option-btn" data-idx="${idx}" onclick="submitChoice(${idx}, this)">
            ${escapeHtml(opt)}
          </button>
        `).join('')}
      </div>
    `;
  } else if (q.type === 'word-spelling') {
    html += `
      <p class="quiz-question">${escapeHtml(q.item.meaning)}</p>
      <p class="quiz-hint">请拼出对应的英文单词</p>
      <input type="text" class="quiz-input" id="answer-input" placeholder="输入英文单词" autocomplete="off" onkeydown="if(event.key==='Enter')submitSpelling()">
      <button class="btn-primary" onclick="submitSpelling()">提交</button>
      <div id="spelling-example" class="hidden" style="margin-top:12px;padding:12px;background:var(--bg);border-radius:8px;font-size:14px;color:var(--text-light)">
        <strong style="color:var(--text)">例句：</strong>${escapeHtml(q.item.example)}
      </div>
    `;
  } else if (q.type === 'expression-translate') {
    const zhTranslation = q.item.scene; // use scene as translation prompt, or we can use original meaning
    html += `
      <p class="quiz-question">${escapeHtml(q.item.meaning)}</p>
      <p class="quiz-hint">请用英文「${escapeHtml(q.item.text)}」翻译下面的意思</p>
      <p class="quiz-hint" style="font-size:16px;line-height:1.6;background:var(--bg);padding:12px;border-radius:8px">${escapeHtml(zhTranslation)}</p>
      <input type="text" class="quiz-input" id="answer-input" placeholder="输入英文句子" autocomplete="off" onkeydown="if(event.key==='Enter')submitExpressionTranslate()">
      <button class="btn-primary" onclick="submitExpressionTranslate()">提交</button>
    `;
  } else if (q.type === 'expression-write') {
    html += `
      <p class="quiz-question">用「${escapeHtml(q.item.text)}」写一句话</p>
      <p class="quiz-hint">${escapeHtml(q.item.meaning)}</p>
      <textarea class="quiz-input" id="answer-input" rows="3" placeholder="写一句英文..."></textarea>
      <button class="btn-primary" onclick="submitExpressionWrite()">提交批改</button>
    `;
  }

  html += `<div id="feedback"></div></div>`;
  container.innerHTML = html;
  setTimeout(() => {
    const input = document.getElementById('answer-input');
    if (input) input.focus();
  }, 50);
}

function generateWordChoiceOptions(correctItem) {
  const all = getAllItems().filter(i => i.type === 'word' && i.id !== correctItem.id);
  const wrong = shuffle(all).slice(0, 3).map(i => i.meaning);
  return shuffle([correctItem.meaning, ...wrong]);
}

function submitChoice(idx, btn) {
  const q = state.practiceSession.questions[state.practiceSession.current];
  const answer = q.options[idx];
  const correct = answer === q.item.meaning;
  document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
  btn.classList.add(correct ? 'correct' : 'wrong');
  handleAnswer(correct, q.item.text);
}

function submitSpelling() {
  const input = document.getElementById('answer-input');
  const answer = input.value.trim().toLowerCase();
  const q = state.practiceSession.questions[state.practiceSession.current];
  const correct = normalize(answer) === normalize(q.item.text);
  handleAnswer(correct, q.item.text);
}

function submitExpressionTranslate() {
  const input = document.getElementById('answer-input');
  const answer = input.value.trim().toLowerCase();
  const q = state.practiceSession.questions[state.practiceSession.current];
  const expr = q.item.text.toLowerCase();
  const exprParts = expr.split(/\s+/);
  const correct = exprParts.every(part => answer.includes(part));
  handleAnswer(correct, q.item.text);
}

function submitExpressionWrite() {
  const input = document.getElementById('answer-input');
  const sentence = input.value.trim();
  const q = state.practiceSession.questions[state.practiceSession.current];
  const feedback = correctExpression(q.item, sentence);
  saveExpressionRecord(q.item.id, sentence, feedback);
  handleAnswer(feedback.ok, q.item.text, false, feedback);
}

function handleAnswer(correct, correctText, autoNext = true, extraFeedback = null) {
  const session = state.practiceSession;
  const q = session.questions[session.current];
  session.answers.push({ correct, itemId: q.item.id });

  if (correct) {
    const p = getItemProgress(q.item.id);
    if (!p.learned) markLearned(q.item.id);
    else recordReview(q.item.id, true);
  } else {
    recordReview(q.item.id, false);
  }

  const feedback = document.getElementById('feedback');
  feedback.className = `feedback ${correct ? 'correct' : 'wrong'}`;
  let html = `<strong>${correct ? '答对了！' : '再想想看'}</strong>`;
  if (!correct) html += `<p>正确答案是：${escapeHtml(correctText)}</p>`;

  // Reveal example sentence for word-spelling after user has attempted
  if (q.type === 'word-spelling') {
    const exEl = document.getElementById('spelling-example');
    if (exEl) exEl.classList.remove('hidden');
  }
  if (extraFeedback) {
    html += `<p>${escapeHtml(extraFeedback.message)}</p>`;
    if (extraFeedback.suggestion) html += `<p>${escapeHtml(extraFeedback.suggestion)}</p>`;
  } else {
    html += `<div style="margin-top:8px;font-size:13px">${escapeHtml(q.item.original)}</div>`;
  }
  feedback.innerHTML = html;

  if (state.currentEpisode && state.practiceMode === 'expression') {
    savePracticeProgress(state.currentEpisode, 'expression', session.current + 1);
  }

  setTimeout(() => {
    session.current++;
    render();
  }, autoNext ? 1400 : 2200);
}

function renderPracticeResult(container) {
  const session = state.practiceSession;
  const correct = session.answers.filter(a => a.correct).length;
  const total = session.questions.length;
  container.innerHTML = `
    <div class="quiz-card result-card">
      <p class="result-score">${correct}/${total}</p>
      <p class="result-label">练习完成</p>
      <div class="result-stats">
        <div class="result-stat">
          <span class="result-stat-number" style="color:var(--secondary)">${correct}</span>
          <span class="result-stat-label">答对</span>
        </div>
        <div class="result-stat">
          <span class="result-stat-number" style="color:var(--coral)">${total - correct}</span>
          <span class="result-stat-label">答错</span>
        </div>
      </div>
      <p style="color:var(--text-light);font-size:14px;margin-bottom:20px">答错的内容已加入明日复习计划</p>
      <button class="btn-primary" onclick="if(state.currentEpisode&&state.practiceMode==='expression')clearPracticeProgress(state.currentEpisode,'expression');state.practiceSession=null;render()">再练一次</button>
      <button class="btn-secondary" onclick="if(state.currentEpisode&&state.practiceMode==='expression')clearPracticeProgress(state.currentEpisode,'expression');state.practiceSession=null;navigate('home')">回到首页</button>
    </div>
  `;
}

function setWordPracticeType(type) {
  state.wordPracticeType = type;
  state.practiceMode = 'word';
  // Use word book or default episode
  const items = state.wordBook.length ? getWordBookItems() : getEpisodeItems(getContinueEpisode(), 'word');
  state.practiceSession = createPracticeSession(items, 'word');
  navigate('practice');
}

function setExpressionPracticeType(type) {
  state.expressionPracticeType = type;
  state.practiceMode = 'expression';
  const items = getEpisodeItems(getContinueEpisode(), 'expression');
  state.practiceSession = createPracticeSession(items, 'expression');
  navigate('practice');
}

// --- Review ---
function renderReview(container) {
  const dueExpressions = getDueExpressions();
  const dueWords = getDueWords();
  const todayItems = getTodayLearnedItems();
  const wordBookItems = getWordBookItems();

  let html = `<button class="back-btn" onclick="navigate('home')">← 返回首页</button>`;

  // Word review section (new)
  html += `<h3 class="section-title" style="margin-top:0">单词复习</h3>`;
  if (dueWords.length === 0) {
    html += `
      <div class="action-card" style="cursor:default;margin-bottom:16px">
        <div class="action-text">
          <p>今天没有待复习单词</p>
          <p style="font-size:13px;color:var(--text-light)">新学单词会在第二天出现</p>
        </div>
      </div>
    `;
  } else {
    html += `
      <button class="action-card" style="margin-bottom:16px" onclick="startWordReview(getDueWords())">
        <div class="action-icon teal">${ICONS.abc}</div>
        <div class="action-text">
          <h3>开始单词复习</h3>
          <p>${dueWords.length} 个单词待复习 · 像不背单词一样过卡</p>
        </div>
      </button>
    `;
  }

  // Today's practice section
  html += `<h3 class="section-title">练习今日所学</h3>`;
  if (todayItems.length === 0) {
    html += `
      <div class="action-card" style="cursor:default;margin-bottom:16px">
        <div class="action-text">
          <p>今天还没有学习新内容</p>
          <p style="font-size:13px;color:var(--text-light)">学完一集后来这里练习今天全部所学</p>
        </div>
      </div>
    `;
  } else {
    html += `
      <button class="action-card" style="margin-bottom:16px" onclick="startTodayPractice()">
        <div class="action-icon teal">${ICONS.pencil}</div>
        <div class="action-text">
          <h3>去练习</h3>
          <p>今日已学 ${todayItems.length} 个 · 单词和表达一起练</p>
        </div>
      </button>
    `;
  }

  // Expression review section
  html += `<h3 class="section-title">表达复习</h3>`;
  if (dueExpressions.length === 0) {
    html += `
      <div class="review-empty" style="padding:24px 0">
        <div class="review-empty-icon">${ICONS.party}</div>
        <h3>今天没有待复习表达</h3>
        <p style="font-size:13px">表达会按第1、3、7、14天自动出现。</p>
      </div>
    `;
  } else {
    const item = dueExpressions[0];
    const data = EPISODE_CONTENT[item.episode];
    html += `
      <div class="quiz-progress">
        <span>剩余 ${dueExpressions.length} 个</span>
      </div>
      <div class="quiz-card">
        <p class="quiz-question" style="font-size:22px">${escapeHtml(item.text)}</p>
        <p class="quiz-hint">${escapeHtml(item.meaning)}</p>
        <button class="toggle-btn" onclick="document.getElementById('review-detail').classList.toggle('hidden')">显示原句+例句</button>
        <div class="item-detail hidden" id="review-detail">
          <div class="detail-row">
            <p class="detail-label">剧中原句</p>
            <p class="detail-text">${escapeHtml(item.original)}</p>
          </div>
          <div class="detail-row">
            <p class="detail-label">新例句</p>
            <p class="detail-text">${escapeHtml(item.example)}</p>
          </div>
        </div>
        <div class="review-actions">
          <button class="btn-hard" onclick="reviewItem('${item.id}', false)">不熟悉</button>
          <button class="btn-good" onclick="reviewItem('${item.id}', true)">掌握了</button>
        </div>
      </div>
      <p style="color:var(--text-light);font-size:13px;text-align:center;margin-top:16px;margin-bottom:24px">${data.zh_title} · 复习间隔会根据你的回答调整</p>
    `;
  }

  // Quick links to word book and expression records
  html += `<h3 class="section-title">更多复习</h3>`;
  html += `
    <div class="action-grid">
      <button class="action-card" onclick="navigate('wordbook')">
        <div class="action-icon yellow">${ICONS.book}</div>
        <div class="action-text">
          <h3>单词本</h3>
          <p>${wordBookItems.length} 个收藏单词</p>
        </div>
      </button>
      <button class="action-card" onclick="navigate('expressionRecords')">
        <div class="action-icon coral">${ICONS.doc}</div>
        <div class="action-text">
          <h3>表达记录</h3>
          <p>查看写句子的批改</p>
        </div>
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function startTodayPractice() {
  const items = getTodayLearnedItems();
  if (items.length === 0) return;
  state.practiceMode = 'today';
  state.wordPracticeType = 'mixed';
  state.expressionPracticeType = 'mixed';
  state.practiceSession = createPracticeSession(items, 'today');
  navigate('practice');
}

function startWordReview(items) {
  if (!items || items.length === 0) return;
  const words = items.filter(i => i.type === 'word');
  if (words.length === 0) return;
  state.wordReviewSession = {
    items: shuffle([...words]),
    current: 0,
    revealed: false,
    answers: []
  };
  navigate('wordReview');
}

function handleWordReview(result) {
  const session = state.wordReviewSession;
  if (!session) return;
  const item = session.items[session.current];
  recordWordReview(item.id, result);
  session.answers.push({ itemId: item.id, result });
  session.current++;
  session.revealed = false;
  if (session.current >= session.items.length) {
    render();
    return;
  }
  render();
}

function toggleWordReveal() {
  if (!state.wordReviewSession) return;
  state.wordReviewSession.revealed = !state.wordReviewSession.revealed;
  render();
}

function reviewItem(itemId, known) {
  recordReview(itemId, known);
  render();
}

function renderWordReview(container) {
  const session = state.wordReviewSession;
  if (!session) { navigate('review'); return; }

  if (session.current >= session.items.length) {
    const total = session.items.length;
    const known = session.answers.filter(a => a.result === 'known').length;
    const fuzzy = session.answers.filter(a => a.result === 'fuzzy').length;
    const forgotten = session.answers.filter(a => a.result === 'forgotten').length;
    container.innerHTML = `
      <div class="quiz-card result-card">
        <p class="result-score">${total}</p>
        <p class="result-label">单词复习完成</p>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-number" style="color:var(--secondary)">${known}</span>
            <span class="result-stat-label">认识</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-number" style="color:var(--mustard)">${fuzzy}</span>
            <span class="result-stat-label">模糊</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-number" style="color:var(--coral)">${forgotten}</span>
            <span class="result-stat-label">忘记</span>
          </div>
        </div>
        <p style="color:var(--text-light);font-size:14px;margin-bottom:20px">忘记的单词会连续多天出现，直到你掌握为止</p>
        <button class="btn-primary" onclick="state.wordReviewSession=null;navigate('review')">完成</button>
      </div>
    `;
    return;
  }

  const item = session.items[session.current];
  const progress = `${session.current + 1}/${session.items.length}`;
  const revealed = session.revealed;

  container.innerHTML = `
    <div class="word-review-wrapper">
      <div class="word-review-header">
        <span class="word-review-progress">${progress}</span>
        <button class="icon-btn" onclick="state.wordReviewSession=null;navigate('review')" title="退出">${ICONS.close}</button>
      </div>
      <div class="word-review-card ${revealed ? 'revealed' : ''}" onclick="toggleWordReveal()">
        <div class="word-review-word">${escapeHtml(item.text)}</div>
        ${revealed ? `
          <div class="word-review-detail">
            <p class="word-review-meaning">${escapeHtml(item.meaning)}</p>
            <p class="word-review-example">${escapeHtml(item.example)}</p>
            <p class="word-review-original">${escapeHtml(item.original)}</p>
          </div>
        ` : `<p class="word-review-hint">点击卡片查看释义</p>`}
      </div>
      <div class="word-review-actions">
        <button class="word-review-btn forgotten" onclick="handleWordReview('forgotten')">忘记了</button>
        <button class="word-review-btn fuzzy" onclick="handleWordReview('fuzzy')">模糊</button>
        <button class="word-review-btn known" onclick="handleWordReview('known')">认识</button>
      </div>
    </div>
  `;
}

// --- Word Card Practice (learn all episode words) ---
function startEpisodeWordCards(ep) {
  const words = getEpisodeItems(ep, 'word');
  if (!words.length) return;
  const saved = getPracticeProgress(ep, 'wordCard');
  const startIndex = (saved > 0 && saved < words.length) ? saved : 0;
  state.currentEpisode = ep;
  state.wordCardSession = {
    items: [...words],
    current: startIndex,
    revealed: false,
    answers: []
  };
  navigate('wordCard');
}

function startEpisodeExpressionPractice(ep) {
  const items = getEpisodeItems(ep, 'expression');
  if (!items.length) return;
  const questions = [];
  for (const item of items) {
    questions.push({ type: 'expression-translate', item });
    questions.push({ type: 'expression-write', item });
  }
  const saved = getPracticeProgress(ep, 'expression');
  const startIndex = (saved > 0 && saved < questions.length) ? saved : 0;
  state.currentEpisode = ep;
  state.practiceMode = 'expression';
  state.practiceSession = { questions, current: startIndex, answers: [] };
  navigate('practice');
}

function startSpellingSession(items) {
  if (!items || items.length === 0) return;
  state.practiceMode = 'word';
  state.practiceSession = {
    questions: shuffle([...items]).map(item => ({ type: 'word-spelling', item })),
    current: 0,
    answers: []
  };
  navigate('practice');
}

function handleWordCard(result) {
  const session = state.wordCardSession;
  if (!session) return;
  const item = session.items[session.current];
  recordWordReview(item.id, result);
  session.answers.push({ itemId: item.id, result });
  session.revealed = true;
  savePracticeProgress(state.currentEpisode, 'wordCard', session.current);
  render();
}

function nextWordCard() {
  const session = state.wordCardSession;
  if (!session) return;
  session.current++;
  session.revealed = false;
  savePracticeProgress(state.currentEpisode, 'wordCard', session.current);
  render();
}

function continueWordCardSpelling() {
  const session = state.wordCardSession;
  if (!session) return;
  const items = session.items;
  state.wordCardSession = null;
  startSpellingSession(items);
}

function renderWordCard(container) {
  const session = state.wordCardSession;
  if (!session) { navigate('learn', {episode: state.currentEpisode || DEFAULT_EPISODE}); return; }

  if (session.current >= session.items.length) {
    const total = session.items.length;
    const known = session.answers.filter(a => a.result === 'known').length;
    const fuzzy = session.answers.filter(a => a.result === 'fuzzy').length;
    const forgotten = session.answers.filter(a => a.result === 'forgotten').length;
    container.innerHTML = `
      <div class="quiz-card result-card">
        <p class="result-score">${total}</p>
        <p class="result-label">单词卡完成</p>
        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-number" style="color:var(--secondary)">${known}</span>
            <span class="result-stat-label">认识</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-number" style="color:var(--mustard)">${fuzzy}</span>
            <span class="result-stat-label">模糊</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-number" style="color:var(--coral)">${forgotten}</span>
            <span class="result-stat-label">忘记</span>
          </div>
        </div>
        <p style="color:var(--text-light);font-size:14px;margin-bottom:20px">继续用中文拼写，巩固这些单词</p>
        <button class="btn-primary" onclick="clearPracticeProgress(state.currentEpisode, 'wordCard'); continueWordCardSpelling()">继续拼写</button>
        <button class="btn-secondary" onclick="clearPracticeProgress(state.currentEpisode, 'wordCard'); state.wordCardSession=null;navigate('learn',{episode:'${state.currentEpisode}'})">返回学习</button>
      </div>
    `;
    return;
  }

  const item = session.items[session.current];
  const progress = `${session.current + 1}/${session.items.length}`;
  const revealed = session.revealed;

  const resumeHint = session.current > 0 ? `<p class="word-review-resume">继续上次进度</p>` : '';
  const examplesHtml = `
    <div class="word-review-examples">
      <p class="word-review-examples-label">例句：</p>
      <div class="word-review-example-item">
        <p class="word-review-example-en">1. ${escapeHtml(item.original)}</p>
        <p class="word-review-example-zh">${escapeHtml(item.originalZh)}</p>
      </div>
      <div class="word-review-example-item">
        <p class="word-review-example-en">2. ${escapeHtml(item.example)}</p>
        <p class="word-review-example-zh">${escapeHtml(item.exampleZh)}</p>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="word-review-wrapper">
      <button class="back-btn" onclick="state.wordCardSession=null;navigate('learn',{episode:'${state.currentEpisode}'})">← 返回学习</button>
      <div class="word-review-header">
        <span class="word-review-progress">${progress}</span>
      </div>
      ${resumeHint}
      <div class="word-review-card">
        <div class="word-review-word">${escapeHtml(item.text)}</div>
        ${item.phonetic ? `<p class="word-review-phonetic">${escapeHtml(item.phonetic)}</p>` : ''}
        ${revealed ? `
          <div class="word-review-detail">
            <p class="word-review-meaning">${escapeHtml(item.meaning)}</p>
            ${examplesHtml}
          </div>
        ` : `<p class="word-review-hint">选择你认识的程度</p>`}
      </div>
      ${revealed ? `
        <button class="btn-primary" onclick="nextWordCard()">下一个</button>
      ` : `
        <div class="word-review-actions">
          <button class="word-review-btn forgotten" onclick="handleWordCard('forgotten')">忘记了</button>
          <button class="word-review-btn fuzzy" onclick="handleWordCard('fuzzy')">模糊</button>
          <button class="word-review-btn known" onclick="handleWordCard('known')">认识</button>
        </div>
      `}
    </div>
  `;
}

// --- Helpers ---
function setLearnTab(tab) {
  state.learnTab = tab;
  state.wordPage = 0;
  state.expressionPage = 0;
  render();
}

function setPage(key, page) {
  state[key] = page;
  render();
}

function toggleDetail(id) {
  const el = document.getElementById(`detail-${id}`);
  el.classList.toggle('hidden');
}

function markItemLearned(id) {
  markLearned(id);
  render();
}

function toggleWordBook(id) {
  if (isInWordBook(id)) removeFromWordBook(id);
  else addToWordBook(id);
}

function searchTranscript(query) {
  state.transcriptQuery = query;
  renderTranscript(document.getElementById('main-content'));
}

function formatDate(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, ' ');
}

function shuffle(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Floating note / ask panel ---
function toggleNotePanel() {
  state.notePanelOpen = !state.notePanelOpen;
  const panel = document.getElementById('note-panel');
  if (panel) panel.classList.toggle('hidden', !state.notePanelOpen);
  if (state.notePanelOpen) renderNotePanel();
}

function setNoteTab(tab) {
  state.noteTab = tab;
  renderNotePanel();
}

function getCurrentContext() {
  let context = state.page;
  if (state.currentEpisode && EPISODE_CONTENT[state.currentEpisode]) {
    context += ' · ' + EPISODE_CONTENT[state.currentEpisode].zh_title;
  }
  if (state.wordCardSession && state.wordCardSession.items[state.wordCardSession.current]) {
    context += ' · ' + state.wordCardSession.items[state.wordCardSession.current].text;
  } else if (state.practiceSession && state.practiceSession.questions[state.practiceSession.current]) {
    context += ' · ' + state.practiceSession.questions[state.practiceSession.current].item.text;
  }
  return context;
}

function saveNote() {
  const input = document.getElementById('note-input');
  const text = (input.value || '').trim();
  if (!text) return;
  state.notes.unshift({
    id: Date.now().toString(),
    text,
    context: getCurrentContext(),
    createdAt: new Date().toISOString()
  });
  saveData(NOTES_KEY, state.notes);
  renderNotePanel();
}

function deleteNote(id) {
  state.notes = state.notes.filter(n => n.id !== id);
  saveData(NOTES_KEY, state.notes);
  renderNotePanel();
}

function findAnswerInContent(question) {
  const q = normalize(question);
  if (!q) return null;
  const all = getAllItems();
  // Prefer exact match
  let match = all.find(item => normalize(item.text) === q);
  if (!match) {
    // Partial match
    match = all.find(item => q.includes(normalize(item.text)) || normalize(item.text).includes(q));
  }
  return match || null;
}

function saveAskRecord(question, answer, hasMatch) {
  state.askHistory.unshift({
    id: Date.now().toString(),
    question,
    answer,
    hasMatch,
    context: getCurrentContext(),
    createdAt: new Date().toISOString()
  });
  saveData(ASK_HISTORY_KEY, state.askHistory);
}

function deleteAskHistory(id) {
  state.askHistory = state.askHistory.filter(r => r.id !== id);
  saveData(ASK_HISTORY_KEY, state.askHistory);
  renderNotePanel();
}

function askQuestion() {
  const input = document.getElementById('ask-input');
  const question = (input.value || '').trim();
  if (!question) return;
  const match = findAnswerInContent(question);
  let answer = '';
  let hasMatch = false;
  if (match) {
    const phonetic = match.phonetic ? `<span class="item-phonetic">${escapeHtml(match.phonetic)}</span>` : '';
    hasMatch = true;
    answer = `
      <p class="item-text" style="margin:0 0 4px">${escapeHtml(match.text)} ${phonetic}</p>
      <p style="margin:0 0 8px;color:var(--accent);font-weight:700">${escapeHtml(match.meaning)}</p>
      <p style="margin:0 0 4px;font-size:13px">例句：${escapeHtml(match.original)}</p>
      <p style="margin:0;color:var(--text-light);font-size:13px">${escapeHtml(match.originalZh || '')}</p>
    `;
  } else {
    answer = '<p style="margin:0">这个问题我先帮你记下了，你可以稍后查资料或继续问我。</p>';
  }
  saveAskRecord(question, answer, hasMatch);
  input.value = '';
  renderNotePanel();
}

function renderNotePanel() {
  const body = document.getElementById('note-panel-body');
  if (!body) return;

  document.querySelectorAll('.note-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === state.noteTab);
  });

  if (state.noteTab === 'ask') {
    let html = `
      <p class="note-section-hint">有疑问随时写下来，我会先在学过的内容里帮你找答案～</p>
      <input type="text" id="ask-input" class="ask-input" placeholder="比如：present 怎么写？" onkeydown="if(event.key==='Enter')askQuestion()">
      <button class="btn-primary" onclick="askQuestion()">保存疑问</button>
    `;
    if (state.askHistory.length === 0) {
      html += `<div class="note-empty">还没有记录，把疑问写下来吧</div>`;
    } else {
      html += `<div class="note-list">`;
      for (const r of state.askHistory.slice(0, 50)) {
        html += `
          <div class="note-item ask-item">
            <p class="ask-question">Q：${escapeHtml(r.question)}</p>
            <div class="ask-answer">${r.answer}</div>
            <div class="note-item-meta">${escapeHtml(r.context || '')} · ${formatDate(r.createdAt)}</div>
            <button class="toggle-btn" style="margin-top:6px" onclick="deleteAskHistory('${r.id}')">删除</button>
          </div>
        `;
      }
      html += `</div>`;
    }
    body.innerHTML = html;
    return;
  }

  // Notes tab
  let html = `
    <p class="note-section-hint">学习时把重点敲下来，回头复习更高效～</p>
    <textarea id="note-input" class="note-input" rows="3" placeholder="把重点敲下来..."></textarea>
    <button class="btn-primary" onclick="saveNote()">保存重点</button>
  `;
  if (state.notes.length === 0) {
    html += `<div class="note-empty">还没有重点笔记，遇到关键点就记下来吧</div>`;
  } else {
    html += `<div class="note-list">`;
    for (const note of state.notes.slice(0, 50)) {
      html += `
        <div class="note-item">
          <p style="margin:0">${escapeHtml(note.text)}</p>
          <div class="note-item-meta">${escapeHtml(note.context || '')} · ${formatDate(note.createdAt)}</div>
          <button class="toggle-btn" style="margin-top:6px" onclick="deleteNote('${note.id}')">删除</button>
        </div>
      `;
    }
    html += `</div>`;
  }
  body.innerHTML = html;
}

// --- Init ---
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    state.practiceSession = null;
    state.wordReviewSession = null;
    state.wordCardSession = null;
    navigate(btn.dataset.page);
  });
});

loadState();
state.currentEpisode = DEFAULT_EPISODE;
navigate('home');
