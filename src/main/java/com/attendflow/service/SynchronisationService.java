package com.attendflow.service;

import com.attendflow.model.Admin;
import com.attendflow.model.JournalSynchronisation;

import java.util.List;

public interface SynchronisationService {

    JournalSynchronisation synchroniser(Admin declencheur);

    List<JournalSynchronisation> derniersJournaux();
}
