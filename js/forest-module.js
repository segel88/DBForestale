// DBForestale - Main Application Module
// Forest Database Management System for Assessment

class ForestModule {
    constructor() {
        this.init();
    }

    init() {
        this.setupPageManagement();
        this.setupEventListeners();
        this.setupFormValidation();
        this.loadHeaderFooterSettings();
        this.setupExistingRowListeners();
    }

    // ========================================
    // PAGE MANAGEMENT
    // ========================================

    showHomePage() {
        document.getElementById('home-page').classList.remove('hidden');
        document.getElementById('project-page').classList.add('hidden');
        document.getElementById('main-form').classList.add('hidden');
    }

    showProjectPage() {
        document.getElementById('home-page').classList.add('hidden');
        document.getElementById('project-page').classList.remove('hidden');
        document.getElementById('main-form').classList.add('hidden');
        this.loadProjectData();
    }

    showMainForm() {
        document.getElementById('home-page').classList.add('hidden');
        document.getElementById('project-page').classList.add('hidden');
        document.getElementById('main-form').classList.remove('hidden');

        // Load specific particella data when editing
        this.loadCurrentParticellaData();
    }

    // ========================================
    // DATA MANAGEMENT
    // ========================================

    loadCurrentParticellaData() {
        const particellaIndex = localStorage.getItem('current-particella-index');
        if (particellaIndex !== null) {
            const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');
            const particella = particelleData[parseInt(particellaIndex)];

            if (particella && particella.formData) {
                console.log('Loading data for particella index:', particellaIndex);
                Object.keys(particella.formData).forEach(key => {
                    const element = document.querySelector(`[name="${key}"]`);
                    if (element) {
                        // Skip chiave-db field - it should always be calculated, never loaded
                        if (key !== 'chiave-db') {
                            element.value = particella.formData[key];
                            if (key === 'superficie-particella') {
                                console.log('Loaded superficie-particella:', particella.formData[key], 'Element value:', element.value);
                            }
                        }
                    }
                });

                // After loading all data, recalculate chiave database
                setTimeout(() => {
                    const pfInput = document.getElementById('particella');
                    const spfInput = document.getElementById('sottoparticella');
                    const chiaveDbInput = document.getElementById('chiave-db');

                    if (pfInput && spfInput && chiaveDbInput) {
                        const pfValue = pfInput.value.trim();
                        const spfValue = spfInput.value.trim();
                        const concatenated = pfValue + spfValue;
                        chiaveDbInput.value = concatenated;
                        console.log('Recalculated chiave DB after data load:', concatenated);
                    }
                }, 100);
            } else {
                // Clear form for new particella
                const form = document.getElementById('forestry-form');
                if (form) {
                    form.reset();
                }
            }
        }
    }

    loadProjectData() {
        const projectData = JSON.parse(localStorage.getItem('current-project'));
        if (projectData) {
            document.getElementById('display-project-name').textContent = projectData.name;
            document.getElementById('display-project-location').textContent = projectData.location;
            document.getElementById('display-project-client').textContent = projectData.client;
            document.getElementById('display-project-authority').textContent = projectData.authority;
            this.loadParticellaCards();
        }
    }

