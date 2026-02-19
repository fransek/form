export const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export type GenderOption = (typeof genderOptions)[number]["value"];

export const hobbyOptions = [
  { value: "reading", label: "Reading" },
  { value: "sports", label: "Sports" },
  { value: "music", label: "Music" },
] as const;

export type HobbyOption = (typeof hobbyOptions)[number]["value"];

export const favoriteFruitOptions = [
  { value: "", label: "Select a fruit" },
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "orange", label: "Orange" },
] as const;

export type FavoriteFruitOption =
  (typeof favoriteFruitOptions)[number]["value"];
