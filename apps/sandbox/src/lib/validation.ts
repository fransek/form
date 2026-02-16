export const validateUsername = (value: string) => {
  if (!value) {
    return "Username is required";
  }
};
export const validateUsernameAsync = async (value: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (value.toLowerCase() === "john") {
    return "Username is already taken";
  }
};

export const validateEmail = (value: string) => {
  if (!value) {
    return "Email is required";
  }

  if (!/\S+@\S+\.\S+/.test(value)) {
    return "Email is invalid";
  }
};

export const validatePassword = (value: string) => {
  if (!value) {
    return "Password is required";
  }

  if (value.length < 6) {
    return "Password must be at least 6 characters";
  }
};

export const validateRepeatPassword = (password: string) => (value: string) => {
  if (value !== password) {
    return "Passwords do not match";
  }
};
