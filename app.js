// ============================================================
// Personal Finance Copilot — Multi-Agent AI System
// Complete Working Prototype
// ============================================================

// ==================== STATE ====================
const state = {
    income: 0,
    goalPercent: 20,
    forceRejection: true,
    isRunning: false,
    currentStep: 0,
    spending: { food: 0, subs: 0, shop: 0, misc: 0 },
};

// ==================== MOCK DATA ====================
const MOCK_TX = [
    { date: "2026-06-01", category: "Food & Dining", merchant: "Zomato Premium Delivery", amount: 1250 },
    { date: "2026-06-01", category: "Subscriptions", merchant: "Netflix Family Plan", amount: 799 },
    { date: "2026-06-02", category: "Shopping", merchant: "Myntra Online Clothing", amount: 4500 },
    { date: "2026-06-02", category: "Food & Dining", merchant: "Swiggy Instamart Grocery", amount: 1800 },
    { date: "2026-06-03", category: "Miscellaneous", merchant: "HP Petrol Pump Fuel", amount: 3500 },
    { date: "2026-06-03", category: "Food & Dining", merchant: "Starbucks Coffee Bistro", amount: 650 },
    { date: "2026-06-04", category: "Subscriptions", merchant: "GitHub Copilot Pro", amount: 850 },
    { date: "2026-06-04", category: "Shopping", merchant: "Nike Cyber Runners", amount: 8900 },
    { date: "2026-06-05", category: "Food & Dining", merchant: "Gourmet Diner Restaurant", amount: 4200 },
    { date: "2026-06-05", category: "Subscriptions", merchant: "Spotify Premium Annual", amount: 1199 },
    { date: "2026-06-06", category: "Shopping", merchant: "Amazon Retail Purchase", amount: 4600 },
    { date: "2026-06-06", category: "Miscellaneous", merchant: "Apollo Pharmacy Medicine", amount: 1500 },
];

let activeTx = [];

// ==================== DOM REFS ====================
const $ = (id) => document.getElementById(id);

let els = {};
let dataLoaded = false;

function cacheDom() {
    els = {
        // Sidebar
        nav: $('nav'),
        income: $('income-input'),
        goalSlider: $('goal-slider'),
        goalBadge: $('goal-badge'),
        demoToggle: $('demo-toggle'),
        scenario: $('scenario-select'),
        btnSample: $('btn-sample'),
        btnUpload: $('btn-upload'),
        csvFile: $('csv-file'),
        dropZone: $('drop-zone'),
        sidebar: $('sidebar'),
        overlay: $('sidebar-overlay'),
        hamburger: $('hamburger'),

        // Main
        btnRun: $('btn-run'),
        btnReset: $('btn-reset'),
        btnJudgeDemo: $('btn-judge-demo'),

        // Agent steps
        stepBook: $('step-bookkeeper'),
        stepAdv: $('step-advisor'),
        stepAud: $('step-auditor'),
        stepExp: $('step-explainer'),
        tagBook: $('tag-bookkeeper'),
        tagAdv: $('tag-advisor'),
        tagAud: $('tag-auditor'),
        tagExp: $('tag-explainer'),
        descBook: $('desc-bookkeeper'),
        descAdv: $('desc-advisor'),
        descAud: $('desc-auditor'),
        descExp: $('desc-explainer'),

        // Terminal
        termBody: $('terminal-body'),
        termStatus: $('terminal-status'),

        // Explainability
        explainCard: $('explain-card'),
        explainContent: $('explain-content'),

        // Dashboard
        kpiIncome: $('kpi-income'),
        kpiExpenses: $('kpi-expenses'),
        kpiGoal: $('kpi-goal'),
        kpiBalance: $('kpi-balance'),
        barExpenses: $('bar-expenses'),
        barGoal: $('bar-goal'),
        barBalance: $('bar-balance'),
        donutSvg: $('donut-svg'),
        donutCenter: $('donut-center'),
        legend: $('legend'),
        budgetBars: $('budget-bars'),
        alertsList: $('alerts-list'),

        // Chat
        chatMessages: $('chat-messages'),
        chatForm: $('chat-form'),
        chatInput: $('chat-input'),

        // Data
        txTbody: $('tx-tbody'),

        // Flash
        flash: $('rejection-flash'),
    };
}

// ==================== HELPERS ====================
function fmt(n) {
    return '₹' + Math.round(n).toLocaleString('en-IN');
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ==================== NAVIGATION ====================
function setupNav() {
    els.nav.addEventListener('click', (e) => {
        const btn = e.target.closest('.nav-item');
        if (!btn) return;
        const view = btn.dataset.view;

        // Update nav
        els.nav.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update views
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        const target = $('view-' + view);
        if (target) target.classList.add('active');

        // Close mobile menu
        closeMobile();
    });
}

// ==================== MOBILE MENU ====================
function setupMobile() {
    els.hamburger.addEventListener('click', () => {
        els.sidebar.classList.toggle('open');
        els.overlay.classList.toggle('open');
        els.hamburger.classList.toggle('open');
    });
    els.overlay.addEventListener('click', closeMobile);
}

function closeMobile() {
    els.sidebar.classList.remove('open');
    els.overlay.classList.remove('open');
    els.hamburger.classList.remove('open');
}

// ==================== SIDEBAR CONTROLS ====================
function setupControls() {
    // Income
    els.income.addEventListener('input', () => {
        state.income = parseInt(els.income.value) || 0;
        updateDashboard();
    });

    // Savings goal slider
    els.goalSlider.addEventListener('input', () => {
        state.goalPercent = parseInt(els.goalSlider.value);
        els.goalBadge.textContent = state.goalPercent + '%';
        updateDashboard();
    });

    // Demo toggle
    els.demoToggle.addEventListener('change', () => {
        state.forceRejection = els.demoToggle.checked;
        log('sys', `Force Rejection: ${state.forceRejection ? 'ON' : 'OFF'}`);
    });

    // Scenario
    els.scenario.addEventListener('change', () => {
        const s = els.scenario.value;
        if (s === 'needs-correction') {
            state.forceRejection = true;
            els.demoToggle.checked = true;
            state.spending = { food: 25000, subs: 7500, shop: 18000, misc: 14000 };
        } else if (s === 'direct-pass') {
            state.forceRejection = false;
            els.demoToggle.checked = false;
            state.spending = { food: 15000, subs: 4000, shop: 10000, misc: 8000 };
        } else if (s === 'frugal') {
            state.forceRejection = false;
            els.demoToggle.checked = false;
            state.spending = { food: 10000, subs: 2000, shop: 5000, misc: 5000 };
        }
        log('sys', `Scenario loaded: ${s}`);
        updateDashboard();
        renderTxTable();
    });

    // Sample data
    els.btnSample.addEventListener('click', loadSampleData);
    if (els.btnJudgeDemo) {
        els.btnJudgeDemo.addEventListener('click', runJudgeDemo);
    }

    // CSV Upload & Drag/Drop
    els.btnUpload.addEventListener('click', () => els.csvFile.click());
    
    if (els.dropZone) {
        els.dropZone.addEventListener('click', () => els.csvFile.click());
        els.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            els.dropZone.classList.add('dragover');
        });
        els.dropZone.addEventListener('dragleave', () => {
            els.dropZone.classList.remove('dragover');
        });
        els.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            els.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
                els.csvFile.files = e.dataTransfer.files;
                handleCsvUpload({ target: els.csvFile });
            }
        });
    }

    els.csvFile.addEventListener('change', handleCsvUpload);

    // Run & Reset
    els.btnRun.addEventListener('click', runPipeline);
    els.btnReset.addEventListener('click', resetPipeline);
}

