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

  let chartCash;
  let ctxCash;
  var chartCashData = [];

  let chartSalaries;
  let ctxSalaries;
  var chartSalariesData = [];

  let dates = [""];

  let banks = [];
  let totalBank = 0;
  let totalBankPerso = 0;
  let totalBankOpfd = 0;

  let invoices = [];
  let totalPotentialInvoices = 0; // somme des factures de l'année
  let totalRealizedInvoices = 0; // somme des factures de l'année avant le mois en cours
  let currentCaObjective = 0;

  let persoExpenses = [];

  let OpfdExpenses = [];

  let salaries = [];
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
  //  currentYear = 2024;
  //  currentMonth = 11;

  // données pour la synthèse du cash
  let totalPersoExpensesCurrentMonth = 0;
  let totalOpfdExpensesCurrentMonth = 0;
  let totalSalariesCurrentMonth = 0;
  let cssNeg = "text-red-400";
  let cssOpfdNeg = "text-red-400";
  let soldeCash = 0;
  let soldeOpfd = 0;

  onMount(async (promise) => {
    loadTables();

    ctxIrObjective = chartIrObjective.getContext("2d");
    chartIrObjectiveData = new chartjs(ctxIrObjective, {});

    ctxCaObjective = chartCaObjective.getContext("2d");
    chartCaObjectiveData = new chartjs(ctxCaObjective, {});

    ctxCash = chartCash.getContext("2d");
    chartCashData = new chartjs(ctxCash, {});

    ctxSalaries = chartSalaries.getContext("2d");
    chartSalariesData = new chartjs(ctxSalaries, {});
  });

  async function loadTables() {
    Promise.all([
      fetch("/MDB/irobjectives?year=" + currentYear),
      fetch("/MDB/caobjectives?year=" + currentYear),
      fetch("/MDB/expenses"),
      fetch("/MDB/salaries"),
      fetch("/MDB/banks?group=all"),
      fetch("/MDB/opfd"),
      fetch("/MDB/invoices"),
    ])
      .then(async ([res1, res2, res5, res7, res8, res9, res11]) => {
        const iro = await res1.json();
        currentIrObjective = await iro.ir[0].amount;
        currentIrObjectiveMonth = (currentIrObjective / 12).toFixed(0);
        const cao = await res2.json();
        currentCaObjective = await cao.ca[0].amount;
        const exp = await res5.json();
        persoExpenses = await exp.expenses;
        const sa = await res7.json();
        salaries = await sa.salaries;
        const b = await res8.json();
        banks = await b.banks;
        const op = await res9.json();
        OpfdExpenses = await op.openfield;
        const inv = await res11.json();
        invoices = await inv.invoices;
      })
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
            totalBankOpfd = totalBankPerso + banks[i].amount;
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
        let salariesMonth = [];
        let deltaSalariesMonth = [];
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
                    tempTotalCurrentYearInvoices =
                      tempTotalCurrentYearInvoices + invoices[k].days * invoices[k].dailyRate;
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
              tempCashPessimist =
                tempCashPessimist + tempTotalInvoices - tempTotalPersoExpenses - tempTotalOpfdExpenses;
              // données pour la synthèse du cash
            } else {
              tempCashPessimist = tempCashPessimist - tempTotalPersoExpenses - tempTotalOpfdExpenses;
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
        cssNeg = "";
        if (soldeCash < 0) {
          cssNeg = "text-red-400";
        }
        soldeCash = totalBankPerso - totalPersoExpensesCurrentMonth;
        cssNeg = "";
        if (soldeCash < 0) {
          cssNeg = "text-red-400";
        }
        soldeOpfd = totalBankOpfd - totalOpfdExpensesCurrentMonth;
        cssOpfdNeg = "";
        if (soldeOpfd < 0) {
          cssOpfdNeg = "text-red-400";
        }
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

        // gestion des données pour les graphes
        let datasetIrObjective = [];
        if (totalEstimatedSalaries > totalPrevisionnelIr) {
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
            data: [(totalEstimatedSalaries / currentIrObjective) * 100],
          });
        } else {
          datasetIrObjective.push({
            label: "Salaires prév.",
            backgroundColor: categoryTypesColor[4],
            borderColor: categoryTypesColor[4],
            borderRadius: 20,
            data: [(totalEstimatedSalaries / currentIrObjective) * 100],
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
                label: "Tréso prévisionnelle",
                data: cashGraph,
                fill: {
                  target: "origin",
                  above: "rgba(255, 255, 255, 0.08)",
                  below: "rgba(255, 255, 255, 0.08)",
                },
                borderColor: categoryTypesColor[4],
                pointBackgroundColor: categoryTypesColor[4],
                pointBorderColor: categoryTypesColor[4],
                order: 2,
              },
              {
                label: "Tréso pessimiste",
                data: cashPessimistGraph,
                fill: {
                  target: "origin",
                  above: "rgba(11, 149, 100, 0.08)",
                  below: "rgba(218, 96, 96, 0.08)",
                },
                borderColor: categoryTypesColor[0],
                pointBackgroundColor: categoryTypesColor[0],
                pointBorderColor: categoryTypesColor[0],
                order: 1,
              },
            ],
          },
          options: {
            tension: 0.3,
            cubicInterpolationMode: "monotone",
            borderDash: [20, 10, 60, 10],
            pointRadius: 3,
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

        chartSalariesData.destroy();
        chartSalariesData = new chartjs(ctxSalaries, {
          type: "bar",
          data: {
            labels: ["JAN", "FEV", "MAR", "AVR", "MAI", "JUN", "JUL", "AOU", "SEP", "OCT", "NOV", "DEC"],
            datasets: [
              {
                label: "Salaires mensuels",
                data: salariesMonth,
                backgroundColor: categoryTypesColor[2],
                order: 2,
              },
              {
                label: "moyenne",
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
                borderColor: categoryTypesColor[2],
                borderWidth: 2,
                borderDash: [10, 5],
                pointRadius: 0,
                type: "line",
                order: 3,
              },
              {
                label: "cible",
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                borderColor: categoryTypesColor[8],
                borderWidth: 2,
                pointRadius: 0,
                type: "line",
                order: 1,
                yAxisID: "yline",
              },
              {
                label: "difference",
                data: deltaSalariesMonth,
                borderColor: categoryTypesColor[0],
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 10,
                pointHitRadius: 30,
                pointBorderWidth: 2,
                pointStyle: "rectRounded",
                pointBackgroundColor: categoryTypesColor[0],
                pointBorderColor: categoryTypesColor[0],
                type: "line",
                order: 1,
                yAxisID: "yline",
              },
            ],
          },
          options: {
            scales: { y: { beginAtZero: true }, yline: { position: "right" } },
            plugins: {
              legend: {
                display: false,
              },
            },
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
          <p>
            {totalEstimatedSalaries.toLocaleString("fr", {
              maximumFractionDigits: 0,
            })}
          </p>
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
          <p>
            {totalRealizedInvoices.toLocaleString("fr")}
          </p>
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
          <p>{totalOpfdExpensesCurrentMonth.toLocaleString("fr")}</p>
        </div>
        <div class="text-center">
          <p class={cssOpfdNeg}>Solde cash</p>
          <p class={cssOpfdNeg}>{soldeOpfd.toLocaleString("fr")}</p>
        </div>
      </div>
    </div>
    <div class="border-solid hover:border-dotted border-2 rounded mr-1 mt-1">
      <div class="grid grid-cols-1 w-full text-center">
        <div>
          <p>
            Salaires {totalSalaries.toLocaleString("fr", {
              maximumFractionDigits: 0,
            })} / Objectif IR {currentIrObjective.toLocaleString("fr")}
          </p>
        </div>
        <canvas bind:this={chartSalaries} />
      </div>
    </div>
  </div>
</div>
