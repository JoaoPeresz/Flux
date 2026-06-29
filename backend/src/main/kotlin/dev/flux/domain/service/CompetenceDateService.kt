package dev.flux.domain.service

import dev.flux.domain.model.PaymentSource
import dev.flux.domain.model.PaymentSourceType
import org.springframework.stereotype.Service
import java.time.LocalDate

@Service
class CompetenceDateService {

    /**
     * Calculates the billing competence month for a transaction.
     *
     * For CREDIT_CARD: if the purchase date is AFTER the closing day,
     * the competence shifts to the next month (it lands on the next bill).
     *
     * For all other payment sources: competence = same month as transaction date.
     *
     * Returns the first day of the competence month.
     */
    fun calculate(transactionDate: LocalDate, paymentSource: PaymentSource?): LocalDate {
        if (paymentSource == null || paymentSource.type != PaymentSourceType.CREDIT_CARD) {
            return transactionDate.withDayOfMonth(1)
        }

        val closingDay = paymentSource.closingDay ?: return transactionDate.withDayOfMonth(1)

        return if (transactionDate.dayOfMonth > closingDay) {
            // Purchase after closing → lands on next month's bill
            transactionDate.plusMonths(1).withDayOfMonth(1)
        } else {
            // Purchase before/on closing → current month's bill
            transactionDate.withDayOfMonth(1)
        }
    }
}
