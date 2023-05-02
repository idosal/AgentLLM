import { createTRPCRouter, protectedProcedure } from "../trpc";
// import Stripe from "stripe";
// import { env } from "../../../env/server.mjs";
// import { prisma } from "../../db";
// import { getCustomerId } from "../../../utils/stripe-utils";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
// const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "", {
//   apiVersion: "2022-11-15",
// });

export const accountRouter = createTRPCRouter({
  subscribe: protectedProcedure.mutation( ({ ctx }) => ''),
  manage: protectedProcedure.mutation( ({ ctx }) => ''),
});
