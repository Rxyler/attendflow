package com.attendflow.service;

/** F-31 : export des rapports, fidele aux donnees affichees (critere de recette). */
public interface ExportService {

    byte[] pdf(RapportService.Rapport rapport);

    byte[] excel(RapportService.Rapport rapport);
}
