export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (email === "test@example.com") {
    return Response.json(
      { isValid: false, message: "This email is already in use" },
      { status: 400 },
    );
  }
  return Response.json({ isValid: true });
}
