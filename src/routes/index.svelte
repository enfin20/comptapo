<script context="module">
</script>

<script>
  import { YYYYMMDD } from "$lib/date_functions.js";
  import { onMount } from "svelte";
  import chartjs from "chart.js/auto";

  // variables pour le dashboard

  const CHART_COLORS = {
    red: "rgb(255, 99, 132)",
    orange: "rgb(255, 159, 64)",
    yellow: "rgb(255, 205, 86)",
    green: "rgb(75, 230, 192)",
    blue: "rgb(54, 162, 235)",
    purple: "rgb(153, 102, 255)",
    grey: "rgb(101, 103, 107)",
    grey2: "rgb(153, 192, 192)",
    pct: "rgb(0, 110, 118)",
  };
  let categoryTypesColor = [
    CHART_COLORS.red,
    CHART_COLORS.orange,
    CHART_COLORS.grey2,
    CHART_COLORS.green,
    CHART_COLORS.blue,
    CHART_COLORS.purple,
    CHART_COLORS.yellow,
    CHART_COLORS.grey,
    CHART_COLORS.pct,
    "rgb(255, 99, 132)",
  ];

  let chartIrObjective;
  let ctxIrObjective;
  var chartIrObjectiveData = [];

  let chartCaObjective;
  let ctxCaObjective;
  var chartCaObjectiveData = [];

  let chartPersoExpenses;
  let ctxPersoExpenses;
  var chartPersoExpensesData = [];

  let chartOpenfieldExpenses;
  let ctxOpenfieldExpenses;
  var chartOpenfieldExpensesData = [];

  let chartCash;
  let ctxCash;
  var chartCashData = [];

  let dates = [""];

  let categoryOpenfieldExpenses = [];
  let categoryPersoExpenses = [];

  let banks = [];
  let totalBank = 0;
  let totalBankPerso = 0;

  let invoices = [];
  let totalPotentialInvoices = 0;
  let totalRealizedInvoices = 0;
  let currentCaObjective = 0;

  let persoExpenses = [];
  let persoAnnualExpenses = [];

  let openfieldExpenses = [];
  let openfieldAnnualExpenses = [];

  let salaries = [];

  let cashPessimist = ["Tréso pessimiste"];
  let monthPessimist;

  let datesGraph = [];
  let cashGraph = [];

  let currentIrObjective = 0;
  let totalPrevisionnelIr = 0;

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();

  onMount(async (promise) => {
    loadTables();

    ctxIrObjective = chartIrObjective.getContext("2d");
    chartIrObjectiveData = new chartjs(ctxIrObjective, {});

    ctxCaObjective = chartCaObjective.getContext("2d");
    chartCaObjectiveData = new chartjs(ctxCaObjective, {});

    ctxCash = chartCash.getContext("2d");
    chartCashData = new chartjs(ctxCash, {});

    ctxPersoExpenses = chartPersoExpenses.getContext("2d");
    chartPersoExpensesData = new chartjs(ctxPersoExpenses, {});

    ctxOpenfieldExpenses = chartOpenfieldExpenses.getContext("2d");
    chartOpenfieldExpensesData = new chartjs(ctxOpenfieldExpenses, {});
  });

  async function loadTables() {
    let res = await fetch("/MDB/irobjectives?year=" + currentYear);
    const iro = await res.json();
    currentIrObjective = await iro.ir[0].amount;

    res = await fetch("/MDB/caobjectives?year=" + currentYear);
    const cao = await res.json();
    currentCaObjective = await cao.ca[0].amount;

    res = await fetch("/MDB/categories?group=Openfield");
    const cat = await res.json();
    categoryOpenfieldExpenses = await cat.categories;

    res = await fetch("/MDB/categories?group=Perso");
    const ca = await res.json();
    categoryPersoExpenses = await ca.categories;

    res = await fetch("/MDB/expenses");
    const exp = await res.json();
    persoExpenses = await exp.expenses;

    res = await fetch("/MDB/annualexpenses?year=" + currentYear);
    const aexp = await res.json();
    persoAnnualExpenses = await aexp.expenses;

    res = await fetch("/MDB/salaries");
    const sa = await res.json();
    salaries = await sa.salaries;

    res = await fetch("/MDB/banks?group=all");
    const b = await res.json();
    banks = await b.banks;

    res = await fetch("/MDB/openfield");
    const op = await res.json();
    openfieldExpenses = await op.openfield;

    res = await fetch("/MDB/annualopenfield?year=" + currentYear);
    const aop = await res.json();
    openfieldAnnualExpenses = await aop.expenses;

    res = await fetch("/MDB/invoices");
    const inv = await res.json();
    invoices = await inv.invoices;

    // totalBank = Solde total
    // totalBankPerso = Somme des banques perso
    totalBank = 0;
    totalBankPerso = 0;
    for (var i = 0; i < banks.length; i++) {
      totalBank = totalBank + banks[i].amount;
      if (banks[i].group === "Perso") {
        totalBankPerso = totalBankPerso + banks[i].amount;
      }
    }
    // pour le graph
    let tempCashGraph = totalBank;
    let tempCashPessimist = totalBank;

    //data pour les graphs
    // categoryPersoExpensesLabel : pour l'affichage dans les graphes
    let categoryPersoExpensesLabel = [];
    for (var i = 0; i < categoryPersoExpenses.length; i++) {
      categoryPersoExpensesLabel.push(categoryPersoExpenses[i].name);
    }
    // persoAnnualExpensesValue : pour l'affichage dans les graphes
    let persoAnnualExpensesValue = [];
    for (var i = 0; i < categoryPersoExpensesLabel.length; i++) {
      for (var j = 0; j < persoAnnualExpenses.length; j++) {
        if (
          persoAnnualExpenses[j].year === currentYear &&
          categoryPersoExpensesLabel[i] === persoAnnualExpenses[j].category
        ) {
          persoAnnualExpensesValue.push(persoAnnualExpenses[j].amount);
        }
      }
    }
    // categoryOpenfieldExpensesLabel : pour l'affichage dans les graphes
    let categoryOpenfieldExpensesLabel = [];
    for (var i = 0; i < categoryOpenfieldExpenses.length; i++) {
      categoryOpenfieldExpensesLabel.push(categoryOpenfieldExpenses[i].name);
    }
    // openfieldAnnualExpensesValue : pour l'affichage dans les graphes
    let openfieldAnnualExpensesValue = [];
    for (var i = 0; i < categoryOpenfieldExpensesLabel.length; i++) {
      for (var j = 0; j < openfieldAnnualExpenses.length; j++) {
        if (
          openfieldAnnualExpenses[j].year === currentYear &&
          categoryOpenfieldExpensesLabel[i] ===
            openfieldAnnualExpenses[j].category
        ) {
          openfieldAnnualExpensesValue.push(openfieldAnnualExpenses[j].amount);
        }
      }
    }

    totalPotentialInvoices = 0;
    totalRealizedInvoices = 0;
    // cashPessimist : permet de retrouver le premier mois négatif (monthPessimist)
    cashPessimist = ["Tréso pessimiste"];
    monthPessimist = "";
    datesGraph = [];
    cashGraph = [];

    let tempTotalPersoExpenses = 0;
    let tempTotalOpenfieldExpenses = 0;
    let tempTotalInvoices = 0;
    let tempTotalPaidInvoices = 0;
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
            tempTotalPersoExpenses =
              tempTotalPersoExpenses + persoExpenses[k].amount;
          }
        }
        tempTotalOpenfieldExpenses = 0;
        for (var k = 0; k < openfieldExpenses.length; k++) {
          if (
            openfieldExpenses[k].year === i &&
            openfieldExpenses[k].month === j + 1
          ) {
            tempTotalOpenfieldExpenses =
              tempTotalOpenfieldExpenses + openfieldExpenses[k].amount;
          }
        }
        tempTotalPaidInvoices = 0;
        tempTotalInvoices = 0;
        for (var k = 0; k < invoices.length; k++) {
          if (
            invoices[k].paymentYear === i &&
            invoices[k].paymentMonth === j + 1
          ) {
            if (!invoices[k].paid) {
              if (j - 1 === currentMonth && i <= currentYear) {
                tempTotalPaidInvoices =
                  tempTotalPaidInvoices +
                  invoices[k].days * invoices[k].dailyRate * 1.2;
              } else {
                tempTotalInvoices =
                  tempTotalInvoices +
                  invoices[k].days * invoices[k].dailyRate * 1.2;
              }
            } else {
              tempTotalPaidInvoices =
                tempTotalPaidInvoices +
                invoices[k].days * invoices[k].dailyRate * 1.2;
            }
          }
        }
        // permet de calculer IR prévisionnel
        tempTotalSalaries = 0;
        for (var k = 0; k < salaries.length; k++) {
          if (salaries[k].year === i && salaries[k].month === j + 1) {
            tempTotalSalaries = tempTotalSalaries + salaries[k].amount;
          }
        }
        tempCashGraph =
          tempCashGraph +
          tempTotalInvoices -
          tempTotalPersoExpenses -
          tempTotalOpenfieldExpenses;
        if (
          i === currentYear &&
          (j === currentMonth || j === currentMonth + 1)
        ) {
          tempCashPessimist =
            tempCashPessimist +
            tempTotalInvoices -
            tempTotalPersoExpenses -
            tempTotalOpenfieldExpenses;
        } else {
          tempCashPessimist =
            tempCashPessimist -
            tempTotalPersoExpenses -
            tempTotalOpenfieldExpenses;
        }

        totalPotentialInvoices =
          totalPotentialInvoices +
          (tempTotalPaidInvoices + tempTotalInvoices) / 1.2;
        totalRealizedInvoices =
          totalRealizedInvoices + tempTotalPaidInvoices / 1.2;

        cashPessimist.push(tempCashPessimist);
        dates.push(tempMois + "/" + i.toString().substring(2, 4));
        // pour le cashGraph, on ne prend que maintenant, 1 mois, 2 mois, 3 mois, 6 mois, 1 an, 2 ans, 3 ans, 4 ans, 5 ans
        if (
          tempDateGraph === 0 ||
          tempDateGraph === 1 ||
          tempDateGraph === 2 ||
          tempDateGraph === 3 ||
          tempDateGraph === 6 ||
          tempDateGraph === 12 ||
          tempDateGraph === 24 ||
          tempDateGraph === 36 ||
          tempDateGraph === 48 ||
          tempDateGraph === 60
        ) {
          cashGraph.push(tempCashGraph);
          datesGraph.push(tempMois + "/" + i.toString().substring(2, 4));
        }

        // calcul de l'IR
        tempIr = 0;
        if (i === currentYear) {
          if (j < currentMonth) {
            tempIr = tempTotalSalaries;
          } else if (j === currentMonth) {
            tempIr =
              tempTotalSalaries - totalBankPerso + tempTotalPersoExpenses;
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
    dates = dates;
    cashPessimist = cashPessimist;
    cashGraph = cashGraph;
    datesGraph = datesGraph;

    // détermination du premier mois négatif de cash
    for (var i = 0; i < cashPessimist.length; i++) {
      if (cashPessimist[i] < 0) {
        monthPessimist = dates[i];
        i = 1000;
      }
    }

    // gestion des données pour les graphes
    let datasetIrObjective = [];
    datasetIrObjective.push({
      label: "En cours",
      backgroundColor: categoryTypesColor[1],
      borderColor: categoryTypesColor[1],
      borderRadius: 20,
      data: [(totalPrevisionnelIr / currentIrObjective) * 100],
    });
    datasetIrObjective.push({
      label: "Objectif",
      backgroundColor: categoryTypesColor[2],
      borderColor: categoryTypesColor[2],
      borderRadius: 20,
      data: [100],
    });
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
        },
      },
    });

    let datasetCaObjective = [];
    datasetCaObjective.push({
      label: "Réalisé",
      backgroundColor: categoryTypesColor[4],
      borderColor: categoryTypesColor[4],
      borderRadius: 20,
      data: [(totalRealizedInvoices / currentCaObjective) * 100],
    });
    datasetCaObjective.push({
      label: "Potentiel",
      backgroundColor: categoryTypesColor[1],
      borderColor: categoryTypesColor[1],
      borderRadius: 20,
      data: [(totalPotentialInvoices / currentCaObjective) * 100],
    });
    datasetCaObjective.push({
      label: "Objectif",
      backgroundColor: categoryTypesColor[2],
      borderColor: categoryTypesColor[2],
      borderRadius: 20,
      data: [100],
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
        },
      },
    });

    chartCashData.destroy();
    chartCashData = new chartjs(ctxCash, {
      type: "line",
      data: {
        labels: datesGraph,
        datasets: [
          {
            label: "Tréso",
            data: cashGraph,
            fill: {
              target: "origin",
              above: "rgba(11, 149, 100, 0.08)",
              below: "rgba(218, 96, 96, 0.08)",
            },
            borderColor: categoryTypesColor[1],
          },
        ],
      },
      options: {
        tension: 0.3,
        cubicInterpolationMode: "monotone",
        borderDash: [20, 10, 60, 10],
        pointBorderColor: "#E64A19",
        pointBackgroundColor: categoryTypesColor[1],
        pointRadius: 5,
        pointHoverRadius: 10,
        pointHitRadius: 30,
        pointBorderWidth: 2,
        pointStyle: "rectRounded",
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });

    chartPersoExpensesData.destroy();
    chartPersoExpensesData = new chartjs(ctxPersoExpenses, {
      type: "doughnut",
      data: {
        labels: categoryPersoExpensesLabel,
        datasets: [
          {
            label: "",
            data: persoAnnualExpensesValue,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: "Dépenses personnelles",
          },
        },
        plugins: { legend: { labels: { boxWidth: 15 } } },
      },
    });

    chartOpenfieldExpensesData.destroy();
    chartOpenfieldExpensesData = new chartjs(ctxOpenfieldExpenses, {
      type: "doughnut",
      data: {
        labels: categoryOpenfieldExpensesLabel,
        datasets: [
          {
            label: "",
            data: openfieldAnnualExpensesValue,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "bottom",
          },
          title: {
            display: true,
            text: "Dépenses openfield",
          },
        },
        plugins: { legend: { labels: { boxWidth: 15 } } },
      },
    });
  }
