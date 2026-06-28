/**
 * Seed Script — Multi-Canteen Setup
 * ─────────────────────────────────
 * Creates canteens and their staff accounts in MongoDB.
 * Run once: node scripts/seedStaff.js
 *
 * This is the ONLY way to create staff accounts.
 * Staff accounts are intentionally not self-registerable.
 *
 * Add or modify entries in CANTEEN_STAFF_DATA to set up your canteens.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Canteen = require("../models/Canteen");
const Staff = require("../models/Staff");
const Menu = require("../models/Menu");

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
// Modify this array to match your actual canteen setup.
const CANTEEN_STAFF_DATA = [
  {
    canteen: {
      name: "Coffee Day",
      description: "Coffee, snacks, and light refreshments",
      location: "Block A, Ground Floor",
      isOpen: true,
      isBusy: false,
      operatingHours: { open: "08:00", close: "20:00" },
    },
    staff: {
      name: "Coffee Day Staff",
      email: "coffeeday@lpu.in",
      username: "coffeeday_staff",
      password: "CoffeeDay@123",
    },
    sampleMenu: [
      { name: "Cappuccino", price: 60, category: "Beverages" },
      { name: "Cold Coffee", price: 70, category: "Beverages" },
      { name: "Veg Sandwich", price: 50, category: "Snacks" },
      { name: "Chocolate Muffin", price: 40, category: "Bakery" },
    ],
  },
  {
    canteen: {
      name: "Tea Point",
      description: "Tea, chai, and traditional snacks",
      location: "Block B, Ground Floor",
      isOpen: true,
      isBusy: false,
      operatingHours: { open: "07:00", close: "21:00" },
    },
    staff: {
      name: "Tea Point Staff",
      email: "teapoint@lpu.in",
      username: "teapoint_staff",
      password: "TeaPoint@123",
    },
    sampleMenu: [
      { name: "Masala Chai", price: 15, category: "Beverages" },
      { name: "Green Tea", price: 20, category: "Beverages" },
      { name: "Samosa", price: 15, category: "Snacks" },
      { name: "Bread Pakora", price: 25, category: "Snacks" },
    ],
  },
  {
    canteen: {
      name: "Kitchenette",
      description: "Full meals, thali, and hot food",
      location: "Cafeteria Block, First Floor",
      isOpen: true,
      isBusy: false,
      operatingHours: { open: "09:00", close: "22:00" },
    },
    staff: {
      name: "Kitchenette Staff",
      email: "kitchenette@lpu.in",
      username: "kitchenette_staff",
      password: "Kitchenette@123",
    },
    sampleMenu: [
      { name: "Veg Thali", price: 80, category: "Meals" },
      { name: "Paneer Butter Masala", price: 120, category: "Main Course" },
      { name: "Dal Fry", price: 70, category: "Main Course" },
      { name: "Jeera Rice", price: 60, category: "Main Course" },
      { name: "Gulab Jamun", price: 30, category: "Desserts" },
    ],
  },
];

// ─── SEEDER ───────────────────────────────────────────────────────────────────
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("\n✅ MongoDB Connected\n");

    for (const entry of CANTEEN_STAFF_DATA) {
      // 1. Create or update the canteen
      const canteen = await Canteen.findOneAndUpdate(
        { name: entry.canteen.name },
        entry.canteen,
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      console.log(`🏪 Canteen ready: "${canteen.name}"`);

      // 2. Hash the staff password
      const hashedPassword = await bcrypt.hash(entry.staff.password, 10);

      // 3. Create or update the staff account
      const staff = await Staff.findOneAndUpdate(
        { email: entry.staff.email },
        {
          name: entry.staff.name,
          email: entry.staff.email,
          username: entry.staff.username,
          password: hashedPassword,
          assignedCanteen: canteen.name,
          role: "staff",
          isActive: true,
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
      );
      console.log(
        `👤 Staff ready: "${staff.name}" → "${staff.assignedCanteen}"`
      );
      console.log(`   Login: ${entry.staff.email} / ${entry.staff.password}`);

      // 4. Seed sample menu items (only if menu is empty for this canteen)
      const existingMenuCount = await Menu.countDocuments({
        canteen: canteen.name,
      });
      if (existingMenuCount === 0) {
        const menuItems = entry.sampleMenu.map((item) => ({
          ...item,
          canteen: canteen.name,
          isAvailable: true,
        }));
        await Menu.insertMany(menuItems);
        console.log(`🍽️  Added ${menuItems.length} menu items\n`);
      } else {
        console.log(
          `🍽️  Menu already exists (${existingMenuCount} items) — skipped\n`
        );
      }
    }

    console.log("✅ Seeding complete!\n");
    console.log("─────────────────────────────────────────");
    console.log("Staff Login Credentials:");
    CANTEEN_STAFF_DATA.forEach((e) => {
      console.log(
        `  ${e.canteen.name}: ${e.staff.email} / ${e.staff.password}`
      );
    });
    console.log("─────────────────────────────────────────\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();
