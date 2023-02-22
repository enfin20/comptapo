<script context="module">
</script>

<script>
  import { date_DD_MM, YYYYMM } from "$lib/date_functions";

  import { onMount } from "svelte";
  let statutEnregistrement = "";

  let banks = [];

  let expenses = [];
  let categoryExpenses = [];
  let tableExpenses = [];
  let totalExpenses = ["Total", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  let years = [];
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
  let currentYear = new Date().getFullYear();

  onMount(async (promise) => {
    let res = await fetch("/MDB/categories?group=Perso");
    const cat = await res.json();
    categoryExpenses = await cat.categories;

    res = await fetch("/MDB/expenses");
    const ope = await res.json();
    expenses = await ope.expenses;

    res = await fetch("/MDB/banks?group=Perso");
    const b = await res.json();
    banks = await b.banks;
    console.info("banks :", banks);
    for (var i = 0; i < banks.length; i++) {
      banks[i].previousValue = banks[i].value;
    }

    loadTables();
  });

  function loadTables() {
    if (years.length < 4) {
      for (var i = 0; i < 5; i++) {
        years.push(currentYear + i);
      }
      years = years;
    }

    tableExpenses = [];
    totalExpenses = ["Total", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var row = [];
    let _id = 0;
    let value = 0;
    for (var i = 0; i < categoryExpenses.length; i++) {
      row.push({ _id: -i - 1, value: categoryExpenses[i].name });
      for (var j = 1; j <= 12; j++) {
        _id = 0;
        value = 0;
        for (var k = 0; k < expenses.length; k++) {
          if (
            expenses[k].year === currentYear &&
            expenses[k].month === j &&
            expenses[k].category === categoryExpenses[i].name
          ) {
            _id = expenses[k]._id;
            value = expenses[k].amount;
            totalExpenses[j] = totalExpenses[j] + expenses[k].amount;
          }
        }
        row.push({ _id: _id, previousValue: value, value: value });
      }
      tableExpenses.push(row);
      row = [];
    }
    tableExpenses = tableExpenses;
  }

  export async function saveData() {
    let tempDate;
    let res;
    statutEnregistrement = "   En cours ....";
    for (var i = 0; i < categoryExpenses.length; i++) {
      for (var j = 1; j <= 12; j++) {
        if (j <= 9) {
          tempDate = currentYear.toString().concat("0").concat(j.toString());
        } else {
          tempDate = currentYear.toString().concat(j.toString());
        }
        if (
          tableExpenses[i][j]._id !== 0 &&
          tableExpenses[i][j].value !== tableExpenses[i][j].previousValue
        ) {
          res = await fetch("/MDB/expenses", {
            method: "PUT",
            body: JSON.stringify({
              _id: tableExpenses[i][j]._id,
              amount: Number(tableExpenses[i][j].value),
            }),
          });
        }
        if (tableExpenses[i][j]._id === 0 && tableExpenses[i][j].value !== 0) {
          res = await fetch("/MDB/expenses", {
            method: "POST",
            body: JSON.stringify({
              date: tempDate,
              category: categoryExpenses[i].name,
              amount: Number(tableExpenses[i][j].value),
            }),
          });
          tableExpenses[i][j]._id = await res.json();
        }
      }
    }

    for (var i = 0; i < banks.length; i++) {
      if (banks[i].previousValue !== banks[i].amount) {
        res = await fetch("/MDB/banks", {
          method: "PUT",
          body: JSON.stringify({
            _id: banks[i]._id,
            amount: Number(banks[i].amount),
          }),
        });
      }
    }
    statutEnregistrement = "... Terminé";
  }

  export async function expensesChanges() {
    totalExpenses = ["Total", 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < categoryExpenses.length; i++) {
      for (var j = 1; j <= 12; j++) {
        totalExpenses[j] = totalExpenses[j] + Number(tableExpenses[i][j].value);
      }
    }
  }
</script>

<div class="grid grid-cols-1 w-full">
  <div class="md:m-5">
    <h1 class="text-lg uppercase">Dépenses personnelles</h1>
  </div>
  <div
    class="grid grid-cols-4 gap-1 md:gap-4 w-full md:w-1/2 border-solid hover:border-dotted border-2 rounded m-1 p-1 text-sm md:text-base"
  >
    {#each banks as b}
      <div>
        {b.name}
        <input
          type="text"
          bind:value={b.amount}
          class="text-sm text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
        />
      </div>
    {/each}
    <div>
      Année<br />
      <select
        bind:value={currentYear}
        class="appearance-none border-2 text-sm border-gray-200 rounded py-1 px-10 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
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
        class="shadow bg-amber-400 text-sm hover:bg-amber-300 focus:shadow-outline focus:outline-none text-gray-700  py-1 px-4 ml-4 rounded"
        on:click={saveData}>Save</button
      >
      <span class="ml-4 ">{statutEnregistrement}</span>
    </div>
  </div>
  <div class="mt-5  w-full md:w-2/3">
    <table>
      <tr>
        {#each months as m}
          <td class="text-xs text-center ">{m}</td>
        {/each}
      </tr>
      {#each tableExpenses as row}
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
        {#each totalExpenses as s}
          <td class="text-sm text-right py-1 px-1 font-bold"
            >{s.toLocaleString("fr")}</td
          >
        {/each}
      </tr>
    </table>
  </div>
</div>
