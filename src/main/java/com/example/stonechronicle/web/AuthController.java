package com.example.stonechronicle.web;

import com.example.stonechronicle.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequiredArgsConstructor
public class AuthController {

	private final RegistrationService registrationService;

	@Value("${app.inactive-user.retention-days:7}")
	private int inactiveUserRetentionDays;

	@GetMapping("/login")
	public String login(Model model) {
		model.addAttribute("inactiveUserRetentionDays", inactiveUserRetentionDays);
		return "login";
	}

	@GetMapping("/register")
	public String registerForm() {
		return "register";
	}

	@PostMapping("/register")
	public String register(@RequestParam String username, @RequestParam String password, RedirectAttributes ra) {
		try {
			registrationService.register(username, password);
			ra.addFlashAttribute("msg", "登録しました。ログインしてください。");
			return "redirect:/login";
		} catch (IllegalArgumentException e) {
			ra.addFlashAttribute("error", e.getMessage());
			return "redirect:/register";
		}
	}
}
