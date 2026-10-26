export const services = [
  {
    name: "Ring Repair",
    description: "Bring your favourite ring back to life.",
    features: ["Size adjustment", "Stone fitting", "Crack repair"],
    price: 300,
    imageIndex: 0,
  },
  {
    name: "Necklace & Chain Repair",
    description: "Care for every link and every memory.",
    features: ["Soldering", "Clasp fixing", "Chain repair"],
    price: 500,
    imageIndex: 1,
  },
  {
    name: "Earrings Repair",
    description: "Expert attention for a perfect pair.",
    features: ["Lock fixing", "Stone setting", "Post replacement"],
    price: 400,
    imageIndex: 2,
  },
  {
    name: "Bangle Repair",
    description: "Restore the beauty of your bangles.",
    features: ["Crack fix", "Size adjustment", "Polishing"],
    price: 300,
    imageIndex: 3,
  },
  {
    name: "Pendant Repair",
    description: "Preserve the pieces closest to your heart.",
    features: ["Stone setting", "Chain fixing", "Polishing"],
    price: 300,
    imageIndex: 4,
  },
  {
    name: "Silver Items Repair",
    description: "A little care. A beautiful new shine.",
    features: ["Oxidation removal", "Polishing", "Reshaping"],
    price: 300,
    imageIndex: 5,
  },
];
export const charges = [
  ["Ring Repair (soldering / crack fix)", 300, 800],
  ["Ring Resizing", 500, 1200],
  ["Necklace / Chain Repair", 400, 1000],
  ["Earrings Repair (pair)", 300, 700],
  ["Bangle Repair", 300, 1200],
  ["Pendant Repair", 400, 900],
  ["Stone Setting (per stone)", 300, 800],
  ["Silver Item Repair", 300, 1000],
].map(([name, min, max]) => ({ name, min, max }));
export const business = {
  name: "Sunar Karighar",
  phone: "+91 98765 43210",
  email: "info@sunarkarighar.com",
  address: "Sector 62, Noida, Uttar Pradesh",
  hours: "Mon – Sat, 9:00 AM – 7:00 PM",
};
