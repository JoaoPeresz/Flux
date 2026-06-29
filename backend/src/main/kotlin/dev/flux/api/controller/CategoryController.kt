package dev.flux.api.controller

import dev.flux.api.dto.*
import dev.flux.domain.model.Category
import dev.flux.domain.repository.CategoryRepository
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/categories")
class CategoryController(private val categoryRepository: CategoryRepository) {

    @GetMapping
    fun listAll(@RequestParam(required = false) isIncome: Boolean?): List<CategoryResponse> {
        val categories = if (isIncome != null)
            categoryRepository.findByIsIncome(isIncome)
        else
            categoryRepository.findAll()
        return categories.map { it.toResponse() }
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun create(@Valid @RequestBody request: CreateCategoryRequest): CategoryResponse =
        categoryRepository.save(
            Category(
                name = request.name,
                icon = request.icon,
                color = request.color,
                isIncome = request.isIncome,
                ruleGroup = request.ruleGroup
            )
        ).toResponse()

    @PutMapping("/{id}")
    fun update(@PathVariable id: UUID, @Valid @RequestBody request: CreateCategoryRequest): CategoryResponse {
        val existing = categoryRepository.findById(id).orElseThrow { NoSuchElementException("Category not found") }
        return categoryRepository.save(
            existing.copy(name = request.name, icon = request.icon, color = request.color, isIncome = request.isIncome, ruleGroup = request.ruleGroup)
        ).toResponse()
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = categoryRepository.deleteById(id)

    private fun Category.toResponse() = CategoryResponse(id = id, name = name, icon = icon, color = color, isIncome = isIncome, ruleGroup = ruleGroup)
}
