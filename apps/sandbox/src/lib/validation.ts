import { isMatch } from "date-fns";

export const dateFormat = "MM/dd/yyyy";

export function validateSummary(value: string) {
  if (!value) {
    return "Summary is required";
  }
}

export async function validateSummaryAsync(value: string) {
  await new Promise((resolve) => setTimeout(resolve, 300));
  if (value.toLowerCase().includes("duplicate")) {
    return "A task with this summary already exists";
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

export function validateStartDate(dueDate: string) {
  return (value: string) => {
    if (value && !isMatch(value, dateFormat)) {
      return `Invalid date or format. Select a date in the format of ${dateFormat}`;
    }
    if (
      dueDate &&
      isMatch(dueDate, dateFormat) &&
      new Date(value) > new Date(dueDate)
    ) {
      return "Start date cannot be after due date";
    }
  };
}

export function validateDueDate(startDate: string) {
  return (value: string) => {
    if (value && !isMatch(value, dateFormat)) {
      return `Invalid date or format. Select a date in the format of ${dateFormat}`;
    }
    if (
      startDate &&
      isMatch(startDate, dateFormat) &&
      new Date(value) < new Date(startDate)
    ) {
      return "Due date cannot be before start date";
    }
  };
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
