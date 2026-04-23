---
'@unpunnyfuns/swatchbook-core': patch
---

Correct the "Consuming the active theme" guide: swatchbook does ship React hooks (`useActiveAxes` / `useActiveTheme` / `useColorFormat` from `@unpunnyfuns/swatchbook-addon`), and for React story / block / decorator code inside the Storybook preview they're the ergonomic path — the previous guide framed DOM-observation as the only option and claimed "no framework-specific hooks" which is wrong. DOM observation is now positioned as the cross-framework / out-of-preview fallback, and the intro lists three paths (CSS variables → React hook → DOM observation) in order of preference. Non-React bindings are still explicitly not shipped — that part is unchanged.
