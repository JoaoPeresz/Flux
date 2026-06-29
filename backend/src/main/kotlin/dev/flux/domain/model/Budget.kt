package dev.flux.domain.model

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(
    name = "budgets",
    uniqueConstraints = [UniqueConstraint(columnNames = ["user_id", "category_id", "reference_month"])]
)
data class Budget(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    val category: Category,

    /** Always stored as the first day of the month, e.g. 2025-07-01. */
    @Column(name = "reference_month", nullable = false)
    val referenceMonth: LocalDate,

    @Column(name = "limit_amount", nullable = false, precision = 12, scale = 2)
    val limitAmount: BigDecimal
)
