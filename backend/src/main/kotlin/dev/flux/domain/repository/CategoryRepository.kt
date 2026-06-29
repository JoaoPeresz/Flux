package dev.flux.domain.repository

import dev.flux.domain.model.Category
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface CategoryRepository : JpaRepository<Category, UUID> {
    fun findByIsIncome(isIncome: Boolean): List<Category>
}
