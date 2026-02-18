import { db, schema } from "./index";
import { createTemplateId } from "../utils/id";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

const TEMPLATES_DIR = path.join(process.cwd(), "templates");

export function seedBuiltInTemplates() {
  const existingBuiltIn = db
    .select()
    .from(schema.templates)
    .where(eq(schema.templates.isBuiltIn, true))
    .all();

  if (existingBuiltIn.length > 0) {
    console.log(`  ${existingBuiltIn.length} built-in templates already exist, skipping seed`);
    return;
  }

  const templateFiles = fs
    .readdirSync(TEMPLATES_DIR)
    .filter((f) => f.endsWith(".json"));

  const now = new Date().toISOString();

  for (const file of templateFiles) {
    const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), "utf-8");
    const data = JSON.parse(content);

    db.insert(schema.templates)
      .values({
        id: createTemplateId(),
        name: data.name,
        description: data.description || "",
        config: data.config,
        tags: data.tags || [],
        isBuiltIn: true,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    console.log(`  Seeded template: ${data.name}`);
  }
}
