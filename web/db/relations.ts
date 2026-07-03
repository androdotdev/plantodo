import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const schemaRelations = defineRelations(schema, (helpers) => ({
  user: {
    sessions: helpers.many.session({
      from: helpers.user.id,
      to: helpers.session.userId,
    }),
    accounts: helpers.many.account({
      from: helpers.user.id,
      to: helpers.account.userId,
    }),
  },
  session: {
    user: helpers.one.user({
      from: helpers.session.userId,
      to: helpers.user.id,
    }),
  },
  account: {
    user: helpers.one.user({
      from: helpers.account.userId,
      to: helpers.user.id,
    }),
  },
}));
