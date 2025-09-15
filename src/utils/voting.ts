import { createServerFn } from "@tanstack/react-start";
import { getDB } from "../db";
import { and, eq } from "drizzle-orm";
import {
  horoscopeRatings,
  horoscopeCategoryRatings,
  horoscopeContent,
  horoscopeContentCategories,
} from "../db/schema/schema";
import { auth } from "../lib/auth";
import { getHeaders } from "@tanstack/react-start/server";
import z from "zod";

const getUserVoteSchema = z.object({
  signId: z.number(),
  effectiveDate: z.string(),
  categoryId: z.number().optional(),
});

const castVoteSchema = z.object({
  signId: z.number(),
  effectiveDate: z.string(),
  categoryId: z.number().optional(),
  rating: z.boolean(), // true for thumbs up, false for thumbs down
});

export const getUserVoteFn = createServerFn({ method: "GET" })
  .validator(getUserVoteSchema)
  .handler(async ({ data: { signId, effectiveDate, categoryId } }) => {
    const session = await auth.api.getSession({ headers: getHeaders() as any });

    if (!session?.user?.id) {
      return { hasVoted: false, rating: null };
    }

    // First, get the horoscope content ID
    const horoscopeContentRecord =
      await getDB().query.horoscopeContent.findFirst({
        where: and(
          eq(horoscopeContent.signId, signId),
          eq(horoscopeContent.effectiveDate, effectiveDate),
          eq(horoscopeContent.typeId, 1) // daily horoscope
        ),
        columns: { id: true },
      });

    if (!horoscopeContentRecord) {
      return { hasVoted: false, rating: null };
    }

    if (categoryId) {
      // Check category-specific vote
      const vote = await getDB().query.horoscopeCategoryRatings.findFirst({
        where: and(
          eq(
            horoscopeCategoryRatings.horoscopeContentId,
            horoscopeContentRecord.id
          ),
          eq(horoscopeCategoryRatings.categoryId, categoryId),
          eq(horoscopeCategoryRatings.userId, session.user.id)
        ),
        columns: { rating: true },
      });

      return {
        hasVoted: !!vote,
        rating: vote?.rating ?? null,
      };
    } else {
      // Check general horoscope vote
      const vote = await getDB().query.horoscopeRatings.findFirst({
        where: and(
          eq(horoscopeRatings.horoscopeContentId, horoscopeContentRecord.id),
          eq(horoscopeRatings.userId, session.user.id)
        ),
        columns: { rating: true },
      });

      return {
        hasVoted: !!vote,
        rating: vote?.rating ?? null,
      };
    }
  });

export const castVoteFn = createServerFn({ method: "POST" })
  .validator(castVoteSchema)
  .handler(
    async ({
      data: { signId, effectiveDate, categoryId, rating },
    }) => {
      const session = await auth.api.getSession({
        headers: getHeaders() as any,
      });

      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      // First, get the horoscope content ID
      const horoscopeContentRecord =
        await getDB().query.horoscopeContent.findFirst({
          where: and(
            eq(horoscopeContent.signId, signId),
            eq(horoscopeContent.effectiveDate, effectiveDate),
            eq(horoscopeContent.typeId, 1) // daily horoscope
          ),
          columns: { id: true },
        });

      if (!horoscopeContentRecord) {
        throw new Error("Horoscope content not found");
      }

      if (categoryId) {
        // Handle category-specific vote
        // First check if the category content exists
        const categoryContent =
          await getDB().query.horoscopeContentCategories.findFirst({
            where: and(
              eq(
                horoscopeContentCategories.horoscopeContentId,
                horoscopeContentRecord.id
              ),
              eq(horoscopeContentCategories.categoryId, categoryId)
            ),
          });

        if (!categoryContent) {
          throw new Error("Category content not found");
        }

        // Check if user has already voted
        const existingVote =
          await getDB().query.horoscopeCategoryRatings.findFirst({
            where: and(
              eq(
                horoscopeCategoryRatings.horoscopeContentId,
                horoscopeContentRecord.id
              ),
              eq(horoscopeCategoryRatings.categoryId, categoryId),
              eq(horoscopeCategoryRatings.userId, session.user.id)
            ),
          });

        if (existingVote) {
          // Update existing vote
          await getDB()
            .update(horoscopeCategoryRatings)
            .set({ rating })
            .where(
              and(
                eq(
                  horoscopeCategoryRatings.horoscopeContentId,
                  horoscopeContentRecord.id
                ),
                eq(horoscopeCategoryRatings.categoryId, categoryId),
                eq(horoscopeCategoryRatings.userId, session.user.id)
              )
            );
        } else {
          // Insert new vote
          await getDB().insert(horoscopeCategoryRatings).values({
            horoscopeContentId: horoscopeContentRecord.id,
            categoryId,
            userId: session.user.id,
            rating,
          });
        }
      } else {
        // Handle general horoscope vote
        const existingVote = await getDB().query.horoscopeRatings.findFirst({
          where: and(
            eq(horoscopeRatings.horoscopeContentId, horoscopeContentRecord.id),
            eq(horoscopeRatings.userId, session.user.id)
          ),
        });

        if (existingVote) {
          // Update existing vote
          await getDB()
            .update(horoscopeRatings)
            .set({ rating })
            .where(
              and(
                eq(
                  horoscopeRatings.horoscopeContentId,
                  horoscopeContentRecord.id
                ),
                eq(horoscopeRatings.userId, session.user.id)
              )
            );
        } else {
          // Insert new vote
          await getDB().insert(horoscopeRatings).values({
            horoscopeContentId: horoscopeContentRecord.id,
            userId: session.user.id,
            rating,
          });
        }
      }

      return { success: true };
    }
  );

export const checkAuthAndSignInFn = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await auth.api.getSession({ headers: getHeaders() as any });

    if (session?.user?.id) {
      return {
        isAuthenticated: true,
        userId: session.user.id,
        isAnonymous: session.user.isAnonymous,
      };
    }

    // User is not authenticated, they need to sign in anonymously on the client side
    return {
      isAuthenticated: false,
      userId: null,
      isAnonymous: null,
    };
  }
);