    loadParticellaCards() {
        const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');
        const tableBody = document.getElementById('particella-table-body');
        const emptyMessage = document.getElementById('empty-particelle-message');
        const table = document.querySelector('.particella-table');

        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (particelleData.length === 0) {
            if (table) table.style.display = 'none';
            if (emptyMessage) emptyMessage.style.display = 'flex';
        } else {
            if (table) table.style.display = 'table';
            if (emptyMessage) emptyMessage.style.display = 'none';

            particelleData.forEach((particella, index) => {
                const row = document.createElement('tr');
                row.className = 'particella-row';

                // Extract PF and SPF data
                let pfValue = 'Non specificata';
                let spfValue = 'Non specificata';
                if (particella.formData) {
                    pfValue = particella.formData['particella'] || 'Non specificata';
                    spfValue = particella.formData['sottoparticella'] || 'Non specificata';
                }

                // Extract species data (first species from the form data)
                let specieName = 'Non specificata';
                if (particella.formData && particella.formData.species) {
                    specieName = particella.formData.species;
                }

                // Extract intervention data
                let interventoProgr = 'Non specificato';
                let anno = 'Non specificato';
                if (particella.formData) {
                    // Check for intervention table data or ultimo intervento
                    interventoProgr = particella.formData['ultimo-intervento'] || 'Non specificato';
                    anno = particella.formData['ultimo-intervento-anno'] || 'Non specificato';
                }

                // Get superficie particella from form data (calculated value) and format to 4 decimals
                let superficieParticella = 'Non specificata';
                if (particella.formData && particella.formData['superficie-particella']) {
                    const value = parseFloat(particella.formData['superficie-particella']);
                    superficieParticella = !isNaN(value) ? value.toFixed(4) : particella.formData['superficie-particella'];
                } else if (particella.superficie) {
                    const value = parseFloat(particella.superficie);
                    superficieParticella = !isNaN(value) ? value.toFixed(4) : particella.superficie; // fallback to old field
                }

                row.innerHTML = `
                    <td class="particella-name">${pfValue}</td>
                    <td class="particella-spf">${spfValue}</td>
                    <td class="particella-superficie">${superficieParticella}</td>
                    <td class="particella-specie">${specieName}</td>
                    <td class="particella-intervento">${interventoProgr}</td>
                    <td class="particella-anno">${anno}</td>
                    <td class="particella-actions">
                        <button class="action-btn edit-btn" onclick="editParticella(${index})" title="Modifica">✏️</button>
                        <button class="action-btn duplicate-btn" onclick="duplicateParticella(${index})" title="Duplica">📋</button>
                        <button class="action-btn delete-btn" onclick="deleteParticella(${index})" title="Elimina">🗑️</button>
                    </td>
                `;

                // Make row clickable (except for action buttons)
                row.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('action-btn')) {
                        this.editParticella(index);
                    }
                });

                tableBody.appendChild(row);
            });
        }
    }

    // ========================================
    // PARTICELLA MANAGEMENT
    // ========================================

    createNewParticella() {
        const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');
        const newParticella = {
            id: Date.now(),
            createdAt: new Date().toISOString(),
            localita: '',
            superficie: ''
        };

        // Store current particella index for editing
        localStorage.setItem('current-particella-index', particelleData.length.toString());
        particelleData.push(newParticella);
        localStorage.setItem('project-particelle', JSON.stringify(particelleData));

        // Navigate to form for editing the new particella
        this.showMainForm();
    }

    editParticella(index) {
        localStorage.setItem('current-particella-index', index.toString());
        this.showMainForm();
    }

    duplicateParticella(index) {
        const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');
        const originalParticella = particelleData[index];

        if (originalParticella) {
            // Create a deep copy to ensure complete independence
            const duplicatedParticella = {
                id: Date.now(),
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                localita: originalParticella.localita || '',
                superficie: originalParticella.superficie || '',
                // Deep copy the form data
                formData: originalParticella.formData ? JSON.parse(JSON.stringify(originalParticella.formData)) : {}
            };

            particelleData.push(duplicatedParticella);
            localStorage.setItem('project-particelle', JSON.stringify(particelleData));
            this.loadParticellaCards();

            // Show confirmation
            alert('Particella duplicata con successo!');
        }
    }

    deleteParticella(index) {
        if (confirm('Sei sicuro di voler eliminare questa particella?')) {
            const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');
            particelleData.splice(index, 1);
            localStorage.setItem('project-particelle', JSON.stringify(particelleData));
            this.loadParticellaCards();
        }
    }

    // ========================================
    // EVENT LISTENERS SETUP
    // ========================================

    setupPageManagement() {
        // Export methods to global scope for HTML onclick handlers
        window.deleteInfrastructureRow = this.deleteInfrastructureRow.bind(this);
        window.deleteSpeciesRow = this.deleteSpeciesRow.bind(this);
        window.deleteInterventionRow = this.deleteInterventionRow.bind(this);
        window.deleteCadastralRow = this.deleteCadastralRow.bind(this);
        window.formatText = this.formatText.bind(this);

        // Also expose edit functions for particella management
        window.editParticella = this.editParticella.bind(this);
        window.duplicateParticella = this.duplicateParticella.bind(this);
        window.deleteParticella = this.deleteParticella.bind(this);
    }

    setupEventListeners() {
        // Home page navigation
        this.safeAddEventListener('new-project-btn', 'click', () => {
            const modal = document.getElementById('project-modal');
            if (modal) modal.classList.remove('hidden');
        });

        this.safeAddEventListener('cancel-project-btn', 'click', () => {
            const modal = document.getElementById('project-modal');
            const form = document.getElementById('project-form');
            if (modal) modal.classList.add('hidden');
            if (form) form.reset();
        });

        this.safeAddEventListener('start-project-btn', 'click', () => {
            const form = document.getElementById('project-form');
            if (form && form.checkValidity()) {
                // Save project data
                const projectData = {
                    name: this.getElementValue('project-name'),
                    location: this.getElementValue('project-location'),
                    client: this.getElementValue('project-client'),
                    authority: this.getElementValue('project-authority'),
                    createdAt: new Date().toISOString()
                };

                localStorage.setItem('current-project', JSON.stringify(projectData));
                localStorage.setItem('project-' + Date.now(), JSON.stringify(projectData));

                // Close modal and show project page
                const modal = document.getElementById('project-modal');
                if (modal) modal.classList.add('hidden');
                this.showProjectPage();
            } else {
                alert('Compilare tutti i campi richiesti.');
            }
        });

        // Placeholder functions for other buttons
        this.safeAddEventListener('load-project-btn', 'click', () => {
            alert('Funzionalità "Carica progetto" in sviluppo');
        });

        this.safeAddEventListener('manage-projects-btn', 'click', () => {
            alert('Funzionalità "Gestione progetti" in sviluppo');
        });

        this.safeAddEventListener('settings-btn', 'click', () => {
            const modal = document.getElementById('settings-modal');
            if (modal) modal.classList.remove('hidden');
        });

        this.safeAddEventListener('guide-btn', 'click', () => {
            alert('Funzionalità "Guida" in sviluppo');
        });

        // Project page navigation
        this.safeAddEventListener('back-to-home-btn', 'click', () => {
            this.showHomePage();
        });

        this.safeAddEventListener('add-particella-btn', 'click', () => {
            this.createNewParticella();
        });

        // Add dynamic row functionality
        this.setupDynamicRowHandlers();

        // Setup form save functionality
        this.setupFormSave();

        // Setup settings modal
        this.setupSettingsModal();

        // Setup modal close on outside click
        this.setupModalCloseHandlers();
    }

    setupDynamicRowHandlers() {
        // Infrastructure addition
        this.safeAddEventListener('add-infrastruttura-btn', 'click', () => {
            this.addInfrastructureRow();
        });

        // Species addition
        this.safeAddEventListener('add-species', 'click', () => {
            this.addSpeciesRow();
        });

        // Intervention addition
        this.safeAddEventListener('add-intervention', 'click', () => {
            this.addInterventionRow();
        });

        // Cadastral addition
        this.safeAddEventListener('add-cadastral', 'click', () => {
            this.addCadastralRow();
        });
    }

    // ========================================
    // FORM VALIDATION SETUP
    // ========================================

    setupFormValidation() {
        // Basic form validation setup can be added here if needed
        console.log('Form validation setup completed');
    }

    // ========================================
    // DYNAMIC ROW MANAGEMENT
    // ========================================

    addInfrastructureRow() {
        const col1 = document.getElementById('infra-col-1');
        const col2 = document.getElementById('infra-col-2');
        const col3 = document.getElementById('infra-col-3');

        if (!col1 || !col2 || !col3) return;

        const col1Count = col1.children.length;
        const col2Count = col2.children.length;
        const col3Count = col3.children.length;
        const totalItems = col1Count + col2Count + col3Count;

        // Limit to 6 items maximum
        if (totalItems >= 6) {
            alert('Massimo 6 infrastrutture consentite');
            return;
        }

        let targetColumn;
        let showDeleteBtn = false;

        // Distribution logic: Items 1-2 in col1, 3-4 in col2, 5-6 in col3
        if (col1Count < 2) {
            targetColumn = col1;
            showDeleteBtn = totalItems >= 1; // Show delete for 2nd item and beyond
        } else if (col2Count < 2) {
            targetColumn = col2;
            showDeleteBtn = true;
        } else {
            targetColumn = col3;
            showDeleteBtn = true;
        }

        const newFieldGroup = document.createElement('div');
        newFieldGroup.className = 'field-group';
        newFieldGroup.innerHTML = `
            <div class="input-with-delete">
                <select name="viabilita-extra">
                    <option value="">Seleziona...</option>
                    <option value="Strada camionabile principale">Strada camionabile principale</option>
                    <option value="Strada camionabile secondaria">Strada camionabile secondaria</option>
                    <option value="Strada trattorabile">Strada trattorabile</option>
                    <option value="Pista camionabile">Pista camionabile</option>
                    <option value="Pista principale per trattori">Pista principale per trattori</option>
                    <option value="Pista secondaria per trattori">Pista secondaria per trattori</option>
                    <option value="Linee di esbosco">Linee di esbosco</option>
                    <option value="Imposto permanente">Imposto permanente</option>
                    <option value="Imposto temporaneo">Imposto temporaneo</option>
                </select>
                ${showDeleteBtn ? '<button type="button" class="delete-row-btn" onclick="deleteInfrastructureRow(this)" title="Elimina">✕</button>' : ''}
            </div>
        `;
        targetColumn.appendChild(newFieldGroup);
    }

    deleteInfrastructureRow(button) {
        const fieldGroup = button.closest('.field-group');
        if (fieldGroup) {
            fieldGroup.remove();
        }
    }

    addSpeciesRow() {
        const tbody = document.querySelector('.species-table tbody');
        if (!tbody) return;

        const newRow = tbody.insertRow();
        newRow.innerHTML = `
            <td>
                <select>
                    <option value="">Seleziona specie...</option>
                    <option value="Abete bianco (Abies alba)">Abete bianco <em>(Abies alba)</em></option>
                    <option value="Abete rosso (Picea abies)">Abete rosso <em>(Picea abies)</em></option>
                    <option value="Acero campestre (Acer campestre)">Acero campestre <em>(Acer campestre)</em></option>
                    <option value="Acero di monte (Acer pseudoplatanus)">Acero di monte <em>(Acer pseudoplatanus)</em></option>
                    <option value="Acero opalo (Acer opalus)">Acero opalo <em>(Acer opalus)</em></option>
                    <option value="Acero riccio (Acer lobelii)">Acero riccio <em>(Acer lobelii)</em></option>
                    <option value="Acero tribolo (Acer tataricum)">Acero tribolo <em>(Acer tataricum)</em></option>
                    <option value="Ailanto (Ailanthus altissima)">Ailanto <em>(Ailanthus altissima)</em></option>
                    <option value="Betulla (Betula pendula)">Betulla <em>(Betula pendula)</em></option>
                    <option value="Carpino bianco (Carpinus betulus)">Carpino bianco <em>(Carpinus betulus)</em></option>
                    <option value="Carpino nero (Ostrya carpinifolia)">Carpino nero <em>(Ostrya carpinifolia)</em></option>
                    <option value="Castagno (Castanea sativa)">Castagno <em>(Castanea sativa)</em></option>
                    <option value="Cedro dell'Atlante (Cedrus atlantica)">Cedro dell'Atlante <em>(Cedrus atlantica)</em></option>
                    <option value="Cedro deodara (Cedrus deodara)">Cedro deodara <em>(Cedrus deodara)</em></option>
                    <option value="Cedro del Libano (Cedrus libani)">Cedro del Libano <em>(Cedrus libani)</em></option>
                    <option value="Cerro (Quercus cerris)">Cerro <em>(Quercus cerris)</em></option>
                    <option value="Chamaecyparis (Chamaecyparis sp)">Chamaecyparis <em>(Chamaecyparis sp)</em></option>
                    <option value="Ciavardello (Quercus robur)">Ciavardello <em>(Quercus robur)</em></option>
                    <option value="Ciliegio (Prunus avium)">Ciliegio <em>(Prunus avium)</em></option>
                    <option value="Cipresso comune (Cupressus sempervirens)">Cipresso comune <em>(Cupressus sempervirens)</em></option>
                    <option value="Cipresso dell'Arizona (Cupressus arizonica)">Cipresso dell'Arizona <em>(Cupressus arizonica)</em></option>
                    <option value="Cipresso di Monterey (Cupressus macrocarpa)">Cipresso di Monterey <em>(Cupressus macrocarpa)</em></option>
                    <option value="Corbezzolo (Arbutus unedo)">Corbezzolo <em>(Arbutus unedo)</em></option>
                    <option value="Douglasia (Pseudotsuga menziesii)">Douglasia <em>(Pseudotsuga menziesii)</em></option>
                    <option value="Faggio (Fagus sylvatica)">Faggio <em>(Fagus sylvatica)</em></option>
                    <option value="Farnetto (Fraxinus ornus)">Farnetto <em>(Fraxinus ornus)</em></option>
                    <option value="Farnia (Fraxinus excelsior)">Farnia <em>(Fraxinus excelsior)</em></option>
                    <option value="Frassino maggiore (Fraxinus angustifolia)">Frassino maggiore <em>(Fraxinus angustifolia)</em></option>
                    <option value="Frassino ossifillo (Fraxinus oxycarpa)">Frassino ossifillo <em>(Fraxinus oxycarpa)</em></option>
                    <option value="Ippocastano (Aesculus hippocastanum)">Ippocastano <em>(Aesculus hippocastanum)</em></option>
                    <option value="Leccio (Quercus ilex)">Leccio <em>(Quercus ilex)</em></option>
                    <option value="Nocciolo (Corylus avellana)">Nocciolo <em>(Corylus avellana)</em></option>
                    <option value="Noce (Juglans regia)">Noce <em>(Juglans regia)</em></option>
                    <option value="Ontano bianco (Alnus incana)">Ontano bianco <em>(Alnus incana)</em></option>
                    <option value="Ontano napoletano (Alnus cordata)">Ontano napoletano <em>(Alnus cordata)</em></option>
                    <option value="Ontano nero (Alnus glutinosa)">Ontano nero <em>(Alnus glutinosa)</em></option>
                    <option value="Orniello (Fraxinus ornus)">Orniello <em>(Fraxinus ornus)</em></option>
                    <option value="Pino d'Aleppo (Pinus halepensis)">Pino d'Aleppo <em>(Pinus halepensis)</em></option>
                    <option value="Pino domestico (Pinus pinea)">Pino domestico <em>(Pinus pinea)</em></option>
                    <option value="Pino insigne (Pinus radiata)">Pino insigne <em>(Pinus radiata)</em></option>
                    <option value="Pino loricato (Pinus heldreichii)">Pino loricato <em>(Pinus heldreichii)</em></option>
                    <option value="Pino marittimo (Pinus pinaster)">Pino marittimo <em>(Pinus pinaster)</em></option>
                    <option value="Pino nero (Pinus nigra)">Pino nero <em>(Pinus nigra)</em></option>
                    <option value="Pino silvestre (Pinus sylvestris)">Pino silvestre <em>(Pinus sylvestris)</em></option>
                    <option value="Pioppo bianco (Populus alba)">Pioppo bianco <em>(Populus alba)</em></option>
                    <option value="Pioppo cinerino (Populus cinerea)">Pioppo cinerino <em>(Populus cinerea)</em></option>
                    <option value="Pioppo nero (Populus nigra)">Pioppo nero <em>(Populus nigra)</em></option>
                    <option value="Pioppo tremulo (Populus tremula)">Pioppo tremulo <em>(Populus tremula)</em></option>
                    <option value="Robinia (Robinia pseudoacacia)">Robinia <em>(Robinia pseudoacacia)</em></option>
                    <option value="Rovere (Quercus robur)">Rovere <em>(Quercus robur)</em></option>
                    <option value="Roverella (Quercus petraea)">Roverella <em>(Quercus petraea)</em></option>
                    <option value="Salice (Salix spp)">Salice <em>(Salix spp)</em></option>
                    <option value="Sorbo degli uccellatori (Sorbus aucuparia)">Sorbo degli uccellatori <em>(Sorbus aucuparia)</em></option>
                    <option value="Sorbo domestico (Sorbus domestica)">Sorbo domestico <em>(Sorbus domestica)</em></option>
                    <option value="Sughera (Quercus suber)">Sughera <em>(Quercus suber)</em></option>
                    <option value="Tasso (Taxus baccata)">Tasso <em>(Taxus baccata)</em></option>
                    <option value="Thuja (Thuja occidentalis)">Thuja <em>(Thuja occidentalis)</em></option>
                    <option value="Tiglio (Tilia cordata)">Tiglio <em>(Tilia cordata)</em></option>
                </select>
            </td>
            <td><input type="number" step="1" max="99" class="no-spinner"></td>
            <td><input type="number" step="1" max="999" class="no-spinner diameter-field"></td>
            <td><input type="number" step="1" max="999" class="no-spinner height-field"></td>
            <td><input type="number" step="0.01" max="9999.99" readonly class="calculated-field volume-field"></td>
            <td><input type="number" step="0.01" readonly class="calculated-field volume-per-hectare-field"></td>
            <td><button type="button" class="delete-row-btn" onclick="deleteSpeciesRow(this)">🗑️</button></td>
        `;

        // Add calculation listeners to the new row
        this.addCalculationListenersToSpeciesRow(newRow);
    }

    addCalculationListenersToSpeciesRow(row) {
        const diameterField = row.querySelector('.diameter-field');
        const heightField = row.querySelector('.height-field');
        const volumeField = row.querySelector('.volume-field');
        const percentageField = row.querySelector('td:nth-child(2) input');

        console.log('Row elements:', {
            diameterField,
            heightField,
            volumeField,
            percentageField,
            calculationModule: window.calculationModule
        });

        if (diameterField && heightField && volumeField && percentageField && window.calculationModule) {
            const updateVolume = () => {
                console.log('Updating volume for row...');
                window.calculationModule.calculateVolume(diameterField, heightField, volumeField);
            };

            const validateAndUpdateVolume = () => {
                console.log('Validating and updating volume for row...');
                // Validate percentage first
                if (window.calculationModule) {
                    window.calculationModule.validateTotalPercentage();
                }
                window.calculationModule.calculateVolume(diameterField, heightField, volumeField);
            };

            diameterField.addEventListener('input', updateVolume);
            heightField.addEventListener('input', updateVolume);
            percentageField.addEventListener('input', validateAndUpdateVolume);

            console.log('Listeners added successfully to species row');
        } else {
            console.error('Failed to add listeners - missing elements or calculationModule');
        }
    }

    deleteSpeciesRow(button) {
        const row = button.closest('tr');
        if (row) {
            row.remove();
            // Trigger recalculations after row deletion
            if (window.calculationModule) {
                window.calculationModule.calculateTotalVolume();
                window.calculationModule.calculateImd();
                window.calculationModule.calculateImh();
                window.calculationModule.calculateImv();
            }
        }
    }

    addInterventionRow() {
        const tbody = document.querySelector('.intervention-table tbody');
        if (!tbody) return;

        const newRow = tbody.insertRow();
        newRow.innerHTML = `
            <td>
                <select>
                    <option value="">Seleziona intervento...</option>
                    <option value="Diradamento selettivo">Diradamento selettivo</option>
                    <option value="Taglio a scelta">Taglio a scelta</option>
                    <option value="Taglio del ceduo semplice">Taglio del ceduo semplice</option>
                </select>
            </td>
            <td><input type="number" step="0.0001" max="999.9999" class="intervention-superficie-field"></td>
            <td><input type="number" min="1900" max="2050" class="intervention-anno-field"></td>
            <td><input type="number" readonly class="calculated-field intervention-eta-field"></td>
            <td><input type="number" step="0.01" max="9999.99" readonly class="calculated-field intervention-provv-field"></td>
            <td><input type="number" step="0.01" max="9999.99" readonly class="calculated-field intervention-ripresa-field"></td>
            <td><button type="button" class="delete-row-btn" onclick="deleteInterventionRow(this)">🗑️</button></td>
        `;

        // Add calculation listeners to the new row
        this.addCalculationListenersToInterventionRow(newRow);
    }

    addCalculationListenersToInterventionRow(row) {
        const annoInterventoField = row.querySelector('.intervention-anno-field');
        const superficieInterventoField = row.querySelector('.intervention-superficie-field');

        if (annoInterventoField && window.calculationModule) {
            annoInterventoField.addEventListener('input', () => {
                window.calculationModule.calculateInterventionEta();
                window.calculationModule.calculateInterventionProvv();
                window.calculationModule.calculateInterventionRipresa();
            });
        }

        if (superficieInterventoField && window.calculationModule) {
            superficieInterventoField.addEventListener('input', () => {
                window.calculationModule.calculateInterventionRipresa();
            });

            // Add formatting listeners for superficie field
            superficieInterventoField.addEventListener('input', (e) => {
                const value = e.target.value;
                const sanitized = value.replace(/[^0-9.,]/g, '');
                if (sanitized !== value) {
                    e.target.value = sanitized;
                }
            });

            superficieInterventoField.addEventListener('blur', () => {
                console.log('Intervention superficie field blur event triggered');
                if (window.calculationModule) {
                    console.log('Calling validateAndFormatDecimals for intervention field');
                    window.calculationModule.validateAndFormatDecimals(superficieInterventoField);
                } else {
                    console.error('calculationModule not available');
                }
            });
        }
    }

    deleteInterventionRow(button) {
        const row = button.closest('tr');
        if (row) {
            row.remove();
            // Trigger recalculations after row deletion
            if (window.calculationModule) {
                window.calculationModule.calculateInterventionEta();
                window.calculationModule.calculateInterventionProvv();
                window.calculationModule.calculateInterventionRipresa();
            }
        }
    }

    addCadastralRow() {
        const leftTbody = document.getElementById('cadastral-left-tbody');
        const rightTbody = document.getElementById('cadastral-right-tbody');

        if (!leftTbody || !rightTbody) return;

        const leftRowCount = leftTbody.children.length;
        const rightRowCount = rightTbody.children.length;
        const totalRows = leftRowCount + rightRowCount;

        let targetTbody;
        let showDeleteBtn = false;

        if (leftRowCount < 4) {
            targetTbody = leftTbody;
            showDeleteBtn = totalRows >= 1;
        } else {
            targetTbody = rightTbody;
            showDeleteBtn = true;
        }

        const newRow = targetTbody.insertRow();
        newRow.innerHTML = `
            <td><input type="text"></td>
            <td><input type="text"></td>
            <td><input type="text"></td>
            <td><input type="number" step="0.01" class="cadastral-superficie-field"></td>
            ${showDeleteBtn ? '<td><button type="button" class="delete-row-btn" onclick="deleteCadastralRow(this)">🗑️</button></td>' : '<td></td>'}
        `;

        // Add validation and formatting listeners to the new superficie field
        const newSuperficieField = newRow.querySelector('.cadastral-superficie-field');
        if (newSuperficieField) {
            // Add input listener for real-time validation
            newSuperficieField.addEventListener('input', (e) => {
                const value = e.target.value;
                const sanitized = value.replace(/[^0-9.,]/g, '');
                if (sanitized !== value) {
                    e.target.value = sanitized;
                }
                // Trigger validation
                if (window.calculationModule) {
                    window.calculationModule.validateCadastralSuperficie();
                }
            });

            // Add blur listener for final formatting
            newSuperficieField.addEventListener('blur', () => {
                console.log('Cadastral superficie field blur event triggered');
                if (window.calculationModule) {
                    console.log('Calling validateAndFormatDecimals for cadastral field');
                    window.calculationModule.validateAndFormatDecimals(newSuperficieField);
                } else {
                    console.error('calculationModule not available');
                }
            });
        }
    }

    deleteCadastralRow(button) {
        const row = button.closest('tr');
        if (row) {
            row.remove();
            // Trigger validation after row deletion
            if (window.calculationModule) {
                setTimeout(() => {
                    window.calculationModule.validateCadastralSuperficie();
                }, 10);
            }
        }
    }

    // ========================================
    // FORM AND SETTINGS
    // ========================================

    setupFormSave() {
        this.safeAddEventListener('save-btn', 'click', () => {
            const form = document.getElementById('forestry-form');
            if (form) {
                const formData = new FormData(form);
                const data = Object.fromEntries(formData);
                localStorage.setItem('forestry-survey-' + Date.now(), JSON.stringify(data));
                alert('Dati salvati con successo!');
            }
        });

        // Auto-save every 30 seconds
        setInterval(() => {
            const particellaIndex = localStorage.getItem('current-particella-index');
            if (particellaIndex !== null) {
                const form = document.getElementById('forestry-form');
                if (form) {
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData);

                    const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');
                    if (particelleData[parseInt(particellaIndex)]) {
                        particelleData[parseInt(particellaIndex)] = {
                            ...particelleData[parseInt(particellaIndex)],
                            formData: data,
                            lastModified: new Date().toISOString()
                        };
                        localStorage.setItem('project-particelle', JSON.stringify(particelleData));
                        console.log('Auto-saved data for particella index:', particellaIndex);
                    }
                }
            }
        }, 30000);
    }

    setupSettingsModal() {
        // Settings modal event listeners
        this.safeAddEventListener('cancel-settings-btn', 'click', () => {
            const modal = document.getElementById('settings-modal');
            if (modal) modal.classList.add('hidden');
        });

        this.safeAddEventListener('save-settings-btn', 'click', () => {
            // Save header and footer content to localStorage
            const headerEditor = document.getElementById('header-editor');
            const footerEditor = document.getElementById('footer-editor');

            if (headerEditor && footerEditor) {
                const headerContent = headerEditor.innerHTML;
                const footerContent = footerEditor.innerHTML;

                localStorage.setItem('print-header-content', headerContent);
                localStorage.setItem('print-footer-content', footerContent);

                // Apply to current page
                this.applyHeaderFooter();

                // Close modal
                const modal = document.getElementById('settings-modal');
                if (modal) modal.classList.add('hidden');

                alert('Impostazioni Header/Footer salvate!');
            }
        });

        // Settings tabs functionality
        const settingsTabs = document.querySelectorAll('.settings-tab');
        settingsTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active from all tabs and contents
                document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.settings-content').forEach(c => c.classList.remove('active'));

                // Add active to clicked tab
                e.target.classList.add('active');

                // Show corresponding content
                const targetTab = e.target.dataset.tab;
                const targetContent = document.getElementById(targetTab + '-settings');
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    setupModalCloseHandlers() {
        // Close modals when clicking outside
        this.safeAddEventListener('project-modal', 'click', (e) => {
            if (e.target.id === 'project-modal') {
                e.target.classList.add('hidden');
                const form = document.getElementById('project-form');
                if (form) form.reset();
            }
        });

        this.safeAddEventListener('settings-modal', 'click', (e) => {
            if (e.target.id === 'settings-modal') {
                e.target.classList.add('hidden');
            }
        });
    }

    // Rich text editor formatting functions
    formatText(command, value = null) {
        document.execCommand(command, false, value);
    }

    // Load saved header/footer content on page load
    loadHeaderFooterSettings() {
        const savedHeader = localStorage.getItem('print-header-content');
        const savedFooter = localStorage.getItem('print-footer-content');

        const headerEditor = document.getElementById('header-editor');
        const footerEditor = document.getElementById('footer-editor');

        if (savedHeader && headerEditor) {
            headerEditor.innerHTML = savedHeader;
        }

        if (savedFooter && footerEditor) {
            footerEditor.innerHTML = savedFooter;
        }

        // Apply to current page
        this.applyHeaderFooter();
    }

    // Apply header and footer to the form page
    applyHeaderFooter() {
        const headerContent = localStorage.getItem('print-header-content');
        const footerContent = localStorage.getItem('print-footer-content');

        const headerElement = document.querySelector('.print-header-content');
        const footerElement = document.querySelector('.print-footer-content');

        if (headerContent && headerElement) {
            headerElement.innerHTML = headerContent;
        }

        if (footerContent && footerElement) {
            footerElement.innerHTML = footerContent;
        }
    }

    // ========================================
    // SETUP EXISTING ROW LISTENERS
    // ========================================

    setupExistingRowListeners() {
        // Wait for DOM to be fully loaded
        setTimeout(() => {
            console.log('Setting up existing row listeners...');

            // Setup listeners for existing species rows
            const speciesTable = document.querySelector('.species-table tbody');
            console.log('Species table found:', speciesTable);

            if (speciesTable) {
                const existingRows = speciesTable.querySelectorAll('tr');
                console.log('Found', existingRows.length, 'existing species rows');

                existingRows.forEach((row, index) => {
                    console.log(`Setting up listeners for species row ${index}`);
                    this.addCalculationListenersToSpeciesRow(row);
                });
            } else {
                console.warn('Species table not found!');
            }

            // Setup listeners for existing intervention rows
            const interventionTable = document.querySelector('.intervention-table tbody');
            if (interventionTable) {
                const existingRows = interventionTable.querySelectorAll('tr');
                existingRows.forEach(row => {
                    this.addCalculationListenersToInterventionRow(row);
                });
            }

            // Setup listeners for existing cadastral fields
            const cadastralFields = document.querySelectorAll('.cadastral-superficie-field');
            cadastralFields.forEach(field => {
                // Add input listener for real-time validation
                field.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const sanitized = value.replace(/[^0-9.,]/g, '');
                    if (sanitized !== value) {
                        e.target.value = sanitized;
                    }
                    // Trigger validation
                    if (window.calculationModule) {
                        window.calculationModule.validateCadastralSuperficie();
                    }
                });

                // Add blur listener for final formatting
                field.addEventListener('blur', () => {
                    if (window.calculationModule) {
                        window.calculationModule.validateAndFormatDecimals(field);
                    }
                });
            });

            // Setup listeners for existing intervention superficie fields
            const interventionSuperficieFields = document.querySelectorAll('.intervention-superficie-field');
            interventionSuperficieFields.forEach(field => {
                // Add input listener for real-time validation
                field.addEventListener('input', (e) => {
                    const value = e.target.value;
                    const sanitized = value.replace(/[^0-9.,]/g, '');
                    if (sanitized !== value) {
                        e.target.value = sanitized;
                    }
                });

                // Add blur listener for final formatting
                field.addEventListener('blur', () => {
                    if (window.calculationModule) {
                        window.calculationModule.validateAndFormatDecimals(field);
                    }
                });
            });

            // Setup listeners for global fields that affect calculations
            this.setupGlobalCalculationListeners();

            // Trigger initial calculations if there's already data
            this.triggerInitialCalculations();

            console.log('Existing row listeners setup completed');
        }, 500); // Increased timeout to give more time for DOM
    }

    setupGlobalCalculationListeners() {
        // Function to update all species volumes when global fields change
        const updateAllSpeciesVolumes = () => {
            const speciesTable = document.querySelector('.species-table tbody');
            if (speciesTable && window.calculationModule) {
                const speciesRows = speciesTable.querySelectorAll('tr');
                speciesRows.forEach(row => {
                    const diameterField = row.querySelector('.diameter-field');
                    const heightField = row.querySelector('.height-field');
                    const volumeField = row.querySelector('.volume-field');

                    if (diameterField && heightField && volumeField) {
                        window.calculationModule.calculateVolume(diameterField, heightField, volumeField);
                    }
                });
            }
        };

        // Add listeners to global fields that affect all species calculations
        const pianteEttaroField = document.getElementById('piante-ettaro');
        const superficieSottoField = document.getElementById('superficie-sottoparticella');
        const etaField = document.getElementById('eta-soprassuolo');
        const annoRilievoField = document.getElementById('anno-rilievo');
        const intensitaInterventoField = document.getElementById('intensita-intervento');

        if (pianteEttaroField) {
            pianteEttaroField.addEventListener('input', updateAllSpeciesVolumes);
        }

        if (superficieSottoField) {
            superficieSottoField.addEventListener('input', function() {
                updateAllSpeciesVolumes();
                if (window.calculationModule) {
                    window.calculationModule.calculateInterventionProvv();
                    window.calculationModule.validateCadastralSuperficie();
                }
            });
        }

        if (etaField) {
            etaField.addEventListener('input', function() {
                if (window.calculationModule) {
                    window.calculationModule.calculateImd();
                    window.calculationModule.calculateImh();
                    window.calculationModule.calculateImv();
                    window.calculationModule.calculateInterventionEta();
                    window.calculationModule.calculateInterventionProvv();
                    window.calculationModule.calculateInterventionRipresa();
                }
            });
        }

        if (annoRilievoField) {
            annoRilievoField.addEventListener('input', function() {
                if (window.calculationModule) {
                    window.calculationModule.calculateInterventionEta();
                    window.calculationModule.calculateInterventionProvv();
                }
            });
        }

        if (intensitaInterventoField) {
            intensitaInterventoField.addEventListener('input', function() {
                if (window.calculationModule) {
                    window.calculationModule.calculateInterventionProvv();
                }
            });
        }
    }

    triggerInitialCalculations() {
        if (!window.calculationModule) return;

        // Trigger volume calculations for all existing species rows
        const speciesTable = document.querySelector('.species-table tbody');
        if (speciesTable) {
            const speciesRows = speciesTable.querySelectorAll('tr');
            speciesRows.forEach(row => {
                const diameterField = row.querySelector('.diameter-field');
                const heightField = row.querySelector('.height-field');
                const volumeField = row.querySelector('.volume-field');

                if (diameterField && heightField && volumeField) {
                    // Only calculate if there are values
                    if (diameterField.value || heightField.value) {
                        window.calculationModule.calculateVolume(diameterField, heightField, volumeField);
                    }
                }
            });
        }

        // Trigger initial index calculations
        window.calculationModule.calculateImd();
        window.calculationModule.calculateImh();
        window.calculationModule.calculateImv();

        // Trigger initial intervention calculations
        window.calculationModule.calculateInterventionEta();
        window.calculationModule.calculateInterventionProvv();
        window.calculationModule.calculateInterventionRipresa();

        console.log('Initial calculations triggered');
    }

    // ========================================
    // UTILITY METHODS
    // ========================================

    safeAddEventListener(elementId, event, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.warn(`Element with ID '${elementId}' not found`);
        }
    }

    getElementValue(elementId) {
        const element = document.getElementById(elementId);
        return element ? element.value : '';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ForestModule;
}