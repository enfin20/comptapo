<script context="module">
</script>

<script>
  import { YYYYMM } from "$lib/date_functions";
  import { onMount } from "svelte";
  import chartjs from "chart.js/auto";

  let statutEnregistrement = "";

  let banks = [];
  let banksOpfd = [];
  let banksPerso = [];
  let totalBankPerso = 0;

  let persoExpenses = [];
  let totalPersoExpenses = [
    "Perso dépenses",
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
  ];

  let OpfdExpenses = [];
  let totalOpfdExpenses = ["Opfd dépenses", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let soldeOpfd = 0;

  let salaries = [];
  let currentSalaries = [];
  let totalSalaries = ["Salaires", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let totalSalariesGraph = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let totalObjectiveIRGraph = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let soldeCash = 0;
  let currentIrObjective = 0;

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth() + 1;

  let cssNeg = "text-red-400";
  let cssOpfdNeg = "text-red-400";

  let months = [
    "",
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  let monthsGraph = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  let chartSalaries;
  let ctxSalaries;
  var chartSalariesData = [];

  onMount(async (promise) => {
    loadTables();

    ctxSalaries = chartSalaries.getContext("2d");
    chartSalariesData = new chartjs(ctxSalaries, {});
  });

  export async function loadTables() {
    Promise.all([
      fetch("/MDB/expenses"),
      fetch("/MDB/salaries"),
      fetch("/MDB/banks?group=all"),
      fetch("/MDB/opfd"),
      fetch("/MDB/irobjectives?year=" + currentYear),
    ])
      .then(async ([res1, res2, res3, res4, res5]) => {
        const exp = await res1.json();
        persoExpenses = await exp.expenses;
        const sa = await res2.json();
        salaries = await sa.salaries;
        const b = await res3.json();
        banks = await b.banks;
        const op = await res4.json();
        OpfdExpenses = await op.openfield;
        const iro = await res5.json();
        currentIrObjective = await iro.ir[0].amount;
      })
      .then(() => {
        currentSalaries = [];
        for (var i = 0; i < banks.length; i++) {
          if (banks[i].group === "Openfield") {
            banksOpfd.push(banks[i]);
          }
          if (banks[i].group === "Perso") {
            currentSalaries.push(0);
            banksPerso.push(banks[i]);
          }
        }
        banksOpfd = banksOpfd;
        banksPerso = banksPerso;

        totalSalaries = ["Salaires", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        totalSalariesGraph = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        totalObjectiveIRGraph = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        totalPersoExpenses = [
          "Perso dépenses",
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ];
        totalOpfdExpenses = [
          "Opfd dépenses",
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
          0,
        ];
        for (var j = 0; j <= 11; j++) {
          for (var k = 0; k < persoExpenses.length; k++) {
            if (
              persoExpenses[k].year === currentYear &&
              persoExpenses[k].month === j + 1
            ) {
              totalPersoExpenses[j + 1] =
                totalPersoExpenses[j + 1] + persoExpenses[k].amount;
            }
          }
          for (var k = 0; k < salaries.length; k++) {
            if (
              salaries[k].year === currentYear &&
              salaries[k].month === j + 1
            ) {
              totalSalaries[j + 1] = totalSalaries[j + 1] + salaries[k].amount;
            }
          }
          for (var k = 0; k < OpfdExpenses.length; k++) {
            if (
              OpfdExpenses[k].year === currentYear &&
              OpfdExpenses[k].month === j + 1
            ) {
              totalOpfdExpenses[j + 1] =
                totalOpfdExpenses[j + 1] + OpfdExpenses[k].amount;
            }
          }
        }
        totalPersoExpenses = totalPersoExpenses;
        totalSalaries = totalSalaries;
        totalOpfdExpenses = totalOpfdExpenses;

        salaryChanges();
      });
  }

  export async function saveData() {
    var res;
    statutEnregistrement = "   En cours ....";
    for (var i = 0; i < banksPerso.length; i++) {
      if (Number(currentSalaries[i]) > 0) {
        res = await fetch("/MDB/salaries", {
          method: "POST",
          body: JSON.stringify({
            date: YYYYMM(0).date,
            amount: Number(currentSalaries[i]),
          }),
        });
      }
      console.info("bank perso", banksPerso[i]);
      res = await fetch("/MDB/banks", {
        method: "PUT",
        body: JSON.stringify({
          _id: banksPerso[i]._id,
          amount: Number(banksPerso[i].amount),
        }),
      });
    }
    for (var i = 0; i < banksOpfd.length; i++) {
      res = await fetch("/MDB/banks", {
        method: "PUT",
        body: JSON.stringify({
          _id: banksOpfd[i]._id,
          amount: Number(banksOpfd[i].amount),
        }),
      });
    }
    statutEnregistrement = "... Terminé";
  }

  export async function salaryChanges() {
    totalBankPerso = 0;
    for (var i = 0; i < banksPerso.length; i++) {
      // mise à jour des comptes perso en ajoutant le salaire correspondant
      banksPerso[i].amount =
        Number(banksPerso[i].amount) + Number(currentSalaries[i]);
      // mise à jour du compte Opfd en retranchant le salaire correspondant
      banksOpfd[0].amount =
        Number(banksOpfd[0].amount) - Number(currentSalaries[i]);
      // mise à jour du total des comptes persos
      totalBankPerso = totalBankPerso + Number(banksPerso[i].amount);
      // mise à jour des soldes cash
      soldeOpfd = banksOpfd[0].amount - totalOpfdExpenses[currentMonth];
      cssOpfdNeg = "";
      if (soldeOpfd < 0) {
        cssOpfdNeg = "text-red-400";
      }
      soldeCash = totalBankPerso - totalPersoExpenses[currentMonth];
      cssNeg = "";
      if (soldeCash < 0) {
        cssNeg = "text-red-400";
      }
      // mise à jour du salaire du mois correspondant
      totalSalaries[currentMonth] =
        totalSalaries[currentMonth] + Number(currentSalaries[i]);
    }

    // mise en forme du graph
    totalSalariesGraph[0] = totalSalaries[1];
    totalObjectiveIRGraph[0] = currentIrObjective / 12;
    for (var i = 1; i < 12; i++) {
      totalSalariesGraph[i] = totalSalariesGraph[i - 1] + totalSalaries[i + 1];
      totalObjectiveIRGraph[i] =
        totalObjectiveIRGraph[i - 1] + currentIrObjective / 12;
    }
    chartSalariesData.destroy();
    chartSalariesData = new chartjs(ctxSalaries, {
      type: "line",
      data: {
        labels: monthsGraph,
        datasets: [
          {
            label: "Salaires",
            data: totalSalariesGraph,
          },
          {
            label: "Objectif",
            data: totalObjectiveIRGraph,
          },
        ],
      },
    });
  }
</script>

<div class="grid grid-cols-1 w-full">
  <div class="md:m-5">
    <h1 class="text-lg uppercase">Trésorerie</h1>
  </div>
  <div
    class="grid grid-cols-3 gap-1 md:gap-4 w-full md:w-2/3 border-solid hover:border-dotted border-2 rounded m-1 p-1 text-xs md:text-base"
  >
    <div class="text-center">
      <p>Banques perso</p>
      <p>{totalBankPerso.toLocaleString("fr")}</p>
    </div>
    <div class="text-center">
      <p>Dépenses mois</p>
      <p>{totalPersoExpenses[currentMonth].toLocaleString("fr")}</p>
    </div>
    <div class="text-center">
      <p class={cssNeg}>Solde cash</p>
      <p class={cssNeg}>{soldeCash.toLocaleString("fr")}</p>
    </div>

    {#each banksPerso as b}
      <div>
        {b.name}
        <input
          type="text"
          bind:value={b.amount}
          on:change={salaryChanges}
          class="text-xs text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
        />
      </div>
    {/each}

    <div />

    {#each currentSalaries as c}
      <div>
        Salaires
        <input
          type="text"
          bind:value={c}
          on:change={salaryChanges}
          class="text-xs text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
        />
      </div>
    {/each}
    <div class="text-center">
      <p>Salaires du mois</p>
      <p>
        {totalSalaries[currentMonth].toLocaleString("fr")}
      </p>
    </div>
    {#each banksOpfd as b}
      <div>
        {b.name}
        <input
          type="text"
          bind:value={b.amount}
          class="text-xs text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
        />
      </div>
    {/each}
    <div class="text-center">
      <p>Dépenses mois</p>
      <p>{totalOpfdExpenses[currentMonth].toLocaleString("fr")}</p>
    </div>
    <div class="text-center">
      <p class={cssOpfdNeg}>Solde cash</p>
      <p class={cssOpfdNeg}>{soldeOpfd.toLocaleString("fr")}</p>
    </div>
    <div class="mt-4">
      <button
        type="submit"
        class="shadow bg-amber-400 text-xs hover:bg-amber-300 focus:shadow-outline focus:outline-none text-gray-700  py-1 px-4 ml-4 rounded"
        on:click={saveData}>Enregistrer</button
      >
    </div>
    <div class="ml-4">{statutEnregistrement}</div>
  </div>
  <div class="mt-5 w-full md:w-2/3 text-xs md:text-base">
    <canvas bind:this={chartSalaries} />
  </div>
  <div class="mt-5 w-full md:w-2/3 text-xs md:text-base">
    <table class="w-full md:w-1/2">
      {#each months as m, i}
        <tr>
          <td class="text-left w-1/6">{m}</td>
          <td class="text-right w-1/6"
            >{totalSalaries[i].toLocaleString("fr")}</td
          >
          <td class="text-right w-1/6"
            >{totalPersoExpenses[i].toLocaleString("fr")}</td
          >
          <td class="text-right  w-1/6"
            >{totalOpfdExpenses[i].toLocaleString("fr")}</td
          >
        </tr>
      {/each}
    </table>
  </div>
</div>