</script>

<div class="grid grid-cols-1 w-full">
  <div class="grid grid-cols-1 md:grid-cols-2 w-full">
    <div class="border-solid hover:border-dotted border-2 rounded mr-1 mt-1">
      <div class="grid grid-cols-4 w-full text-center">
        <div>
          <p>Objectif IR</p>
          <p>{currentIrObjective.toLocaleString("fr")}</p>
        </div>
        <div>
          <p>IR prév.</p>
          <p>{totalPrevisionnelIr.toLocaleString("fr")}</p>
        </div>
      </div>
      <canvas bind:this={chartIrObjective} height="50px" />
      <div class="grid grid-cols-4 w-full text-center mt-2 md:mt-10">
        <div>
          <p>Objectif CA</p>
          <p>{currentCaObjective.toLocaleString("fr")}</p>
        </div>
        <div>
          <p>CA potentiel</p>
          <p>{totalPotentialInvoices.toLocaleString("fr")}</p>
        </div>
        <div>
          <p>CA réalisé</p>
          <p>{totalRealizedInvoices.toLocaleString("fr")}</p>
        </div>
      </div>
      <canvas bind:this={chartCaObjective} height="50px" />
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
          Dépenses personnelles<canvas bind:this={chartPersoExpenses} />
        </div>
        <div>
          Dépenses Openfield<canvas bind:this={chartOpenfieldExpenses} />
        </div>
      </div>
    </div>
  </div>
  <div class="hidden md:grid grid-cols-1 mt-6 w-full md:w-2/3 text-xs" />
</div>
