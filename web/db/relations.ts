import { defineRelations } from "drizzle-orm";

export const schemaRelations = defineRelations((r: any) => ({
  userRelations: r.many.user({
    // Combines the "many" lookups into the single central user object
    sessions: r.session,
    accounts: r.account,
  }),

  sessionRelations: r.one.session({
    user: r.user,
    from: r.session.userId,
    to: r.user.id,
  }),

  accountRelations: r.one.account({
    user: r.user,
    from: r.account.userId,
    to: r.user.id,
  }),
}));

