import { Brand } from '@/types/game';
import realBrandsData from './realBrands.json';

export const GROVARA_BRANDS: Brand[] = [
  {
    id: 'organic-valley',
    name: 'Organic Valley',
    description: 'Premium organic dairy products from family farms',
    category: 'Dairy',
    imageUrl: '/brands/organic-valley.png',
    color: '#4CAF50',
  },
  {
    id: 'natures-path',
    name: "Nature's Path",
    description: 'Organic cereals and breakfast foods',
    category: 'Breakfast',
    imageUrl: '/brands/natures-path.png',
    color: '#8BC34A',
  },
  {
    id: 'rx-bar',
    name: 'RXBar',
    description: 'Clean protein bars with simple ingredients',
    category: 'Snacks',
    imageUrl: '/brands/rxbar.png',
    color: '#FF9800',
  },
  {
    id: 'hippeas',
    name: 'Hippeas',
    description: 'Organic chickpea puffs for healthy snacking',
    category: 'Snacks',
    imageUrl: '/brands/hippeas.png',
    color: '#FFEB3B',
  },
  {
    id: 'beyond-meat',
    name: 'Beyond Meat',
    description: 'Plant-based meat alternatives',
    category: 'Protein',
    imageUrl: '/brands/beyond-meat.png',
    color: '#4CAF50',
  },
  {
    id: 'oatly',
    name: 'Oatly',
    description: 'Oat-based dairy alternatives',
    category: 'Dairy Alternative',
    imageUrl: '/brands/oatly.png',
    color: '#2196F3',
  },
  {
    id: 'siete',
    name: 'Siete',
    description: 'Grain-free Mexican-American foods',
    category: 'Mexican',
    imageUrl: '/brands/siete.png',
    color: '#E91E63',
  },
  {
    id: 'vital-farms',
    name: 'Vital Farms',
    description: 'Pasture-raised eggs and butter',
    category: 'Dairy',
    imageUrl: '/brands/vital-farms.png',
    color: '#FFC107',
  },
];

// Real brands from Grovara marketplace - these are the "friendlies" (good guys - do not shoot)
export const FRIENDLY_LABELS = realBrandsData.map(brand => ({
  id: brand.id,
  label: brand.name,
  emoji: brand.emoji,
  imageUrl: brand.imageUrl,
}));

// Old outdated tools and methods - these are the "enemies" (bad guys - do shoot)
export const ENEMY_LABELS = [
  { id: 'pdf', label: 'PDF Catalogs', emoji: '📄', imageUrl: '/enemies/pdf.png' },
  { id: 'spreadsheet', label: 'Spreadsheets', emoji: '📊', imageUrl: '/enemies/spreadsheet.png' },
  { id: 'fax', label: 'Fax Machines', emoji: '📠', imageUrl: '/enemies/printer.png' },
  { id: 'broker', label: 'Old Brokers', emoji: '👔', imageUrl: '/enemies/broker.png' },
  { id: 'paperwork', label: 'Paperwork', emoji: '📋', imageUrl: '/enemies/paperwork.png' },
  { id: 'mail', label: 'Mail', emoji: '📋', imageUrl: '/enemies/letter.png' },
  { id: 'email-chain', label: 'Email Chains', emoji: '📧', imageUrl: '/enemies/email.png' },
];
