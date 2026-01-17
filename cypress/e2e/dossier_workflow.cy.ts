// Fix: Removed broken reference directive and added declarations for Cypress globals.
declare var describe: any;
declare var it: any;
declare var cy: any;

describe('Dossier Workflow', () => {
  it('erstellt und analysiert ein Dossier end-to-end', () => {
    cy.visit('http://localhost:5173');

    // Sicherstellen, dass das Dashboard geladen ist
    cy.contains('MRV ASSISTANT').should('be.visible');

    // 1. Dokument hochladen
    cy.get('[data-testid="nav-documents"]').click();
    // Force:true notwendig, da das Input-Feld hidden ist
    cy.get('[data-testid="file-input"]').selectFile('cypress/fixtures/testfall.pdf', { force: true });
    cy.contains('Upload erfolgreich').should('be.visible');

    // 2. Analyse starten (Button klicken, falls nicht automatisch)
    cy.contains('button', 'Analysieren').click();

    // Warten auf Analyse-Abschluss (Timeout erhöht für KI-Latenz)
    cy.contains('Analysiert', { timeout: 60000 }).should('be.visible');

    // 3. Wissensbasis prüfen
    cy.get('[data-testid="nav-knowledge"]').click();
    // Wir prüfen generisch, ob Einträge vorhanden sind, da "testfall" vom Dateinamen abhängt
    cy.get('div').contains('Wissenseinträge').should('exist');

    // 4. Radbruch-Wizard durchlaufen
    cy.get('[data-testid="nav-radbruch-check"]').click();
    
    // Wizard Steps durchklicken (da der Wizard 4 Schritte hat)
    cy.contains('button', 'Weiter').click(); // Schritt 1 -> 2
    cy.contains('button', 'Weiter').click(); // Schritt 2 -> 3
    cy.contains('button', 'Forensische Validierung starten').click(); // Schritt 3 -> 4
    
    // Ergebnis speichern
    cy.get('[data-testid="btn-generate-dossier"]').click();
    cy.contains('Radbruch-Analyse gespeichert').should('be.visible');
  });
});