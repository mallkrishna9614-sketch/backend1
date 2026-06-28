/**
 * Seed Script — Multi-Canteen Setup
 * ─────────────────────────────────
 * Creates canteens and their staff accounts in MongoDB.
 * Run once: node scripts/seedStaff.js
 *
 * Staff accounts are intentionally not self-registerable.
 * This script is the ONLY way to create / update staff accounts.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Canteen = require("../models/Canteen");
const Staff = require("../models/Staff");
const Menu = require("../models/Menu");

// ─── FIXED STAFF ACCOUNTS ────────────────────────────────────────────────────
// These are the permanent, production staff accounts.
// username is what the staff types at login (case-insensitive).
const CANTEEN_STAFF_DATA = [
  {
    canteen: {
      name: "Oven Xpress",
      description: "Fast snacks & fresh bites",
      location: "Block A",
      isOpen: true,
      isBusy: false,
      operatingHours: { open: "08:00", close: "20:00" },
    },
    staff: {
      name: "Oven Xpress Staff",
      email: "ovenxpress@lpu.in",
      username: "OverXpress",   // Login ID exactly as specified
      password: "12345678",
    },
    sampleMenu: [
      { name: "Veg Burger", price: 60, category: "Snacks" },
      { name: "Cheese Sandwich", price: 50, category: "Snacks" },
      { name: "French Fries", price: 40, category: "Snacks" },
      { name: "Cold Coffee", price: 70, category: "Drinks" },
      { name: "Veg Wrap", price: 80, category: "Snacks" },
      { name: "Paneer Roll", price: 90, category: "Meals" },
      { name: "Veg Pizza Slice", price: 60, category: "Snacks" },
      { name: "Chocolate Brownie", price: 45, category: "Desserts" },
      { name: "Masala Maggi", price: 35, category: "Snacks" },
      { name: "Aloo Tikki Burger", price: 55, category: "Snacks" },
    ],
  },
  {
    canteen: {
      name: "Kitchenette",
      description: "Home-style meals & thalis",
      location: "Cafeteria Block, First Floor",
      isOpen: true,
      isBusy: false,
      operatingHours: { open: "09:00", close: "22:00" },
    },
    staff: {
      name: "Kitchenette Staff",
      email: "kitchenette@lpu.in",
      username: "Food",          // Login ID exactly as specified
      password: "1212",
    },
    sampleMenu: [
      { name: "Dal Tadka + Rice", price: 80, category: "Meals" },
      { name: "Paneer Butter Masala + 2 Roti", price: 120, category: "Meals" },
      { name: "Veg Thali", price: 100, category: "Meals" },
      { name: "Rajma Chawal", price: 85, category: "Meals" },
      { name: "Chole Bhature", price: 70, category: "Snacks" },
      { name: "Samosa (2 pcs)", price: 20, category: "Snacks" },
      { name: "Kadhai Paneer + Roti", price: 110, category: "Meals" },
      { name: "Lassi", price: 40, category: "Drinks" },
    ],
  },
  {
    canteen: {
      name: "Tea Point",
      description: "Hot teas, coffees & snacks",
      location: "Block B, Ground Floor",
      isOpen: true,
      isBusy: false,
      operatingHours: { open: "07:00", close: "21:00" },
    },
    staff: {
      name: "Tea Point Staff",
      email: "teapoint@lpu.in",
      username: "Teaislove",    // Login ID exactly as specified
      password: "Tea",
    },
    sampleMenu: [
      { name: "Masala Chai", price: 15, category: "Tea & Coffee" },
      { name: "Ginger Tea", price: 15, category: "Tea & Coffee" },
      { name: "Filter Coffee", price: 20, category: "Tea & Coffee" },
      { name: "Green Tea", price: 20, category: "Tea & Coffee" },
      { name: "Bread Butter", price: 20, category: "Snacks" },
      { name: "Veg Puff", price: 25, category: "Snacks" },
      { name: "Biscuit Pack", price: 10, category: "Biscuits" },
      { name: "Lemon Tea", price: 18, category: "Tea & Coffee" },
    ],
  },
  {
    canteen: {
      name: "Coffee Day",
      description: "Specialty coffees & beverages",
      location: "Block C, Ground Floor",
      isOpen: true,
      isBusy: false,
      operatingHours: { open: "08:00", close: "20:00" },
    },
    staff: {
      name: "Coffee Day Staff",
      email: "coffeeday@lpu.in",
      username: "Coffee",       // Login ID exactly as specified
      password: "coffee",
    },
    sampleMenu: [
      { name: "Cappuccino", price: 80, category: "Hot Drinks" },
      { name: "Cold Coffee", price: 90, category: "Cold Drinks" },
      { name: "Café Latte", price: 85, category: "Hot Drinks" },
      { name: "Frappe", price: 110, category: "Cold Drinks" },
      { name: "Chocolate Shake", price: 100, category: "Shakes" },
      { name: "Espresso", price: 60, category: "Hot Drinks" },
      { name: "Panini Sandwich", price: 120, category: "Snacks" },
      { name: "Muffin", price: 60, category: "Snacks" },
    ],
  },
  {
    canteen: {
      name: "The Fresh Juice",
      description: "Fresh juices, shakes & bowls",
      location: "Block D, Ground Floor",
      isOpen: true,
      isBusy: false,
      operatingHours: { open: "08:00", close: "20:00" },
    },
    staff: {
      name: "Fresh Juice Staff",
      email: "freshjuice@lpu.in",
      username: "juice",         // Login ID exactly as specified
      password: "fresh",
    },
    sampleMenu: [
      { name: "Fresh Lime Soda", price: 30, category: "Juices" },
      { name: "Mango Juice", price: 50, category: "Juices" },
      { name: "Orange Juice", price: 45, category: "Juices" },
      { name: "Mixed Fruit Bowl", price: 70, category: "Bowls" },
      { name: "Banana Shake", price: 60, category: "Shakes" },
      { name: "Watermelon Juice", price: 35, category: "Juices" },
      { name: "Strawberry Smoothie", price: 80, category: "Shakes" },
      { name: "Green Detox Juice", price: 65, category: "Juices" },
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

      // 2. Hash password
      const hashedPassword = await bcrypt.hash(entry.staff.password, 10);

      // 3. Create or update staff account (match by email to avoid duplicates)
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
      console.log(
        `   Login: username="${entry.staff.username}" / password="${entry.staff.password}"`
      );

      // 4. Seed sample menu only if empty for this canteen
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
          `🍽️  Menu already seeded (${existingMenuCount} items) — skipped\n`
        );
      }
    }

    console.log("✅ Seeding complete!\n");
    console.log("─────────────────────────────────────────────────────");
    console.log("Staff Login Credentials (use /api/staff/auth/login):");
    CANTEEN_STAFF_DATA.forEach((e) => {
      console.log(
        `  ${e.canteen.name.padEnd(18)} username: ${e.staff.username.padEnd(12)} password: ${e.staff.password}`
      );
    });
    console.log("─────────────────────────────────────────────────────\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seed();
