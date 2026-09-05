"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createExpense,
  getExpense,
  listExpenses,
  removeExpense,
  retryExpenseDriveBackup,
  syncExpenseGastosSheet,
  uploadExpenseFiles,
  type CreateExpenseInput,
} from "./api";

export const expenseQueryKeys = {
  all: ["admin", "expenses"] as const,
  list: (limit: number) => [...expenseQueryKeys.all, "list", limit] as const,
  detail: (id: string) => [...expenseQueryKeys.all, "detail", id] as const,
};

export function useExpensesList(limit = 60) {
  return useQuery({
    queryKey: expenseQueryKeys.list(limit),
    queryFn: () => listExpenses(limit),
  });
}

export function useExpenseDetail(id: string | null) {
  return useQuery({
    queryKey: expenseQueryKeys.detail(id ?? ""),
    queryFn: () => getExpense(id!),
    enabled: Boolean(id),
  });
}

export function useCreateExpenseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { fields: CreateExpenseInput; files: File[] }) => {
      const { expense } = await createExpense(vars.fields);
      if (vars.files.length > 0) {
        await uploadExpenseFiles(expense.id, vars.files);
      }
      const sheet = await syncExpenseGastosSheet(expense.id);
      return { expense, sheet };
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

export function useRemoveExpenseMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (expenseId: string) => removeExpense(expenseId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

export function useRetryExpenseDriveMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => retryExpenseDriveBackup(fileId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}
