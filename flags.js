// flags.js
const EDGE_CONFIG_ID = 'YOUR_EDGE_CONFIG_ID_HERE'; // Ganti dengan ID lo
const EDGE_CONFIG_TOKEN = 'YOUR_READ_TOKEN_HERE';   // Ganti dengan token

let cachedFlags = null;

export async function getFeatureFlags() {
  if (cachedFlags) return cachedFlags;

  try {
    const res = await fetch(
      `https://edge-config.vercel.com/${EDGE_CONFIG_ID}/item/flags`,
      {
        headers: {
          Authorization: `Bearer ${EDGE_CONFIG_TOKEN}`,
        },
      }
    );

    if (!res.ok) throw new Error('Failed to fetch flags');

    const data = await res.json();
    cachedFlags = data;

    // Emit ke window supaya Vercel Analytics bisa baca
    window.__VERCEL_FLAGS__ = data;

    return data;
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    // Fallback default
    return {
      maintenanceMode: false,
      showLiveCategory: true,
      enableExperimentalLayout: false,
      enableInfiniteScroll: false,
      newGalleryDesign: false,
    };
  }
}

// Helper function
export async function isFeatureEnabled(flagName) {
  const flags = await getFeatureFlags();
  return flags[flagName] === true;
}
