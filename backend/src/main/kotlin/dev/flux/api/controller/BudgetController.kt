package dev.flux.api.controller

import dev.flux.api.dto.*
import dev.flux.domain.model.Budget
import dev.flux.domain.repository.*
import dev.flux.domain.service.TransactionService
import jakarta.validation.Valid
import org.springframework.data.repository.findByIdOrNull
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal
import java.util.UUID

@RestController
@RequestMapping("/api/budgets")
class BudgetController(
    private val budgetRepository: BudgetRepository,
    private val userRepository: UserRepository,
    private val categoryRepository: CategoryRepository,
    private val transactionRepository: dev.flux.domain.repository.TransactionRepository
) {

    @GetMapping
    fun getMonthlyBudgets(
        @RequestParam userId: UUID,
        @RequestParam year: Int,
        @RequestParam month: Int
    ): List<BudgetResponse> {
        val referenceMonth = java.time.LocalDate.of(year, month, 1)
        val budgets = budgetRepository.findByUserIdAndReferenceMonth(userId, referenceMonth)
        val transactions = transactionRepository
            .findByUserIdAndCompetenceDateBetweenOrderByTransactionDateDesc(
                userId, referenceMonth, referenceMonth.withDayOfMonth(referenceMonth.lengthOfMonth())
            )

        val spentByCategory = transactions
            .filter { it.category.isIncome.not() }
            .groupBy { it.category.id }
            .mapValues { (_, txList) -> txList.sumOf { it.amount } }

        return budgets.map { budget ->
            val spent = spentByCategory[budget.category.id] ?: BigDecimal.ZERO
            val remaining = (budget.limitAmount - spent).coerceAtLeast(BigDecimal.ZERO)
            val percent = if (budget.limitAmount > BigDecimal.ZERO)
                (spent.divide(budget.limitAmount, 4, java.math.RoundingMode.HALF_UP) * BigDecimal(100)).toInt()
            else 0
            budget.toResponse(spent, remaining, percent)
        }
    }

    @PutMapping
    fun upsert(@Valid @RequestBody request: UpsertBudgetRequest): BudgetResponse {
        val user = userRepository.findByIdOrNull(request.userId) ?: error("User not found")
        val category = categoryRepository.findByIdOrNull(request.categoryId) ?: error("Category not found")
        val existing = budgetRepository.findByUserIdAndCategoryIdAndReferenceMonth(
            request.userId, request.categoryId, request.referenceMonth
        )
        val saved = budgetRepository.save(
            (existing ?: Budget(user = user, category = category, referenceMonth = request.referenceMonth, limitAmount = request.limitAmount))
                .copy(limitAmount = request.limitAmount)
        )
        return saved.toResponse(BigDecimal.ZERO, request.limitAmount, 0)
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) {
        budgetRepository.deleteById(id)
    }

    private fun Budget.toResponse(spent: BigDecimal, remaining: BigDecimal, percent: Int) = BudgetResponse(
        id = id,
        userId = user.id,
        categoryId = category.id,
        categoryName = category.name,
        referenceMonth = referenceMonth,
        limitAmount = limitAmount,
        spent = spent,
        remaining = remaining,
        percentUsed = percent
    )
}
