// save.post.ts
import { Score } from "../../models/Score";
import { logger } from "../../utils/logger";

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

  // Log the quiz submission
  await logger.info(
    'QUIZ_SUBMIT',
    `Quiz soumis par ${body.firstName} ${body.lastName} - Score: ${body.newScore}`,
    {
      participantName: `${body.firstName} ${body.lastName}`,
      institution: body.institution,
      service: body.service,
      score: body.newScore,
      moduleId: body.moduleId
    }
  );

  return score;
});
