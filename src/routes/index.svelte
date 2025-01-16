<script context="module">
</script>

<script>
  import { categoryTypesColor } from "$lib/colors.js";
  import { onMount } from "svelte";
  import chartjs from "chart.js/auto";
  import { base } from "$app/paths";

  // variables pour le dashboard

  let chartIrObjective = null;
  let ctxIrObjective = null;
  var chartIrObjectiveData = null;

  let chartCaObjective = null;
  let ctxCaObjective = null;
  var chartCaObjectiveData = null;

  let chartCash = null;
  let ctxCash = null;
  var chartCashData = null;

  let chartSalaries = null;
  let ctxSalaries = null;
  var chartSalariesData = null;

  let chartMonthPerso = null;
  let ctxMonthPerso = null;
  var chartMonthPersoData = null;

  let chartMonthOpfd = null;
  let ctxMonthOpfd = null;
  var chartMonthOpfdData = null;

  let chartMonthExpenses = null;
  let ctxMonthExpenses = null;
  var chartMonthExpensesData = null;

  let dates = [""];

  let banks = [];
  let banksPerso = [];
  let banksOpfd = [];
  let totalBank = 0;
  let totalBankPerso = 0;
  let totalBankOpfd = 0;

  let invoices = [];
  let totalPotentialInvoices = 0; // somme des factures de l'année
  let totalRealizedInvoices = 0; // somme des factures de l'année avant le mois en cours
  let currentCaObjective = 0;

  let persoExpenses = [];
  let persoExpensesMonth = [];
  let persoExpensesMonthLabel = [];

  let OpfdExpenses = [];

  let salaries = [];
  let salariesMonth = [];
  let deltaSalariesMonth = [];
  let totalSalaries = 0;
  let totalEstimatedSalaries = 0;

  // Pessimist: on en compte pas les factures à venir
  let cashPessimist = ["Tréso pessimiste"];
  let monthPessimist; // solde bank + factures mois en cours - dépenses à venir

  let datesGraph = [];
  let cashGraph = [];
  let cashPessimistGraph = [];

  let currentIrObjective = 0;
  let currentIrObjectiveMonth = 0;
  let totalPrevisionnelIr = 0;

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  // currentYear = 2024;
  // currentMonth = 11;

  // données pour la synthèse du cash
  let totalPersoExpensesCurrentMonth = 0;
  let totalOpfdExpensesCurrentMonth = 0;
  let totalSalariesCurrentMonth = 0;
  let cssNeg = "text-red-400";
  let cssOpfdNeg = "text-red-400";
  let soldeCash = 0;
  let soldeOpfd = 0;
  let screenWidth = 0;

  onMount(async (promise) => {
    screenWidth = window.innerWidth;

    loadTables();
    initializeCharts();
  });

  function initializeCharts() {
    ctxIrObjective = chartIrObjective.getContext("2d");
    chartIrObjectiveData = new chartjs(ctxIrObjective, {});

    ctxCaObjective = chartCaObjective.getContext("2d");
    chartCaObjectiveData = new chartjs(ctxCaObjective, {});

    ctxCash = chartCash.getContext("2d");
    chartCashData = new chartjs(ctxCash, {});

    ctxSalaries = chartSalaries.getContext("2d");
    chartSalariesData = new chartjs(ctxSalaries, {});

    ctxMonthPerso = chartMonthPerso.getContext("2d");
    chartMonthPersoData = new chartjs(ctxMonthPerso, {});

    ctxMonthOpfd = chartMonthOpfd.getContext("2d");
    chartMonthOpfdData = new chartjs(ctxMonthOpfd, {});

    ctxMonthExpenses = chartMonthExpenses.getContext("2d");
    chartMonthExpensesData = new chartjs(ctxMonthExpenses, {});
  }

  async function loadTables() {
    const [iro, cao, exp, sa, b, op, inv] = await Promise.all([
      fetch("/MDB/irobjectives?year=" + currentYear).then((res) => res.json()),
      fetch("/MDB/caobjectives?year=" + currentYear).then((res) => res.json()),
      fetch("/MDB/expenses").then((res) => res.json()),
      fetch("/MDB/salaries").then((res) => res.json()),
      fetch("/MDB/banks?group=all").then((res) => res.json()),
      fetch("/MDB/opfd").then((res) => res.json()),
      fetch("/MDB/invoices").then((res) => res.json()),
    ]);

    currentIrObjective = iro.ir[0].amount;
    currentIrObjectiveMonth = (currentIrObjective / 12).toFixed(0);
    currentCaObjective = cao.ca[0].amount;
    persoExpenses = exp.expenses;
    salaries = sa.salaries;
    banks = b.banks;
    OpfdExpenses = op.openfield;
    invoices = inv.invoices;

    processFinancialData();
  }

  function processFinancialData() {
    // totalBank = Solde total
    // totalBankPerso = Somme des banques perso
    totalBank = 0;
    totalBankPerso = 0;
    for (var i = 0; i < banks.length; i++) {
      totalBank = totalBank + banks[i].amount;
      if (banks[i].group === "Perso") {
        totalBankPerso = totalBankPerso + banks[i].amount;
        banksPerso.push(banks[i].amount);
      } else {
        totalBankOpfd = totalBankPerso + banks[i].amount;
        banksOpfd.push(banks[i].amount);
      }
    }
    // pour le graph
    let tempCashGraph = totalBank;
    let tempCashPessimist = totalBank;

    totalPotentialInvoices = 0;
    // cashPessimist : permet de retrouver le premier mois négatif (monthPessimist)
    // solde bank + factures mois en cours - dépenses à venir
    totalRealizedInvoices = 0;
    cashPessimist = ["Tréso pessimiste"];
    monthPessimist = "";
    datesGraph = [];
    cashGraph = [];
    cashPessimistGraph = [];

    let tempTotalPersoExpenses = 0;
    let tempTotalOpfdExpenses = 0;
    // somme de toutes les factures existantes à venir
    let tempTotalInvoices = 0;
    // somme de toutes les factures payées existantes à venir
    let tempTotalPaidInvoices = 0;
    // somme de toutes les factures de l'année  à venir
    let tempTotalCurrentYearInvoices = 0;
    // somme de toutes les factures de l'année payées ou en cours à venir
    let tempCurrentYearTotalPaidInvoices = 0;
    // permet de calculer IR prévisionnel
    let tempTotalSalaries = 0;
    let tempIr = 0;
    totalPrevisionnelIr = 0;

    // formattage des dates pour les graphes
    let tempMois;
    let tempDateGraph = -1;

    for (var i = currentYear; i < currentYear + 5; i++) {
      for (var j = 0; j <= 11; j++) {
        // formattage des dates pour les graphes
        if (i === currentYear && j < currentMonth) {
        } else {
          tempDateGraph = tempDateGraph + 1;
        }
        tempMois = j + 1;
        if (j < 9) {
          tempMois = "0".concat(j + 1);
        }

        // somme des dépenses du mois en cours
        tempTotalPersoExpenses = 0;
        for (var k = 0; k < persoExpenses.length; k++) {
          if (persoExpenses[k].year === i && persoExpenses[k].month === j + 1) {
            tempTotalPersoExpenses = tempTotalPersoExpenses + persoExpenses[k].amount;
            if (i === currentYear && j === currentMonth) {
              persoExpensesMonth.push(persoExpenses[k].amount);
              persoExpensesMonthLabel.push(persoExpenses[k].category);
            }
          }
        }

        tempTotalOpfdExpenses = 0;
        for (var k = 0; k < OpfdExpenses.length; k++) {
          if (OpfdExpenses[k].year === i && OpfdExpenses[k].month === j + 1) {
            tempTotalOpfdExpenses = tempTotalOpfdExpenses + OpfdExpenses[k].amount;
          }
        }

        // permet de calculer IR prévisionnel uniquement pour l'année en cours
        tempTotalSalaries = 0;
        if (i == currentYear) {
          for (var k = 0; k < salaries.length; k++) {
            if (salaries[k].year === i && salaries[k].month === j + 1) {
              tempTotalSalaries = tempTotalSalaries + salaries[k].amount;
            }
          }
          if (j <= currentMonth) {
            salariesMonth.push(tempTotalSalaries);
            if (j == 0) {
              deltaSalariesMonth.push(tempTotalSalaries - currentIrObjectiveMonth);
            } else {
              deltaSalariesMonth.push(tempTotalSalaries - currentIrObjectiveMonth + deltaSalariesMonth[j - 1]);
            }
          } else {
            salariesMonth.push(0);
            if (j == 0) {
              deltaSalariesMonth.push(0);
            } else {
              deltaSalariesMonth.push(deltaSalariesMonth[j - 1]);
            }
          }
          totalSalaries = totalSalaries + tempTotalSalaries;
        }

        tempTotalInvoices = 0;
        for (var k = 0; k < invoices.length; k++) {
          if (i === currentYear && invoices[k].year === i) {
            // année en cours
            if (j <= currentMonth && invoices[k].month - 1 === j) {
              tempCurrentYearTotalPaidInvoices =
                tempCurrentYearTotalPaidInvoices + invoices[k].days * invoices[k].dailyRate;
            } else {
              if (invoices[k].month - 1 === j) {
                tempTotalCurrentYearInvoices = tempTotalCurrentYearInvoices + invoices[k].days * invoices[k].dailyRate;
              }
            }
          }
          if (i === currentYear && invoices[k].paymentYear === i) {
            // année en cours
            if (j <= currentMonth && invoices[k].paymentMonth - 1 === j) {
              // mois déjà passés
              // on ne comptabilise pas les factures pour le graph si payées
              if (invoices[k].paid) {
                tempTotalInvoices = 0;
              } else {
                // sinon, on les comptabilise
                tempTotalInvoices = tempTotalInvoices + invoices[k].days * invoices[k].dailyRate * 1.2;
              }
            } else {
              {
                // mois suivants de l'année en cours
                // on comptabilise les factures pour le graph
                if (invoices[k].paymentMonth - 1 === j) {
                  tempTotalInvoices = tempTotalInvoices + invoices[k].days * invoices[k].dailyRate * 1.2;
                }
              }
            }
          } else {
            // années suivantes
            // on comptabilise les factures pour le graph
            if (invoices[k].paymentYear === i && invoices[k].paymentMonth - 1 === j) {
              tempTotalInvoices = tempTotalInvoices + invoices[k].days * invoices[k].dailyRate * 1.2;
            }
          }
        }

        tempCashGraph = tempCashGraph + tempTotalInvoices - tempTotalPersoExpenses - tempTotalOpfdExpenses;
        if (i === currentYear && j === currentMonth) {
          totalPersoExpensesCurrentMonth = tempTotalPersoExpenses;
          totalSalariesCurrentMonth = tempTotalSalaries;
          totalOpfdExpensesCurrentMonth = tempTotalOpfdExpenses;
        }
        if (i === currentYear && (j - 1 === currentMonth || j === currentMonth)) {
          // on tient compte des factures non encore encaissées
          //              console.info("tempTotalInvoices Pessimistic", tempTotalInvoices);
          tempCashPessimist = tempCashPessimist + tempTotalInvoices - tempTotalPersoExpenses - tempTotalOpfdExpenses;
          // données pour la synthèse du cash
        } else {
          tempCashPessimist = tempCashPessimist - tempTotalPersoExpenses - tempTotalOpfdExpenses;
        }

        cashPessimist.push(tempCashPessimist);
        dates.push(tempMois + "/" + i.toString().substring(2, 4));
        // pour le cashGraph, on ne prend que maintenant, 1 mois, 2 mois, 3 mois, 6 mois, 1 an, 2 ans, 3 ans, 4 ans, 5 ans
        if ([0, 1, 2, 3, 6, 12, 24, 36, 48, 60].includes(tempDateGraph)) {
          cashGraph.push(tempCashGraph);
          cashPessimistGraph.push(tempCashPessimist);
          datesGraph.push(tempMois + "/" + i.toString().substring(2, 4));
        }

        // calcul de l'IR
        tempIr = 0;
        if (i === currentYear) {
          if (j < currentMonth) {
            tempIr = tempTotalSalaries;
          } else if (j === currentMonth) {
            tempIr = tempTotalSalaries - totalBankPerso + tempTotalPersoExpenses;
          }
          // prévision IR
          if (tempTotalPersoExpenses > tempIr) {
            totalPrevisionnelIr = totalPrevisionnelIr + tempTotalPersoExpenses;
          } else {
            totalPrevisionnelIr = totalPrevisionnelIr + tempIr;
          }
        }
      }
    }
    totalPotentialInvoices = tempTotalCurrentYearInvoices + tempCurrentYearTotalPaidInvoices;
    totalRealizedInvoices = tempCurrentYearTotalPaidInvoices;
    soldeCash = totalBankPerso - totalPersoExpensesCurrentMonth;

    dates = dates;
    cashPessimist = cashPessimist;
    cashGraph = cashGraph;
    cashPessimistGraph = cashPessimistGraph;
    datesGraph = datesGraph;

    // détermination du premier mois négatif de cash
    for (var i = 0; i < cashPessimist.length; i++) {
      if (cashPessimist[i] < 0) {
        monthPessimist = dates[i];
        i = 1000;
      }
    }
    totalEstimatedSalaries = (totalSalaries / (currentMonth + 1)) * 12;

    showData();
  }

  function showData() {
    const borderFactor = Math.min(Math.max(screenWidth / 500, 2), 3);

    soldeCash = totalBankPerso - totalPersoExpensesCurrentMonth;
    cssNeg = soldeCash < 0 ? "text-red-400" : "";
    soldeOpfd = totalBankOpfd - totalOpfdExpensesCurrentMonth;
    cssOpfdNeg = soldeOpfd < 0 ? "text-red-400" : "";

    let datasetIrObjective = [
      {
        label: "Salaires prév.",
        backgroundColor: categoryTypesColor[4],
        borderColor: "rgba(255, 255, 255, 0)",
        borderWidth: borderFactor,
        borderSkipped: false, // Ensures the border is drawn on all sides

        borderRadius: 20,
        data: [(totalEstimatedSalaries / currentIrObjective) * 100],
      },
      {
        label: "En cours",
        backgroundColor: categoryTypesColor[1],
        borderColor: "rgba(255, 255, 255, 0)",
        borderWidth: borderFactor,
        borderSkipped: false, // Ensures the border is drawn on all sides

        borderRadius: 20,
        data: [(totalPrevisionnelIr / currentIrObjective) * 100],
      },
    ];
    if (totalEstimatedSalaries <= totalPrevisionnelIr) {
      datasetIrObjective.reverse();
    }
    datasetIrObjective.push({
      label: "Objectif",
      backgroundColor: "rgba(255, 255, 255, 0)",
      borderColor: categoryTypesColor[7],
      borderWidth: borderFactor,
      borderRadius: 20,
      borderSkipped: false,
      data: [100],
    });
    datasetIrObjective.reverse();

    const datasetCaObjective = [
      {
        label: "Objectif",
        backgroundColor: "rgba(255, 255, 255, 0)",
        borderColor: categoryTypesColor[7],
        borderWidth: borderFactor,
        borderRadius: 20,
        data: [100],
        borderSkipped: false, // Ensures the border is drawn on all sides
      },
      {
        label: "Potentiel",
        backgroundColor: categoryTypesColor[1],
        borderColor: "rgba(255, 255, 255, 0)",
        borderWidth: borderFactor,
        borderSkipped: false, // Ensures the border is drawn on all sides

        borderRadius: 20,
        data: [(totalPotentialInvoices / currentCaObjective) * 100],
      },
      {
        label: "Réalisé",
        backgroundColor: categoryTypesColor[4],
        borderColor: "rgba(255, 255, 255, 0)",
        borderWidth: borderFactor,
        borderRadius: 20,
        borderSkipped: false, // Ensures the border is drawn on all sides
        data: [(totalRealizedInvoices / currentCaObjective) * 100],
      },
    ];

    const barThickness = {
      id: "barThickness",
      beforeDatasetsDraw(chart) {
        chart.getDatasetMeta(1).data[0].height = chart.getDatasetMeta(0).data[0].height * 0.8;
        chart.getDatasetMeta(2).data[0].height = chart.getDatasetMeta(0).data[0].height * 0.8;
      },
    };
    // Register the plugin
    chartjs.register(barThickness);

    const MonthPerso = {
      id: "MonthPerso",
      beforeDatasetsDraw(chart) {
        const { ctx } = chart;
        let totalY = 999;
        let totalWidth = 0;
        let totalX = 0;
        let totalBase = 0;
        let previousY = 0;
        let innerHeight = 0;
        chart.data.datasets.forEach((_, datasetIndex) => {
          // Récupérer les métadonnées du dataset
          const meta = chart.getDatasetMeta(datasetIndex);

          meta.data.forEach((bar) => {
            const { x, y, base, width } = bar;
            // Réduction de la largeur du fond
            const reduction = Math.max(width * 0.2, 10); // Réduction en pixels
            const innerWidth = width - reduction;
            previousY = datasetIndex === 1 ? y + reduction / 2 : y + reduction / 2;
            innerHeight =
              datasetIndex != 2 ? Math.max(0, base - previousY) : Math.max(0, base - previousY + reduction / 2);
            if (datasetIndex >= 1) {
              totalY = Math.min(totalY, y);
              totalX = x;
              totalWidth = width;
              totalBase = Math.max(totalBase, base);
            }

            // Dessiner manuellement le fond avec une largeur réduite
            ctx.save();
            ctx.fillStyle =
              datasetIndex === 0
                ? categoryTypesColor[1]
                : datasetIndex === 1
                ? categoryTypesColor[4]
                : categoryTypesColor[9];
            // Couleur de fond

            ctx.fillRect(
              x - innerWidth / 2, // Position horizontale ajustée
              previousY, // Position verticale
              innerWidth, // Largeur réduite
              innerHeight, // Hauteur de la barre
            );

            ctx.restore();
          });
        });
        ctx.save();
        ctx.strokeStyle = categoryTypesColor[7]; // Couleur de la bordure
        ctx.lineWidth = borderFactor;
        totalBase -= borderFactor / 2; // Épaisseur de la bordure
        ctx.beginPath();
        ctx.moveTo(totalX - totalWidth / 2 + 5, totalY); // Position horizontale ajustée avec angle arrondi
        ctx.lineTo(totalX + totalWidth / 2 - 5, totalY); // Ligne du haut avec angle arrondi
        ctx.quadraticCurveTo(totalX + totalWidth / 2, totalY, totalX + totalWidth / 2, totalY + 5); // Angle arrondi en haut à droite
        ctx.lineTo(totalX + totalWidth / 2, totalBase - 5); // Ligne droite
        ctx.quadraticCurveTo(totalX + totalWidth / 2, totalBase, totalX + totalWidth / 2 - 5, totalBase); // Angle arrondi en bas à droite
        ctx.lineTo(totalX - totalWidth / 2 + 5, totalBase); // Ligne du bas avec angle arrondi
        ctx.quadraticCurveTo(totalX - totalWidth / 2, totalBase, totalX - totalWidth / 2, totalBase - 5); // Angle arrondi en bas à gauche
        ctx.lineTo(totalX - totalWidth / 2, totalY + 5); // Ligne gauche
        ctx.quadraticCurveTo(totalX - totalWidth / 2, totalY, totalX - totalWidth / 2 + 5, totalY); // Angle arrondi en haut à gauche
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      },
    };
    // Register the plugin
    chartjs.register(MonthPerso);

    const MonthOpfd = {
      id: "MonthOpfd",
      beforeDatasetsDraw(chart) {
        const { ctx } = chart;

        chart.data.datasets.forEach((_, datasetIndex) => {
          // Récupérer les métadonnées du dataset
          const meta = chart.getDatasetMeta(datasetIndex);

          meta.data.forEach((bar) => {
            const { x, y, base, width } = bar;
            // Réduction de la largeur du fond
            const reduction = Math.max(width * 0.2, 10); // Réduction en pixels
            const innerWidth = width - reduction;
            const previousY = y;
            let innerHeight = Math.max(0, base - previousY - reduction / 2);
            // Dessiner manuellement le fond avec une largeur réduite
            ctx.save();
            ctx.fillStyle = datasetIndex === 0 ? categoryTypesColor[1] : categoryTypesColor[9]; // Couleur de fond
            ctx.fillRect(
              x - innerWidth / 2, // Position horizontale ajustée
              previousY + reduction / 2, // Position verticale
              innerWidth, // Largeur réduite
              innerHeight, // Hauteur de la barre
            );

            ctx.restore();
          });
        });
      },
    };
    // Register the plugin
    chartjs.register(MonthOpfd);

    // Plugin pour réduire la largeur du fond
    const narrowBackgroundPlugin = {
      id: "narrowBackground",
      beforeDatasetsDraw(chart) {
        const { ctx } = chart;

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          // Récupérer les métadonnées du dataset
          const meta = chart.getDatasetMeta(datasetIndex);
          // Vérifier que le dataset est de type "bar"
          if (meta.type === "bar") {
            meta.data.forEach((bar, index) => {
              const { x, y, base, width } = bar;
              // Réduction de la largeur du fond
              const reduction = Math.max(width * 0.4, 10); // Réduction en pixels
              const innerWidth = width - reduction;
              const previousY = y;
              let innerHeight = Math.max(0, base - previousY - reduction / 2);

              // Dessiner manuellement le fond avec une largeur réduite
              ctx.save();
              ctx.fillStyle = categoryTypesColor[9]; // Couleur de fond
              ctx.fillRect(
                x - innerWidth / 2, // Position horizontale ajustée
                previousY + reduction / 2, // Position verticale
                innerWidth, // Largeur réduite
                innerHeight, // Hauteur de la barre
              );

              ctx.restore();
            });
          }
        });
      },
    };
    // Register the plugin
    chartjs.register(narrowBackgroundPlugin);

    chartIrObjectiveData.destroy();
    chartIrObjectiveData = new chartjs(ctxIrObjective, {
      type: "bar",
      data: {
        labels: ["IR"],
        datasets: datasetIrObjective,
      },
      options: {
        responsive: true,
        indexAxis: "y",
        scales: {
          x: {
            stacked: false,
            display: false,
            ticks: {
              min: 0,
              max: 130,
              stepSize: 10,
            },
          },
          y: {
            stacked: true,
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          narrowBackground: false,
          barThickness: true,
          MonthOpfd: false,
          MonthPerso: false,
        },
        barPercentage: 1,
        categoryPercentage: 1,
      },
    });

    chartCaObjectiveData.destroy();
    chartCaObjectiveData = new chartjs(ctxCaObjective, {
      type: "bar",
      data: {
        labels: ["CA"],
        datasets: datasetCaObjective,
      },
      options: {
        responsive: true,
        indexAxis: "y",
        scales: {
          x: {
            stacked: false,
            display: false,
            ticks: {
              min: 0,
              max: 130,
              stepSize: 10,
            },
          },
          y: {
            stacked: true,
            display: false,
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          narrowBackground: false,
          barThickness: true,
          MonthOpfd: false,
          MonthPerso: false,
        },
        barPercentage: 1,
        categoryPercentage: 1,
      },
    });

    chartCashData.destroy();
    chartCashData = new chartjs(ctxCash, {
      type: "line",
      data: {
        labels: datesGraph,
        datasets: [
          {
            label: "Tréso prévisionnelle",
            data: cashGraph,
            borderColor: categoryTypesColor[1],
            pointBackgroundColor: "rgba(255, 255, 255, 1)",
            pointBorderColor: categoryTypesColor[1],
            borderWidth: 3,
            order: 2,
          },
          {
            label: "Tréso pessimiste",
            data: cashPessimistGraph,
            borderColor: categoryTypesColor[7],
            pointBackgroundColor: "rgba(255, 255, 255, 1)",
            pointBorderColor: categoryTypesColor[7],
            borderWidth: 3,
            order: 1,
          },
          {
            label: "cible",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: categoryTypesColor[0],
            borderDash: [20, 10, 60, 10],
            borderWidth: 3,
            pointRadius: 0,
            type: "line",
            order: 2,
          },
        ],
      },
      options: {
        tension: 0.3,
        cubicInterpolationMode: "monotone",
        //borderDash: [20, 10, 60, 10],
        borderWidth: 3,
        pointRadius: 5,
        pointBorderWidth: 2,
        plugins: {
          legend: {
            display: false,
          },
          barThickness: false,
          MonthOpfd: false,
          MonthPerso: false,
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: {
              display: false, // Masque les valeurs des ticks
            },
            grid: { display: false },
          },
        },
      },
    });

    chartMonthPersoData.destroy();
    chartMonthPersoData = new chartjs(ctxMonthPerso, {
      type: "bar",
      data: {
        labels: ["Perso", ""],
        datasets: [
          {
            label: "Dépenses",
            data: [totalPersoExpensesCurrentMonth],
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderColor: categoryTypesColor[7], // Border color
            borderWidth: borderFactor, // Border thickness
            borderRadius: 5, // Optional: Makes corners rounded
            borderSkipped: false, // Ensures the border is drawn on all sides
          },
          {
            label: banks[1].name,
            data: [banks[1].amount],
            backgroundColor: "rgba(255, 255, 255, 0)",
            stack: "cumulative",
          },
          {
            label: banks[2].name,
            data: [banks[2].amount],
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderColor: categoryTypesColor[7], // Border color
            stack: "cumulative",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: false, // Masque les valeurs des ticks
          },
          y: {
            display: false, // Masque les valeurs des ticks
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          narrowBackground: false,
          barThickness: false,
          MonthOpfd: false,
          MonthPerso: true,
        },
      },
    });

    chartMonthOpfdData.destroy();
    chartMonthOpfdData = new chartjs(ctxMonthOpfd, {
      type: "bar",
      data: {
        labels: ["Opfd", ""],
        datasets: [
          {
            label: "Dépenses",
            data: [totalOpfdExpensesCurrentMonth],
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderColor: categoryTypesColor[7], // Border color
            borderWidth: borderFactor, // Border thickness
            borderRadius: 5, // Optional: Makes corners rounded
            borderSkipped: false, // Ensures the border is drawn on all sides
          },
          {
            label: "Banque",
            data: [banks[0].amount],
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderColor: categoryTypesColor[7], // Border color
            borderWidth: borderFactor, // Border thickness
            borderRadius: 5, // Optional: Makes corners rounded
            borderSkipped: false, // Ensures the border is drawn on all sides
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: false, // Masque les valeurs des ticks
          },
          y: {
            display: false, // Masque les valeurs des ticks
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          narrowBackground: false,
          barThickness: false,
          MonthOpfd: true,
          MonthPerso: false,
        },
      },
    });

    chartMonthExpensesData.destroy();
    chartMonthExpensesData = new chartjs(ctxMonthExpenses, {
      type: "bar",
      data: {
        labels: persoExpensesMonthLabel,
        datasets: [
          {
            data: persoExpensesMonth,
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderColor: categoryTypesColor[7], // Border color
            borderWidth: borderFactor, // Border thickness
            borderRadius: 5, // Optional: Makes corners rounded
            borderSkipped: false, // Ensures the border is drawn on all sides
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: false, // Masque les valeurs des ticks
          },
          y: {
            display: false, // Masque les valeurs des ticks
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          narrowBackground: false,
          barThickness: false,
          MonthOpfd: true,
          MonthPerso: false,
        },
      },
    });
    chartSalariesData.destroy();
    chartSalariesData = new chartjs(ctxSalaries, {
      type: "bar",
      data: {
        labels: ["JAN", "FEV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOU", "SEP", "OCT", "NOV", "DEC"],
        datasets: [
          {
            label: "Salaires mensuels",
            data: salariesMonth,
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderColor: categoryTypesColor[7], // Border color
            borderWidth: borderFactor, // Border thickness
            borderRadius: 5, // Optional: Makes corners rounded
            borderSkipped: false, // Ensures the border is drawn on all sides
            order: 2,
          },
          {
            label: "objectif",
            data: [
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
              currentIrObjectiveMonth,
            ],
            borderColor: categoryTypesColor[7],
            borderWidth: borderFactor,
            borderDash: [10, 5],
            pointRadius: 0,
            type: "line",
            order: 3,
          },
          {
            label: "cible",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: categoryTypesColor[0],
            borderWidth: 3,
            pointRadius: 0,
            type: "line",
            order: 1,
            yAxisID: "yline",
          },
          {
            label: "difference",
            data: deltaSalariesMonth,
            borderColor: categoryTypesColor[1],
            borderWidth: 3,
            pointRadius: 5,
            pointBorderWidth: 2,
            //           pointStyle: "rectRounded",
            pointBackgroundColor: "rgba(255, 255, 255, 1)",
            pointBorderColor: categoryTypesColor[1],
            type: "line",
            order: 1,
            yAxisID: "yline",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: {
            beginAtZero: true,
            ticks: {
              display: false, // Masque les valeurs des ticks
            },
            grid: { display: false },
          },
          yline: {
            position: "right",
            ticks: {
              display: false, // Masque les valeurs des ticks
            },
            grid: { display: false },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
          narrowBackground: true,
          barThickness: false,
          MonthOpfd: false,
          MonthPerso: false,
        },
      },
    });
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-4 w-full">
  <div class="border-solid hover:border-dotted border-2 rounded mr-1 mt-1">
    <div class="grid grid-cols-2 gap-1 md:gap-4 w-full mr-1 mt-1 font-normal">
      <canvas bind:this={chartMonthPerso} height="50px" />
      <div class="text-center">
        <p class={cssNeg}><b>Perso cash</b></p>
        <p class={cssNeg}><b>{soldeCash.toLocaleString("fr")}</b></p>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-1 md:gap-4 w-full mr-1 mt-4 font-normal">
      <canvas bind:this={chartMonthOpfd} height="50px" />
      <div class="text-center">
        <p class={cssOpfdNeg}><b>Opfd cash</b></p>
        <p class={cssOpfdNeg}><b>{soldeOpfd.toLocaleString("fr")}</b></p>
      </div>
      <div class="grid grid-cols-2 gap-1 md:gap-4 w-full mr-1 mt-4 font-normal">
        <canvas bind:this={chartMonthExpenses} height="50px" />
      </div>
      <div class="text-center">
        <p><b>Détail dépenses</b></p>
      </div>
    </div>
  </div>
  <div class="border-solid hover:border-dotted border-2 rounded mr-1 mt-1">
    <div class="grid grid-cols-3 w-full text-center">
      <div>
        <p>Salaire prév.</p>
        <p>{totalEstimatedSalaries.toLocaleString("fr", { maximumFractionDigits: 0 })}</p>
      </div>
      <div>
        <p>IR prév.</p>
        <p>{totalPrevisionnelIr.toLocaleString("fr")}</p>
      </div>
      <div>
        <p>Objectif IR</p>
        <p>{currentIrObjective.toLocaleString("fr")}</p>
      </div>
    </div>
    <canvas bind:this={chartIrObjective} height="40px" />
    <div class="grid grid-cols-3 w-full text-center mt-2 md:mt-10">
      <div>
        <p>CA réalisé</p>
        <p>{totalRealizedInvoices.toLocaleString("fr")}</p>
      </div>
      <div>
        <p>CA potentiel</p>
        <p>{totalPotentialInvoices.toLocaleString("fr")}</p>
      </div>
      <div>
        <p>Objectif CA</p>
        <p>{currentCaObjective.toLocaleString("fr")}</p>
      </div>
    </div>
    <canvas bind:this={chartCaObjective} height="40px" />
  </div>
  <div class="border-solid hover:border-dotted border-2 rounded mr-1 mt-1">
    <div class="grid grid-cols-2 w-full text-center">
      <div>
        <p>Trésorerie actuelle</p>
        <p>{Number(cashPessimist[1]).toLocaleString("fr")}</p>
      </div>
      <div>
        <p>Négative (pessimiste) en</p>
        <p>{monthPessimist}</p>
      </div>
    </div>
    <canvas bind:this={chartCash} />
  </div>
  <div class="border-solid hover:border-dotted border-2 rounded mr-1 mt-1">
    <div class="grid grid-cols-2 w-full text-center">
      <div>
        <p>Salaires</p>
        <p>{totalSalaries.toLocaleString("fr", { maximumFractionDigits: 0 })}</p>
      </div>
      <div>
        <p>Objectif IR</p>
        <p>{currentIrObjective.toLocaleString("fr")}</p>
      </div>
      <canvas bind:this={chartSalaries} />
    </div>
  </div>
</div>
