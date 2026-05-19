/**
 * Utility to dynamically load assets from public directories
 * Handles both enemies and products with their image files
 */

export interface Asset {
  id: string;
  filename: string;
  path: string;
}

const ENEMY_ASSETS: Asset[] = [
  { id: 'enemy_broker', filename: 'broker.png', path: '/enemies/broker.png' },
  { id: 'enemy_villain', filename: 'villain.png', path: '/home/villain.png' },
];

const NEW_BRAND_FILES = [
  'public_products_01K9JVYWR9QDZV7R0NCBX46XHY_Primary Image_Bag front (1).png',
  'public_products_01K9JVYWR9YBG18NTB06TW48TB_Primary Image_Raw front (1).png',
  'public_products_01KAVN5NSZVFN7SGMYDR8CVD6Q_assets_primary-image_Screenshot 2025-11-24 at 2.24.39 PM.png',
  'public_products_01KAVND8QQ8MG3XVVFNM1R8S1K_assets_primary-image_Screenshot 2025-11-24 at 2.28.39 PM.png',
  'public_products_01KAVVKMHGTHQ0Q9506FTC79G0_assets_primary-image_Screenshot 2025-11-24 at 4.19.43 PM.png',
  'public_products_01KEZ5K72T49AVVPEXH6B4PB9M_assets_primary-image_EACH_ 20850003628510_C1C1.png',
  'public_products_01KFDXVKKJA4GJB42DAK006H0N_assets_primary-image_EACH_ 30781231000441_C1C1 (1).jpg',
  'public_products_01KJ1A428AJN9AJZ95BXSB18NB_assets_primary-image_Travel Light Kit-01KJ1AD6HG7SS3ASDN29XNGB5Y (1).jpg',
  'public_products_01KJ63KNX65BQXM3Y7DSGRYYDS_assets_primary-image_IMG_0765-01KJ64W4X5TX07X2HKP6HWE6TW (1).jpg',
  'public_products_01KJDQAXKMZQRRWSEESXDHAQE4_assets_primary-image_2-01KJDQPDKG5F011S82PD14EGQH.jpg',
  'public_products_01KJDTTZHSRQ0S2FF06CVE2FM7_assets_primary-image_14-01KJDVB1H0J78NW6KY8R8ZMP3F (1).jpg',
  'public_products_01KKVVC3EMY068N5B5BMESTSKF_assets_primary-image_Screenshot 2026-03-16 at 2.38.22 PM-01KKVZ34XNQ52XDMS3YZ2QTY55.png',
  'public_products_01KMTGG6PCGHMB2PN3SB628FCQ_assets_primary-image_WhatsApp Image 2025-04-08 at 06.45.45-01KMTGMAACZ3HKX0F7K3AW3BB1 (3).jpeg',
  'public_products_01KMTMEB5GED82AD4PNTB6NS0V_assets_primary-image_B0C12DPP57.main-01KMY8SG5FDEQDJ45MV3K296GR (1).png',
  'public_products_01KQD5FY8177R7VPVWFCV7KKTV_assets_primary-image_Screenshot 2026-04-29 at 1.46.24 PM-01KQD5KM8Q56RM8AG9HF8E620T.png',
  'public_products_01KQD9YH1E0VARC7X28TQQMW0K_assets_primary-image_Screenshot 2026-04-29 at 3.06.01 PM-01KQDA55ZJQS9TS1SP6HM467N3.png',
  // Sweets & Snacks Expo 2026 brands
  'dandies-marshmallows.webp',
  'david-protein.png',
  'gumi-yum-surprise.png',
  'herrs-cheese-curls.png',
  'katjes-rainbow-gummies.png',
  'shameless-snacks.png',
  'smuckers-uncrustables.jpg',
  'pandy-swedish-candy.png',
  'wonderful-pistachios.png',
];

const PRODUCT_ASSETS: Asset[] = NEW_BRAND_FILES.map((filename, i) => ({
  id: `product_${i}`,
  filename,
  path: `/new_brands/${encodeURI(filename)}`,
}));

const RARE_PRODUCT_ASSETS: Asset[] = [
  { id: 'rare_product_0', filename: 'B3B chain.png', path: '/rare_products/B3B%20chain.png' },
  { id: 'rare_product_1', filename: 'Pokemon.png', path: '/rare_products/Pokemon.png' },
  { id: 'rare_product_2', filename: 'Scout 2.png', path: '/rare_products/Scout%202.png' },
];

export const loadEnemyAssets = async (): Promise<Asset[]> => ENEMY_ASSETS;
export const loadProductAssets = async (): Promise<Asset[]> => PRODUCT_ASSETS;
export const loadRareProductAssets = async (): Promise<Asset[]> => RARE_PRODUCT_ASSETS;
export const getEnemyAssets = (): Asset[] => ENEMY_ASSETS;
export const getProductAssets = (): Asset[] => PRODUCT_ASSETS;
export const getRareProductAssets = (): Asset[] => RARE_PRODUCT_ASSETS;

/**
 * Get random asset from array
 */
export const getRandomAsset = (assets: Asset[]): Asset | undefined => {
  if (assets.length === 0) return undefined;
  return assets[Math.floor(Math.random() * assets.length)];
};
