package com.attendflow.web;

import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

/** Un fichier de plus de 5 Mo est refuse avant d'atteindre le controleur : message clair au lieu d'une erreur. */
@ControllerAdvice
public class FichierTropVolumineux {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public String gerer(RedirectAttributes redirect) {
        redirect.addFlashAttribute("erreur", "Fichier trop volumineux : 5 Mo maximum.");
        return "redirect:/etudiant/justificatifs";
    }
}
