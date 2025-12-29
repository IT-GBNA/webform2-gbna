// save.post.ts
import { Score } from "../../models/Score";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.firstName || !body.lastName || !body.institution || !body.service || body.newScore === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Missing required fields",
    });
  }

  // Ajout de la date actuelle
  body.createdAt = new Date();

  const score = await Score.create({ ...body });

  return score;
});