const fs = require('fs');
let lines = fs.readFileSync('c:/Users/kuhug/OneDrive/Desktop/Personal Finance Copilot/app.js', 'utf8').split('\n');
let keepLines = lines.slice(0, 1268);
const newLines = `        // Animate masking to masked
        setTimeout(() => {
            const fields = document.querySelectorAll('.pii-field');
            fields.forEach((f, idx) => {
                setTimeout(() => {
                    f.className = 'pii-field masked';
                    f.textContent = f.textContent.includes('USER') ? \`[MASKED_USER_0\${idx+1}]\` : \`[OBFUSCATED_TX]\`;
                }, idx * 150);
            });
            if($('metric-fields-prot')) $('metric-fields-prot').textContent = '12/12';
        }, 1500);
    }
}

function runJudgeDemo() {
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
    loadSampleData();
    setTimeout(() => {
        runPipeline();
        setTimeout(() => {
            if (flowLine) flowLine.style.display = 'none';
        }, 8000);
    }, 2000);
}`;
fs.writeFileSync('c:/Users/kuhug/OneDrive/Desktop/Personal Finance Copilot/app.js', keepLines.join('\n') + '\n' + newLines);
console.log('Fixed app.js');
