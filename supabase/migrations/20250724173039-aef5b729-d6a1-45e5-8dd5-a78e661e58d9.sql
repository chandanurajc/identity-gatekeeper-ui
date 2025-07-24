-- Add foreign key constraint for party_contact_id to organization_contacts
ALTER TABLE subledger 
ADD CONSTRAINT fk_subledger_party_contact 
FOREIGN KEY (party_contact_id) REFERENCES organization_contacts(id);