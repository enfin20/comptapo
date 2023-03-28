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
  let totalBankOpenfield = 0;

  let invoices = [];
  let totalPotentialInvoices = 0; // somme des factures de l'année
  let totalRealizedInvoices = 0; // somme des factures de l'année avant le mois en cours
  let currentCaObjective = 0;

  let persoExpenses = [];
  let persoAnnualExpenses = [];

  let openfieldExpenses = [];
  let openfieldAnnualExpenses = [];

  let salaries = [];
  let totalSalaries = 0;

  // Pessimist: on en compte pas les factures à venir
  let cashPessimist = ["Tréso pessimiste"];
  let monthPessimist; // solde bank + factures mois en cours - dépenses à venir

  let datesGraph = [];
  let cashGraph = [];

  let currentIrObjective = 0;
  let totalPrevisionnelIr = 0;

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();

  // données pour la synthèse du cash
  let totalPersoExpensesCurrentMonth = 0;
  let totalOpenfieldExpensesCurrentMonth = 0;
  let totalSalariesCurrentMonth = 0;
  let cssNeg = "text-red-400";
  let cssOpenfieldNeg = "text-red-400";
  let soldeCash = 0;
  let soldeOpenfield = 0;

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
    Promise.all([
      fetch("/MDB/irobjectives?year=" + currentYear),
      fetch("/MDB/caobjectives?year=" + currentYear),
      fetch("/MDB/categories?group=Openfield"),
      fetch("/MDB/categories?group=Perso"),
      fetch("/MDB/expenses"),
      fetch("/MDB/annualexpenses?year=" + currentYear),
      fetch("/MDB/salaries"),
      fetch("/MDB/banks?group=all"),
      fetch("/MDB/openfield"),
      fetch("/MDB/annualopenfield?year=" + currentYear),
      fetch("/MDB/invoices"),
    ])
      .then(
        async ([
          res1,
          res2,
          res3,
          res4,
          res5,
          res6,
          res7,
          res8,
          res9,
          res10,
          res11,
        ]) => {
          const iro = await res1.json();
          currentIrObjective = await iro.ir[0].amount;
          const cao = await res2.json();
          currentCaObjective = await cao.ca[0].amount;
          const cat = await res3.json();
          categoryOpenfieldExpenses = await cat.categories;
          const ca = await res4.json();
          categoryPersoExpenses = await ca.categories;
          const exp = await res5.json();
          persoExpenses = await exp.expenses;
          const aexp = await res6.json();
          persoAnnualExpenses = await aexp.expenses;
          const sa = await res7.json();
          salaries = await sa.salaries;
          const b = await res8.json();
          banks = await b.banks;
          const op = await res9.json();
          openfieldExpenses = await op.openfield;
          const aop = await res10.json();
          openfieldAnnualExpenses = await aop.expenses;
          const inv = await res11.json();
          invoices = await inv.invoices;
        }
      )
      .then(() => {
        // totalBank = Solde total
        // totalBankPerso = Somme des banques perso
        totalBank = 0;
        totalBankPerso = 0;
        for (var i = 0; i < banks.length; i++) {
          totalBank = totalBank + banks[i].amount;
          if (banks[i].group === "Perso") {
            totalBankPerso = totalBankPerso + banks[i].amount;
          } else {
            totalBankOpenfield = totalBankPerso + banks[i].amount;
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
          categoryOpenfieldExpensesLabel.push(
            categoryOpenfieldExpenses[i].name
          );
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
              openfieldAnnualExpensesValue.push(
                openfieldAnnualExpenses[j].amount
              );
            }
          }
        }

        totalPotentialInvoices = 0;
        // cashPessimist : permet de retrouver le premier mois négatif (monthPessimist)
        // solde bank + factures mois en cours - dépenses à venir
        totalRealizedInvoices = 0;
        cashPessimist = ["Tréso pessimiste"];
        monthPessimist = "";
        datesGraph = [];
        cashGraph = [];

        let tempTotalPersoExpenses = 0;
        let tempTotalOpenfieldExpenses = 0;
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
              if (
                persoExpenses[k].year === i &&
                persoExpenses[k].month === j + 1
              ) {
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

            // permet de calculer IR prévisionnel
            tempTotalSalaries = 0;
            for (var k = 0; k < salaries.length; k++) {
              if (salaries[k].year === i && salaries[k].month === j + 1) {
                tempTotalSalaries = tempTotalSalaries + salaries[k].amount;
              }
            }
            totalSalaries = totalSalaries + tempTotalSalaries;

            tempTotalInvoices = 0;
            for (var k = 0; k < invoices.length; k++) {
              if (i === currentYear && invoices[k].year === i) {
                // année en cours
                if (j <= currentMonth && invoices[k].month - 1 === j) {
                  tempCurrentYearTotalPaidInvoices =
                    tempCurrentYearTotalPaidInvoices +
                    invoices[k].days * invoices[k].dailyRate;
                } else {
                  if (invoices[k].month - 1 === j) {
                    tempTotalCurrentYearInvoices =
                      tempTotalCurrentYearInvoices +
                      invoices[k].days * invoices[k].dailyRate;
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
                    tempTotalInvoices =
                      tempTotalInvoices +
                      invoices[k].days * invoices[k].dailyRate * 1.2;
                  }
                } else {
                  {
                    // mois suivants de l'année en cours
                    // on comptabilise les factures pour le graph
                    if (invoices[k].paymentMonth - 1 === j) {
                      tempTotalInvoices =
                        tempTotalInvoices +
                        invoices[k].days * invoices[k].dailyRate * 1.2;
                    }
                  }
                }
              } else {
                // années suivantes
                // on comptabilise les factures pour le graph
                if (
                  invoices[k].paymentYear === i &&
                  invoices[k].paymentMonth - 1 === j
                ) {
                  tempTotalInvoices =
                    tempTotalInvoices +
                    invoices[k].days * invoices[k].dailyRate * 1.2;
                }
              }
            }
            /*
            console.log("***************");
            console.info("Annee Mois", i + " " + j);
            console.info("tempCashGraph", tempCashGraph);
            console.info("tempTotalInvoices", tempTotalInvoices);
            console.info("tempTotalPersoExpenses", -tempTotalPersoExpenses);
            console.info(
              "tempTotalOpenfieldExpenses",
              -tempTotalOpenfieldExpenses
            );
            */
            tempCashGraph =
              tempCashGraph +
              tempTotalInvoices -
              tempTotalPersoExpenses -
              tempTotalOpenfieldExpenses;
            if (i === currentYear && j === currentMonth) {
              totalPersoExpensesCurrentMonth = tempTotalPersoExpenses;
              totalSalariesCurrentMonth = tempTotalSalaries;
              totalOpenfieldExpensesCurrentMonth = tempTotalOpenfieldExpenses;
            }
            if (
              i === currentYear &&
              (j - 1 === currentMonth || j === currentMonth)
            ) {
              // on tient compte des factures non encore encaissées
              //              console.info("tempTotalInvoices Pessimistic", tempTotalInvoices);
              tempCashPessimist =
                tempCashPessimist +
                tempTotalInvoices -
                tempTotalPersoExpenses -
                tempTotalOpenfieldExpenses;
              // données pour la synthèse du cash
            } else {
              tempCashPessimist =
                tempCashPessimist -
                tempTotalPersoExpenses -
                tempTotalOpenfieldExpenses;
            }

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
                totalPrevisionnelIr =
                  totalPrevisionnelIr + tempTotalPersoExpenses;
              } else {
                totalPrevisionnelIr = totalPrevisionnelIr + tempIr;
              }
            }
          }
        }
        totalPotentialInvoices =
          tempTotalCurrentYearInvoices + tempCurrentYearTotalPaidInvoices;
        totalRealizedInvoices = tempCurrentYearTotalPaidInvoices;
        soldeCash = totalBankPerso - totalPersoExpensesCurrentMonth;
        cssNeg = "";
        if (soldeCash < 0) {
          cssNeg = "text-red-400";
        }
        soldeCash = totalBankPerso - totalPersoExpensesCurrentMonth;
        cssNeg = "";
        if (soldeCash < 0) {
          cssNeg = "text-red-400";
        }
        soldeOpenfield =
          totalBankOpenfield - totalOpenfieldExpensesCurrentMonth;
        cssOpenfieldNeg = "";
        if (soldeOpenfield < 0) {
          cssOpenfieldNeg = "text-red-400";
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
        totalSalaries = (totalSalaries / (currentMonth + 1)) * 12;
        // gestion des données pour les graphes
        let datasetIrObjective = [];
        if (totalSalaries > totalPrevisionnelIr) {
          datasetIrObjective.push({
            label: "En cours",
            backgroundColor: categoryTypesColor[1],
            borderColor: categoryTypesColor[1],
            borderRadius: 20,
            data: [(totalPrevisionnelIr / currentIrObjective) * 100],
          });
          datasetIrObjective.push({
            label: "Salaires prév.",
            backgroundColor: categoryTypesColor[4],
            borderColor: categoryTypesColor[4],
            borderRadius: 20,
            data: [(totalSalaries / currentIrObjective) * 100],
          });
        } else {
          datasetIrObjective.push({
            label: "Salaires prév.",
            backgroundColor: categoryTypesColor[4],
            borderColor: categoryTypesColor[4],
            borderRadius: 20,
            data: [(totalSalaries / currentIrObjective) * 100],
          });
          datasetIrObjective.push({
            label: "En cours",
            backgroundColor: categoryTypesColor[1],
            borderColor: categoryTypesColor[1],
            borderRadius: 20,
            data: [(totalPrevisionnelIr / currentIrObjective) * 100],
          });
        }
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
      });
  }
