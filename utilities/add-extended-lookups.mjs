#!/usr/bin/env node

import fs from "fs";
import fetch from "node-fetch";

const BASE_URL = "http://localhost:5000";
const TOKEN_FILE = "token.txt";

// Read token from file
function getToken() {
  try {
    return fs.readFileSync(TOKEN_FILE, "utf8").trim();
  } catch (error) {
    console.error("❌ Error reading token file:", error.message);
    console.log("💡 Generate a token first: npm run make:token");
    process.exit(1);
  }
}

// Complete lookup data to be added (30 categories)
const lookupData = [
  {
    category: "Geography",
    subCategory: "Countries",
    items: [
      "South Africa",
      "United States",
      "United Kingdom",
      "India",
      "China",
      "Australia",
      "Canada",
      "Germany",
      "France",
      "Japan",
      "Brazil",
      "Russia",
      "Mexico",
      "Italy",
      "Spain",
      "Netherlands",
      "Sweden",
      "Norway",
      "Denmark",
      "Finland",
    ],
    description:
      "Major countries for international operations and user registration",
  },
  {
    category: "Geography",
    subCategory: "Provinces",
    items: [
      "Eastern Cape",
      "Free State",
      "Gauteng",
      "KwaZulu-Natal",
      "Limpopo",
      "Mpumalanga",
      "Northern Cape",
      "North West",
      "Western Cape",
    ],
    description:
      "Administrative divisions of South Africa, used for address and service mapping",
  },
  {
    category: "Finance",
    subCategory: "Currencies",
    items: ["ZAR", "USD", "EUR", "GBP", "INR"],
    description: "Supported currencies for payments and financial reporting",
  },
  {
    category: "Culture",
    subCategory: "Languages",
    items: [
      "English",
      "Afrikaans",
      "Zulu",
      "Xhosa",
      "Sotho",
      "Tswana",
      "Venda",
      "Tsonga",
      "Swati",
      "Northern Sotho",
      "Ndebele",
    ],
    description:
      "Languages supported for communication, localization, and user interaction",
  },
  {
    category: "System",
    subCategory: "Time Zones",
    items: ["UTC", "GMT+2", "EST", "PST", "CET"],
    description:
      "Time zones for scheduling, logging, and international coordination",
  },
  {
    category: "User Management",
    subCategory: "Roles",
    items: ["Admin", "Editor", "Viewer", "Moderator", "User"],
    description: "User roles for access control and permissions in the system",
  },
  {
    category: "User Management",
    subCategory: "Permissions",
    items: ["Read", "Write", "Update", "Delete", "Approve"],
    description: "Granular access rights assigned to user roles",
  },
  {
    category: "User Profile",
    subCategory: "Genders",
    items: ["Male", "Female", "Non-binary", "Other", "Prefer not to say"],
    description: "Gender options for user profiles and demographic data",
  },
  {
    category: "User Profile",
    subCategory: "Marital Status",
    items: ["Single", "Married", "Divorced", "Widowed"],
    description: "Marital status options for demographic and survey data",
  },
  {
    category: "User Profile",
    subCategory: "Titles",
    items: ["Mr", "Mrs", "Ms", "Dr", "Prof", "Miss", "Rev", "Sir"],
    description: "Common personal titles for users in formal communication",
  },
  {
    category: "Business",
    subCategory: "Product Categories",
    items: ["Electronics", "Clothing", "Food", "Furniture", "Books"],
    description:
      "High-level product categories for e-commerce and inventory classification",
  },
  {
    category: "Business",
    subCategory: "Order Status",
    items: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
    description: "Lifecycle states for customer orders",
  },
  {
    category: "Business",
    subCategory: "Payment Methods",
    items: ["Credit Card", "Cash", "EFT", "Mobile Money", "PayPal"],
    description: "Supported payment methods for transactions",
  },
  {
    category: "Business",
    subCategory: "Payment Status",
    items: ["Paid", "Unpaid", "Refunded", "Overdue"],
    description: "Statuses to track invoice and order payments",
  },
  {
    category: "Business",
    subCategory: "Shipping Methods",
    items: ["Courier", "Pickup", "Freight", "Postal"],
    description: "Available methods of delivering goods and services",
  },
  {
    category: "System",
    subCategory: "Document Types",
    items: ["Invoice", "Receipt", "Quote", "Report", "Contract"],
    description: "Standard document types used in business operations",
  },
  {
    category: "System",
    subCategory: "Notification Types",
    items: ["Email", "SMS", "Push Notification", "In-App"],
    description: "Channels for system and user notifications",
  },
  {
    category: "System",
    subCategory: "Status Codes",
    items: ["Active", "Inactive", "Pending", "Suspended"],
    description: "General status codes for records, accounts, and processes",
  },
  {
    category: "System",
    subCategory: "Event Types",
    items: ["Login", "Logout", "Password Reset", "Purchase", "Alert"],
    description: "System events tracked for audit logs and monitoring",
  },
  {
    category: "Healthcare",
    subCategory: "Blood Types",
    items: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    description: "Standard human blood groups for healthcare applications",
  },
  {
    category: "Healthcare",
    subCategory: "Medication Types",
    items: ["Tablet", "Capsule", "Injection", "Syrup"],
    description: "Common formats for pharmaceutical medications",
  },
  {
    category: "Education",
    subCategory: "Course Types",
    items: ["Full-time", "Part-time", "Online", "Hybrid"],
    description: "Types of educational courses offered by institutions",
  },
  {
    category: "Education",
    subCategory: "Grade Levels",
    items: ["Grade 1", "Grade 2", "Grade 3", "Undergraduate", "Postgraduate"],
    description: "Education levels for school and higher education systems",
  },
  {
    category: "Education",
    subCategory: "Academic Status",
    items: ["Enrolled", "Completed", "Deferred", "Dropped"],
    description: "Academic progress status for learners and students",
  },
  {
    category: "Agriculture",
    subCategory: "Crop Types",
    items: ["Beetroot", "Eggplant", "Broccoli", "Cabbage", "Bunching Onion"],
    description: "Commonly cultivated crops in agricultural production",
  },
  {
    category: "Agriculture",
    subCategory: "Growth Media",
    items: ["Soil", "Cocopeat", "Perlite", "Hydroponic Solution"],
    description: "Growth media options for plant production systems",
  },
  {
    category: "Agriculture",
    subCategory: "Planting Seasons",
    items: ["Spring", "Summer", "Autumn", "Winter"],
    description: "Seasonal windows for crop planting and cultivation",
  },
  {
    category: "Agriculture",
    subCategory: "Pest Categories",
    items: ["Insects", "Fungal", "Bacterial", "Weeds"],
    description: "Categories of pests affecting agricultural crops",
  },
  {
    category: "Emergency Response",
    subCategory: "Alarm Types",
    items: ["Fire", "Medical", "Crime", "Accident", "Panic"],
    description: "Emergency alarm categories used in incident reporting",
  },
  {
    category: "Emergency Response",
    subCategory: "Response Status",
    items: ["Acknowledged", "Dispatched", "In Progress", "Resolved", "Closed"],
    description: "Status lifecycle for emergency incidents",
  },
  {
    category: "Emergency Response",
    subCategory: "Responder Roles",
    items: ["Police", "Firefighter", "Paramedic", "Security", "Volunteer"],
    description: "Types of responders available for emergencies",
  },
];

