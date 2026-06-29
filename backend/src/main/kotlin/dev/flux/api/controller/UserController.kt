package dev.flux.api.controller

import dev.flux.api.dto.*
import dev.flux.domain.model.User
import dev.flux.domain.repository.UserRepository
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*
import java.util.UUID

@RestController
@RequestMapping("/api/users")
class UserController(private val userRepository: UserRepository) {

    @GetMapping
    fun listAll(): List<UserResponse> =
        userRepository.findAll().map { it.toResponse() }

    @GetMapping("/{id}")
    fun getById(@PathVariable id: UUID): UserResponse =
        userRepository.findById(id).orElseThrow { NoSuchElementException("User not found") }.toResponse()

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: CreateUserRequest): UserResponse {
        if (userRepository.findByEmail(request.email) != null) {
            throw IllegalArgumentException("Email already in use")
        }
        return userRepository.save(User(
            name = request.name, 
            email = request.email,
            pin = request.pin,
            avatarColor = request.avatarColor
        )).toResponse()
    }

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): UserResponse {
        val user = userRepository.findByEmail(request.email)
            ?: throw NoSuchElementException("Invalid email or PIN")
        if (user.pin != request.pin) {
            throw IllegalArgumentException("Invalid email or PIN")
        }
        return user.toResponse()
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    fun delete(@PathVariable id: UUID) = userRepository.deleteById(id)

    @PutMapping("/{id}/rules")
    fun updateRules(@PathVariable id: UUID, @Valid @RequestBody request: UpdateUserRulesRequest): UserResponse {
        val existing = userRepository.findById(id).orElseThrow { NoSuchElementException("User not found") }
        if (request.rule1Percent + request.rule2Percent + request.rule3Percent != 100) {
            throw IllegalArgumentException("Percentages must add up to 100")
        }
        return userRepository.save(
            existing.copy(
                rule1Name = request.rule1Name, rule1Percent = request.rule1Percent,
                rule2Name = request.rule2Name, rule2Percent = request.rule2Percent,
                rule3Name = request.rule3Name, rule3Percent = request.rule3Percent
            )
        ).toResponse()
    }

    private fun User.toResponse() = UserResponse(
        id = id, name = name, email = email, avatarColor = avatarColor,
        rule1Name = rule1Name, rule1Percent = rule1Percent,
        rule2Name = rule2Name, rule2Percent = rule2Percent,
        rule3Name = rule3Name, rule3Percent = rule3Percent
    )
}
