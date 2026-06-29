package dev.flux.domain.service

import dev.flux.domain.model.TransactionType
import dev.flux.domain.repository.TransactionRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

data class MonthSummary(
    val month: Int,
    val year: Int,
    val referenceMonth: LocalDate,
    val totalIncome: BigDecimal,
    val totalExpenses: BigDecimal,
    val balance: BigDecimal,
    val projectedItems: List<ProjectedItem>
)

data class ProjectedItem(
    val description: String,
    val amount: BigDecimal,
    val categoryName: String,
    val categoryColor: String,
    val categoryIcon: String,
    val categoryIsIncome: Boolean,
    val type: TransactionType,
    val installmentNumber: Int?,
    val installmentsTotal: Int?,
    val isPaid: Boolean,
    val paymentSourceId: UUID?,
    val paymentSourceName: String?,
    val paymentSourceType: String?,
    val paymentSourceColor: String?,
    val paymentSourceDueDay: Int?
)

@Service
@Transactional(readOnly = true)
class TimelineService(
    private val transactionRepository: TransactionRepository
) {

    /**
     * Returns a summary for each of the next [months] months starting from [from].
     * Includes all known transactions (fixed, installments, income) projected forward.
     */
    fun getTimeline(userId: UUID, from: LocalDate, months: Int): List<MonthSummary> {
        val to = from.plusMonths(months.toLong()).withDayOfMonth(1).minusDays(1)

        // Fetch all concrete transactions already stored in this range
        val storedTransactions = transactionRepository.findByUserIdInRange(userId, from.withDayOfMonth(1), to)

        // Group by competence month
        val byMonth = storedTransactions.groupBy { it.competenceDate.withDayOfMonth(1) }

        return (0 until months).map { offset ->
            val monthStart = from.withDayOfMonth(1).plusMonths(offset.toLong())
            val txList = byMonth[monthStart] ?: emptyList()

            val income = txList
                .filter { it.category.isIncome }
                .sumOf { it.amount }

            val expenses = txList
                .filter { !it.category.isIncome }
                .sumOf { it.amount }

            MonthSummary(
                month = monthStart.monthValue,
                year = monthStart.year,
                referenceMonth = monthStart,
                totalIncome = income,
                totalExpenses = expenses,
                balance = income - expenses,
                projectedItems = txList.map { t ->
                    ProjectedItem(
                        description = t.description,
                        amount = t.amount,
                        categoryName = t.category.name,
                        categoryColor = t.category.color,
                        categoryIcon = t.category.icon,
                        categoryIsIncome = t.category.isIncome,
                        type = t.type,
                        installmentNumber = t.installmentNumber,
                        installmentsTotal = t.installmentsTotal,
                        isPaid = t.isPaid,
                        paymentSourceId = t.paymentSource?.id,
                        paymentSourceName = t.paymentSource?.name,
                        paymentSourceType = t.paymentSource?.type?.name,
                        paymentSourceColor = t.paymentSource?.color,
                        paymentSourceDueDay = t.paymentSource?.dueDay
                    )
                }
            )
        }
    }
}
