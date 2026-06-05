"use client";

import { priorities } from "@/lib/options";
import { cn, initialFormData } from "@/lib/utils";
import {
  dateFormat,
  validateAssignee,
  validateDueDate,
  validatePriority,
  validateStartDate,
  validateSummary,
  validateSummaryAfterSubmit,
  validateSummaryAsync,
  validateType,
} from "@/lib/validation";
import { Field, Form } from "@fransek/form";
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
import { useRef, useState } from "react";
import { ServerResponse, submitForm } from "../lib/server-simulator";
import { Subtasks } from "./Subtasks";

export function FormExample() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [dialogOpen, setDialogOpen] = useState(false);
  const responseRef = useRef<ServerResponse | null>(null);

  return (
    <Form
      className="mx-2 flex flex-col gap-4 rounded-lg border p-6"
      onSubmit={async ({ event, validateForm }) => {
        event.preventDefault();
        setIsSubmitting(true);
        const { isValid, commit } = await validateForm();
        if (isValid) {
          responseRef.current = await submitForm(formData);
          if (responseRef.current.ok) {
            setDialogOpen(true);
          }
        }
        commit();
        setIsSubmitting(false);
      }}
      onReset={() => setFormData(initialFormData)}
    >
      <h1 className="heading-2">New Task</h1>

      <Field
        state={formData.summary}
        onChange={(summary) => setFormData((prev) => ({ ...prev, summary }))}
        validation={{
          onChange: validateSummary,
          onChangeAsync: validateSummaryAsync,
          afterSubmit: () => validateSummaryAfterSubmit(responseRef.current),
        }}
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
            isValidatingMessage="Checking availability..."
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
        validation={{ onChange: validateType }}
      >
        {(props) => (
          <RadioGroup
            label="Type"
            errorMessage={props.errorMessage}
            onValueChange={props.handleChange}
            onBlur={props.handleBlur}
            value={props.value}
            isValidating={props.isValidating}
          >
            <Radio value="bug" label="Bug" ref={props.ref} />
            <Radio value="feature" label="Feature" />
            <Radio value="improvement" label="Improvement" />
          </RadioGroup>
        )}
      </Field>

      <Field
        state={formData.priority}
        onChange={(priority) => setFormData((prev) => ({ ...prev, priority }))}
        validation={{ onChange: validatePriority }}
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
            setFormData((prev) => ({ ...prev, startDate }))
          }
          validation={{
            onChange: validateStartDate(formData.dueDate.value),
            onChangeDependencies: [formData.dueDate.value],
          }}
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
              format={dateFormat}
              calendarProps={{
                autoFocus: false,
              }}
            />
          )}
        </Field>

        <Field
          state={formData.dueDate}
          onChange={(dueDate) => setFormData((prev) => ({ ...prev, dueDate }))}
          validation={{
            onChange: validateDueDate(formData.startDate.value),
            onChangeDependencies: [formData.startDate.value],
          }}
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
              format={dateFormat}
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
        validation={{ onChange: validateAssignee }}
        validationMode="dirty"
      >
        {(props) => (
          <CheckboxGroup
            label="Assignees"
            errorMessage={props.errorMessage}
            onValueChange={props.handleChange}
            onBlur={props.handleBlur}
            value={props.value}
            isValidating={props.isValidating}
          >
            <Checkbox value="alice" label="Alice" ref={props.ref} />
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
