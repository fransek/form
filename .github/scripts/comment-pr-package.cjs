module.exports = async ({ context, github, process }) => {
  const marker = "<!-- pr-package-preview -->";
  const ownerType = context.payload.repository.owner.type;
  const ownerPath = ownerType === "Organization" ? "orgs" : "users";
  const packageSlug = process.env.PACKAGE_NAME.replace(/^@[^/]+\//, "");
  const packageUrl = `https://github.com/${ownerPath}/${context.repo.owner}/packages/npm/package/${packageSlug}`;
  const body = [
    marker,
    `📦 Preview package published: [${process.env.PACKAGE_NAME}@${process.env.PACKAGE_VERSION}](${packageUrl})`,
    "",
    "```bash",
    `npm install ${process.env.PACKAGE_NAME}@${process.env.PACKAGE_VERSION}`,
    "```",
  ].join("\n");

  const { data: comments } = await github.rest.issues.listComments({
    ...context.repo,
    issue_number: context.issue.number,
  });

  const existingComment = comments.find(
    (comment) => comment.user?.type === "Bot" && comment.body?.includes(marker),
  );

  if (existingComment) {
    await github.rest.issues.updateComment({
      ...context.repo,
      comment_id: existingComment.id,
      body,
    });
    return;
  }

  await github.rest.issues.createComment({
    ...context.repo,
    issue_number: context.issue.number,
    body,
  });
};