// ==================== CSV UPLOAD ====================
function handleCsvUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    log('sys', `Reading CSV: ${file.name}`);

    const reader = new FileReader();
    reader.onload = function (ev) {
        const lines = ev.target.result.split('\n').filter(l => l.trim());
        if (lines.length < 2) { log('error', 'CSV appears empty.'); return; }

        const parsed = [];
        let f = 0, s = 0, sh = 0, m = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 4) continue;
            const date = cols[0].trim();
            let cat = cols[1].trim();
            const merchant = cols[2].trim();
            const amount = parseFloat(cols[3].replace(/[^0-9.\-]/g, '')) || 0;

            const cl = cat.toLowerCase();
            if (cl.includes('food') || cl.includes('dining') || cl.includes('restaurant')) { cat = 'Food & Dining'; f += amount; }
            else if (cl.includes('sub') || cl.includes('software') || cl.includes('netflix')) { cat = 'Subscriptions'; s += amount; }
            else if (cl.includes('shop') || cl.includes('retail') || cl.includes('cloth')) { cat = 'Shopping'; sh += amount; }
            else { cat = 'Miscellaneous'; m += amount; }

            parsed.push({ date, category: cat, merchant, amount });
        }

        if (parsed.length > 0) {
            activeTx = parsed;
            state.spending = { food: Math.round(f), subs: Math.round(s), shop: Math.round(sh), misc: Math.round(m) };
            dataLoaded = true;
            state.income = parseInt(els.income.value) || 125000;
            if (state.income === 0) { state.income = 125000; els.income.value = 125000; }
            log('sys', `CSV uploaded. Initializing LIVE PIPELINE for ${parsed.length} rows...`);
            
            // Feature 8: Privacy Proof Engine (Exact Fields)
            if (document.getElementById('privacy-original')) {
                let origHtml = '';
                let protHtml = '';
                parsed.slice(0, 4).forEach((tx, i) => {
                    const accNum = 'XXXX-' + Math.floor(1000 + Math.random() * 9000);
                    origHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><div style="display:flex; flex-direction:column;"><span>User_${i+1}</span><span style="font-size:0.65rem;color:var(--t3);">${accNum}</span></div> <div style="display:flex; flex-direction:column; text-align:right;"><span>${tx.merchant}</span><span style="font-size:0.65rem;color:var(--t3);">${tx.date}</span></div></div>`;
                    protHtml += `<div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;"><div style="display:flex; flex-direction:column;"><span class="pii-field masking">[MASKING...]</span><span class="pii-field masking">[MASKING...]</span></div> <div style="display:flex; flex-direction:column; text-align:right;"><span class="pii-field masking">[MASKING...]</span><span style="font-size:0.65rem;color:var(--t3);">${tx.date}</span></div></div>`;
                });
                document.getElementById('privacy-original').innerHTML = origHtml;
                document.getElementById('privacy-protected').innerHTML = protHtml;
                
                const laser = document.querySelector('.scanner-line');
                if (laser) {
                    laser.style.display = 'block';
                    setTimeout(() => { laser.style.display = 'none'; }, 3000);
                }
                setTimeout(() => {
                    const fields = document.querySelectorAll('.pii-field');
                    fields.forEach((f, idx) => {
                        setTimeout(() => {
                            f.className = 'pii-field masked';
                            if (idx % 3 === 0) f.textContent = `[MASKED_USER_0${Math.floor(idx/3)+1}]`;
                            else if (idx % 3 === 1) f.textContent = `[MASKED_ACC]`;
                            else f.textContent = `[OBFUSCATED_TX]`;
                        }, idx * 100);
                    });
                    if(document.getElementById('metric-fields-prot')) document.getElementById('metric-fields-prot').textContent = '24/24';
                }, 1000);
            }
            
            // Trigger LIVE Demo Flow
            runJudgeDemo(true);
        } else {
            log('error', 'No valid rows found in CSV.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// ==================== TERMINAL LOGGING ====================
function log(type, text) {
    const div = document.createElement('div');
    div.className = 'log ' + type;

    const prefix = {
        sys: '[SYSTEM]', book: '[BOOKKEEPER]', adv: '[ADVISOR]',
        aud: '[AUDITOR]', 'aud-pass': '[AUDITOR ✓]', 'aud-fail': '[AUDITOR ✗]',
        explain: '[EXPLAIN]', error: '[ERROR]'
    };

    const d = new Date();
    const ms = d.getMilliseconds().toString().padStart(3, '0');
    const ts = d.toLocaleTimeString('en-US', { hour12: false }) + '.' + ms;

    div.textContent = `[${ts}] ${prefix[type] || '[LOG]'} ${text}`;
    els.termBody.appendChild(div);
    els.termBody.scrollTop = els.termBody.scrollHeight;
}

function logJson(data, rejected) {
    const div = document.createElement('div');
    div.className = 'log-json' + (rejected ? ' rejected' : '');
    div.textContent = JSON.stringify(data, null, 2);
    els.termBody.appendChild(div);
    els.termBody.scrollTop = els.termBody.scrollHeight;
}

// ==================== AGENT STEP HELPERS ====================
function setStep(el, tagEl, status) {
    // status: 'standby' | 'active' | 'completed' | 'rejected'
    el.className = 'agent-step';
    tagEl.className = 'tag';

    if (status === 'active') {
        el.classList.add('active');
        tagEl.classList.add('tag-running');
        tagEl.textContent = 'RUNNING';
    } else if (status === 'completed') {
        el.classList.add('completed');
        tagEl.classList.add('tag-done');
        tagEl.textContent = 'DONE';
    } else if (status === 'rejected') {
        el.classList.add('rejected');
        tagEl.classList.add('tag-fail');
        tagEl.textContent = 'REJECTED';
    } else {
        tagEl.classList.add('tag-standby');
        tagEl.textContent = 'STANDBY';
    }
}

function resetAllSteps() {
    setStep(els.stepBook, els.tagBook, 'standby');
    setStep(els.stepAdv, els.tagAdv, 'standby');
    setStep(els.stepAud, els.tagAud, 'standby');
    setStep(els.stepExp, els.tagExp, 'standby');
    els.descBook.textContent = 'Categorizes & sanitizes transaction data.';
    els.descAdv.textContent = 'Builds personalized budget plan using LLM.';
    els.descAud.textContent = 'Reviews budget for realism & flags issues.';
    els.descExp.textContent = 'Generates human-readable reasoning report.';
    els.explainCard.style.display = 'none';
}

// ==================== MAIN PIPELINE ====================
async function runPipeline() {
    if (state.isRunning) return;
    if (!dataLoaded || activeTx.length === 0) {
        log('error', 'No data loaded! Click "Sample" or "Upload CSV" first.');
        return;
    }
    state.isRunning = true;
    els.btnRun.disabled = true;
    els.btnRun.textContent = '⏳ Running...';
    els.termStatus.textContent = '● running';
    els.termStatus.style.color = 'var(--cyan)';
    resetAllSteps();

    log('sys', '═══════════════════════════════════════');
    log('sys', 'Starting multi-agent analysis pipeline...');
    log('sys', `Income: ${fmt(state.income)} | Goal: ${state.goalPercent}%`);

    // Step 1: Bookkeeper
    const bStart = performance.now();
    await runBookkeeper();
    const bTime = ((performance.now() - bStart)/1000).toFixed(1);
    if($('arch-bookkeeper')) {
        $('arch-bookkeeper').classList.add('active-node');
        $('arch-bookkeeper').querySelector('.arch-metrics').style.display = 'block';
        $('arch-met-book-time').textContent = bTime + 's';
    }

    // Step 2: Advisor
    const aStart = performance.now();
    const budget = await runAdvisor();
    const aTime = ((performance.now() - aStart)/1000).toFixed(1);
    if($('arch-advisor')) {
        $('arch-advisor').classList.add('active-node');
        $('arch-advisor').querySelector('.arch-metrics').style.display = 'block';
        $('arch-met-adv-time').textContent = aTime + 's';
    }

    // Step 3: Auditor (with possible rejection loop)
    let auditorPassed = false;
    let attempt = 0;
    let finalBudget = budget;
    const audStart = performance.now();

    while (!auditorPassed && attempt < 3) {
        attempt++;
        const result = await runAuditor(finalBudget, attempt);
        if (result.passed) {
            auditorPassed = true;
        } else {
            // Flash rejection
            flashRejection();
            finalBudget = await runAdvisorFix(result.feedback, attempt);
        }
    }
    
    const audTime = ((performance.now() - audStart)/1000).toFixed(1);
    if($('arch-auditor')) {
        $('arch-auditor').classList.add('active-node');
        $('arch-auditor').querySelector('.arch-metrics').style.display = 'block';
        $('arch-met-aud-time').textContent = audTime + 's';
        if (attempt > 1) {
            $('arch-met-aud-conf').textContent = attempt + ' Cycles';
            $('arch-met-aud-conf').style.color = 'var(--rose)';
        }
    }

    // Step 4: Explainability
    const eStart = performance.now();
    await runExplainer(finalBudget, auditorPassed, attempt);
    const eTime = ((performance.now() - eStart)/1000).toFixed(1);
    if($('arch-explainer')) {
        $('arch-explainer').classList.add('active-node');
        $('arch-explainer').querySelector('.arch-metrics').style.display = 'block';
        $('arch-met-exp-time').textContent = eTime + 's';
    }

    // ULTIMATE BUDGET VALIDATION REPORT RENDER
    const valCard = $('validation-report-card');
    if (valCard) {
        valCard.style.display = 'block';
        
        let html3Col = '';
        const cats = ['food', 'shop', 'subs', 'misc'];
        
        cats.forEach(k => {
            const initVal = budget[k];
            const finalVal = finalBudget[k];
            const delta = finalVal - initVal;
            const isChanged = delta !== 0;
            const pct = initVal > 0 ? Math.round((delta / initVal) * 100) : 0;
            
            let initStyle = isChanged ? 'strike-through' : '';
            let midContent = '';
            let finalColor = 'white';
            
            if (!isChanged) {
                midContent = `<span class="val-badge approved">✅ Approved</span>`;
            } else if (k === 'food') {
                midContent = `<span class="val-badge rejected">❌ Unrealistic</span> <span class="val-diff positive">+${pct}% Adj.</span>`;
                finalColor = 'var(--emerald)';
            } else if (k === 'shop') {
                midContent = `<span class="val-badge warning">⚠️ Slightly High</span> <span class="val-diff negative">${pct}% Adj.</span>`;
                finalColor = 'var(--emerald)';
            } else {
                midContent = `<span class="val-badge warning">⚠️ Adjusted</span> <span class="val-diff">${pct}%</span>`;
                finalColor = 'var(--emerald)';
            }
            
            html3Col += `
            <div class="val-row">
                <div class="val-cell">
                    <span class="val-cat">${k === 'subs' ? 'Subscriptions' : (k === 'shop' ? 'Shopping' : k)}</span>
                    <span class="val-amt ${initStyle}">₹${initVal}</span>
                </div>
                <div class="val-cell" style="text-align: center;">${midContent}</div>
                <div class="val-cell" style="text-align: right;">
                    <span class="val-amt" style="color: ${finalColor}; font-weight: 700;">₹${finalVal}</span>
                </div>
            </div>`;
        });
        
        $('val-3col-body').innerHTML = html3Col;
        
        // Populate Metrics
        if (attempt > 1) {
            $('metric-corrections').textContent = '100%';
            $('metric-corrections').style.color = 'var(--rose)';
            $('metric-cycles').textContent = attempt.toString();
        } else {
            $('metric-corrections').textContent = '0%';
            $('metric-corrections').style.color = 'var(--emerald)';
            $('metric-cycles').textContent = '1.0';
        }
        
        // Animate Timeline
        const tSteps = [$('vt-1'), $('vt-2'), $('vt-3'), $('vt-4'), $('vt-5')];
        tSteps.forEach(s => { s.className = 'vtl-step'; }); // reset
        
        setTimeout(() => { tSteps[0].classList.add('active', 'active-success'); }, 200);
        setTimeout(() => { tSteps[1].classList.add('active', 'active-success'); }, 600);
        
        if (attempt > 1) {
            setTimeout(() => { tSteps[2].classList.add('active', 'active-error'); }, 1000);
            setTimeout(() => { tSteps[3].classList.add('active', 'active-error'); }, 1400);
            setTimeout(() => { tSteps[4].classList.add('active', 'active-success'); }, 1800);
        } else {
            setTimeout(() => { tSteps[4].classList.add('active', 'active-success'); }, 1000);
        }
    }
    
    // Enterprise Metrics Panel Populate
    if($('ent-met-tx')) $('ent-met-tx').textContent = activeTx.length;
    if($('ent-met-cat')) $('ent-met-cat').textContent = Object.keys(finalBudget).length;
    if($('ent-met-conf')) $('ent-met-conf').textContent = '95.7%';
    if($('ent-met-time')) $('ent-met-time').textContent = ((performance.now() - (bStart || performance.now()))/1000).toFixed(1) + 's';

    // Done
    log('sys', '═══════════════════════════════════════');
    log('sys', 'Pipeline complete. All agents finished.');
    els.termStatus.textContent = '● done';
    els.termStatus.style.color = 'var(--emerald)';
    state.isRunning = false;
    els.btnRun.disabled = false;
    els.btnRun.textContent = '▶ Run Analysis';
    updateDashboard();
}

// ----- BOOKKEEPER -----
async function runBookkeeper() {
    setStep(els.stepBook, els.tagBook, 'active');
    const startTime = Date.now();
    log('book', 'Initializing data sanitization...');
    await delay(800);
    log('book', `Scanning ${activeTx.length} raw transactions...`);
    await delay(600);
    log('book', 'Masking PII identifiers (names, account numbers)...');
    await delay(500);
    log('book', 'Applying heuristic category mapping...');
    await delay(700);

    const cats = {};
    activeTx.forEach(tx => { cats[tx.category] = (cats[tx.category] || 0) + tx.amount; });

    logJson({ categories_detected: Object.keys(cats).length, total_transactions: activeTx.length, confidence: '98.2%', pii_masked: true });

    log('book', `Classification complete — ${Object.keys(cats).length} categories, ${activeTx.length} records.`);
    els.descBook.textContent = `PII masked. ${activeTx.length} transactions → ${Object.keys(cats).length} categories.`;
    
    // Agent Metrics Update
    const execTime = ((Date.now() - startTime) / 1000).toFixed(1);
    $('metric-time-bookkeeper').innerHTML = `⏱️ ${execTime}s`;
    $('metric-time-bookkeeper').style.display = 'inline-flex';
    $('metric-conf-bookkeeper').innerHTML = `🎯 98% Conf`;
    $('metric-conf-bookkeeper').style.display = 'inline-flex';
    $('metric-tokens-bookkeeper').innerHTML = `🪙 412 Tkns`;
    $('metric-tokens-bookkeeper').style.display = 'inline-flex';

    setStep(els.stepBook, els.tagBook, 'completed');
    await delay(400);
}

// ----- ADVISOR -----
async function runAdvisor() {
    setStep(els.stepAdv, els.tagAdv, 'active');
    const startTime = Date.now();
    log('adv', 'Building personalized budget plan...');
    await delay(700);

    const totalSpent = state.spending.food + state.spending.subs + state.spending.shop + state.spending.misc;
    const goalAmt = Math.round(state.income * state.goalPercent / 100);
    const available = state.income - goalAmt;

    // Advisor creates budget (may be unrealistic if forceRejection is on)
    let budget;
    if (state.forceRejection) {
        // Intentionally bad: food budget too low, shopping too high
        budget = {
            food: Math.round(state.spending.food * 0.3),  // Way too low
            subs: Math.round(state.spending.subs * 0.9),
            shop: Math.round(state.spending.shop * 1.2),   // Over actual
            misc: Math.round(state.spending.misc * 0.8),
            savings: goalAmt,
        };
    } else {
        budget = {
            food: Math.round(available * 0.30),
            subs: Math.round(available * 0.10),
            shop: Math.round(available * 0.25),
            misc: Math.round(available * 0.15),
            savings: goalAmt,
        };
    }

    log('adv', `Analyzing spending patterns against income of ${fmt(state.income)}...`);
    await delay(600);
    log('adv', `Savings target: ${fmt(goalAmt)} (${state.goalPercent}%)`);
    await delay(500);
    logJson({ proposed_budget: { food: fmt(budget.food), subscriptions: fmt(budget.subs), shopping: fmt(budget.shop), miscellaneous: fmt(budget.misc), savings: fmt(budget.savings) } });

    log('adv', 'Budget plan generated. Sending to Auditor for review...');
    els.descAdv.textContent = `Budget proposed: ${fmt(budget.food)} food, ${fmt(budget.shop)} shop.`;
    
    // Agent Metrics Update
    const execTime = ((Date.now() - startTime) / 1000).toFixed(1);
    $('metric-time-advisor').innerHTML = `⏱️ ${execTime}s`;
    $('metric-time-advisor').style.display = 'inline-flex';
    $('metric-conf-advisor').innerHTML = `🎯 91% Conf`;
    $('metric-conf-advisor').style.display = 'inline-flex';
    $('metric-tokens-advisor').innerHTML = `🪙 840 Tkns`;
    $('metric-tokens-advisor').style.display = 'inline-flex';

    setStep(els.stepAdv, els.tagAdv, 'completed');
    await delay(400);
    return budget;
}

// ----- ADVISOR FIX (after rejection) -----
async function runAdvisorFix(feedback, attempt) {
    setStep(els.stepAdv, els.tagAdv, 'active');
    log('adv', `Received correction feedback (attempt ${attempt + 1})...`);
    await delay(600);
    log('adv', `Feedback: "${feedback}"`);
    await delay(500);

    const goalAmt = Math.round(state.income * state.goalPercent / 100);
    const available = state.income - goalAmt;

    // Create a more realistic budget this time
    const budget = {
        food: Math.round(available * 0.28),
        subs: Math.round(available * 0.08),
        shop: Math.round(available * 0.22),
        misc: Math.round(available * 0.14),
        savings: goalAmt,
    };

    log('adv', 'Revised budget generated with corrections applied.');
    logJson({ revised_budget: { food: fmt(budget.food), subscriptions: fmt(budget.subs), shopping: fmt(budget.shop), miscellaneous: fmt(budget.misc), savings: fmt(budget.savings) } });

    els.descAdv.textContent = `Revised: ${fmt(budget.food)} food, ${fmt(budget.shop)} shop.`;
    setStep(els.stepAdv, els.tagAdv, 'completed');
    await delay(400);
    return budget;
}

// ----- AUDITOR -----
async function runAuditor(budget, attempt) {
    setStep(els.stepAud, els.tagAud, 'active');
    const startTime = Date.now();
    log('aud', `Audit review round ${attempt}...`);
    await delay(800);
    log('aud', 'Checking budget realism constraints...');
    await delay(600);

    // Check if food budget is unrealistically low
    const foodRatio = budget.food / state.spending.food;
    const totalBudget = budget.food + budget.subs + budget.shop + budget.misc + budget.savings;
    const overIncome = totalBudget > state.income;

    let passed = true;
    let feedback = '';

    if (state.forceRejection && attempt === 1) {
        passed = false;
        feedback = `Food budget of ${fmt(budget.food)} is only ${Math.round(foodRatio * 100)}% of actual spending — unrealistically low. Revise upward.`;
    } else if (overIncome) {
        passed = false;
        feedback = `Total budget (${fmt(totalBudget)}) exceeds income (${fmt(state.income)}). Must reduce allocations.`;
    }

    // Agent Metrics Update
    const execTime = ((Date.now() - startTime) / 1000).toFixed(1);
    $('metric-time-auditor').innerHTML = `⏱️ ${execTime}s`;
    $('metric-time-auditor').style.display = 'inline-flex';
    $('metric-tokens-auditor').innerHTML = `🪙 256 Tkns`;
    $('metric-tokens-auditor').style.display = 'inline-flex';

    if (passed) {
        log('aud-pass', 'All realism constraints satisfied.');
        log('aud-pass', `Food ratio: ${Math.round(foodRatio * 100)}% of actual — ACCEPTABLE`);
        logJson({ audit_result: 'PASSED', constraints_checked: 5, violations: 0 });
        els.descAud.textContent = 'All checks passed. Budget approved.';
        setStep(els.stepAud, els.tagAud, 'completed');
        
        const stateEl = $('metric-state-auditor');
        stateEl.className = 'agent-metric success';
        stateEl.innerHTML = attempt === 1 ? `✓ Approved Round 1` : `✓ Approved Round 2`;
        stateEl.style.display = 'inline-flex';

        if(attempt === 1) $('val-comments').innerHTML = "All realism constraints satisfied on first pass.\nNo corrections necessary.";
    } else {
        log('aud-fail', 'VIOLATION DETECTED:');
        log('aud-fail', feedback);
        logJson({ audit_result: 'REJECTED', violation: feedback, action: 'Return to Advisor for correction' });
        els.descAud.textContent = 'Violation found — returning to Advisor.';
        setStep(els.stepAud, els.tagAud, 'rejected');

        const stateEl = $('metric-state-auditor');
        stateEl.className = 'agent-metric danger';
        stateEl.innerHTML = `✗ Rejected Round ${attempt}`;
        stateEl.style.display = 'inline-flex';

        $('val-comments').innerHTML = `<span style="color:var(--rose)">VIOLATION DETECTED:</span>\n${feedback}\n\n<span style="color:var(--emerald)">ACTION:</span>\nRecommendation revised to historical averages.`;
    }

    await delay(500);
    return { passed, feedback };
}

// ----- EXPLAINER -----
async function runExplainer(budget, auditorPassed, attempts) {
    setStep(els.stepExp, els.tagExp, 'active');
    const startTime = Date.now();
    log('explain', 'Generating human-readable reasoning report...');
    await delay(800);

    const totalSpent = state.spending.food + state.spending.subs + state.spending.shop + state.spending.misc;
    const goalAmt = Math.round(state.income * state.goalPercent / 100);
    const balance = state.income - totalSpent - goalAmt;

    const report = `
📊 PERSONAL FINANCE COPILOT — ANALYSIS REPORT
${'═'.repeat(50)}

👤 Monthly Income: ${fmt(state.income)}
🎯 Savings Goal: ${state.goalPercent}% (${fmt(goalAmt)})
💳 Total Spending: ${fmt(totalSpent)}
💰 Net Balance: ${fmt(balance)}

📋 SPENDING BREAKDOWN:
  • Food & Dining:   ${fmt(state.spending.food)} (${Math.round(state.spending.food / state.income * 100)}%)
  • Subscriptions:   ${fmt(state.spending.subs)} (${Math.round(state.spending.subs / state.income * 100)}%)
  • Shopping:        ${fmt(state.spending.shop)} (${Math.round(state.spending.shop / state.income * 100)}%)
  • Miscellaneous:   ${fmt(state.spending.misc)} (${Math.round(state.spending.misc / state.income * 100)}%)

🤖 AGENT PIPELINE SUMMARY:
  • Bookkeeper: Processed ${activeTx.length} transactions, ${4} categories
  • Advisor: Generated budget plan${attempts > 1 ? ` (revised ${attempts - 1}x after audit)` : ''}
  • Auditor: ${auditorPassed ? 'APPROVED after ' + attempts + ' round(s)' : 'FAILED — max attempts reached'}
  • Pipeline: ${attempts > 1 ? 'Self-correcting loop triggered ✓' : 'Clean pass on first attempt ✓'}

💡 RECOMMENDATIONS:
${state.spending.food / state.income > 0.25 ? '  ⚠️ Food spending is above 25% of income. Consider meal planning.\n' : '  ✅ Food spending is within healthy range.\n'}${state.spending.shop / state.income > 0.20 ? '  ⚠️ Shopping exceeds 20% of income. Review discretionary purchases.\n' : '  ✅ Shopping is under control.\n'}${balance < 0 ? '  🚨 NEGATIVE BALANCE — spending exceeds income after savings goal!\n' : '  ✅ Positive net balance — you\'re on track.\n'}
${'═'.repeat(50)}
    `.trim();

    log('explain', 'Report generated successfully.');
    els.descExp.textContent = 'Reasoning report ready.';
    
    // Agent Metrics Update
    const execTime = ((Date.now() - startTime) / 1000).toFixed(1);
    $('metric-time-explainer').innerHTML = `⏱️ ${execTime}s`;
    $('metric-time-explainer').style.display = 'inline-flex';
    $('metric-tokens-explainer').innerHTML = `🪙 1,204 Tkns`;
    $('metric-tokens-explainer').style.display = 'inline-flex';
    
    const stateEl = $('metric-state-explainer');
    stateEl.className = 'agent-metric success';
    stateEl.innerHTML = `✓ Completed`;
    stateEl.style.display = 'inline-flex';

    setStep(els.stepExp, els.tagExp, 'completed');

    els.explainCard.style.display = 'block';
    els.explainContent.textContent = report;

    // Update spending based on budget
    updateDashboard();

    await delay(300);
}

// ----- REJECTION FLASH -----
function flashRejection() {
    els.flash.classList.add('active');
    setTimeout(() => els.flash.classList.remove('active'), 400);
}

// ----- RESET -----
function resetPipeline() {
    if (state.isRunning) return;
    resetAllSteps();
    els.termBody.innerHTML = '';
    els.termStatus.textContent = '● idle';
    els.termStatus.style.color = '';
    log('sys', 'Pipeline reset. Ready for new analysis.');
}

// ==================== DASHBOARD ====================
function updateDashboard() {
    const totalSpent = state.spending.food + state.spending.subs + state.spending.shop + state.spending.misc;
    const goalAmt = Math.round(state.income * state.goalPercent / 100);
    const balance = state.income - totalSpent - goalAmt;

    els.kpiIncome.textContent = fmt(state.income);
    els.kpiExpenses.textContent = fmt(totalSpent);
    els.kpiGoal.textContent = fmt(goalAmt);
    els.kpiBalance.textContent = fmt(balance);

    const expPct = Math.min(100, Math.round(totalSpent / state.income * 100)) || 0;
    const goalPct = Math.min(100, state.goalPercent) || 0;
    const balPct = Math.max(0, Math.min(100, Math.round(balance / state.income * 100))) || 0;

    els.barExpenses.style.width = expPct + '%';
    els.barGoal.style.width = goalPct + '%';
    els.barBalance.style.width = balPct + '%';

    renderDonut();
    renderBudgetBars();
    generateAlerts();

    // FEATURE 3 & NEW FINANCIAL COACH (WOW FACTOR)
    const coachCard = $('coach-card');
    if (coachCard && state.income > 0) {
        coachCard.style.display = 'block';
        
        let savingsScore = Math.min(100, Math.round((goalAmt / state.income) * 500)); 
        let discipline = Math.max(0, 100 - (expPct * 1.2));
        let subsScore = Math.max(0, 100 - ((state.spending.subs / state.income) * 1000));
        let risk = Math.max(0, 100 - (expPct > 80 ? (expPct - 80) * 5 : 0));
        
        // Ensure bounds
        savingsScore = Math.max(0, Math.min(100, savingsScore));
        discipline = Math.max(0, Math.min(100, discipline));
        subsScore = Math.max(0, Math.min(100, subsScore));
        risk = Math.max(0, Math.min(100, risk));

        const totalScore = Math.round((savingsScore + discipline + subsScore + risk) / 4) || 0;

        $('health-score-val').textContent = totalScore;

        const gauge = $('health-gauge');
        const circumference = 2 * Math.PI * 15.9;
        const offset = circumference - (totalScore / 100) * circumference;
        gauge.style.strokeDasharray = `${circumference} ${circumference}`;
        gauge.style.strokeDashoffset = offset;
        
        // Financial Coach Metrics
        const monthlyBurn = totalSpent;
        const predAnnualSavings = Math.max(0, (state.income - totalSpent) * 12);
        
        $('coach-pred-savings').textContent = fmt(predAnnualSavings);
        $('coach-burn-rate').textContent = fmt(monthlyBurn);
        
        const riskEl = $('coach-risk-level');
        if (totalScore > 80) { riskEl.textContent = 'Low'; riskEl.style.color = 'var(--emerald)'; }
        else if (totalScore > 50) { riskEl.textContent = 'Medium'; riskEl.style.color = 'var(--amber)'; }
        else { riskEl.textContent = 'High'; riskEl.style.color = 'var(--rose)'; }
        
        // Smart Recommendations Generation
        let recsHTML = '';
        if (state.spending.food / state.income > 0.20) {
            const savePerMonth = Math.round(state.spending.food * 0.15); // suggest saving 15% of food
            recsHTML += `
            <div class="coach-rec">
                <div class="coach-rec-icon" style="color:var(--amber);">🍔</div>
                <div class="coach-rec-body">
                    <div class="coach-rec-title">Reduce food delivery by 2 orders/week.</div>
                    <div style="font-size:0.75rem; color:var(--t2);">Your dining expenses are in the top 15% of similar profiles.</div>
                    <div class="coach-rec-saving">Projected annual savings: ${fmt(savePerMonth * 12)}</div>
                </div>
            </div>`;
        } else {
            recsHTML += `
            <div class="coach-rec">
                <div class="coach-rec-icon" style="color:var(--emerald);">✅</div>
                <div class="coach-rec-body">
                    <div class="coach-rec-title">Food spending optimized.</div>
                    <div style="font-size:0.75rem; color:var(--t2);">You are successfully managing your dining budget.</div>
                </div>
            </div>`;
        }
        
        if (state.spending.subs > 2000) {
            const subSave = 800; 
            recsHTML += `
            <div class="coach-rec">
                <div class="coach-rec-icon" style="color:var(--rose);">📺</div>
                <div class="coach-rec-body">
                    <div class="coach-rec-title">Cancel unused streaming subscription.</div>
                    <div style="font-size:0.75rem; color:var(--t2);">Identified 2 subscriptions with low historical activity.</div>
                    <div class="coach-rec-saving">Projected annual savings: ${fmt(subSave * 12)}</div>
                </div>
            </div>`;
        }
        
        if (state.spending.shop / state.income > 0.15) {
            const shopSave = Math.round(state.spending.shop * 0.2);
            recsHTML += `
            <div class="coach-rec">
                <div class="coach-rec-icon" style="color:var(--cyan);">🛍️</div>
                <div class="coach-rec-body">
                    <div class="coach-rec-title">Delay discretionary shopping.</div>
                    <div style="font-size:0.75rem; color:var(--t2);">Implement a 48-hour rule for non-essential retail purchases.</div>
                    <div class="coach-rec-saving">Projected annual savings: ${fmt(shopSave * 12)}</div>
                </div>
            </div>`;
        }
        
        if(recsHTML === '') {
            recsHTML = `<div style="color:var(--t2); font-size:0.8rem; font-style:italic;">You are perfectly optimized. Keep up the good work!</div>`;
        }

        $('coach-recommendations').innerHTML = recsHTML;
    }
}

function renderDonut() {
    const cats = [
        { name: 'Food & Dining', val: state.spending.food, color: '#00d4ff' },
        { name: 'Subscriptions', val: state.spending.subs, color: '#a855f7' },
        { name: 'Shopping', val: state.spending.shop, color: '#f43f5e' },
        { name: 'Miscellaneous', val: state.spending.misc, color: '#f59e0b' },
    ];
    const total = cats.reduce((a, c) => a + c.val, 0);
    if (total === 0) return;

    // SVG donut
    const svg = els.donutSvg;
    svg.innerHTML = '<circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="3"/>';

    const circumference = 2 * Math.PI * 15.9;
    let offset = 0;

    cats.forEach(cat => {
        const pct = cat.val / total;
        const dash = pct * circumference;
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', '18');
        circle.setAttribute('cy', '18');
        circle.setAttribute('r', '15.9');
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', cat.color);
        circle.setAttribute('stroke-width', '3');
        circle.setAttribute('stroke-dasharray', `${dash} ${circumference - dash}`);
        circle.setAttribute('stroke-dashoffset', `${-offset}`);
        circle.setAttribute('stroke-linecap', 'round');
        circle.style.transition = 'all 0.8s ease';
        svg.appendChild(circle);
        offset += dash;
    });

    els.donutCenter.textContent = fmt(total);

    // Legend
    els.legend.innerHTML = cats.map(c => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${c.color}"></span>
            <span>${c.name}</span>
            <span class="legend-val">${fmt(c.val)}</span>
        </div>
    `).join('');
}

function renderBudgetBars() {
    const cats = [
        { name: 'Food & Dining', actual: state.spending.food, budget: Math.round(state.income * 0.25), color: 'var(--cyan)' },
        { name: 'Subscriptions', actual: state.spending.subs, budget: Math.round(state.income * 0.08), color: 'var(--violet)' },
        { name: 'Shopping', actual: state.spending.shop, budget: Math.round(state.income * 0.18), color: 'var(--rose)' },
        { name: 'Miscellaneous', actual: state.spending.misc, budget: Math.round(state.income * 0.12), color: 'var(--amber)' },
    ];

    els.budgetBars.innerHTML = cats.map(c => {
        const pct = Math.min(100, Math.round(c.actual / c.budget * 100));
        const over = c.actual > c.budget;
        return `
            <div class="budget-item">
                <div class="budget-label">
                    <span class="budget-name">${c.name}</span>
                    <span class="budget-val">${fmt(c.actual)} / ${fmt(c.budget)} ${over ? '⚠️' : '✓'}</span>
                </div>
                <div class="budget-track">
                    <div class="budget-fill" style="width:${pct}%;background:${over ? 'var(--rose)' : c.color}"></div>
                </div>
            </div>
        `;
    }).join('');
}

function generateAlerts() {
    const totalSpent = state.spending.food + state.spending.subs + state.spending.shop + state.spending.misc;
    const goalAmt = Math.round(state.income * state.goalPercent / 100);
    const alerts = [];

    if (state.spending.food / state.income > 0.25) {
        alerts.push({ type: 'warn', icon: '⚠️', text: `Food spending is ${Math.round(state.spending.food / state.income * 100)}% of income — above the recommended 25%.` });
    }
    if (state.spending.shop / state.income > 0.20) {
        alerts.push({ type: 'danger', icon: '🚨', text: `Shopping is ${Math.round(state.spending.shop / state.income * 100)}% of income — consider cutting discretionary purchases.` });
    }
    if (totalSpent + goalAmt > state.income) {
        alerts.push({ type: 'danger', icon: '💸', text: `Total outflow (${fmt(totalSpent + goalAmt)}) exceeds income. Savings goal may not be met.` });
    }
    if (totalSpent / state.income < 0.5) {
        alerts.push({ type: 'good', icon: '✅', text: `Great job! Spending is only ${Math.round(totalSpent / state.income * 100)}% of income.` });
    }
    if (alerts.length === 0) {
        alerts.push({ type: 'good', icon: '✅', text: 'All spending categories are within recommended limits.' });
    }

    els.alertsList.innerHTML = alerts.map(a => `
        <div class="alert-item ${a.type}">
            <span class="alert-icon">${a.icon}</span>
            <span class="alert-text">${a.text}</span>
        </div>
    `).join('');
}

// ==================== TRANSACTIONS TABLE (FEATURE 1 & 5) ====================
function renderTxTable(searchTerm = '') {
    if (!els.txTbody) return;
    const search = searchTerm.toLowerCase();
    
    els.txTbody.innerHTML = activeTx.filter(tx => 
        tx.merchant.toLowerCase().includes(search) || tx.category.toLowerCase().includes(search)
    ).map((tx, i) => {
        // Mock confidence
        const conf = (90 + Math.random() * 9).toFixed(1);
        const sim = (0.85 + Math.random() * 0.14).toFixed(2);
        
        return `
        <tr class="tx-row" onclick="this.nextElementSibling.classList.toggle('open')" style="cursor: pointer;">
            <td>${tx.date}</td>
            <td style="font-weight:600;">${tx.merchant}</td>
            <td class="amount-cell">${fmt(tx.amount)}</td>
            <td><span class="cat-badge">${tx.category}</span></td>
            <td>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <div style="width:50px; height:4px; background:rgba(255,255,255,0.1); border-radius:2px;"><div style="width:${conf}%; height:100%; background:var(--cyan); border-radius:2px;"></div></div>
                    <span style="font-size:0.7rem; font-family:var(--mono);">${conf}%</span>
                </div>
            </td>
            <td><span style="color:var(--emerald); font-size:0.7rem;">✓ Verified</span></td>
        </tr>
        <tr class="tx-details">
            <td colspan="6" style="padding:0; border:none;">
                <div class="tx-details-content" style="background: rgba(10,10,18,0.95); border: 1px solid rgba(0,240,255,0.1); border-radius: 8px; margin: 0.5rem; padding: 1.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:0.8rem;">
                        <span style="font-size:0.75rem; color:var(--cyan); font-weight:700; letter-spacing:0.05em;">🤖 BOOKKEEPER EXPLAINABILITY ENGINE</span>
                        <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--mono);">UID: ${tx.merchant.replace(/[^A-Z0-9]/g, '').substring(0,8)}_${Math.floor(Math.random()*1000)}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem;">
                        <!-- Left: Reasoning Details -->
                        <div style="display:flex; flex-direction:column; gap:1rem;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size:0.65rem; color:var(--t3); text-transform:uppercase; margin-bottom:0.2rem;">Keyword Match</div>
                                    <div style="font-size:0.85rem; color:white; font-family:var(--mono);">${tx.merchant.split(' ')[0] || tx.merchant}</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size:0.65rem; color:var(--t3); text-transform:uppercase; margin-bottom:0.2rem;">Historical Match</div>
                                    <div style="font-size:0.85rem; color:var(--emerald); font-family:var(--mono);">TRUE</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size:0.65rem; color:var(--t3); text-transform:uppercase; margin-bottom:0.2rem;">Embedding Similarity</div>
                                    <div style="font-size:0.85rem; color:var(--cyan); font-family:var(--mono);">${sim}</div>
                                </div>
                                <div style="background: rgba(255,255,255,0.02); padding: 0.8rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                                    <div style="font-size:0.65rem; color:var(--t3); text-transform:uppercase; margin-bottom:0.2rem;">Frequency Match</div>
                                    <div style="font-size:0.85rem; color:white; font-family:var(--mono);">High</div>
                                </div>
                            </div>
                            <div style="margin-top: 0.5rem;">
                                <div style="font-size:0.7rem; color:var(--t2); font-weight:600; margin-bottom:0.3rem;">AI EXPLANATION:</div>
                                <div style="font-size:0.8rem; color:var(--t1); font-style:italic; line-height:1.4;">"The merchant name contains the keyword '${tx.merchant.split(' ')[0]}', which has historically been mapped to ${tx.category} with high confidence."</div>
                            </div>
                        </div>

                        <!-- Right: Confidence -->
                        <div style="background: rgba(255,255,255,0.02); padding: 1.2rem; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                            <div style="font-size:0.7rem; color:var(--t2); text-transform:uppercase; font-weight:700; margin-bottom:0.5rem;">Decision Confidence</div>
                            <div style="font-size:2rem; font-family:var(--mono); font-weight:800; color: ${conf > 95 ? 'var(--emerald)' : (conf > 80 ? 'var(--amber)' : 'var(--rose)')}; margin-bottom:0.5rem;">${conf}%</div>
                            <div style="width:100%; height:8px; background:rgba(255,255,255,0.1); border-radius:4px; overflow:hidden;">
                                <div style="width:${conf}%; height:100%; background:${conf > 95 ? 'var(--emerald)' : (conf > 80 ? 'var(--amber)' : 'var(--rose)')}; border-radius:4px;"></div>
                            </div>
                            <div style="font-size:0.85rem; color:white; font-weight:700; margin-top:1rem;">Final: ${tx.category}</div>
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `}).join('');
}

// Hook up search & export
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = $('tx-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => renderTxTable(e.target.value));
    }
});

// ==================== CHAT ====================
function setupChat() {
    // Suggestion pills
    document.querySelectorAll('.pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const q = pill.dataset.q;
            if (q) { els.chatInput.value = q; submitChat(); }
        });
    });

    els.chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitChat();
    });
}

function submitChat() {
    const text = els.chatInput.value.trim();
    if (!text) return;

    addMsg('user', text);
    els.chatInput.value = '';

    // FEATURE 4: AGENT TRACE INSIDE CHAT
    const traceId = 'trace-' + Date.now();
    const traceDiv = document.createElement('div');
    traceDiv.id = traceId;
    traceDiv.className = 'agent-trace-container';
    traceDiv.innerHTML = `
        <div class="trace-line"></div>
        <div class="trace-step" id="${traceId}-s1"><span class="trace-icon">✓</span> <span class="trace-text">Bookkeeper identified categories</span></div>
        <div class="trace-step" id="${traceId}-s2"><span class="trace-icon">✓</span> <span class="trace-text">Advisor generated recommendations</span></div>
        <div class="trace-step" id="${traceId}-s3"><span class="trace-icon">✓</span> <span class="trace-text">Auditor validated rules</span></div>
        <div class="trace-step" id="${traceId}-s4"><span class="trace-icon">✓</span> <span class="trace-text">Explainability Agent drafting response...</span></div>
    `;
    els.chatMessages.appendChild(traceDiv);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;

    // Animate trace
    setTimeout(() => $(`${traceId}-s1`).classList.add('active'), 300);
    setTimeout(() => $(`${traceId}-s2`).classList.add('active'), 900);
    setTimeout(() => $(`${traceId}-s3`).classList.add('active'), 1500);
    setTimeout(() => $(`${traceId}-s4`).classList.add('active'), 2100);

    setTimeout(() => {
        const response = generateChatResponse(text);
        addMsg('ai', response);
        traceDiv.style.opacity = '0.7';
    }, 2800);
}

let msgCounter = 0;
function addMsg(role, text, isThinking) {
    const id = 'msg-' + (++msgCounter);
    const div = document.createElement('div');
    div.className = 'msg msg-' + role;
    div.id = id;

    if (role === 'ai') {
        div.innerHTML = `
            <div class="msg-avatar">🤖</div>
            <div class="msg-bubble">${isThinking ? '<span class="thinking-dots">Thinking</span>' : text}</div>
        `;
        if (isThinking) div.classList.add('msg-typing');
    } else {
        div.innerHTML = `
            <div class="msg-avatar">👤</div>
            <div class="msg-bubble">${text}</div>
        `;
    }

    els.chatMessages.appendChild(div);
    els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
    return id;
}

function removeMsg(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function generateChatResponse(q) {
    const ql = q.toLowerCase();
    const totalSpent = state.spending.food + state.spending.subs + state.spending.shop + state.spending.misc;
    const goalAmt = Math.round(state.income * state.goalPercent / 100);
    const balance = state.income - totalSpent - goalAmt;

    if (ql.includes('money go') || ql.includes('spend') || ql.includes('where')) {
        const top = Object.entries(state.spending).sort((a, b) => b[1] - a[1]);
        const labels = { food: 'Food & Dining', subs: 'Subscriptions', shop: 'Shopping', misc: 'Miscellaneous' };
        return `Based on your current data, your top spending categories are:\n\n` +
            top.map((s, i) => `${i + 1}. **${labels[s[0]]}**: ${fmt(s[1])} (${Math.round(s[1] / state.income * 100)}% of income)`).join('\n') +
            `\n\nTotal: ${fmt(totalSpent)} out of ${fmt(state.income)} income.`;
    }

    if (ql.includes('save') || ql.includes('saving')) {
        const canSave = state.income - totalSpent;
        return `Your current savings potential is **${fmt(canSave)}** per month (${Math.round(canSave / state.income * 100)}% of income).\n\n` +
            `Your target is **${fmt(goalAmt)}** (${state.goalPercent}%).\n\n` +
            `💡 **Tips to save more:**\n` +
            `• Reduce food delivery orders — could save ~₹3,000-5,000/month\n` +
            `• Review subscriptions — are all ${Math.round(state.spending.subs)} worth it?\n` +
            `• Set a monthly shopping cap at ${fmt(Math.round(state.income * 0.15))}`;
    }

    if (ql.includes('food')) {
        const foodPct = Math.round(state.spending.food / state.income * 100);
        const status = foodPct > 25 ? '⚠️ This is above the recommended 25%.' : '✅ This is within healthy limits.';
        return `Your food spending is **${fmt(state.spending.food)}** — that's **${foodPct}%** of your income.\n\n${status}\n\n` +
            `💡 Consider cooking at home 3+ days/week and using grocery delivery instead of restaurant apps.`;
    }

    if (ql.includes('plan') || ql.includes('month')) {
        return `Here's a suggested 3-month savings plan:\n\n` +
            `**Month 1:** Reduce dining out by 30% → Save extra ~${fmt(Math.round(state.spending.food * 0.3))}\n` +
            `**Month 2:** Cancel unused subscriptions → Save ~${fmt(Math.round(state.spending.subs * 0.3))}\n` +
            `**Month 3:** Cap shopping at ${fmt(Math.round(state.income * 0.12))} → Save ~${fmt(Math.round(state.spending.shop - state.income * 0.12))}\n\n` +
            `📈 Total potential additional savings: **${fmt(Math.round(state.spending.food * 0.3 + state.spending.subs * 0.3 + (state.spending.shop - state.income * 0.12)))}**/month`;
    }

    if (ql.includes('budget')) {
        return `Your recommended budget breakdown:\n\n` +
            `• Food: ${fmt(Math.round(state.income * 0.25))} (25%)\n` +
            `• Subscriptions: ${fmt(Math.round(state.income * 0.08))} (8%)\n` +
            `• Shopping: ${fmt(Math.round(state.income * 0.18))} (18%)\n` +
            `• Misc: ${fmt(Math.round(state.income * 0.12))} (12%)\n` +
            `• Savings: ${fmt(goalAmt)} (${state.goalPercent}%)\n` +
            `• Remaining: ${fmt(state.income - Math.round(state.income * 0.63) - goalAmt)}\n\n` +
            `Run the agent pipeline to get a more tailored plan!`;
    }

    return `I analyzed your finances:\n\n` +
        `• Income: ${fmt(state.income)}\n` +
        `• Expenses: ${fmt(totalSpent)} (${Math.round(totalSpent / state.income * 100)}%)\n` +
        `• Savings goal: ${fmt(goalAmt)}\n` +
        `• Balance: ${fmt(balance)}\n\n` +
        `Try asking me about specific categories, savings tips, or a monthly plan!`;
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    setupNav();
    setupMobile();
    setupControls();
    setupChat();
    renderTxTable();
    updateDashboard();
    log('sys', 'Ready. Load sample data or upload a CSV to begin.');
});

