import prompts from "prompts";

export async function selectAction(issuesAmount: number) {
  const { action }: { action: "transferAll" | "fixIssues" } = await prompts({
    type: "select",
    name: "action",
    message: "Select action",
    choices: [
      { title: "Transfer all tokens", value: "transferAll" },
      {
        title: "Fix issues",
        value: "fixIssues",
        disabled: issuesAmount === 0,
        description:
          issuesAmount === 0
            ? "No issues to fix"
            : `${issuesAmount} issues to fix`,
      },
    ],
  });

  return action;
}