</script>

<div class="grid grid-cols-1 w-full">
  <div class="grid grid-cols-1 md:grid-cols-2 w-full">
    <div class="border-solid hover:border-dotted border-2 rounded mr-1 mt-1">
      <div class="grid grid-cols-3 w-full text-center">
        <div>
          <p>Salaire prév.</p>
          <p>{totalSalaries.toLocaleString("fr")}</p>
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
      <canvas bind:this={chartIrObjective} height="50px" />
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
      <div class="text-center mb-5">Synthèse trésorerie mois actuel</div>
      <div class="grid grid-cols-3 gap-1 md:gap-4 w-full mr-1 mt-1 font-normal">
        <div class="text-center">
          <p>Banques perso</p>
          <p>{totalBankPerso.toLocaleString("fr")}</p>
        </div>

        <div class="text-center">
          <p>Dépenses mois</p>
          <p>{totalPersoExpensesCurrentMonth.toLocaleString("fr")}</p>
        </div>

        <div class="text-center">
          <p class={cssNeg}>Solde cash</p>
          <p class={cssNeg}>{soldeCash.toLocaleString("fr")}</p>
        </div>

        {#each banks as b}
          {#if b.group === "Perso"}
            <div class="text-center">
              <p>
                {b.name}
              </p>
              <p>{b.amount.toLocaleString("fr")}</p>
            </div>
          {/if}
        {/each}
        <div class="text-center">
          <p>Salaires du mois</p>
          <p>
            {totalSalariesCurrentMonth.toLocaleString("fr")}
          </p>
        </div>

        {#each banks as b}
          {#if b.group === "Openfield"}
            <div class="text-center">
              <p>
                {b.name}
              </p>
              <p>{b.amount.toLocaleString("fr")}</p>
            </div>{/if}
        {/each}
        <div class="text-center">
          <p>Dépenses mois</p>
          <p>{totalOpenfieldExpensesCurrentMonth.toLocaleString("fr")}</p>
        </div>
        <div class="text-center">
          <p class={cssOpenfieldNeg}>Solde cash</p>
          <p class={cssOpenfieldNeg}>{soldeOpenfield.toLocaleString("fr")}</p>
        </div>
      </div>
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
</div>
