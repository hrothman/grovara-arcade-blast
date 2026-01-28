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
  { id: 'enemy_0', filename: '7bfbb5b34e13f5f37efd8ef70a492251b99b8d12.png', path: '/enemies/7bfbb5b34e13f5f37efd8ef70a492251b99b8d12.png' },
  { id: 'enemy_1', filename: 'b1876fe608b0368b4d55ce902557a49a4ae981bb.png', path: '/enemies/b1876fe608b0368b4d55ce902557a49a4ae981bb.png' },
  { id: 'enemy_2', filename: 'b9669f092502299b8ff6451ced88435926727b04.png', path: '/enemies/b9669f092502299b8ff6451ced88435926727b04.png' },
  { id: 'enemy_3', filename: 'broker.png', path: '/enemies/broker.png' },
  { id: 'enemy_4', filename: 'paperwork.png', path: '/enemies/paperwork.png' },
];

const PRODUCT_ASSETS: Asset[] = [
  { id: 'product_0', filename: '017b95374b2361d593c3ca7a0e861d0479ac0064.png', path: '/products/017b95374b2361d593c3ca7a0e861d0479ac0064.png' },
  { id: 'product_1', filename: '09c17048b517f04e61147428b060918fa9e5c2c6.png', path: '/products/09c17048b517f04e61147428b060918fa9e5c2c6.png' },
  { id: 'product_2', filename: '0eee9bd70a21386e16a29b23d0ee55201ae8f6e2.png', path: '/products/0eee9bd70a21386e16a29b23d0ee55201ae8f6e2.png' },
  { id: 'product_3', filename: '18797974080cb22af4bb9b7bc82573f306adfa1e.png', path: '/products/18797974080cb22af4bb9b7bc82573f306adfa1e.png' },
  { id: 'product_4', filename: '1ab1b3cdb128cc7f0c1fb5e6e4948e02e8efd34d.png', path: '/products/1ab1b3cdb128cc7f0c1fb5e6e4948e02e8efd34d.png' },
  { id: 'product_5', filename: '1b0882f2b77dee171b120d0a929f64c2511eaecb.png', path: '/products/1b0882f2b77dee171b120d0a929f64c2511eaecb.png' },
  { id: 'product_6', filename: '1ccf4b81ed38106e7fc100abab20f66217a78cbf.png', path: '/products/1ccf4b81ed38106e7fc100abab20f66217a78cbf.png' },
  { id: 'product_7', filename: '20683b86a0e0d879b72ca2683b4445c1ac1ef773.png', path: '/products/20683b86a0e0d879b72ca2683b4445c1ac1ef773.png' },
  { id: 'product_8', filename: '2a99bc8365a0b48cf58ce38fb99d22c4bc81d54e.png', path: '/products/2a99bc8365a0b48cf58ce38fb99d22c4bc81d54e.png' },
  { id: 'product_9', filename: '2da2ef266779595eb7b409ab7f2e9009721627cc.png', path: '/products/2da2ef266779595eb7b409ab7f2e9009721627cc.png' },
  { id: 'product_10', filename: '34b5a0861756d05f750233295d5d64fa067269c5.png', path: '/products/34b5a0861756d05f750233295d5d64fa067269c5.png' },
  { id: 'product_11', filename: '41c2a8bd14ff0bde714ad8e04677fd2c39cb5878.png', path: '/products/41c2a8bd14ff0bde714ad8e04677fd2c39cb5878.png' },
  { id: 'product_12', filename: '42673d4af72d0b29b895da96689fb2378863c0c2.png', path: '/products/42673d4af72d0b29b895da96689fb2378863c0c2.png' },
  { id: 'product_13', filename: '4b62e20ead5f35c43dd5e24aa631eda6b436ce2c.png', path: '/products/4b62e20ead5f35c43dd5e24aa631eda6b436ce2c.png' },
  { id: 'product_14', filename: '4d2b4e225940483ecfce1cd08d6caf7034d9950a.png', path: '/products/4d2b4e225940483ecfce1cd08d6caf7034d9950a.png' },
  { id: 'product_15', filename: '53554bc84e8ff536735992405bc9753b80fcbc63.png', path: '/products/53554bc84e8ff536735992405bc9753b80fcbc63.png' },
  { id: 'product_16', filename: '58e076508a56fa86cb311c7da37c0b8236533315.png', path: '/products/58e076508a56fa86cb311c7da37c0b8236533315.png' },
  { id: 'product_18', filename: '6aa2344ed6ccfbbb105d0d7e0137572785965e7f.png', path: '/products/6aa2344ed6ccfbbb105d0d7e0137572785965e7f.png' },
  { id: 'product_19', filename: '6e966d8ac8754e17bb5dfae63ccfb86fa84b6ec8.png', path: '/products/6e966d8ac8754e17bb5dfae63ccfb86fa84b6ec8.png' },
  { id: 'product_20', filename: '6eb2c2947798f9534f5a4e34abd8e597a47c0398.png', path: '/products/6eb2c2947798f9534f5a4e34abd8e597a47c0398.png' },
  { id: 'product_21', filename: '730ee9c1516bb96810b3ec376ff7711a40043bb8.png', path: '/products/730ee9c1516bb96810b3ec376ff7711a40043bb8.png' },
  { id: 'product_22', filename: '7bc8f04eda28c44ae37c6908db64c8f668fe51d5.png', path: '/products/7bc8f04eda28c44ae37c6908db64c8f668fe51d5.png' },
  { id: 'product_23', filename: '7f28cacf9213dfe5ca01470fffca6d42d0e19b85.png', path: '/products/7f28cacf9213dfe5ca01470fffca6d42d0e19b85.png' },
  { id: 'product_24', filename: '834073e4e2c6068a66727eda50ef49812a23d350.png', path: '/products/834073e4e2c6068a66727eda50ef49812a23d350.png' },
  { id: 'product_26', filename: '8dc8b8ce51323e1a65512f032490cc4140567c76.png', path: '/products/8dc8b8ce51323e1a65512f032490cc4140567c76.png' },
  { id: 'product_27', filename: '8f030cf8700a57b425ce2f81d3cdca81de867154.png', path: '/products/8f030cf8700a57b425ce2f81d3cdca81de867154.png' },
  { id: 'product_28', filename: '90bf7fc4742c25beb903f81def57036b30ea0a3b.png', path: '/products/90bf7fc4742c25beb903f81def57036b30ea0a3b.png' },
  { id: 'product_29', filename: '95517964b8a87158f3c2755c20753c856fe8ca14.png', path: '/products/95517964b8a87158f3c2755c20753c856fe8ca14.png' },
  { id: 'product_30', filename: '989424d37b917ff0cab81a9934037a039fc459e4.png', path: '/products/989424d37b917ff0cab81a9934037a039fc459e4.png' },
  { id: 'product_31', filename: '9a94954b72fc836cf097ecd9e72e146afcea7915.png', path: '/products/9a94954b72fc836cf097ecd9e72e146afcea7915.png' },
  { id: 'product_32', filename: 'b4615556aa97f60b5b1a1862274da37ae8a42cdb.png', path: '/products/b4615556aa97f60b5b1a1862274da37ae8a42cdb.png' },
  { id: 'product_33', filename: 'c20aa5e951e5819beb7378f6150697145eb05120.png', path: '/products/c20aa5e951e5819beb7378f6150697145eb05120.png' },
  { id: 'product_34', filename: 'c3896b37c97c3ef88173fa5e2625561168795dfd.png', path: '/products/c3896b37c97c3ef88173fa5e2625561168795dfd.png' },
  { id: 'product_35', filename: 'c476f1efeabe0cde349952ae4da6850b6e5a8f38.png', path: '/products/c476f1efeabe0cde349952ae4da6850b6e5a8f38.png' },
  { id: 'product_36', filename: 'c480bde430c05fdec05609dc7d89ff152cce7cb4.png', path: '/products/c480bde430c05fdec05609dc7d89ff152cce7cb4.png' },
  { id: 'product_37', filename: 'cd2b344725ae02ad30f1faafc464346905f3c22d.png', path: '/products/cd2b344725ae02ad30f1faafc464346905f3c22d.png' },
  { id: 'product_38', filename: 'd26fec8e7b16eb2f8f69109b3c6b4384eb5fc043.png', path: '/products/d26fec8e7b16eb2f8f69109b3c6b4384eb5fc043.png' },
  { id: 'product_39', filename: 'd8bfb8a0319322cded14c0947df6d5518403d695.png', path: '/products/d8bfb8a0319322cded14c0947df6d5518403d695.png' },
  { id: 'product_40', filename: 'da53d70f3070605bd69a1b799ee892c50e8f8913.png', path: '/products/da53d70f3070605bd69a1b799ee892c50e8f8913.png' },
  { id: 'product_41', filename: 'de5043c55be1675d7abceeb8e1fc9ae93fbba59b.png', path: '/products/de5043c55be1675d7abceeb8e1fc9ae93fbba59b.png' },
  { id: 'product_43', filename: 'e9b9657728963874a8d955127475e2bc4e5c2907.png', path: '/products/e9b9657728963874a8d955127475e2bc4e5c2907.png' },
  { id: 'product_44', filename: 'edee2988da6c278c871fde87711c895bb8f4a832.png', path: '/products/edee2988da6c278c871fde87711c895bb8f4a832.png' },
  { id: 'product_45', filename: 'ef70e0fbfa9c40120c3b861bff4b55166b40763b.png', path: '/products/ef70e0fbfa9c40120c3b861bff4b55166b40763b.png' },
  { id: 'product_46', filename: 'f4863b34f48308ba27ba8134d4a188c85169c09c.png', path: '/products/f4863b34f48308ba27ba8134d4a188c85169c09c.png' },
  { id: 'product_47', filename: 'f9d406d561d203c74cded9f173bff2093ac508f7.png', path: '/products/f9d406d561d203c74cded9f173bff2093ac508f7.png' },
];

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
