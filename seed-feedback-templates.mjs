import { drizzle } from "drizzle-orm/mysql2";
import { feedbackTemplates } from "./drizzle/schema.ts";

const db = drizzle(process.env.DATABASE_URL);

const defaultTemplates = [
  {
    name: "Excellent Culture Fit",
    category: "positive",
    rating: 5,
    notes: "Outstanding cultural alignment. Demonstrates strong values match with our company culture and team dynamics.",
  },
  {
    name: "Strong Technical Skills",
    category: "positive",
    rating: 5,
    notes: "Impressive technical expertise. Shows deep understanding of required technologies and best practices.",
  },
  {
    name: "Great Communication",
    category: "positive",
    rating: 4,
    notes: "Excellent communication skills. Clear, articulate, and professional in all interactions.",
  },
  {
    name: "Leadership Potential",
    category: "positive",
    rating: 5,
    notes: "Demonstrates strong leadership qualities. Shows initiative, decision-making ability, and team management skills.",
  },
  {
    name: "Solid Candidate",
    category: "neutral",
    rating: 3,
    notes: "Good overall candidate. Meets most requirements with room for growth in specific areas.",
  },
  {
    name: "Needs More Experience",
    category: "neutral",
    rating: 3,
    notes: "Shows potential but requires additional experience in key areas before being ready for this role.",
  },
  {
    name: "Overqualified",
    category: "neutral",
    rating: 3,
    notes: "Candidate exceeds requirements significantly. May seek more challenging opportunities quickly.",
  },
  {
    name: "Skills Gap",
    category: "negative",
    rating: 2,
    notes: "Significant gap in required skills. Would need extensive training to meet role requirements.",
  },
  {
    name: "Communication Concerns",
    category: "negative",
    rating: 2,
    notes: "Communication skills below expectations. May impact team collaboration and client interactions.",
  },
  {
    name: "Not a Culture Fit",
    category: "negative",
    rating: 2,
    notes: "Values and work style don't align well with our company culture and team environment.",
  },
];

async function seedTemplates() {
  try {
    console.log("Seeding feedback templates...");
    
    for (const template of defaultTemplates) {
      await db.insert(feedbackTemplates).values({
        ...template,
        isDefault: true,
        createdBy: null, // System template
      });
      console.log(`✓ Added template: ${template.name}`);
    }
    
    console.log("\n✅ Successfully seeded feedback templates!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding templates:", error);
    process.exit(1);
  }
}

seedTemplates();
