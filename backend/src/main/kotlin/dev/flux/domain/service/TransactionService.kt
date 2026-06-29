package dev.flux.domain.service

import dev.flux.api.dto.*
import dev.flux.domain.model.*
import dev.flux.domain.repository.*
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Service
@Transactional
class TransactionService(
    private val transactionRepository: TransactionRepository,
    private val userRepository: UserRepository,
    private val categoryRepository: CategoryRepository,
    private val paymentSourceRepository: PaymentSourceRepository,
    private val competenceDateService: CompetenceDateService
) {

    @Transactional(readOnly = true)
    fun getMonthlyTransactions(userId: UUID, year: Int, month: Int): List<Transaction> {
        val from = LocalDate.of(year, month, 1)
        val to = from.withDayOfMonth(from.lengthOfMonth())
        return transactionRepository
            .findByUserIdAndCompetenceDateBetweenOrderByTransactionDateDesc(userId, from, to)
    }

    fun create(request: CreateTransactionRequest): List<Transaction> {
        val user = userRepository.findByIdOrNull(request.userId)
            ?: error("User not found: ${request.userId}")
        val category = categoryRepository.findByIdOrNull(request.categoryId)
            ?: error("Category not found: ${request.categoryId}")
        val paymentSource = request.paymentSourceId?.let {
            paymentSourceRepository.findByIdOrNull(it) ?: error("PaymentSource not found: $it")
        }

        return when (request.type) {
            TransactionType.INSTALLMENT -> createInstallments(request, user, category, paymentSource)
            TransactionType.FIXED -> createFixed(request, user, category, paymentSource)
            else -> listOf(createSingle(request, user, category, paymentSource))
        }
    }

    private fun createSingle(
        request: CreateTransactionRequest,
        user: User,
        category: Category,
        paymentSource: PaymentSource?
    ): Transaction {
        val competenceDate = competenceDateService.calculate(request.transactionDate, paymentSource)
        return transactionRepository.save(
            Transaction(
                user = user,
                category = category,
                paymentSource = paymentSource,
                description = request.description,
                amount = request.amount,
                transactionDate = request.transactionDate,
                competenceDate = competenceDate,
                type = request.type,
                recurrenceEndDate = request.recurrenceEndDate,
                isShared = request.isShared,
                notes = request.notes
            )
        )
    }

    private fun createInstallments(
        request: CreateTransactionRequest,
        user: User,
        category: Category,
        paymentSource: PaymentSource?
    ): List<Transaction> {
        val total = request.installmentsTotal ?: error("installmentsTotal required for INSTALLMENT type")
        val paid = request.installmentsPaid ?: 0
        if (paid >= total) return emptyList()

        val groupId = UUID.randomUUID()
        val installmentAmount = request.amount // Amount is already the per-installment amount

        return ((paid + 1)..total).map { i ->
            val purchaseDate = request.transactionDate.plusMonths((i - (paid + 1)).toLong())
            val competenceDate = competenceDateService.calculate(purchaseDate, paymentSource)
            transactionRepository.save(
                Transaction(
                    user = user,
                    category = category,
                    paymentSource = paymentSource,
                    description = "${request.description} ($i/$total)",
                    amount = installmentAmount,
                    transactionDate = purchaseDate,
                    competenceDate = competenceDate,
                    type = TransactionType.INSTALLMENT,
                    installmentGroupId = groupId,
                    installmentNumber = i,
                    installmentsTotal = total,
                    isShared = request.isShared,
                    notes = request.notes
                )
            )
        }
    }

    private fun createFixed(
        request: CreateTransactionRequest,
        user: User,
        category: Category,
        paymentSource: PaymentSource?
    ): List<Transaction> {
        // Project 24 months forward for FIXED transactions (Salaries, Subscriptions, Rent)
        val totalMonths = 24L
        val groupId = UUID.randomUUID()
        
        return (0 until totalMonths).map { i ->
            val simulatedPurchaseDate = request.transactionDate.plusMonths(i)
            val competenceDate = competenceDateService.calculate(simulatedPurchaseDate, paymentSource)
            transactionRepository.save(
                Transaction(
                    user = user,
                    category = category,
                    paymentSource = paymentSource,
                    description = request.description,
                    amount = request.amount,
                    transactionDate = simulatedPurchaseDate,
                    competenceDate = competenceDate,
                    type = TransactionType.FIXED,
                    installmentGroupId = groupId, // Link them so they can be grouped in the future if needed
                    isShared = request.isShared,
                    notes = request.notes
                )
            )
        }
    }

    fun update(id: UUID, request: UpdateTransactionRequest): Transaction {
        val existing = transactionRepository.findByIdOrNull(id)
            ?: error("Transaction not found: $id")
        val category = request.categoryId?.let {
            categoryRepository.findByIdOrNull(it) ?: error("Category not found: $it")
        } ?: existing.category
        val paymentSource = request.paymentSourceId?.let {
            paymentSourceRepository.findByIdOrNull(it)
        } ?: existing.paymentSource

        val newDate = request.transactionDate ?: existing.transactionDate
        val competenceDate = competenceDateService.calculate(newDate, paymentSource)

        // Update the target row
        val updated = transactionRepository.save(
            existing.copy(
                category = category,
                paymentSource = paymentSource,
                description = request.description ?: existing.description,
                amount = request.amount ?: existing.amount,
                transactionDate = newDate,
                competenceDate = competenceDate,
                recurrenceEndDate = request.recurrenceEndDate ?: existing.recurrenceEndDate,
                isPaid = request.isPaid ?: existing.isPaid,
                notes = request.notes ?: existing.notes
            )
        )

        // Propagate shared fields to siblings when part of a group (FIXED / INSTALLMENT)
        val groupId = existing.installmentGroupId
        if (groupId != null && (request.amount != null || request.description != null
                    || request.categoryId != null || request.paymentSourceId != null || request.notes != null)) {
            val siblings = transactionRepository.findByInstallmentGroupId(groupId)
                .filter { it.id != updated.id }

            if (siblings.isNotEmpty()) {
                val newDescription = request.description ?: existing.description
                val newAmount = request.amount ?: existing.amount
                val newNotes = request.notes ?: existing.notes

                // Amount from frontend is now the per-installment amount
                val installmentAmount = newAmount

                // Also update the target row if installment amount was recalculated
                if (existing.type == TransactionType.INSTALLMENT && request.amount != null) {
                    transactionRepository.save(updated.copy(amount = installmentAmount))
                }

                siblings.forEach { sibling ->
                    val siblingDesc = if (existing.type == TransactionType.INSTALLMENT && request.description != null) {
                        // Preserve the "(2/12)" suffix for installments
                        val suffix = sibling.installmentNumber?.let { n ->
                            sibling.installmentsTotal?.let { t -> " ($n/$t)" }
                        } ?: ""
                        newDescription.replace(Regex("\\s*\\(\\d+/\\d+\\)$"), "") + suffix
                    } else {
                        if (request.description != null) newDescription else sibling.description
                    }

                    // Recalculate competenceDate for sibling in case paymentSource changed
                    val siblingCompetenceDate = competenceDateService.calculate(sibling.transactionDate, paymentSource)

                    transactionRepository.save(
                        sibling.copy(
                            category = category,
                            paymentSource = paymentSource,
                            description = siblingDesc,
                            amount = installmentAmount,
                            competenceDate = siblingCompetenceDate,
                            notes = newNotes
                        )
                    )
                }
            }
        }

        return updated
    }

    fun delete(id: UUID, deleteGroup: Boolean = false) {
        if (deleteGroup) {
            val existing = transactionRepository.findByIdOrNull(id)
                ?: error("Transaction not found: $id")
            val groupId = existing.installmentGroupId
            if (groupId != null) {
                val siblings = transactionRepository.findByInstallmentGroupId(groupId)
                transactionRepository.deleteAll(siblings)
                return
            }
        }
        transactionRepository.deleteById(id)
    }
}
