-- ============================================================================
-- MIGRATION: Module 1 - Classe Virtuelle (Phase 2A - FINAL)
-- ============================================================================

-- Suppression des triggers existants pour éviter les conflits
DROP TRIGGER IF EXISTS update_cours_updated_at ON cours;
DROP TRIGGER IF EXISTS update_qcms_updated_at ON qcms;
DROP TRIGGER IF EXISTS update_devoirs_updated_at ON devoirs;
DROP TRIGGER IF EXISTS update_rendus_updated_at ON rendus_devoir;
DROP TRIGGER IF EXISTS update_threads_updated_at ON threads;
DROP TRIGGER IF EXISTS update_messages_updated_at ON messages;

-- Recréer tous les triggers
CREATE TRIGGER update_cours_updated_at BEFORE UPDATE ON cours
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qcms_updated_at BEFORE UPDATE ON qcms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_devoirs_updated_at BEFORE UPDATE ON devoirs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rendus_updated_at BEFORE UPDATE ON rendus_devoir
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_threads_updated_at BEFORE UPDATE ON threads
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Validation : toutes les tables sont bien créées
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cours') THEN
        RAISE EXCEPTION 'Table cours n''existe pas';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'qcms') THEN
        RAISE EXCEPTION 'Table qcms n''existe pas';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'devoirs') THEN
        RAISE EXCEPTION 'Table devoirs n''existe pas';
    END IF;
    RAISE NOTICE 'Toutes les tables Module Classe Virtuelle sont créées avec succès';
END $$;