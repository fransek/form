export const validateName = (value: string) => {
  if (!value) {
    return "Name is required";
  }
};
export const validateNameAsync = async (value: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (value.toLowerCase() === "taken") {
    return "Name is already taken";
  }
};
export const validateRepeatName = (nameValue: string) => (value: string) => {
  if (value !== nameValue) {
    return "Names must match";
  }
};
export const validateRepeatNameAsync = async (value: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (value.toLowerCase() === "name") {
    return "Error";
  }
};
