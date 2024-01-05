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

  let invoices = [];
  let categoryInvoices = [
    { name: "days", label: "Nb jours" },
    { name: "dailyRate", label: "Taux" },
    { name: "paymentDate", label: "Mois paiement" },
    { name: "netAmount", label: "Total HT" },
    { name: "vat", label: "TVA" },
    { name: "total", label: "Total TTC" },
    { name: "paid", label: "Payée" },
  ];
  const rowPaid = 6;
  let tableInvoices = [];

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
    Promise.all([
      fetch("/MDB/categories?group=Openfield"),
      fetch("/MDB/opfd"),
      fetch("/MDB/invoices"),
      fetch("/MDB/banks?group=Openfield"),
    ])
      .then(async ([res1, res2, res3, res4]) => {
        const cat = await res1.json();
        categoryExpenses = await cat.categories;
        const ope = await res2.json();
        expenses = await ope.openfield;
        const inv = await res3.json();
        invoices = await inv.invoices;
        const b = await res4.json();
        banks = await b.banks;
      })
      .then(() => {
        for (var i = 0; i < banks.length; i++) {
          banks[i].previousValue = banks[i].value;
        }
        loadTables();
      });
  });

  function loadTables() {
    if (years.length < 4) {
      for (var i = 0; i < 5; i++) {
        years.push(currentYear + i);
      }
      years = years;
    }
    tableExpenses = [];
    tableInvoices = [];
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

    for (var i = 0; i < categoryInvoices.length; i++) {
      row.push({ _id: -i - 1, value: categoryInvoices[i].label });
      for (var j = 1; j <= 12; j++) {
        _id = 0;
        value = 0;
        for (var k = 0; k < invoices.length; k++) {
          if (invoices[k].year === currentYear && invoices[k].month === j) {
            _id = invoices[k]._id;
            switch (categoryInvoices[i].name) {
              case "days":
                value = invoices[k].days;
                break;
              case "dailyRate":
                value = invoices[k].dailyRate;
                break;
              case "paymentDate":
                value = invoices[k].paymentDate;
                break;
              case "netAmount":
                value = invoices[k].days * invoices[k].dailyRate;
                break;
              case "vat":
                value = invoices[k].days * invoices[k].dailyRate * 0.2;
                break;
              case "total":
                value = invoices[k].days * invoices[k].dailyRate * 1.2;
                break;
              case "paid":
                value = invoices[k].paid;
                console.info("value", value);
                break;
            }
          }
        }
        row.push({ _id: _id, previousValue: value, value: value });
      }
      tableInvoices.push(row);
      row = [];
    }
    tableInvoices = tableInvoices;
  }

  export async function saveData() {
    let tempDate;
    let res;
    let updateInvoice;
    let insertInvoice;
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
          res = await fetch("/MDB/opfd", {
            method: "PUT",
            body: JSON.stringify({
              _id: tableExpenses[i][j]._id,
              amount: Number(tableExpenses[i][j].value),
            }),
          });
        }
        if (tableExpenses[i][j]._id === 0 && tableExpenses[i][j].value !== 0) {
          res = await fetch("/MDB/opfd", {
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

    for (var j = 1; j <= 12; j++) {
      if (j <= 9) {
        tempDate = currentYear.toString().concat("0").concat(j.toString());
      } else {
        tempDate = currentYear.toString().concat(j.toString());
      }
      updateInvoice = false;
      insertInvoice = false;
      for (var i = 0; i < 3; i++) {
        if (
          tableInvoices[i][j]._id !== 0 &&
          tableInvoices[i][j].value !== tableInvoices[i][j].previousValue
        ) {
          updateInvoice = true;
        }
        if (tableInvoices[i][j]._id === 0 && tableInvoices[i][j].value !== 0) {
          insertInvoice = true;
        }
      }
      // gestion de la coche "payée"
      if (
        tableInvoices[rowPaid][j]._id !== 0 &&
        tableInvoices[rowPaid][j].value !==
          tableInvoices[rowPaid][j].previousValue
      ) {
        updateInvoice = true;
      }
      if (
        tableInvoices[rowPaid][j]._id === 0 &&
        tableInvoices[rowPaid][j].value !== 0
      ) {
        insertInvoice = true;
      }
      if (updateInvoice) {
        res = await fetch("/MDB/invoices", {
          method: "PUT",
          body: JSON.stringify({
            _id: tableInvoices[0][j]._id,
            days: Number(tableInvoices[0][j].value),
            dailyRate: Number(tableInvoices[1][j].value),
            paymentDate: tableInvoices[2][j].value,
            paid: Boolean(tableInvoices[rowPaid][j].value),
          }),
        });
      }
      if (insertInvoice) {
        res = await fetch("/MDB/invoices", {
          method: "POST",
          body: JSON.stringify({
            date: tempDate,
            days: Number(tableInvoices[0][j].value),
            dailyRate: Number(tableInvoices[1][j].value),
            paymentDate: tableInvoices[2][j].value,
            paid: Boolean(tableInvoices[rowPaid][j].value),
          }),
        });
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

  export async function openfieldChanges() {
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
    <h1 class="text-lg uppercase">Gestion Opfd</h1>
  </div>
  <div
    class="grid grid-cols-3 gap-5 w-full md:w-1/3 border-solid hover:border-dotted border-2 rounded m-1 p-1"
  >
    {#each banks as b}
      <div>
        {b.name}
        <input
          type="text"
          bind:value={b.amount}
          class="text-xs text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
        />
      </div>
    {/each}
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
        on:click={saveData}>Save</button
      >
      <span class="ml-4 ">{statutEnregistrement}</span>
    </div>
  </div>
  <!--
  <div class="mt-5  w-full md:w-2/3">
    <table>
      <tr>
        {#each months as m}
          <td class="text-xs text-center ">{m}</td>
        {/each}
      </tr>
      <tr class="bg-sky-100"><td colspan="13">Dépenses</td></tr>
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
                  on:change={openfieldChanges}
                  class="text-xs text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                /></td
              >
            {/if}
          {/each}
        </tr>
      {/each}
      <tr>
        {#each totalExpenses as s}
          <td class="text-xs text-right py-1 px-1 font-bold"
            >{s.toLocaleString("fr")}</td
          >
        {/each}
      </tr>
      <tr class="bg-sky-100"><td colspan="13">Facturation</td></tr>
      {#each tableInvoices as row, i}
        <tr>
          {#each row as cell}
            {#if cell._id < 0}
              <td class="text-xs text-right">{cell.value}</td>
            {:else if i === rowPaid}
              <td class="text-xs text-center py-1 px-1">
                <input
                  type="checkbox"
                  bind:checked={cell.value}
                  class="appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                /></td
              >
            {:else if i > 2}
              <td class="text-xs text-right py-1 px-1"
                >{cell.value.toLocaleString("fr")}</td
              >
            {:else}
              <td>
                <input
                  type="text"
                  bind:value={cell.value}
                  class="text-xs text-right appearance-none border-2 border-gray-200 rounded w-full py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                />
              </td>
            {/if}
          {/each}
        </tr>
      {/each}
    </table>
  </div>
-->
  <div class="mt-5 w-full md:w-2/3">
    <h1>Dépenses</h1>
    <table class="table-auto">
      {#each months as m, i}
        <tr>
          <td class="text-xs text-left w-1/8">{m}</td>
          <td class="text-xs text-center w-1/8">
            {#each tableExpenses as row, j}
              {#each row as cell, k}
                {#if j == 0}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="text"
                        bind:value={cell.value}
                        on:change={openfieldChanges}
                        class="w-full text-xs text-right appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}
                  {/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableExpenses as row, j}
              {#each row as cell, k}
                {#if j == 1}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="text"
                        size="10"
                        bind:value={cell.value}
                        on:change={openfieldChanges}
                        class="w-full text-xs text-right appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}{/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableExpenses as row, j}
              {#each row as cell, k}
                {#if j == 2}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="text"
                        size="10"
                        bind:value={cell.value}
                        on:change={openfieldChanges}
                        class="w-full text-xs text-right appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}{/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableExpenses as row, j}
              {#each row as cell, k}
                {#if j == 3}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="text"
                        size="10"
                        bind:value={cell.value}
                        on:change={openfieldChanges}
                        class="w-full text-xs text-right appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}{/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableExpenses as row, j}
              {#each row as cell, k}
                {#if j == 4}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="text"
                        size="10"
                        bind:value={cell.value}
                        on:change={openfieldChanges}
                        class="w-full text-xs text-right appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}{/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-right w-1/8">
            {totalExpenses[i]}
          </td>
        </tr>
      {/each}
    </table>
    <h1>Facturation</h1>
    <table class="table-auto">
      {#each months as m, i}
        <tr>
          <td class="text-xs text-left w-1/8">{m}</td>
          <td class="text-xs text-center w-1/8">
            {#each tableInvoices as row, j}
              {#each row as cell, k}
                {#if j == 0}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="text"
                        size="10"
                        bind:value={cell.value}
                        on:change={openfieldChanges}
                        class="w-full text-xs text-right appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}
                  {/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableInvoices as row, j}
              {#each row as cell, k}
                {#if j == 1}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="text"
                        size="10"
                        bind:value={cell.value}
                        on:change={openfieldChanges}
                        class="w-full text-xs text-right appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}{/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableInvoices as row, j}
              {#each row as cell, k}
                {#if j == 2}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="text"
                        size="10"
                        bind:value={cell.value}
                        on:change={openfieldChanges}
                        class="w-full text-xs text-right appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}{/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableInvoices as row, j}
              {#each row as cell, k}
                {#if j == 3}
                  {#if k == i}
                    {cell.value.toLocaleString("fr")}{/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableInvoices as row, j}
              {#each row as cell, k}
                {#if j == 4}
                  {#if k == i}
                    {cell.value.toLocaleString("fr")}{/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableInvoices as row, j}
              {#each row as cell, k}
                {#if j == 5}
                  {#if k == i}
                    {cell.value.toLocaleString("fr")}
                  {/if}
                {/if}
              {/each}
            {/each}
          </td>
          <td class="text-xs text-center w-1/8">
            {#each tableInvoices as row, j}
              {#each row as cell, k}
                {#if j == rowPaid}
                  {#if k == i}
                    {#if cell._id < 0}
                      {cell.value}
                    {:else}
                      <input
                        type="checkbox"
                        bind:checked={cell.value}
                        class="appearance-none border-2 border-gray-200 rounded py-1 px-1 text-gray-700 leading-tight focus:outline-none focus:bg-white focus:border-pink-400"
                      />
                    {/if}{/if}
                {/if}
              {/each}
            {/each}
          </td>
        </tr>
      {/each}
    </table>
  </div>
</div>
