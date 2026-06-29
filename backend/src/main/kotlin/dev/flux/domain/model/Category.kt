package dev.flux.domain.model

import jakarta.persistence.*
import java.util.UUID

@Entity
@Table(name = "categories")
data class Category(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false, length = 100)
    val name: String,

    @Column(nullable = false, length = 50)
    val icon: String = "tag",

    @Column(nullable = false, length = 7)
    val color: String = "#6C63FF",

    @Column(name = "is_income", nullable = false)
    val isIncome: Boolean = false,

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_group", nullable = false, length = 20)
    val ruleGroup: RuleGroup = RuleGroup.NEEDS
)

enum class RuleGroup {
    NEEDS, WANTS, SAVINGS
}
