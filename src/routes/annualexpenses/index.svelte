<script context="module">
</script>

<script>
  import { date_DD_MM, YYYYMM } from "$lib/date_functions";

  import { onMount } from "svelte";
  let statutEnregistrement = "";
  let categoryOpfdExpenses = [];
  let categoryPersoExpenses = [];

  let OpfdExpenses = [];
  let tableOpfdExpenses = [];
  let totalOpfdExpenses = ["Total", 0];

  let persoExpenses = [];
  let tablePersoExpenses = [];
  let totalPersoExpenses = ["Total", 0];

  let years = [];

  let currentYear = new Date().getFullYear();

  onMount(async (promise) => {
    Promise.all([
      fetch("/MDB/categories?group=Openfield"),
      fetch("/MDB/categories?group=Perso"),
      fetch("/MDB/annualopfd"),
      fetch("/MDB/annualexpenses"),
    ])
      .then(async ([res1, res2, res3, res4]) => {
        const cat = await res1.json();
        categoryOpfdExpenses = await cat.categories;
        const ca = await res2.json();
        categoryPersoExpenses = await ca.categories;
        const ope = await res3.json();
        OpfdExpenses = await ope.expenses;
        const exp = await res4.json();
        persoExpenses = await exp.expenses;
      })
      .then(() => {
        loadTables();
      });
  });

  function loadTables() {
    for (var i = 0; i < 5; i++) {
      years.push(currentYear + i);
    }
    years = years;

    tableOpfdExpenses = [];
    totalOpfdExpenses = ["Total", 0];

    var row = [];
    let _id = 0;
    let value = 0;
    for (var i = 0; i < categoryOpfdExpenses.length; i++) {
      row.push({ _id: -i - 1, value: categoryOpfdExpenses[i].name });
      _id = 0;
      value = 0;
      for (var k = 0; k < OpfdExpenses.length; k++) {
        if (
          OpfdExpenses[k].year === currentYear &&
          OpfdExpenses[k].category === categoryOpfdExpenses[i].name
        ) {
          _id = OpfdExpenses[k]._id;
          value = OpfdExpenses[k].amount;
          totalOpfdExpenses[1] = totalOpfdExpenses[1] + OpfdExpenses[k].amount;
        }
      }
      row.push({ _id: _id, previousValue: value, value: value });
      tableOpfdExpenses.push(row);
      row = [];
    }
    tableOpfdExpenses = tableOpfdExpenses;

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
    for (var i = 0; i < categoryOpfdExpenses.length; i++) {
      if (
        tableOpfdExpenses[i][1]._id !== 0 &&
        tableOpfdExpenses[i][1].value !== tableOpfdExpenses[i][1].previousValue
      ) {
        res = await fetch("/MDB/annualopfd", {
          method: "PUT",
          body: JSON.stringify({
            _id: tableOpfdExpenses[i][1]._id,
            amount: Number(tableOpfdExpenses[i][1].value),
          }),
        });
      }
      if (
        tableOpfdExpenses[i][1]._id === 0 &&
        tableOpfdExpenses[i][1].value !== 0
      ) {
        res = await fetch("/MDB/annualopfd", {
          method: "POST",
          body: JSON.stringify({
            year: currentYear,
            category: categoryOpfdExpenses[i].name,
            amount: Number(tableOpfdExpenses[i][1].value),
          }),
        });
        tableOpfdExpenses[i][1]._id = await res.json();
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
    totalOpfdExpenses = ["Total", 0];
    for (var i = 0; i < categoryOpfdExpenses.length; i++) {
      totalOpfdExpenses[1] =
        totalOpfdExpenses[1] + Number(tableOpfdExpenses[i][1].value);
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
        <h1 class="text-lg uppercase">Opfd</h1>
      </div>
      <table>
        {#each tableOpfdExpenses as row}
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
          {#each totalOpfdExpenses as s}
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
