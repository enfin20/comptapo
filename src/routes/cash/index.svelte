<script context="module">
</script>

<script>
  import { YYYYMM } from "$lib/date_functions";

  import { onMount } from "svelte";
  let statutEnregistrement = "";

  let banks = [];
  let banksOpenfield = [];
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

  let openfieldExpenses = [];
  let totalOpenfieldExpenses = [
    "Openfield dépenses",
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
  let soldeOpenfield = 0;

  let salaries = [];
  let currentSalaries = [];
  let totalSalaries = ["Salaires", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  let soldeCash = 0;

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth() + 1;

  let cssNeg = "text-red-400";
  let cssOpenfieldNeg = "text-red-400";

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
  onMount(async (promise) => {
    Promise.all([
      fetch("/MDB/expenses"),
      fetch("/MDB/salaries"),
      fetch("/MDB/banks?group=all"),
      fetch("/MDB/openfield"),
    ])
      .then(async ([res1, res2, res3, res4]) => {
        const exp = await res1.json();
        persoExpenses = await exp.expenses;
        const sa = await res2.json();
        salaries = await sa.salaries;
        const b = await res3.json();
        banks = await b.banks;
        const op = await res4.json();
        openfieldExpenses = await op.openfield;
      })
      .then(() => {
        loadTables();
      });
  });

  function loadTables() {
    currentSalaries = [];
    for (var i = 0; i < banks.length; i++) {
      if (banks[i].group === "Openfield") {
        banksOpenfield.push(banks[i]);
      }
      if (banks[i].group === "Perso") {
        currentSalaries.push(0);
        banksPerso.push(banks[i]);
      }
    }
    banksOpenfield = banksOpenfield;
    banksPerso = banksPerso;

    totalSalaries = ["Salaires", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    totalPersoExpenses = ["Perso dépenses", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    totalOpenfieldExpenses = [
      "Openfield dépenses",
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
        if (salaries[k].year === currentYear && salaries[k].month === j + 1) {
          totalSalaries[j + 1] = totalSalaries[j + 1] + salaries[k].amount;
        }
      }
      for (var k = 0; k < openfieldExpenses.length; k++) {
        if (
          openfieldExpenses[k].year === currentYear &&
          openfieldExpenses[k].month === j + 1
        ) {
          totalOpenfieldExpenses[j + 1] =
            totalOpenfieldExpenses[j + 1] + openfieldExpenses[k].amount;
        }
      }
    }
    totalPersoExpenses = totalPersoExpenses;
    totalSalaries = totalSalaries;
    totalOpenfieldExpenses = totalOpenfieldExpenses;

    salaryChanges();
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
    for (var i = 0; i < banksOpenfield.length; i++) {
      res = await fetch("/MDB/banks", {
        method: "PUT",
        body: JSON.stringify({
          _id: banksOpenfield[i]._id,
          amount: Number(banksOpenfield[i].amount),
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
      // mise à jour du compte Openfield en retranchant le salaire correspondant
      banksOpenfield[0].amount =
        Number(banksOpenfield[0].amount) - Number(currentSalaries[i]);
      // mise à jour du total des comptes persos
      totalBankPerso = totalBankPerso + Number(banksPerso[i].amount);
      // mise à jour des soldes cash
      soldeOpenfield =
        banksOpenfield[0].amount - totalOpenfieldExpenses[currentMonth];
      cssOpenfieldNeg = "";
      if (soldeOpenfield < 0) {
        cssOpenfieldNeg = "text-red-400";
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
    {#each banksOpenfield as b}
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
      <p>{totalOpenfieldExpenses[currentMonth].toLocaleString("fr")}</p>
    </div>
    <div class="text-center">
      <p class={cssOpenfieldNeg}>Solde cash</p>
      <p class={cssOpenfieldNeg}>{soldeOpenfield.toLocaleString("fr")}</p>
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
  <div class="mt-5  w-full md:w-2/3 text-xs md:text-base">
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
            >{totalOpenfieldExpenses[i].toLocaleString("fr")}</td
          >
        </tr>
      {/each}
    </table>
  </div>
</div>
