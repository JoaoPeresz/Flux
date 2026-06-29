package dev.flux.api.controller

import dev.flux.api.dto.*
import dev.flux.domain.model.Transaction
import dev.flux.domain.service.TransactionService
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/transactions")
class TransactionController(private val transactionService: TransactionService) {

    @GetMapping
    fun getMonthly(
        @RequestParam userId: UUID,
        @RequestParam year: Int,
        @RequestParam month: Int
    ): List<TransactionResponse> =
        transactionService.getMonthlyTransactions(userId, year, month).map { it.toResponse() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateTransactionRequest): List<TransactionResponse> =
        transactionService.create(request).map { it.toResponse() }

    @PutMapping("/{id}")
    fun update(
        @PathVariable id: UUID,
        @RequestBody request: UpdateTransactionRequest
    ): TransactionResponse =
        transactionService.update(id, request).toResponse()

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(
        @PathVariable id: UUID,
        @RequestParam(defaultValue = "false") deleteGroup: Boolean
    ) = transactionService.delete(id, deleteGroup)

    private fun Transaction.toResponse() = TransactionResponse(
        id = id,
        userId = user.id,
        categoryId = category.id,
        categoryName = category.name,
        categoryColor = category.color,
        categoryIcon = category.icon,
        categoryIsIncome = category.isIncome,
        categoryRuleGroup = category.ruleGroup,
        paymentSourceId = paymentSource?.id,
        paymentSourceName = paymentSource?.name,
        description = description,
        amount = amount,
        transactionDate = transactionDate,
        competenceDate = competenceDate,
        type = type,
        installmentGroupId = installmentGroupId,
        installmentNumber = installmentNumber,
        installmentsTotal = installmentsTotal,
        recurrenceEndDate = recurrenceEndDate,
        isShared = isShared,
        isPaid = isPaid,
        notes = notes
    )
}
