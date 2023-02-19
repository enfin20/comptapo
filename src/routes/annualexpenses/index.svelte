<script context="module">
</script>

<script>
  import { date_DD_MM, YYYYMM } from "$lib/date_functions";

  import { onMount } from "svelte";
  let statutEnregistrement = "";
  let categoryOpenfieldExpenses = [];
  let categoryPersoExpenses = [];

  let openfieldExpenses = [];
  let tableOpenfieldExpenses = [];
  let totalOpenfieldExpenses = ["Total", 0];

  let persoExpenses = [];
  let tablePersoExpenses = [];
  let totalPersoExpenses = ["Total", 0];

  let years = [];

  let currentYear = new Date().getFullYear();

  onMount(async (promise) => {
    let res = await fetch("/MDB/categories?group=Openfield");
    const cat = await res.json();
    categoryOpenfieldExpenses = await cat.categories;

    res = await fetch("/MDB/categories?group=Perso");
    const ca = await res.json();
    categoryPersoExpenses = await ca.categories;

    res = await fetch("/MDB/annualopenfield");
    const ope = await res.json();
    openfieldExpenses = await ope.expenses;

    res = await fetch("/MDB/annualexpenses");
    const exp = await res.json();
    persoExpenses = await exp.expenses;

    loadTables();
  });

  function loadTables() {
    for (var i = 0; i < 5; i++) {
      years.push(currentYear + i);
    }
    years = years;

    tableOpenfieldExpenses = [];
    totalOpenfieldExpenses = ["Total", 0];

    var row = [];
    let _id = 0;
    let value = 0;
    for (var i = 0; i < categoryOpenfieldExpenses.length; i++) {
      row.push({ _id: -i - 1, value: categoryOpenfieldExpenses[i].name });
      _id = 0;
      value = 0;
      for (var k = 0; k < openfieldExpenses.length; k++) {
        if (
          openfieldExpenses[k].year === currentYear &&
          openfieldExpenses[k].category === categoryOpenfieldExpenses[i].name
        ) {
          _id = openfieldExpenses[k]._id;
          value = openfieldExpenses[k].amount;
          totalOpenfieldExpenses[1] =
            totalOpenfieldExpenses[1] + openfieldExpenses[k].amount;
        }
      }
      row.push({ _id: _id, previousValue: value, value: value });
      tableOpenfieldExpenses.push(row);
      row = [];
    }
    tableOpenfieldExpenses = tableOpenfieldExpenses;

    tablePersoExpenses = [];
    totalPersoExpenses = ["Total", 0];
    for (var i = 0; i < categoryPersoExpenses.length; i++) {
      row.push({ _id: -i - 1, value: categoryPersoExpenses[i].name });
      _id = 0;
      value = 0;
      for (var k = 0; k < persoExpenses.length; k++) {
        if (
          persoExpenses[k].year === currentYear &&
          persoExpenses[k].category === categoryPersoExpenses[i].name
        ) {
          _id = persoExpenses[k]._id;
          value = persoExpenses[k].amount;
          totalPersoExpenses[1] =
            totalPersoExpenses[1] + persoExpenses[k].amount;
        }
      }
      row.push({ _id: _id, previousValue: value, value: value });
      tablePersoExpenses.push(row);
      row = [];
    }
    tablePersoExpenses = tablePersoExpenses;
  }

  export async function saveData() {
    let res;
    statutEnregistrement = "   En cours ....";
    for (var i = 0; i < categoryOpenfieldExpenses.length; i++) {
      if (
        tableOpenfieldExpenses[i][1]._id !== 0 &&
        tableOpenfieldExpenses[i][1].value !==
          tableOpenfieldExpenses[i][1].previousValue
      ) {
        res = await fetch("/MDB/annualopenfield", {
          method: "PUT",
          body: JSON.stringify({
            _id: tableOpenfieldExpenses[i][1]._id,
            amount: Number(tableOpenfieldExpenses[i][1].value),
          }),
        });
      }
      if (
        tableOpenfieldExpenses[i][1]._id === 0 &&
        tableOpenfieldExpenses[i][1].value !== 0
      ) {
        res = await fetch("/MDB/annualopenfield", {
          method: "POST",
          body: JSON.stringify({
            year: currentYear,
            category: categoryOpenfieldExpenses[i].name,
            amount: Number(tableOpenfieldExpenses[i][1].value),
          }),
        });
        tableOpenfieldExpenses[i][1]._id = await res.json();
      }
    }

    for (var i = 0; i < categoryPersoExpenses.length; i++) {
      if (
        tablePersoExpenses[i][1]._id !== 0 &&
        tablePersoExpenses[i][1].value !==
          tablePersoExpenses[i][1].previousValue
      ) {
        res = await fetch("/MDB/annualexpenses", {
          method: "PUT",
          body: JSON.stringify({
            _id: tablePersoExpenses[i][1]._id,
            amount: Number(tablePersoExpenses[i][1].value),
          }),
        });
      }
      if (
        tablePersoExpenses[i][1]._id === 0 &&
        tablePersoExpenses[i][1].value !== 0
      ) {
        res = await fetch("/MDB/annualexpenses", {
          method: "POST",
          body: JSON.stringify({
            year: currentYear,
            category: categoryPersoExpenses[i].name,
            amount: Number(tablePersoExpenses[i][1].value),
          }),
        });
        tablePersoExpenses[i][1]._id = await res.json();
      }
    }
    statutEnregistrement = "... Terminé";
  }

  export async function expensesChanges() {
    totalOpenfieldExpenses = ["Total", 0];
    for (var i = 0; i < categoryOpenfieldExpenses.length; i++) {
      totalOpenfieldExpenses[1] =
        totalOpenfieldExpenses[1] + Number(tableOpenfieldExpenses[i][1].value);
    }
    totalPersoExpenses = ["Total", 0];
    for (var i = 0; i < categoryPersoExpenses.length; i++) {
      totalPersoExpenses[1] =
        totalPersoExpenses[1] + Number(tablePersoExpenses[i][1].value);
    }
  }
