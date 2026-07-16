/// <reference types="astro/client" />

// starlight-versions doesn't export its virtual-module type declarations
// (only components and config types are in the package's `exports` map),
// so CurrentVersionBanner.astro's import needs an ambient declaration here.
declare module 'virtual:starlight-versions-config' {
  const StarlightVersionsConfig: {
    versionsBySlug: Record<string, { slug: string; label?: string }>;
  };
  export default StarlightVersionsConfig;
}
