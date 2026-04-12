package com.example.nineuniverse.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

/**
 * Thymeleaf 3.1+ では #request が既定で使えないため、JS 用にコンテキストパスをモデルへ渡す。
 */
@ControllerAdvice
public class GlobalThymeleafModelAdvice {

	@ModelAttribute("contextPath")
	public String contextPath(HttpServletRequest request) {
		String cp = request.getContextPath();
		return cp != null ? cp : "";
	}
}