</script>

<div class="grid grid-cols-1 w-full">
  <div class="md:m-5">
    <h1 class="text-lg uppercase">Dépenses annuelles</h1>
  </div>
  <div
    class="grid grid-cols-2 gap-5 w-full md:w-1/4 border-solid hover:border-dotted border-2 rounded m-1 p-1"
  >
    <div>
      Année<br />
      <select
        bind:value={currentYear}
        class="appearance-none border-2 text-xs border-gray-200 rounded py-1 px-10 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
        on:change={loadTables}
      >
        {#each years as y}
          <option value={y}>
            {y}
          </option>
        {/each}
      </select>
    </div>
    <div>
      <br />
      <button
        type="submit"
        class="shadow bg-amber-400 text-xs hover:bg-amber-300 focus:shadow-outline focus:outline-none text-gray-700  py-1 px-4 ml-4 rounded"
        on:click={saveData}>Enregistrer</button
      >
      <span class="ml-4 ">{statutEnregistrement}</span>
    </div>
  </div>
  <div class="grid grid-cols-2 gap-5 mt-5 w-full md:w-2/3">
    <div>
      <div class="md:m-5">
        <h1 class="text-lg uppercase">Openfield</h1>
      </div>
      <table>
        {#each tableOpenfieldExpenses as row}
          <tr>
            {#each row as cell}
              {#if cell._id < 0}
                <td class="text-xs text-right">{cell.value}</td>
              {:else}
                <td>
                  <input
                    type="text"
                    bind:value={cell.value}
                    on:change={expensesChanges}
                    class="text-xs text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                  /></td
                >
              {/if}
            {/each}
          </tr>
        {/each}
        <tr>
          {#each totalOpenfieldExpenses as s}
            <td class="text-sm text-right py-1 px-1 font-bold"
              >{s.toLocaleString("fr")}</td
            >
          {/each}
        </tr>
      </table>
    </div>
    <div>
      <div class="md:m-5">
        <h1 class="text-lg uppercase">Personnelles</h1>
      </div>
      <table>
        {#each tablePersoExpenses as row}
          <tr>
            {#each row as cell}
              {#if cell._id < 0}
                <td class="text-xs text-right">{cell.value}</td>
              {:else}
                <td>
                  <input
                    type="text"
                    bind:value={cell.value}
                    on:change={expensesChanges}
                    class="text-xs text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                  /></td
                >
              {/if}
            {/each}
          </tr>
        {/each}
        <tr>
          {#each totalPersoExpenses as s}
            <td class="text-sm text-right py-1 px-1 font-bold"
              >{s.toLocaleString("fr")}</td
            >
          {/each}
        </tr>
      </table>
    </div>
  </div>
</div>
