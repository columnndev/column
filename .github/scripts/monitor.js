const fs = require('fs');
const http = require('http');

const BNET_URL = 'http://us.patch.battle.net:1119/pro/versions';
const CONFIG_FILE = './config.js';
const BUILD_FILE = './current_build.txt';
const HISTORY_FILE = './status-history.json';

// ── Downtime log ────────────────────────────────────────────────────────────
// The status page calculates uptime from this, so an outage has to record both
// ends. Detecting the start is easy (build changed). The end is when a human
// has finished the offsets and set cheatStatus back off UPDATING - this script
// runs every 10 minutes regardless, so it closes the open entry the first time
// it sees the status is no longer UPDATING. Granularity is therefore ~10 min.
function readHistory() {
    try {
        return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) {
        return { reportedBans: 0, uptimeWindowDays: 30, downtime: [] };
    }
}

function writeHistory(h) {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(h, null, 2) + '\n');
}

// Current status straight out of config.js, without needing to import it.
function currentStatus() {
    try {
        const m = fs.readFileSync(CONFIG_FILE, 'utf8').match(/cheatStatus:\s*"([^"]+)"/);
        return m ? m[1].toUpperCase() : 'UNDETECTED';
    } catch (e) {
        return 'UNDETECTED';
    }
}

function markDown(build) {
    const h = readHistory();
    if (!Array.isArray(h.downtime)) h.downtime = [];
    // Already have an outage open? Don't start a second one.
    if (h.downtime.some(d => !d.end)) return false;
    h.downtime.push({
        start: new Date().toISOString(),
        end: null,
        build: String(build),
        reason: 'Overwatch build update - offsets rebuilt'
    });
    writeHistory(h);
    return true;
}

function markUp() {
    const h = readHistory();
    if (!Array.isArray(h.downtime)) return false;
    const open = h.downtime.filter(d => !d.end);
    if (!open.length) return false;
    const now = new Date().toISOString();
    open.forEach(d => { d.end = now; });
    writeHistory(h);
    return true;
}

http.get(BNET_URL, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Parse BNET format
        const lines = data.split('\n');
        let currentBuild = null;
        for (const line of lines) {
            if (line.startsWith('us|')) {
                const parts = line.split('|');
                currentBuild = parts[4]; // BuildId
                break;
            }
        }

        if (!currentBuild) {
            console.error('Failed to parse build ID from Battle.net');
            process.exit(1);
        }

        console.log('Battle.net Current Build:', currentBuild);

        // Read stored build
        let storedBuild = '';
        if (fs.existsSync(BUILD_FILE)) {
            storedBuild = fs.readFileSync(BUILD_FILE, 'utf8').trim();
        }

        if (storedBuild && currentBuild !== storedBuild) {
            console.log(`Update detected! Previous: ${storedBuild}, New: ${currentBuild}`);
            
            // Overwrite config.js to disable loader
            const newConfig = `// --- Global Site Configuration ---
// Automatically updated by GitHub Actions bot when Overwatch updates.

const CONFIG = {
    // Cheat Status: "UNDETECTED", "UPDATING", "TESTING", "DETECTED"
    cheatStatus: "UPDATING",
    
    // Set to false to disable the 'Download Loader' button in the portal
    loaderEnabled: false,
    
    // Message to show if the loader is disabled (e.g., when updating)
    disabledMessage: "Overwatch just updated to build ${currentBuild}. We are currently updating offsets. Please check Discord for ETA."
};`;
            
            fs.writeFileSync(CONFIG_FILE, newConfig);
            fs.writeFileSync(BUILD_FILE, currentBuild);
            markDown(currentBuild);
            console.log('Downtime entry opened.');

            // Inform GitHub action that we made a change
            require('child_process').execSync('echo "updated=true" >> $GITHUB_OUTPUT');
        } else {
            console.log('No update detected. Everything is up to date.');

            // Build is unchanged. If someone has flipped the status back off
            // UPDATING since the last run, the outage is over - close it so the
            // uptime figure reflects reality.
            let closed = false;
            if (currentStatus() !== 'UPDATING') {
                closed = markUp();
                if (closed) console.log('Downtime entry closed - service is back up.');
            }

            if (!storedBuild) {
                fs.writeFileSync(BUILD_FILE, currentBuild);
                require('child_process').execSync('echo "updated=true" >> $GITHUB_OUTPUT');
            } else {
                require('child_process').execSync(`echo "updated=${closed}" >> $GITHUB_OUTPUT`);
            }
        }
    });
}).on('error', err => {
    console.error('Network Error:', err.message);
    process.exit(1);
});
