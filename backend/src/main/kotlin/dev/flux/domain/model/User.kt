package dev.flux.domain.model

import jakarta.persistence.*
import java.time.LocalDateTime
import java.util.UUID

@Entity
@Table(name = "users")
data class User(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),

    @Column(nullable = false, length = 100)
    val name: String,

    @Column(nullable = false, unique = true, length = 100)
    val email: String = "",

    @Column(nullable = false, length = 10)
    val pin: String = "1234",

    @Column(name = "avatar_color", nullable = false, length = 7)
    val avatarColor: String = "#6C63FF",

    @Column(name = "created_at", nullable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),

    @Column(name = "rule1_name", nullable = false, length = 50)
    val rule1Name: String = "Necessidades",
    @Column(name = "rule1_percent", nullable = false)
    val rule1Percent: Int = 50,

    @Column(name = "rule2_name", nullable = false, length = 50)
    val rule2Name: String = "Desejos",
    @Column(name = "rule2_percent", nullable = false)
    val rule2Percent: Int = 30,

    @Column(name = "rule3_name", nullable = false, length = 50)
    val rule3Name: String = "Poupança/Dívidas",
    @Column(name = "rule3_percent", nullable = false)
    val rule3Percent: Int = 20
)