// Function to add a single lookup
async function addLookup(lookupItem, index, total) {
  const token = getToken();

  try {
    const response = await fetch(`${BASE_URL}/internal/lookup`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(lookupItem),
    });

    const responseText = await response.text();

    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log(`   ✅ SUCCESS - ID: ${result.data?.id || "Unknown"}`);
      return { success: true, data: result.data };
    } else {
      console.log(`   ❌ FAILED - Status: ${response.status}`);
      console.log(`   Error: ${responseText}`);
      return { success: false, error: responseText };
    }
  } catch (error) {
    console.log(`   ❌ FAILED - Status: 500`);
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main function to add all lookups
async function addAllLookups() {
  console.log(
    "======================================================================"
  );
  console.log(
    "🚀 ADDING COMPREHENSIVE LOOKUP DATA TO DATABASE (30 CATEGORIES)"
  );
  console.log(
    "======================================================================"
  );

  const results = [];
  const successfulLookups = [];
  const failedLookups = [];

  for (let i = 0; i < lookupData.length; i++) {
    const lookup = lookupData[i];

    console.log(
      `\n📝 [${i + 1}/${lookupData.length}] Adding: ${lookup.category} > ${
        lookup.subCategory
      }`
    );
    console.log(`   Items: ${lookup.items.length} entries`);
    console.log(`   Description: ${lookup.description.substring(0, 60)}...`);

    const result = await addLookup(lookup, i + 1, lookupData.length);
    results.push(result);

    if (result.success) {
      successfulLookups.push(
        `${lookup.category} > ${lookup.subCategory} (ID: ${result.data?.id})`
      );
    } else {
      failedLookups.push(
        `${lookup.category} > ${lookup.subCategory} - ${result.error}`
      );
    }

    // Small delay between requests to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Summary report
  console.log(
    "\n======================================================================"
  );
  console.log("📊 SUMMARY REPORT");
  console.log(
    "======================================================================"
  );
  console.log(`✅ Successfully added: ${successfulLookups.length} lookups`);
  console.log(`❌ Failed to add: ${failedLookups.length} lookups`);
  console.log(
    `📈 Success rate: ${Math.round(
      (successfulLookups.length / lookupData.length) * 100
    )}%`
  );

  if (successfulLookups.length > 0) {
    console.log("\n🎯 Successfully Added Lookups:");
    successfulLookups.forEach((lookup) => console.log(`   • ${lookup}`));
  }

  if (failedLookups.length > 0) {
    console.log("\n💥 Failed Lookups:");
    failedLookups.forEach((lookup) => console.log(`   • ${lookup}`));
  }

  console.log(
    "\n======================================================================"
  );
  if (failedLookups.length === 0) {
    console.log("🎉 ALL LOOKUP DATA SUCCESSFULLY ADDED TO DATABASE!");
  } else if (successfulLookups.length === 0) {
    console.log("💥 NO LOOKUPS WERE ADDED - Check server and authentication");
  } else {
    console.log("⚠️  PARTIAL SUCCESS - Some lookups failed to be added");
  }
  console.log(
    "======================================================================"
  );
}

// Run the script
addAllLookups().catch((error) => {
  console.error("💥 Script failed:", error.message);
  process.exit(1);
});
