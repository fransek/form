import {
  DependenciesByHook,
  DependencyValidationHook,
  Validation,
} from "./types";

const DEPENDENCY_VALIDATION_HOOKS: DependencyValidationHook[] = [
  "onChange",
  "onBlur",
  "onChangeAsync",
  "onBlurAsync",
];

function haveDependenciesChanged(
  previous: readonly unknown[],
  next: readonly unknown[],
) {
  return (
    previous.length !== next.length ||
    previous.some((dependency, index) => !Object.is(dependency, next[index]))
  );
}

export function getDependenciesByHook<T>(
  validation: Validation<T> | undefined,
): DependenciesByHook {
  return {
    onChange: validation?.onChangeDependencies,
    onBlur: validation?.onBlurDependencies,
    onChangeAsync: validation?.onChangeAsyncDependencies,
    onBlurAsync: validation?.onBlurAsyncDependencies,
  };
}

export function getChangedDependencyHooks(
  previous: DependenciesByHook,
  current: DependenciesByHook,
): DependencyValidationHook[] {
  return DEPENDENCY_VALIDATION_HOOKS.filter((hook) => {
    const previousDependencies = previous[hook];
    const currentDependencies = current[hook];

    return Boolean(
      previousDependencies &&
      currentDependencies &&
      haveDependenciesChanged(previousDependencies, currentDependencies),
    );
  });
}

export function getSyncValidationError<T>(
  value: T,
  validators: Array<((value: T) => React.ReactNode) | undefined>,
) {
  for (const validator of validators) {
    const error = validator?.(value);
    if (error) {
      return error;
    }
  }
}

export async function getAsyncValidationError<T>(
  value: T,
  validators: Array<((value: T) => Promise<React.ReactNode>) | undefined>,
) {
  const errors = await Promise.all(
    validators.map((validator) => validator?.(value)),
  );
  return errors.find(Boolean);
}
