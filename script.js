// DOM Elements
const inputs = document.querySelectorAll('input');
const ctxMonthly = document.getElementById('monthlyChart').getContext('2d');
const ctxNetWorth = document.getElementById('netWorthChart').getContext('2d');

let monthlyChartInstance = null;
let netWorthChartInstance = null;

// Helper function: PMT Calculation
function calculatePMT(rate, nper, pv) {
    if (rate === 0) return pv / nper;
    if (nper === 0) return 0;
    const pvif = Math.pow(1 + rate, nper);
    return (rate * pv * pvif) / (pvif - 1);
}

// Chart Global Settings
Chart.defaults.color = '#94a3b8';
Chart.defaults.font.family = "'Outfit', sans-serif";

function updateDashboard() {
    // ==== GLOBAL ASSUMPTIONS ====
    const sellRate = parseFloat(document.getElementById('global-selling-costs').value) / 100;
    const apprecRate = parseFloat(document.getElementById('global-home-apprec').value) / 100;
    const invRate = parseFloat(document.getElementById('global-inv-return').value) / 100;

    // ==== CURRENT PROPERTY ====
    const currValue = parseFloat(document.getElementById('curr-value').value);
    const currBal = parseFloat(document.getElementById('curr-balance').value);
    const currRate = parseFloat(document.getElementById('curr-rate').value) / 100;
    const currPMT = parseFloat(document.getElementById('curr-pmt').value);
    
    const currTaxes = parseFloat(document.getElementById('curr-taxes').value) || 0;
    const currIns = parseFloat(document.getElementById('curr-ins').value) || 0;
    const currMaint = parseFloat(document.getElementById('curr-maint').value) || 0;
    
    const currUtils = ['gas', 'elec', 'water', 'trash', 'int'].reduce((sum, u) => 
        sum + (parseFloat(document.getElementById(`curr-${u}`).value) || 0), 0);
    
    const currMonthlyTotal = currPMT + currTaxes + currIns + currMaint + currUtils;

    // ==== TOWNHOME ====
    const townPrice = parseFloat(document.getElementById('town-price').value);
    const townRate = parseFloat(document.getElementById('town-rate').value) / 100;
    const townTerm = parseFloat(document.getElementById('town-term').value) * 12;

    const townTaxes = parseFloat(document.getElementById('town-taxes').value) || 0;
    const townIns = parseFloat(document.getElementById('town-ins').value) || 0;
    const townHoa = parseFloat(document.getElementById('town-hoa').value) || 0;

    const townUtils = ['gas', 'elec', 'water', 'trash', 'int'].reduce((sum, u) => 
        sum + (parseFloat(document.getElementById(`town-${u}`).value) || 0), 0);

    const netProceeds = (currValue * (1 - sellRate)) - currBal;
    const isPayCash = document.getElementById('town-pay-cash').checked;
    
    let townLoan = Math.max(0, townPrice - netProceeds);
    let townStartingCapital = 0;
    
    if (isPayCash) {
        townLoan = 0;
        townStartingCapital = netProceeds - townPrice;
    }

    const townPMT = calculatePMT(townRate / 12, townTerm, townLoan);
    const townMonthlyTotal = townPMT + townTaxes + townIns + townHoa + townUtils;

    // ==== RENT & INVEST ====
    const rentMonthly = parseFloat(document.getElementById('rent-monthly').value) || 0;
    const rentIns = parseFloat(document.getElementById('rent-ins').value) || 0;
    
    const rentUtils = ['gas', 'elec', 'water', 'trash', 'int'].reduce((sum, u) => 
        sum + (parseFloat(document.getElementById(`rent-${u}`).value) || 0), 0);

    const rentMonthlyTotal = rentMonthly + rentIns + rentUtils;
    const rentStartingCapital = netProceeds;

    // UPDATE UI TEXT
    document.getElementById('curr-total-display').innerText = `$${Math.round(currMonthlyTotal).toLocaleString()}`;
    document.getElementById('town-total-display').innerText = `$${Math.round(townMonthlyTotal).toLocaleString()}`;
    document.getElementById('rent-total-display').innerText = `$${Math.round(rentMonthlyTotal).toLocaleString()}`;

    // Delta Updates
    const setDelta = (id, currentTotal, baselineTotal) => {
        const el = document.getElementById(id);
        const diff = currentTotal - baselineTotal;
        const sign = diff > 0 ? '+' : '';
        el.innerText = `Δ ${sign}$${Math.round(diff)}`;
        el.className = `delta-badge ${diff > 0 ? 'positive' : 'negative'}`;
        if (Math.abs(diff) < 1) el.style.display = 'none';
        else el.style.display = 'block';
    };

    setDelta('town-delta', townMonthlyTotal, currMonthlyTotal);
    setDelta('rent-delta', rentMonthlyTotal, currMonthlyTotal);

    // ===========================
    // UPDATE MONTHLY CHART
    // ===========================
    const monthlyData = {
        labels: ['P&I / Rent', 'Taxes & Ins', 'HOA / Maint', 'Utilities'],
        datasets: [
            {
                label: 'Current Property',
                backgroundColor: 'rgba(244, 63, 94, 0.8)',
                data: [currPMT, currTaxes + currIns, currMaint, currUtils]
            },
            {
                label: 'Townhome',
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                data: [townPMT, townTaxes + townIns, townHoa, townUtils]
            },
            {
                label: 'Rent & Invest',
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                data: [rentMonthly, rentIns, 0, rentUtils] // Rent in P&I bucket
            }
        ]
    };

    if (monthlyChartInstance) monthlyChartInstance.destroy();
    monthlyChartInstance = new Chart(ctxMonthly, {
        type: 'bar',
        data: monthlyData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { stacked: false, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${Math.round(context.raw)}`;
                        }
                    }
                }
            }
        }
    });

    // ===========================
    // 10-YEAR PROJECTION LOGIC
    // ===========================
    const years = Array.from({length: 11}, (_, i) => i);
    const maxMonthly = Math.max(currMonthlyTotal, townMonthlyTotal, rentMonthlyTotal);
    
    // Amounts to invest each month (savings relative to most expensive scenario)
    const currInvRate = maxMonthly - currMonthlyTotal;
    const townInvRate = maxMonthly - townMonthlyTotal;
    const rentInvRate = maxMonthly - rentMonthlyTotal;

    const currNW = [];
    const townNW = [];
    const rentNW = [];

    let cBal = currBal;
    let tBal = townLoan;
    
    let cInv = 0;
    let tInv = townStartingCapital;
    let rInv = rentStartingCapital;

    years.forEach(y => {
        if (y === 0) {
            currNW.push((currValue - cBal) + cInv);
            townNW.push((townPrice - tBal) + tInv);
            rentNW.push(rInv);
            return;
        }

        // Current Property Year simulation
        const cVal = currValue * Math.pow(1 + apprecRate, y);
        for(let m=0; m<12; m++) {
            if (cBal > 0) {
                const interest = cBal * (currRate / 12);
                const principal = currPMT - interest;
                cBal = Math.max(0, cBal - principal);
            }
            cInv = cInv * (1 + invRate/12) + currInvRate;
        }
        currNW.push((cVal - cBal) + cInv);

        // Townhome Year simulation
        const tVal = townPrice * Math.pow(1 + apprecRate, y);
        for(let m=0; m<12; m++) {
            if (tBal > 0) {
                const interest = tBal * (townRate / 12);
                const principal = townPMT - interest;
                tBal = Math.max(0, tBal - principal);
            }
            tInv = tInv * (1 + invRate/12) + townInvRate;
        }
        townNW.push((tVal - tBal) + tInv);

        // Rent Year simulation
        for(let m=0; m<12; m++) {
            rInv = rInv * (1 + invRate/12) + rentInvRate;
        }
        rentNW.push(rInv);
    });

    // UPDATE LINE CHART
    if (netWorthChartInstance) netWorthChartInstance.destroy();
    netWorthChartInstance = new Chart(ctxNetWorth, {
        type: 'line',
        data: {
            labels: years.map(y => `Year ${y}`),
            datasets: [
                {
                    label: 'Current Property (Eq + Inv)',
                    data: currNW,
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Townhome (Eq + Inv)',
                    data: townNW,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Rent & Invest (Portfolio)',
                    data: rentNW,
                    borderColor: '#8b5cf6',
                    backgroundColor: 'rgba(139, 92, 246, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${Math.round(context.raw).toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
}

// Attach event listeners
inputs.forEach(input => {
    input.addEventListener('input', updateDashboard);
});

// Initial Render
updateDashboard();
