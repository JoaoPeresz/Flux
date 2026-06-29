package dev.flux.domain.repository

import dev.flux.domain.model.PaymentSource
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PaymentSourceRepository : JpaRepository<PaymentSource, UUID> {
    fun findByUserId(userId: UUID): List<PaymentSource>
}
