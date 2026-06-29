package dev.flux.domain.model

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

enum class TransactionType {
    FIXED, INSTALLMENT, VARIABLE, ONE_TIME, INCOME
}

@Entity
@Table(name = "transactions")
data class Transaction(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    val category: Category,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_source_id")
    val paymentSource: PaymentSource? = null,

    @Column(nullable = false, length = 255)
    val description: String,

    @Column(nullable = false, precision = 12, scale = 2)
    val amount: BigDecimal,

    /** The actual date the purchase was made. */
    @Column(name = "transaction_date", nullable = false)
    val transactionDate: LocalDate,

    /**
     * The billing month for this transaction (always stored as first day of month).
     * For credit cards: calculated based on the card's closing_day.
     * For other sources: same month as transaction_date.
     */
    @Column(name = "competence_date", nullable = false)
    val competenceDate: LocalDate,

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    val type: TransactionType,

    /** Groups all installments of the same purchase. */
    @Column(name = "installment_group_id")
    val installmentGroupId: UUID? = null,

    @Column(name = "installment_number")
    val installmentNumber: Int? = null,

    @Column(name = "installments_total")
    val installmentsTotal: Int? = null,

    /** For FIXED/VARIABLE: when the recurrence ends. Null = no end. */
    @Column(name = "recurrence_end_date")
    val recurrenceEndDate: LocalDate? = null,

    @Column(name = "is_shared", nullable = false)
    val isShared: Boolean = false,

    @Column(name = "is_paid", nullable = false)
    val isPaid: Boolean = false,

    val notes: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
