import { StorageProfile } from '../types';

export const INITIAL_PROFILES: StorageProfile[] = [
  {
    id: 'vaccine-demo',
    name: 'Vaccine-Storage Demonstration',
    category: 'vaccine',
    minTemp: 2.0,
    maxTemp: 8.0,
    warningBuffer: 0.5,
    description: 'Illustrative 2°C to 8°C cold-chain storage envelope standard in routine immunization regimens.',
    disclaimer:
      'ILLUSTRATIVE PROFILE ONLY: This 2°C to 8°C range is an educational demonstration and does not apply to all vaccines (e.g., ultracold mRNA vaccines require -80°C to -60°C). This software cannot determine vaccine potency or clinical safety. Always consult manufacturer stability datasheets and qualified healthcare personnel.',
  },
  {
    id: 'general-fridge',
    name: 'General Refrigerator Demonstration',
    category: 'general_refrigerator',
    minTemp: 2.0,
    maxTemp: 8.0,
    warningBuffer: 0.5,
    description: 'Configurable commercial or laboratory refrigeration target between 2.0°C and 8.0°C.',
    disclaimer:
      'DEMONSTRATION PROFILE: Target temperature tolerances vary by biological samples, reagents, or foodstuffs stored. Temperature compliance alone does not verify equipment mechanical health or internal air circulation.',
  },
  {
    id: 'electronics-lab',
    name: 'Electronics Laboratory Test Chamber',
    category: 'electronics_lab',
    minTemp: 20.0,
    maxTemp: 40.0,
    warningBuffer: 2.0,
    description: 'Illustrative thermal cycling and operational envelope for electronics burn-in and benchtop testing (20°C to 40°C).',
    disclaimer:
      'TEST BENCH PROFILE: Component junction temperatures and thermal dissipation vary significantly. Excursion records indicate ambient enclosure temperatures only.',
  },
];

export const DEFAULT_CUSTOM_PROFILE: StorageProfile = {
  id: 'custom-user-profile',
  name: 'Custom Storage Environment',
  category: 'custom',
  minTemp: 15.0,
  maxTemp: 25.0,
  warningBuffer: 1.0,
  description: 'User-specified temperature envelope with custom upper and lower thresholds.',
  disclaimer:
    'CUSTOM SPECIFICATION: User-defined limits must be verified against applicable standard operating procedures (SOPs) or engineering specifications.',
  isCustom: true,
};
