"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentHouseholdId } from "@/lib/household"
import { revalidatePath } from "next/cache"

export async function getSettings() {
  const householdId = await getCurrentHouseholdId()

  const settings = await prisma.settings.upsert({
    where: { householdId },
    update: {},
    create: {
      householdId,
      currency: "$"
    }
  })

  return settings
}

export async function updateSettings(formData: FormData) {
  const householdId = await getCurrentHouseholdId()
  const currency = formData.get("currency") as string
  if (!currency) throw new Error("Currency is required")

  await prisma.settings.upsert({
    where: { householdId },
    update: { currency },
    create: { householdId, currency }
  })

  // Revalidate the entire app layout so the provider updates instantly
  revalidatePath("/", "layout")
}
