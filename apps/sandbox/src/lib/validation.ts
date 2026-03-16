export function validateSummary(value: string) {
  if (!value) {
    return "Summary is required";
  }
}

export async function validateSummaryAsync(value: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (value.toLowerCase().includes("duplicate")) {
    return "Summary must be unique";
  }
}

export function validateType(value: string | null) {
  if (!value) {
    return "Type is required";
  }
}

export function validatePriority(value: string | null) {
  if (!value) {
    return "Priority is required";
  }
}

export function validateStartDate(value: string, dueDate: string) {
  if (dueDate && new Date(value) > new Date(dueDate)) {
    return "Start date cannot be after due date";
  }
}

export function validateDueDate(value: string, startDate: string) {
  if (startDate && new Date(value) < new Date(startDate)) {
    return "Due date cannot be before start date";
  }
}

export function validateAssignee(value: string[]) {
  if (value.length === 0) {
    return "At least one assignee is required";
  }
}

export function validateSubtask(value: string) {
  if (!value) {
    return "Cannot be empty";
  }
}
