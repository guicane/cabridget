// Every household-scoped table in the schema requires a householdId,
// but there's no login yet — every request in this single-tenant
// deployment belongs to the one seeded household (created by the
// add_household migration).
//
// TODO(auth): once real accounts exist, derive this from the session
// instead. Every query in the app already goes through this function,
// so that swap is the only change needed anywhere.
const DEFAULT_HOUSEHOLD_ID = "default-household"

export async function getCurrentHouseholdId(): Promise<string> {
  return DEFAULT_HOUSEHOLD_ID
}
