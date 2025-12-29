import bcrypt from "bcryptjs";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const { username, email, password } = body;

  if (!username || !email || !password) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }

  const exists = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (exists) {

    throw createError({
      statusCode: 400,
      statusMessage: "User already exists",
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    username,
    email,
    password: hashed,
  });

  return { success: true };
});
