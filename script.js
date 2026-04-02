// DOM Elements
const inputs = document.querySelectorAll('input, select');
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

    // ==== RETIREMENT PROFILE ====
    const basePortfolio = parseFloat(document.getElementById('ret-portfolio').value) || 0;
    const ssaIncome = parseFloat(document.getElementById('ret-ssa').value) || 0;
    const rentalNet = parseFloat(document.getElementById('ret-rental').value) || 0;
    const monthlyDraw = parseFloat(document.getElementById('ret-draw').value) || 0;
    const healthPremium = parseFloat(document.getElementById('ret-ins-premium').value) || 0;
    const lifestyleGoal = parseFloat(document.getElementById('ret-lifestyle-goal').value) || 0;

    const totalIncome = ssaIncome + rentalNet + monthlyDraw;

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
    
    const currHousingTotal = currPMT + currTaxes + currIns + currMaint + currUtils + healthPremium;

    // ==== TOWNHOME ====
    const townPrice = parseFloat(document.getElementById('town-price').value);
    const townRate = parseFloat(document.getElementById('town-rate').value) / 100;
    const townTerm = parseFloat(document.getElementById('town-term').value) * 12;
    const townTaxes = parseFloat(document.getElementById('town-taxes').value) || 0;
    const townIns = parseFloat(document.getElementById('town-ins').value) || 0;
    const townHoa = parseFloat(document.getElementById('town-hoa').value) || 0;
    const townExtraMtg = parseFloat(document.getElementById('town-extra-pmt').value) || 0;
    const townUtils = ['gas', 'elec', 'water', 'trash', 'int'].reduce((sum, u) => 
        sum + (parseFloat(document.getElementById(`town-${u}`).value) || 0), 0);

    const netProceeds = (currValue * (1 - sellRate)) - currBal;
    const strategy = document.getElementById('town-strategy').value;
    let townLoanStart = Math.max(0, townPrice - netProceeds);
    let townStartingCapital = 0;
    if (strategy === 'cash') {
        townLoanStart = 0;
        townStartingCapital = netProceeds - townPrice;
    }
    const townPMT = calculatePMT(townRate / 12, townTerm, townLoanStart);
    const townHousingTotal = townPMT + townTaxes + townIns + townHoa + townUtils + healthPremium;

    // ==== RENT & INVEST ====
    const rentMonthly = parseFloat(document.getElementById('rent-monthly').value) || 0;
    const rentTaxes = parseFloat(document.getElementById('rent-taxes').value) || 0;
    const rentIns = parseFloat(document.getElementById('rent-ins').value) || 0;
    const rentUtils = ['gas', 'elec', 'water', 'trash', 'int'].reduce((sum, u) => 
        sum + (parseFloat(document.getElementById(`rent-${u}`).value) || 0), 0);

    const rentHousingTotal = rentMonthly + rentTaxes + rentIns + rentUtils + healthPremium;
    const rentStartingCapital = netProceeds;

    // UPDATE UI TEXT
    document.getElementById('curr-total-display').innerText = `$${Math.round(currHousingTotal).toLocaleString()}`;
    document.getElementById('town-total-display').innerText = `$${Math.round(townHousingTotal).toLocaleString()}`;
    document.getElementById('rent-total-display').innerText = `$${Math.round(rentHousingTotal).toLocaleString()}`;

    // Delta Updates
    const setDelta = (id, housingTotal, totalInflow) => {
        const el = document.getElementById(id);
        const surplus = totalInflow - housingTotal;
        el.innerText = `Surplus: $${Math.round(surplus).toLocaleString()}/mo`;
        el.className = `delta-badge ${surplus > 0 ? 'negative' : 'positive'}`; 
        el.style.display = 'block';
    };
    setDelta('town-delta', townHousingTotal, totalIncome);
    setDelta('rent-delta', rentHousingTotal, totalIncome);

    // ===========================
    // UPDATE MONTHLY CHART
    // ===========================
    if (monthlyChartInstance) monthlyChartInstance.destroy();
    monthlyChartInstance = new Chart(ctxMonthly, {
        type: 'bar',
        data: {
            labels: ['Current Home (Stay)', 'Townhome (Buy)', 'Rent & Invest'],
            datasets: [
                {
                    label: 'Housing & Taxes',
                    backgroundColor: 'rgba(244, 63, 94, 0.8)',
                    data: [currHousingTotal, townHousingTotal, rentHousingTotal]
                },
                {
                    label: 'Income Surplus (Lifestyle Fund)',
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    data: [
                        Math.max(0, totalIncome - currHousingTotal),
                        Math.max(0, totalIncome - townHousingTotal),
                        Math.max(0, totalIncome - rentHousingTotal)
                    ]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' } }
            },
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        label: function(context) { return `${context.dataset.label}: $${Math.round(context.raw).toLocaleString()}`; }
                    }
                }
            }
        }
    });

    // ===========================
    // 10-YEAR PROJECTION LOGIC
    // ===========================
    const years = Array.from({length: 11}, (_, i) => i);
    const currNW = [];
    const townNW = [];
    const rentNW = [];

    let cBal = currBal;
    let tBal = townLoanStart;
    
    let cPort = basePortfolio;
    let tPort = basePortfolio + townStartingCapital;
    let rPort = basePortfolio + rentStartingCapital;

    years.forEach(y => {
        if (y === 0) {
            currNW.push((currValue - cBal) + cPort);
            townNW.push((townPrice - tBal) + tPort);
            rentNW.push(rPort);
            return;
        }

        const cVal = currValue * Math.pow(1 + apprecRate, y);
        const tVal = townPrice * Math.pow(1 + apprecRate, y);

        for(let m=0; m<12; m++) {
            // Portfolio Growth & Withdrawals
            cPort = cPort * (1 + inv_rate/12) - monthlyDraw;
            tPort = tPort * (1 + inv_rate/12) - monthlyDraw;
            rPort = rPort * (1 + inv_rate/12) - monthlyDraw;

            // Reinvestment of surplus (after lifestyle goal)
            const cSurplus = Math.max(0, totalIncome - currHousingTotal - lifestyleGoal);
            const tSurplus = Math.max(0, totalIncome - townHousingTotal - lifestyleGoal - townExtraMtg);
            const rSurplus = Math.max(0, totalIncome - rentHousingTotal - lifestyleGoal);

            cPort += cSurplus;
            tPort += tSurplus;
            rPort += rSurplus;

            // Debt Payoff
            if (cBal > 0) {
                const cInterest = cBal * (currRate / 12);
                cBal = Math.max(0, cBal - (currPMT - cInterest));
            }
            if (tBal > 0) {
                const tInterest = tBal * (townRate / 12);
                tBal = Math.max(0, tBal - (townPMT + townExtraMtg - tInterest));
            }
        }

        currNW.push((cVal - cBal) + cPort);
        townNW.push((tVal - tBal) + tPort);
        rentNW.push(rPort);
    });

    // UPDATE LINE CHART
    if (netWorthChartInstance) netWorthChartInstance.destroy();
    netWorthChartInstance = new Chart(ctxNetWorth, {
        type: 'line',
        data: {
            labels: years.map(y => `Year ${y}`),
            datasets: [
                {
                    label: 'Stay (Palace Garden)',
                    data: currNW,
                    borderColor: '#f43f5e',
                    backgroundColor: 'rgba(244, 63, 94, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Buy (Brookside Townhome)',
                    data: townNW,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true
                },
                {
                    label: 'Rent & Invest',
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
            scales: {
                x: { grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { callback: (val) => `$${(val/1000000).toFixed(1)}M` }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) { return `${context.dataset.label}: $${Math.round(context.raw).toLocaleString()}`; }
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
