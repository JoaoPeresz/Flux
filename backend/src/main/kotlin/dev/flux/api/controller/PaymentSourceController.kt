package dev.flux.api.controller

import dev.flux.api.dto.*
import dev.flux.domain.model.PaymentSource
import dev.flux.domain.model.PaymentSourceType
import dev.flux.domain.repository.PaymentSourceRepository
import dev.flux.domain.repository.TransactionRepository
import dev.flux.domain.repository.UserRepository
import jakarta.validation.Valid
import org.springframework.data.repository.findByIdOrNull
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/payment-sources")
class PaymentSourceController(
    private val paymentSourceRepository: PaymentSourceRepository,
    private val userRepository: UserRepository,
    private val transactionRepository: TransactionRepository
) {

    @GetMapping
    fun listByUser(@RequestParam userId: UUID): List<PaymentSourceResponse> =
        paymentSourceRepository.findByUserId(userId).map { it.toResponse() }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreatePaymentSourceRequest): PaymentSourceResponse {
        val user = userRepository.findByIdOrNull(request.userId) ?: error("User not found")
        return paymentSourceRepository.save(
            PaymentSource(
                user = user,
                name = request.name,
                type = PaymentSourceType.valueOf(request.type),
                closingDay = request.closingDay,
                dueDay = request.dueDay,
                color = request.color,
                icon = request.icon
            )
        ).toResponse()
    }

    @Transactional
    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody request: UpdatePaymentSourceRequest): PaymentSourceResponse {
        val source = paymentSourceRepository.findByIdOrNull(id) ?: error("Payment source not found")
        source.name = request.name
        source.type = PaymentSourceType.valueOf(request.type)
        source.closingDay = request.closingDay
        source.dueDay = request.dueDay
        source.color = request.color
        source.icon = request.icon
        return paymentSourceRepository.save(source).toResponse()
    }

    @Transactional
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) {
        transactionRepository.deleteByPaymentSourceId(id)
        paymentSourceRepository.deleteById(id)
    }

    private fun PaymentSource.toResponse() = PaymentSourceResponse(
        id = id, userId = user.id, name = name, type = type.name,
        closingDay = closingDay, dueDay = dueDay, color = color, icon = icon
    )
}
