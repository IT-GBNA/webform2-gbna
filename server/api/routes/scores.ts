// server/api/users.ts
import mongoose from 'mongoose';
import { Score } from '../../models/Score';

export default defineEventHandler(async (event) => {
  if (!event.context.user) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  // await connectDB(); // Handled by global plugin

  // Route API mise à jour
  const query = getQuery(event);
  const { institution, service, moduleId } = query;

  let filter: any = {};

  if (institution) {
    filter.institution = institution;
  }

  if (service) {
    filter.service = service;
  }

  if (moduleId) {
    filter.moduleId = moduleId;
  }

  try {
    const users = await Score.find(filter);
    return users;
  } catch (error) {
    return createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
      message: 'Erreur lors de la récupération des utilisateurs',
    });
  }
})
