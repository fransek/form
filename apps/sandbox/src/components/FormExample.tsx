"use client";

import { cn } from "@/lib/utils";
import {
  validateAssignee,
  validateDueDate,
  validatePriority,
  validateStartDate,
  validateSummary,
  validateSummaryAsync,
  validateType,
} from "@/lib/validation";
import { createFieldState, Field, FieldState, Form } from "@fransek/form";
import {
  Checkbox,
  CheckboxGroup,
  DatePicker,
  Dialog,
  DialogClose,
  DialogTitle,
  Radio,
  RadioGroup,
} from "@fransek/ui";
import { Button } from "@fransek/ui/button";
import { Input } from "@fransek/ui/input";
import { Select } from "@fransek/ui/select";
import { Textarea } from "@fransek/ui/textarea";
import { useState } from "react";
import { Subtasks } from "./Subtasks";

export const priorities = [
  { value: "low", label: "Low", className: "bg-success-foreground" },
  { value: "medium", label: "Medium", className: "bg-warning-foreground" },
  { value: "high", label: "High", className: "bg-error-foreground" },
] as const;

export const initialFormData = {
  summary: createFieldState(""),
  description: createFieldState(""),
  type: createFieldState<string | null>(null),
  priority: createFieldState<string | null>(null),
  startDate: createFieldState(""),
  dueDate: createFieldState(""),
  assignees: createFieldState<string[]>([]),
  subtasks: [] as FieldState<string>[],
  createAnother: createFieldState(false),
};

export function FormExample() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Form
      className="mx-2 flex flex-col gap-4 rounded-lg border p-6"
      onSubmit={async (e, validate) => {
        e.preventDefault();
        setIsSubmitting(true);
        const isValid = await validate();
        if (isValid) {
          setDialogOpen(true);
        }
        setIsSubmitting(false);
      }}
      onReset={() => setFormData(initialFormData)}
    >
      <h1 className="heading-2">New Task</h1>

      <Field
        state={formData.summary}
        onChange={(summary) => setFormData((prev) => ({ ...prev, summary }))}
        validateOnChange={validateSummary}
        validateOnChangeAsync={validateSummaryAsync}
      >
        {(props) => (
          <Input
            label="Summary"
            errorMessage={props.errorMessage}
            onValueChange={props.handleChange}
            onBlur={props.handleBlur}
            value={props.value}
            ref={props.ref}
            isValidating={props.isValidating}
          />
        )}
      </Field>

      <Field
        state={formData.description}
        onChange={(description) =>
          setFormData((prev) => ({ ...prev, description }))
        }
      >
        {(props) => (
          <Textarea
            label="Description"
            rows={4}
            errorMessage={props.errorMessage}
            onValueChange={props.handleChange}
            onBlur={props.handleBlur}
            value={props.value}
            ref={props.ref}
            isValidating={props.isValidating}
          />
        )}
      </Field>

      <Field
        state={formData.type}
        onChange={(type) => setFormData((prev) => ({ ...prev, type }))}
        validateOnChange={validateType}
      >
        {(props) => (
          <RadioGroup
            label="Type"
            errorMessage={props.errorMessage}
            onValueChange={props.handleChange}
            onBlur={props.handleBlur}
            value={props.value}
            ref={props.ref}
            isValidating={props.isValidating}
          >
            <Radio value="bug" label="Bug" />
            <Radio value="feature" label="Feature" />
            <Radio value="improvement" label="Improvement" />
          </RadioGroup>
        )}
      </Field>

      <Field
        state={formData.priority}
        onChange={(priority) => setFormData((prev) => ({ ...prev, priority }))}
        validateOnChange={validatePriority}
      >
        {(props) => (
          <Select
            label="Priority"
            placeholder="Select priority"
            items={priorities.map(({ value, label, className }) => ({
              value,
              label: (
                <span className={cn("flex items-center gap-2")}>
                  <span
                    className={cn("ml-1 size-1.5 rounded-full", className)}
                  />
                  {label}
                </span>
              ),
            }))}
            errorMessage={props.errorMessage}
            onValueChange={props.handleChange}
            onBlur={props.handleBlur}
            value={props.value}
            ref={props.ref}
            isValidating={props.isValidating}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          state={formData.startDate}
          onChange={(startDate) =>
            setFormData((prev) => ({
              ...prev,
              startDate,
              dueDate: {
                ...prev.dueDate,
                isValid: true,
                errorMessage: undefined,
              },
            }))
          }
          validateOnChange={(value) =>
            validateStartDate(value, formData.dueDate.value)
          }
          validateOnTouch
        >
          {(props) => (
            <DatePicker
              label="Start Date"
              errorMessage={props.errorMessage}
              onValueChange={props.handleChange}
              onBlur={props.handleBlur}
              value={props.value}
              ref={props.ref}
              isValidating={props.isValidating}
              calendarProps={{
                autoFocus: false,
              }}
            />
          )}
        </Field>

        <Field
          state={formData.dueDate}
          onChange={(dueDate) =>
            setFormData((prev) => ({
              ...prev,
              dueDate,
              startDate: {
                ...prev.startDate,
                isValid: true,
                errorMessage: undefined,
              },
            }))
          }
          validateOnChange={(value) =>
            validateDueDate(value, formData.startDate.value)
          }
          validateOnTouch
        >
          {(props) => (
            <DatePicker
              label="Due Date"
              errorMessage={props.errorMessage}
              onValueChange={props.handleChange}
              onBlur={props.handleBlur}
              value={props.value}
              ref={props.ref}
              isValidating={props.isValidating}
              calendarProps={{
                autoFocus: false,
              }}
            />
          )}
        </Field>
      </div>

      <Field
        state={formData.assignees}
        onChange={(assignees) =>
          setFormData((prev) => ({ ...prev, assignees }))
        }
        validateOnChange={validateAssignee}
        validateOnTouch
      >
        {(props) => (
          <CheckboxGroup
            label="Assignees"
            errorMessage={props.errorMessage}
            onValueChange={props.handleChange}
            onBlur={props.handleBlur}
            value={props.value}
            ref={props.ref}
            isValidating={props.isValidating}
          >
            <Checkbox value="alice" label="Alice" />
            <Checkbox value="bob" label="Bob" />
            <Checkbox value="charlie" label="Charlie" />
          </CheckboxGroup>
        )}
      </Field>

      <Subtasks formData={formData} setFormData={setFormData} />

      <Field
        state={formData.createAnother}
        onChange={(createAnother) =>
          setFormData((prev) => ({ ...prev, createAnother }))
        }
      >
        {(props) => (
          <Checkbox
            label="Create another task"
            errorMessage={props.errorMessage}
            onCheckedChange={props.handleChange}
            onBlur={props.handleBlur}
            checked={props.value}
            ref={props.ref}
            isValidating={props.isValidating}
          />
        )}
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Button variant="secondary" type="reset">
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Task"}
        </Button>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        popupProps={{ className: "z-10" }}
      >
        <DialogTitle className="mb-4">Task created!</DialogTitle>
        <DialogClose render={<Button />}>OK</DialogClose>
      </Dialog>
    </Form>
  );
}
