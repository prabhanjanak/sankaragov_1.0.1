import { db } from "./index";
import { unitsTable, InsertUnit } from "./schema/units";

const units = [
  {
    name: "Sankara Eye Hospital - Kanpur",
    state: "Uttar Pradesh",
    district: "Kanpur",
    address: "Off GT Road, PO Amiliha, Tatiyaganj, Kanpur, Uttar Pradesh 209203",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Coimbatore",
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "16-A, Sathy Rd, near Prozone Mall, Saravanampatti, Siranandha Puram, Coimbatore, Tamil Nadu 641035",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Guntur",
    state: "Andhra Pradesh",
    district: "Guntur",
    address: "Guntur - Vijayawada Hwy, Pedakakani, Andhra Pradesh 522509",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Anand",
    state: "Gujarat",
    district: "Anand",
    address: "NH64, Ramdev Society, Mogar, Gujarat 388340",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Bangalore",
    state: "Karnataka",
    district: "Bengaluru",
    address: "Varthur Main Rd, Vaikuntam Layout, Lakshminarayana Pura, Kundalahalli, Munnekolala, Bengaluru, Karnataka 560037",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Shimoga",
    state: "Karnataka",
    district: "Shivamogga",
    address: "Thirthahalli, Gandharva Nagara Rd, Harakere, Shivamogga, Karnataka 577202",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Hyderabad",
    state: "Telangana",
    district: "Hyderabad",
    address: "Financial District, Nanakramguda, Telangana 500032",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Indore",
    state: "Madhya Pradesh",
    district: "Indore",
    address: "Vijay Nagar Main Rd, Scheme No 74C, Indore, Madhya Pradesh 452010",
    isActive: true,
  },
  {
    name: "RJ Sankara Eye Hospital - Panvel",
    state: "Maharashtra",
    district: "Panvel",
    address: "Plot No 12, Sector 5A, Sector 6, New Panvel East, Panvel, Maharashtra 410206",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Ludhiana",
    state: "Punjab",
    district: "Ludhiana",
    address: "Vipul World Village Bhanohar, Post Dhaka, Ferozepur - Ludhiana Rd, near Wadi Haveli, Ludhiana, Punjab 141102",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Krishnankoil",
    state: "Tamil Nadu",
    district: "Krishnan Kovil",
    address: "Kunnur PO, Srivilliputhur Taluk, Krishnan Kovil, Tamil Nadu 626126",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Varanasi",
    state: "Uttar Pradesh",
    district: "Varanasi",
    address: "Plot No 193 & 194, Ring Road Phase-I, Madhopur, Varanasi, Uttar Pradesh 221003",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - Jaipur",
    state: "Rajasthan",
    district: "Jaipur",
    address: "6, Central Spine Rd, Sector 2, Sector 6, Vidyadhar Nagar, Jaipur, Rajasthan 302039",
    isActive: true,
  },
  {
    name: "Sankara Eye Hospital - RS Puram CBE",
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "Srivari Kikani Centre, Dr Krishnasamy Mudaliyar Rd, next to Chinthamani Super Market, Sukrawar Pettai, R.S. Puram, Coimbatore, Tamil Nadu 641002",
    isActive: true,
  },
  {
    name: "SEFI MHQ - Mission Head Quarters",
    state: "Tamil Nadu",
    district: "Coimbatore",
    address: "16-A, Sathy Rd, near Prozone Mall, Saravanampatti, Siranandha Puram, Coimbatore, Tamil Nadu 641035",
    isActive: true,
  }
];

async function seed() {
  console.log("Seeding units...");
  for (const unit of units) {
    const seedUnit: InsertUnit = {
      ...unit,
      coordinatorName: "Eye Bank Coordinator",
      coordinatorWhatsapp: "+91 9000019190"
    };
    await db.insert(unitsTable).values(seedUnit).onConflictDoNothing();
  }
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
