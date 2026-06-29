package dev.flux.domain.model

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID
import org.hibernate.annotations.JdbcTypeCode
import org.hibernate.type.SqlTypes

enum class PaymentSourceType {
    CREDIT_CARD, DEBIT, CASH, PIX, BOLETO, AUTO_DEBIT
}

@Entity
@Table(name = "payment_sources")
data class PaymentSource(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Column(nullable = false, length = 100)
    var name: String,

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(nullable = false)
    var type: PaymentSourceType,

    /** Day of month the credit card closes (1–28). Only for CREDIT_CARD. */
    @Column(name = "closing_day")
    var closingDay: Int? = null,

    /** Day of month the bill is due (1–28). Only for CREDIT_CARD. */
    @Column(name = "due_day")
    var dueDay: Int? = null,

    @Column(nullable = false, length = 7)
    var color: String = "#6C63FF",

    @Column(nullable = false, length = 50)
    var icon: String = "credit-card",

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now()
)
