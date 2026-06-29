package dev.flux.domain.repository

import dev.flux.domain.model.Transaction
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDate
import java.util.UUID

interface TransactionRepository : JpaRepository<Transaction, UUID> {

    /** All transactions for a user in a given billing month. */
    fun findByUserIdAndCompetenceDateBetweenOrderByTransactionDateDesc(
        userId: UUID,
        from: LocalDate,
        to: LocalDate
    ): List<Transaction>

    /** All transactions for a user in a date range (for timeline projection). */
    @Query("""
        SELECT t FROM Transaction t
        WHERE t.user.id = :userId
          AND t.competenceDate >= :from
          AND t.competenceDate <= :to
        ORDER BY t.competenceDate, t.transactionDate
    """)
    fun findByUserIdInRange(
        @Param("userId") userId: UUID,
        @Param("from") from: LocalDate,
        @Param("to") to: LocalDate
    ): List<Transaction>

    /** Fetch all FIXED/VARIABLE transactions for recurrence expansion. */
    @Query("""
        SELECT t FROM Transaction t
        WHERE t.user.id = :userId
          AND t.type IN ('FIXED', 'VARIABLE')
          AND (t.recurrenceEndDate IS NULL OR t.recurrenceEndDate >= :from)
    """)
    fun findRecurringByUserId(
        @Param("userId") userId: UUID,
        @Param("from") from: LocalDate
    ): List<Transaction>

    fun findByInstallmentGroupId(installmentGroupId: UUID): List<Transaction>

    fun deleteByPaymentSourceId(paymentSourceId: UUID)
}
