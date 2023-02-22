const c = [
	() => import("..\\..\\..\\src\\routes\\__layout.svelte"),
	() => import("..\\components\\error.svelte"),
	() => import("..\\..\\..\\src\\routes\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\annualexpenses\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\openfield\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\expenses\\index.svelte"),
	() => import("..\\..\\..\\src\\routes\\cash\\index.svelte")
];

const d = decodeURIComponent;

export const routes = [
	// src/routes/index.svelte
	[/^\/$/, [c[0], c[2]], [c[1]]],

	// src/routes/annualexpenses/index.svelte
	[/^\/annualexpenses\/?$/, [c[0], c[3]], [c[1]]],

	// src/routes/openfield/index.svelte
	[/^\/openfield\/?$/, [c[0], c[4]], [c[1]]],

	// src/routes/expenses/index.svelte
	[/^\/expenses\/?$/, [c[0], c[5]], [c[1]]],

	// src/routes/cash/index.svelte
	[/^\/cash\/?$/, [c[0], c[6]], [c[1]]],

	,

	,

	,

	,

	,

	,

	,

	,

	,

	
];

// we import the root layout/error components eagerly, so that
// connectivity errors after initialisation don't nuke the app
export const fallback = [c[0](), c[1]()];