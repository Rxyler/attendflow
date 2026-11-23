package com.attendflow.service;

public interface ExportService {

    byte[] pdf(RapportService.Rapport rapport);

    byte[] excel(RapportService.Rapport rapport);
}
