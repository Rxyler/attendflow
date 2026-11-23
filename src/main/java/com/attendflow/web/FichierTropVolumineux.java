package com.attendflow.web;

import static com.attendflow.service.Textes.t;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@ControllerAdvice
public class FichierTropVolumineux {

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public String gerer(RedirectAttributes redirect) {
        redirect.addFlashAttribute("erreur", t("Fichier trop volumineux : 5 Mo maximum."));
        return "redirect:/etudiant/justificatifs";
    }
}
