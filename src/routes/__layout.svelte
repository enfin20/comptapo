<script>
</script>

<nav>
  <div class="grid grid-cols-5 md:grid-cols-5 text-xs md:text-base bg-sky-700 px-2 py-2 ">
    <div>
      <a href="/" class=" px-3 py-2 flex items-center uppercase font-bold leading-snug text-white hover:opacity-75">
        Dashboard</a
      >
    </div>
    <div>
      <a href="/opfd" class=" px-3 py-2 flex items-center uppercase font-bold leading-snug text-white hover:opacity-75">
        Opfd
      </a>
    </div>
    <div>
      <a
        href="/expenses"
        class=" px-3 py-2 flex items-center uppercase font-bold leading-snug text-white hover:opacity-75"
      >
        Dépenses
      </a>
    </div>
    <div>
      <a href="/cash" class=" px-3 py-2 flex items-center uppercase font-bold leading-snug text-white hover:opacity-75">
        Tréso
      </a>
    </div>
    <!--    <div>
      <a
        href="/annualexpenses"
        class=" px-3 py-2 flex items-center uppercase font-bold leading-snug text-white hover:opacity-75"
      >
        Annuelles
      </a>
    </div>
    -->
  </div>
</nav>
<div class="px-2 py-2 w-full">
  <div class="flex mb-2 text-gray-500 font-bold">
    <slot />
  </div>
</div>

<style>
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
</style>
