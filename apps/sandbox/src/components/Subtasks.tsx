import { validateSubtask } from "@/lib/validation";
import { createFieldState, Field } from "@fransek/form";
import { Button } from "@fransek/ui/button";
import { Input } from "@fransek/ui/input";
import { Plus, Trash } from "lucide-react";
import { useRef } from "react";
import { initialFormData } from "./FormExample";

interface SubtasksProps {
  formData: typeof initialFormData;
  setFormData: React.Dispatch<React.SetStateAction<typeof initialFormData>>;
}

export function Subtasks({ formData, setFormData }: SubtasksProps) {
  const nextSubtaskId = useRef(0);
  return (
    <fieldset className="bg-card/50 flex flex-col gap-4 rounded-lg border p-4">
      <legend className="sr-only">Subtasks</legend>
      <h2 aria-hidden className="heading-6">
        Subtasks
      </h2>
      {formData.subtasks.map((subtask, index) => (
        <Field
          key={subtask.id}
          state={subtask.state}
          onChange={(value) =>
            setFormData((prev) => {
              const subtasks = [...prev.subtasks];
              subtasks[index].state = value;
              return { ...prev, subtasks };
            })
          }
          validation={{ onChange: validateSubtask }}
        >
          {(props) => (
            <Input
              label={`Subtask ${index + 1}`}
              className="bg-background"
              errorMessage={props.errorMessage}
              onValueChange={props.handleChange}
              onBlur={props.handleBlur}
              value={props.value}
              ref={props.ref}
              isValidating={props.isValidating}
              rightAdornment={
                <Button
                  variant="ghost"
                  className="text-error-foreground"
                  size="icon"
                  onClick={() =>
                    setFormData((prev) => {
                      const newSubtasks = prev.subtasks.filter(
                        (_, i) => i !== index,
                      );
                      return { ...prev, subtasks: newSubtasks };
                    })
                  }
                >
                  <Trash className="size-4" />
                </Button>
              }
            />
          )}
        </Field>
      ))}
      <Button
        variant="ghost"
        className="w-fit"
        onClick={() => {
          const id = nextSubtaskId.current++;
          setFormData((prev) => ({
            ...prev,
            subtasks: [...prev.subtasks, { state: createFieldState(""), id }],
          }));
        }}
      >
        <Plus className="size-5" />
        Add subtask
      </Button>
    </fieldset>
  );
}
