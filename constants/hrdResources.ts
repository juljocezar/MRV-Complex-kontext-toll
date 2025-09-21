// Defines a curated list of resources for Human Rights Defenders (HRDs).

import { HRDResource } from "../types/hrdResources";

/**
 * A curated list of external resources providing support to Human Rights Defenders (HRDs).
 * Each resource includes a name, description, URL, and category.
 */
export const HRD_RESOURCES: HRDResource[] = [
  {
    name: "Front Line Defenders",
    description: "Provides rapid and practical support for HRDs at risk, including emergency grants, training, and advocacy.",
    url: "https://www.frontlinedefenders.org/",
    category: "Emergency Support",
  },
  {
    name: "ProtectDefenders.eu",
    description: "The European Union Human Rights Defenders mechanism. Provides emergency assistance, temporary relocation, and material support.",
    url: "https://www.protectdefenders.eu/",
    category: "Emergency Support",
  },
  {
    name: "Access Now Digital Security Helpline",
    description: "Offers 24/7 technical assistance and advice to activists, journalists, and HRDs facing digital attacks.",
    url: "https://www.accessnow.org/help/",
    category: "Digital Security",
  },
  {
    name: "Security in-a-box (Tactical Tech)",
    description: "A guide to digital security tools and tactics for activists and human rights defenders.",
    url: "https://securityinabox.org/",
    category: "Digital Security",
  },
  {
    name: "Reporters Without Borders (RSF)",
    description: "Provides legal and financial support to journalists and media activists who are persecuted for their work.",
    url: "https://rsf.org/",
    category: "Legal Aid",
  },
  {
    name: "Martin Ennals Award Foundation",
    description: "Supports HRDs through emergency aid and protective measures. The Martin Ennals Award honors HRDs who are at great risk.",
    url: "https://www.martinennalsaward.org/",
    category: "Legal Aid",
  },
  {
    name: "Headspace for Human Rights Defenders",
    description: "Offers resources and support for the mental well-being and resilience of HRDs.",
    url: "https://www.hrdhub.org/headspace", // Example URL
    category: "Well-being",
  },
];