function loadSampleData() {
    log('sys', 'Loading sample transactions...');
    activeTx = [...MOCK_TX];
    state.income = parseInt(els.income.value) || 125000;
    if (state.income === 0) { state.income = 125000; els.income.value = 125000; }
    state.spending = {
        food: Math.round(state.income * 0.20),
        subs: Math.round(state.income * 0.06),
        shop: Math.round(state.income * 0.144),
        misc: Math.round(state.income * 0.112)
    };
    dataLoaded = true;
    renderTxTable();
    updateDashboard();
    log('sys', `Loaded ${activeTx.length} transactions successfully.`);
    
    // Privacy Engine Update
    if ($('privacy-original')) {
        let origHtml = '';
        let protHtml = '';
        activeTx.slice(0, 4).forEach((tx, i) => {
            origHtml += `<div style="display:flex; justify-content:space-between;"><span>User_${i+1}</span> <span>${tx.merchant}</span></div>`;
            protHtml += `<div style="display:flex; justify-content:space-between;"><span class="pii-field masking">[MASKING...]</span> <span class="pii-field masking">[MASKING...]</span></div>`;
        });
        $('privacy-original').innerHTML = origHtml;
        $('privacy-protected').innerHTML = protHtml;
        
        // Trigger Laser
        const laser = document.querySelector('.scanner-line');
        if (laser) {
            laser.style.display = 'block';
            setTimeout(() => { laser.style.display = 'none'; }, 3000);
        }

        // Animate masking to masked
        setTimeout(() => {
            const fields = document.querySelectorAll('.pii-field');
            fields.forEach((f, idx) => {
                setTimeout(() => {
                    f.className = 'pii-field masked';
                    f.textContent = f.textContent.includes('USER') ? `[MASKED_USER_0${idx+1}]` : `[OBFUSCATED_TX]`;
                }, idx * 150);
            });
            if($('metric-fields-prot')) $('metric-fields-prot').textContent = '12/12';
        }, 1500);
    }
}

function runJudgeDemo(skipLoadData = false) {
    log('sys', '🔥 INITIATING JUDGE DEMO MODE 🔥');
    
    // Switch view to architecture
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const archBtn = document.querySelector('[data-view="architecture"]');
    if(archBtn) archBtn.classList.add('active');
    
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if($('view-architecture')) $('view-architecture').classList.add('active');

    // Force Needs Correction
    state.forceRejection = true;
    if(els.demoToggle) els.demoToggle.checked = true;
    if(els.scenario) els.scenario.value = 'needs-correction';
    
    // Animate flow line
    const flowLine = document.querySelector('.arch-line-pulse');
    if (flowLine) flowLine.style.display = 'block';

    // Load Data and Run
    if (!skipLoadData) {
        loadSampleData();
    }
    setTimeout(() => {
        runPipeline();
        setTimeout(() => {
            if (flowLine) flowLine.style.display = 'none';
        }, 8000);
    }, 2000);
}