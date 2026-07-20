"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getSettings() {
  const settings = await prisma.settings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      currency: "$"
    }
  })

  return settings
}

export async function updateSettings(formData: FormData) {
  const currency = formData.get("currency") as string
  if (!currency) throw new Error("Currency is required")

  await prisma.settings.upsert({
    where: { id: "global" },
    update: { currency },
    create: { id: "global", currency }
  })

  // Revalidate the entire app layout so the provider updates instantly
  revalidatePath("/", "layout")
}
