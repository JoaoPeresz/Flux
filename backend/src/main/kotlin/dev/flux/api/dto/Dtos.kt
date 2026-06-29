package dev.flux.api.dto

import dev.flux.domain.model.TransactionType
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID
import dev.flux.domain.model.RuleGroup

// ── Transaction Request DTOs ──────────────────────────────────────────────────

data class CreateTransactionRequest(
    @field:NotNull val userId: UUID,
    @field:NotNull val categoryId: UUID,
    val paymentSourceId: UUID? = null,

    @field:NotBlank val description: String,

    @field:NotNull
    @field:DecimalMin("0.01")
    val amount: BigDecimal,

    @field:NotNull val transactionDate: LocalDate,
    @field:NotNull val type: TransactionType,

    val installmentsTotal: Int? = null,
    val installmentsPaid: Int? = null,
    val recurrenceEndDate: LocalDate? = null,
    val isShared: Boolean = false,
    val notes: String? = null
)

data class UpdateTransactionRequest(
    val categoryId: UUID? = null,
    val paymentSourceId: UUID? = null,
    val description: String? = null,
    val amount: BigDecimal? = null,
    val transactionDate: LocalDate? = null,
    val recurrenceEndDate: LocalDate? = null,
    val isPaid: Boolean? = null,
    val notes: String? = null
)

// ── Transaction Response DTO ──────────────────────────────────────────────────

data class TransactionResponse(
    val id: UUID,
    val userId: UUID,
    val categoryId: UUID,
    val categoryName: String,
    val categoryColor: String,
    val categoryIcon: String,
    val categoryIsIncome: Boolean,
    val categoryRuleGroup: RuleGroup,
    val paymentSourceId: UUID?,
    val paymentSourceName: String?,
    val description: String,
    val amount: BigDecimal,
    val transactionDate: LocalDate,
    val competenceDate: LocalDate,
    val type: TransactionType,
    val installmentGroupId: UUID?,
    val installmentNumber: Int?,
    val installmentsTotal: Int?,
    val recurrenceEndDate: LocalDate?,
    val isShared: Boolean,
    val isPaid: Boolean,
    val notes: String?
)

// ── Budget DTOs ───────────────────────────────────────────────────────────────

data class UpsertBudgetRequest(
    @field:NotNull val userId: UUID,
    @field:NotNull val categoryId: UUID,
    @field:NotNull val referenceMonth: LocalDate,
    @field:NotNull @field:DecimalMin("0.01") val limitAmount: BigDecimal
)

data class BudgetResponse(
    val id: UUID,
    val userId: UUID,
    val categoryId: UUID,
    val categoryName: String,
    val referenceMonth: LocalDate,
    val limitAmount: BigDecimal,
    val spent: BigDecimal,
    val remaining: BigDecimal,
    val percentUsed: Int
)

// ── User DTOs ─────────────────────────────────────────────────────────────────

data class CreateUserRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val email: String,
    @field:NotBlank val pin: String,
    val avatarColor: String = "#6C63FF"
)

data class LoginRequest(
    @field:NotBlank val email: String,
    @field:NotBlank val pin: String
)

data class UserResponse(
    val id: UUID,
    val name: String,
    val email: String,
    val avatarColor: String,
    val rule1Name: String,
    val rule1Percent: Int,
    val rule2Name: String,
    val rule2Percent: Int,
    val rule3Name: String,
    val rule3Percent: Int
)

data class UpdateUserRulesRequest(
    @field:NotBlank val rule1Name: String,
    @field:NotNull val rule1Percent: Int,
    @field:NotBlank val rule2Name: String,
    @field:NotNull val rule2Percent: Int,
    @field:NotBlank val rule3Name: String,
    @field:NotNull val rule3Percent: Int
)

// ── Category DTOs ─────────────────────────────────────────────────────────────

data class CreateCategoryRequest(
    @field:NotBlank val name: String,
    val icon: String = "tag",
    val color: String = "#6C63FF",
    val isIncome: Boolean = false,
    val ruleGroup: RuleGroup = RuleGroup.NEEDS
)

data class CategoryResponse(
    val id: UUID,
    val name: String,
    val icon: String,
    val color: String,
    val isIncome: Boolean,
    val ruleGroup: RuleGroup
)

// ── PaymentSource DTOs ────────────────────────────────────────────────────────

data class CreatePaymentSourceRequest(
    @field:NotNull val userId: UUID,
    @field:NotBlank val name: String,
    @field:NotBlank val type: String,
    val closingDay: Int? = null,
    val dueDay: Int? = null,
    val color: String = "#6C63FF",
    val icon: String = "credit-card"
)

data class UpdatePaymentSourceRequest(
    @field:NotBlank val name: String,
    @field:NotBlank val type: String,
    val closingDay: Int? = null,
    val dueDay: Int? = null,
    val color: String,
    val icon: String
)

data class PaymentSourceResponse(
    val id: UUID,
    val userId: UUID,
    val name: String,
    val type: String,
    val closingDay: Int?,
    val dueDay: Int?,
    val color: String,
    val icon: String
)
