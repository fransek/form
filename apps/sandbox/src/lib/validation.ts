import { FavoriteFruitOption, GenderOption, HobbyOption } from "./options";

export const validateUsername = (value: string) => {
  if (!value) {
    return "Username is required";
  }
};
export const validateUsernameAsync = async (value: string) => {
  if (!value) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, 500));

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
  if (!value) {
    return "Please repeat your password";
  }

  if (value !== password) {
    return "Passwords do not match";
  }
};

export const validateHobbies = (value: HobbyOption[]) => {
  if (value.length < 1 || value.length > 2) {
    return "Select 1-2 hobbies";
  }
};

export const validateFavoriteColor = (value: string) => {
  if (!value) {
    return "Favorite color is required";
  }
};

export const validateGender = (value: GenderOption | "") => {
  if (!value) {
    return "Gender is required";
  }
};

export const validateFavoriteFruit = (value: FavoriteFruitOption) => {
  if (!value) {
    return "Favorite fruit is required";
  }
};

export const validateTermsAccepted = (value: boolean) => {
  if (!value) {
    return "You must accept the terms and conditions";
  }
};
