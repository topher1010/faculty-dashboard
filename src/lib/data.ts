import accountsData from "../data/accounts.json"
import personnelData from "../data/personnel.json"
import salaryAllocationsData from "../data/salary-allocations.json"
import transactionsData from "../data/transactions.json"
import type { Account, Person, SalaryAllocation, Transaction } from "./types"

export function getAccounts(): Account[] {
  return accountsData as Account[]
}

export function getPersonnel(): Person[] {
  return personnelData as Person[]
}

export function getSalaryAllocations(): SalaryAllocation[] {
  return salaryAllocationsData as SalaryAllocation[]
}

export function getTransactions(): Transaction[] {
  return transactionsData as Transaction[]
}

export function getAccountById(id: string): Account | undefined {
  return getAccounts().find((a) => a.id === id)
}

export function getAccountsByArea(area: string): Account[] {
  return getAccounts().filter((a) => a.area === area)
}

export function getPersonById(id: string): Person | undefined {
  return getPersonnel().find((p) => p.id === id)
}

export function getAllocationsForAccount(accountId: string): SalaryAllocation[] {
  return getSalaryAllocations().filter((a) => a.accountId === accountId)
}

export function getAllocationsForPerson(personId: string): SalaryAllocation[] {
  return getSalaryAllocations().filter((a) => a.personId === personId)
}

export function getTransactionsForAccount(accountId: string): Transaction[] {
  return getTransactions().filter((t) => t.accountId === accountId)
}
