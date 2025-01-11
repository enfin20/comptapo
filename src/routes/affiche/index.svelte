<script context="module">
</script>

<script>
  import { onMount, afterUpdate } from "svelte";
  import chartjs from "chart.js/auto";
  import { categoryTypesColor } from "$lib/colors.js";

  let chartCanvas;
  let chartInstance;

  onMount(() => {
    // Plugin pour réduire la largeur du fond
    const narrowBackgroundPlugin = {
      id: "narrowBackground",
      beforeDatasetsDraw(chart) {
        const { ctx } = chart;

        chart.data.datasets.forEach((dataset, datasetIndex) => {
          // Récupérer les métadonnées du dataset
          const meta = chart.getDatasetMeta(datasetIndex);
          // Vérifier que le dataset est de type "bar"
          if (meta.type === "bar") {
            meta.data.forEach((bar) => {
              const { x, y, base, width } = bar;
              // Réduction de la largeur du fond
              const reduction = 25; // Réduction en pixels
              const innerWidth = width - reduction;
              const innerHeight = base - y - reduction / 2;

              // Dessiner manuellement le fond avec une largeur réduite
              ctx.save();
              ctx.fillStyle = categoryTypesColor[1]; // Couleur de fond
              ctx.fillRect(
                x - innerWidth / 2, // Position horizontale ajustée
                y + reduction / 2, // Position verticale
                innerWidth, // Largeur réduite
                innerHeight, // Hauteur de la barre
              );
              ctx.restore();
            });
          }
        });
      },
    };
    // Register the plugin
    chartjs.register(narrowBackgroundPlugin);

    // Create the chart
    const ctx = chartCanvas.getContext("2d");
    chartInstance = new chartjs(ctx, {
      type: "bar",
      data: {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [
          {
            label: "Dataset 1",
            data: [65, 59, 80, 81, 56, 55, 40],
            backgroundColor: "rgba(255, 255, 255, 0)",
            borderColor: categoryTypesColor[7],
            borderWidth: 5,
            borderRadius: 5,
            borderSkipped: false, // Ensures the border is drawn on all sides
          },
        ],
      },
      options: {
        plugins: {
          narrowBackground: true,
        },
      },
    });

    return () => {
      if (chartInstance) {
        chartInstance.destroy();
      }
    };
  });
</script>

<div class="grid grid-cols-1 w-full">
  <canvas bind:this={chartCanvas} style="width: 100%; height: 400px;" />
</div>
