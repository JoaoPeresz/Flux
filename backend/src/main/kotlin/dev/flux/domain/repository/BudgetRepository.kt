package dev.flux.domain.repository

import dev.flux.domain.model.Budget
import org.springframework.data.jpa.repository.JpaRepository
import java.time.LocalDate
import java.util.UUID

interface BudgetRepository : JpaRepository<Budget, UUID> {

    fun findByUserIdAndReferenceMonth(userId: UUID, referenceMonth: LocalDate): List<Budget>

    fun findByUserIdAndCategoryIdAndReferenceMonth(
        userId: UUID,
        categoryId: UUID,
        referenceMonth: LocalDate
    ): Budget?
}
