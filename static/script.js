console.log("Application d'analyse de consommation électrique chargée");

let globalData = null;

async function loadData() {
    console.log("Chargement des données...");
    try {
        const response = await fetch('data_for_dashboard.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Données chargées avec succès:", data);
        return data;
    } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        return null;
    }
}

function initializeCharts(data) {
    console.log("Initialisation des graphiques");
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1000,
            easing: 'easeOutQuart'
        },
        plugins: {
            legend: {
                labels: {
                    font: {
                        family: "'Poppins', sans-serif",
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                titleFont: {
                    family: "'Poppins', sans-serif",
                    size: 14
                },
                bodyFont: {
                    family: "'Poppins', sans-serif",
                    size: 12
                }
            }
        }
    };
    
    // Graphique Vue d'ensemble
    const overviewCtx = document.getElementById('overviewChart').getContext('2d');
    new Chart(overviewCtx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: [{
                label: 'Consommation Corrigée',
                data: data.corrigee,
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.1,
                fill: true
            }, {
                label: 'Consommation Brute',
                data: data.brute,
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Évolution de la Consommation Électrique',
                    font: {
                        family: "'Poppins', sans-serif",
                        size: 18,
                        weight: 'bold'
                    }
                }
            }
        }
    });

    // Graphique Prévisions
    const forecastCtx = document.getElementById('forecastChart').getContext('2d');
    new Chart(forecastCtx, {
        type: 'line',
        data: {
            labels: [...data.dates, ...data.forecast_dates],
            datasets: [{
                label: 'Consommation Corrigée',
                data: [...data.corrigee, ...new Array(data.forecast_corrigee.length).fill(null)],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                tension: 0.1,
                fill: true
            }, {
                label: 'Prévision Corrigée',
                data: [...new Array(data.corrigee.length).fill(null), ...data.forecast_corrigee],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                borderDash: [5, 5],
                tension: 0.1,
                fill: true
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Prévisions de Consommation',
                    font: {
                        family: "'Poppins', sans-serif",
                        size: 18,
                        weight: 'bold'
                    }
                }
            }
        }
    });

    // Graphique Comparaison
    const comparisonCtx = document.getElementById('comparisonChart').getContext('2d');
    new Chart(comparisonCtx, {
        type: 'bar',
        data: {
            labels: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
            datasets: [{
                label: 'Consommation Moyenne Corrigée',
                data:  calculateMonthlyAverage(data.corrigee),
                backgroundColor: 'rgba(75, 192, 192, 0.6)'
            }, {
                label: 'Consommation Moyenne Brute',
                data: calculateMonthlyAverage(data.brute),
                backgroundColor: 'rgba(255, 99, 132, 0.6)'
            }]
        },
        options: {
            ...chartOptions,
            plugins: {
                ...chartOptions.plugins,
                title: {
                    display: true,
                    text: 'Comparaison Mensuelle',
                    font: {
                        family: "'Poppins', sans-serif",
                        size: 18,
                        weight: 'bold'
                    }
                }
            }
        }
    });
}

function calculateMonthlyAverage(data) {
    const monthlyData = Array(12).fill().map(() => []);
    data.forEach((value, index) => {
        const month = index % 12;
        monthlyData[month].push(value);
    });
    return monthlyData.map(month => month.reduce((sum, value) => sum + value, 0) / month.length);
}

function updateKeyMetrics(data) {
    const avgConsumption = data.corrigee.reduce((a, b) => a + b, 0) / data.corrigee.length;
    document.getElementById('avgConsumption').textContent = `${avgConsumption.toFixed(2)} TWh`;

    const yearlyTrend = (data.corrigee[data.corrigee.length - 1] - data.corrigee[0]) / (data.corrigee.length / 12);
    const trendElement = document.getElementById('yearlyTrend');
    trendElement.textContent = `${yearlyTrend > 0 ? '+' : ''}${yearlyTrend.toFixed(2)} TWh/an`;
    trendElement.classList.add(yearlyTrend > 0 ? 'positive-trend' : 'negative-trend');

    document.getElementById('rmseValue').textContent = `${data.rmse_corrigee.toFixed(2)}`;
}

function updateInsights(data) {
    const peakConsumption = Math.max(...data.corrigee);
    document.getElementById('peakConsumption').textContent = `${peakConsumption.toFixed(2)} TWh`;

    const potentialSavings = (data.corrigee[data.corrigee.length - 1] - data.corrigee[data.corrigee.length - 13]) / data.corrigee[data.corrigee.length - 13] * 100;
    const savingsElement = document.getElementById('potentialSavings');
    savingsElement.textContent = `${Math.abs(potentialSavings).toFixed(2)}% ${potentialSavings > 0 ? 'augmentation' : 'réduction'} sur l'année précédente`;
    savingsElement.classList.add(potentialSavings > 0 ? 'negative-trend' : 'positive-trend');

    const environmentalImpact = data.corrigee[data.corrigee.length - 1] * 0.1;
    document.getElementById('environmentalImpact').textContent = `${environmentalImpact.toFixed(2)} tonnes de CO2 équivalent`;
}

function setupNavigation() {
    const sections = ['overview', 'forecast', 'comparison', 'insights'];
    sections.forEach(section => {
        const btn = document.getElementById(`${section}Btn`);
        btn.addEventListener('click', () => {
            sections.forEach(s => {
                document.getElementById(`${s}Section`).classList.remove('active');
                document.getElementById(`${s}Btn`).classList.remove('active');
                document.getElementById(`${s}Btn`).setAttribute('aria-pressed', 'false');
            });
            document.getElementById(`${section}Section`).classList.add('active');
            btn.classList.add('active');
            btn.setAttribute('aria-pressed', 'true');
        });
    });
    console.log("Navigation configurée");
}

async function initApp() {
    console.log("Initialisation de l'application");
    try {
        globalData = await loadData();
        if (globalData) {
            initializeCharts(globalData);
            updateKeyMetrics(globalData);
            updateInsights(globalData);
            setupNavigation();
            console.log("Application initialisée avec succès");
        } else {
            console.error("Échec du chargement des données");
            document.body.innerHTML = "<h1>Erreur de chargement des données. Veuillez réessayer plus tard.</h1>";
        }
    } catch (error) {
        console.error("Erreur lors de l'initialisation de l'application:", error);
        document.body.innerHTML = "<h1>Une erreur est survenue. Veuillez réessayer plus tard.</h1>";
    }
}

// Lancer l'application au chargement de la page
window.addEventListener('load', initApp);