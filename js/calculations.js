// DBForestale - Calculation Module
// Handles all mathematical calculations for forest assessment

class CalculationModule {
    constructor() {
        // Don't setup listeners in constructor - let main app control this
    }

    // ========================================
    // VALIDATION AND FORMATTING
    // ========================================

    validateAndFormatDecimals(inputElement) {
        console.log('validateAndFormatDecimals called with:', inputElement, 'value:', inputElement.value);

        const value = inputElement.value;
        if (value && value.trim() !== '') {
            // Replace comma with dot for European decimal format
            const normalizedValue = value.replace(',', '.');
            const numValue = parseFloat(normalizedValue);

            console.log('Normalized value:', normalizedValue, 'Parsed number:', numValue);

            if (!isNaN(numValue) && numValue >= 0 && numValue <= 999.9999) {
                // Always format to 4 decimal places
                const formattedValue = numValue.toFixed(4);
                inputElement.value = formattedValue;
                console.log('Formatted to:', formattedValue);
            } else {
                console.log('Invalid value, showing alert');
                alert('Inserire un valore numerico valido tra 0 e 999.9999');
                inputElement.focus();
            }
        } else {
            console.log('Empty or whitespace value, skipping formatting');
        }
    }

    // ========================================
    // AUTOMATIC CALCULATIONS
    // ========================================

    setupAutomaticCalculations() {
        const pfInput = document.getElementById('particella');
        const spfInput = document.getElementById('sottoparticella');
        const chiaveDbInput = document.getElementById('chiave-db');
        const superficieSottoparticellaInput = document.getElementById('superficie-sottoparticella');
        const superficieParticellaInput = document.getElementById('superficie-particella');

        console.log('PF Input:', pfInput);
        console.log('SPF Input:', spfInput);
        console.log('Chiave DB Input:', chiaveDbInput);
        console.log('Superficie Sottoparticella Input:', superficieSottoparticellaInput);
        console.log('Superficie Particella Input:', superficieParticellaInput);

        const calculateChiaveDb = () => {
            if (!pfInput || !spfInput || !chiaveDbInput) return;
            const pfValue = pfInput.value.trim();
            const spfValue = spfInput.value.trim();
            const concatenated = pfValue + spfValue;
            console.log('Calculating chiave db:', pfValue, '+', spfValue, '=', concatenated);
            chiaveDbInput.value = concatenated;
            console.log('Chiave DB updated to:', concatenated);
        };

        const calculateSuperficieParticella = () => {
            if (!pfInput || !superficieParticellaInput) return;
            const currentPF = pfInput.value.trim();
            if (!currentPF) {
                superficieParticellaInput.value = '';
                return;
            }

            // Calculate total for this PF and update current form
            const totalSuperficie = this.calculateTotalSuperficieForPF(currentPF);
            if (totalSuperficie > 0) {
                const formattedValue = totalSuperficie.toFixed(4);
                superficieParticellaInput.value = formattedValue;
                console.log('Setting superficie particella for PF', currentPF, ':', formattedValue);
            } else {
                superficieParticellaInput.value = '';
            }
        };

        const handlePFSPFChange = () => {
            calculateChiaveDb();
            this.loadSuperficieSottoparticella();
            calculateSuperficieParticella();
        };

        const handleSuperficieChange = () => {
            calculateSuperficieParticella();

            // Save current form data before updating all particelle
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
                        console.log('Saved current form data before superficie update');
                    }
                }
            }

            this.updateAllParticelleSuperficie();
        };

        if (pfInput && spfInput && chiaveDbInput && superficieSottoparticellaInput && superficieParticellaInput) {
            pfInput.addEventListener('input', handlePFSPFChange);
            spfInput.addEventListener('input', handlePFSPFChange);
            superficieSottoparticellaInput.addEventListener('input', handleSuperficieChange);

            handlePFSPFChange();
            console.log('Event listeners added successfully');
        } else {
            console.error('Could not find required input elements');
        }
    }

    calculateTotalSuperficieForPF(targetPF) {
        const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');
        let totalSuperficie = 0;

        console.log('=== DEBUG: Calculating total for PF:', targetPF, '===');

        // Get current form's PF+SPF combination to exclude it from saved data
        const pfInput = document.getElementById('particella');
        const spfInput = document.getElementById('sottoparticella');
        const superficieSottoparticellaInput = document.getElementById('superficie-sottoparticella');

        if (!pfInput || !spfInput || !superficieSottoparticellaInput) return 0;

        const currentPF = pfInput.value.trim();
        const currentSPF = spfInput.value.trim();
        const currentParticellaIndex = localStorage.getItem('current-particella-index');
        const currentIndex = currentParticellaIndex ? parseInt(currentParticellaIndex) : -1;

        console.log(`Current editing: PF=${currentPF}, SPF=${currentSPF}, Index=${currentIndex}`);

        // Sum all superficie sottoparticella values for the same PF (excluding current)
        particelleData.forEach((particella, index) => {
            if (particella.formData) {
                const particellaPF = particella.formData['particella'];
                const particellaSPF = particella.formData['sottoparticella'];
                const superficieSottoRaw = particella.formData['superficie-sottoparticella'];
                const superficieSotto = parseFloat(superficieSottoRaw) || 0;

                console.log(`Particella ${index}: PF=${particellaPF}, SPF=${particellaSPF}, Superficie=${superficieSottoRaw} -> ${superficieSotto}`);

                // Skip if this is the current particella being edited
                if (index === currentIndex) {
                    console.log(`  -> SKIPPED (current particella being edited)`);
                    return;
                }

                if (particellaPF === targetPF && superficieSotto > 0) {
                    totalSuperficie += superficieSotto;
                    console.log(`  -> Added ${superficieSotto}, running total: ${totalSuperficie}`);
                }
            }
        });

        // Add current form's superficie sottoparticella if it matches the target PF
        const currentSuperficieSottoRaw = superficieSottoparticellaInput.value;
        const currentSuperficieSotto = parseFloat(currentSuperficieSottoRaw) || 0;

        console.log(`Current form: PF=${currentPF}, SPF=${currentSPF}, Superficie=${currentSuperficieSottoRaw} -> ${currentSuperficieSotto}`);

        if (currentPF === targetPF && currentSuperficieSotto > 0) {
            totalSuperficie += currentSuperficieSotto;
            console.log(`  -> Added current form ${currentSuperficieSotto}, final total: ${totalSuperficie}`);
        }

        console.log('=== FINAL TOTAL:', totalSuperficie, '===');
        return totalSuperficie;
    }

    // ========================================
    // VOLUME CALCULATIONS
    // ========================================

    calculateVolume(diameterField, heightField, volumeField) {
        console.log('calculateVolume called with:', { diameterField, heightField, volumeField });

        const diameter = parseFloat(diameterField.value) || 0; // d in cm
        const height = parseFloat(heightField.value) || 0; // h in m

        console.log('Input values:', { diameter, height });

        // Get the percentage from the same row (second column)
        const row = diameterField.closest('tr');
        const percentageField = row.querySelector('td:nth-child(2) input');
        const percentage = parseFloat(percentageField.value) || 0; // % as integer (e.g., 50 for 50%)

        console.log('Percentage and row:', { percentage, row, percentageField });

        // Get volume per hectare field from the same row (sixth column)
        const volumePerHectareField = row.querySelector('.volume-per-hectare-field');

        // Get piante ad ettaro from the form
        const piantePinInput = document.getElementById('piante-ettaro');
        const pianteEttaro = parseFloat(piantePinInput ? piantePinInput.value : 0) || 0;

        // Get superficie sottoparticella from the form
        const superficieInput = document.getElementById('superficie-sottoparticella');
        const superficieSotto = parseFloat(superficieInput ? superficieInput.value : 0) || 0;

        if (diameter > 0 && height > 0 && percentage > 0 && pianteEttaro > 0) {
            // Base volume formula: ((π/4) × d²) × h × 0.5
            // d needs to be converted from cm to m: d/100
            const diameterInMeters = diameter / 100;
            const baseVolume = ((Math.PI / 4) * Math.pow(diameterInMeters, 2)) * height * 0.5;

            // Volume per hectare formula: baseVolume × (pianteEttaro × (percentage/100))
            const volumePerHectare = baseVolume * (pianteEttaro * (percentage / 100));

            // Set volume per hectare
            if (volumePerHectareField) {
                volumePerHectareField.value = volumePerHectare.toFixed(2);
            }

            // Total volume formula: volumePerHectare × superficieSotto
            if (superficieSotto > 0) {
                const totalVolume = volumePerHectare * superficieSotto;
                volumeField.value = totalVolume.toFixed(2);
            } else {
                volumeField.value = '';
            }
        } else {
            volumeField.value = '';
            if (volumePerHectareField) {
                volumePerHectareField.value = '';
            }
        }

        // Update total volume after individual volume calculation
        this.calculateTotalVolume();

        // Update all indices after changes
        this.calculateImd();
        this.calculateImh();
        this.calculateImv();

        // Update intervention calculations after volume changes
        this.calculateInterventionEta();
        this.calculateInterventionProvv();
        this.calculateInterventionRipresa();
    }

    calculateTotalVolume() {
        const speciesTable = document.querySelector('.species-table tbody');
        if (!speciesTable) return;

        const rows = speciesTable.querySelectorAll('tr');
        let totalVolume = 0;

        // Sum all individual species volumes
        rows.forEach(row => {
            const volumeField = row.querySelector('.volume-field');
            if (volumeField && volumeField.value) {
                const volume = parseFloat(volumeField.value) || 0;
                totalVolume += volume;
            }
        });

        // Update the Volume totale field
        const volumeTotaleField = document.getElementById('volume-totale');
        if (volumeTotaleField) {
            volumeTotaleField.value = totalVolume > 0 ? totalVolume.toFixed(2) : '';
        }
    }

    // ========================================
    // INDEX CALCULATIONS (Imd, Imh, Imv)
    // ========================================

    calculateImd() {
        const speciesTable = document.querySelector('.species-table tbody');
        const etaField = document.getElementById('eta-soprassuolo');
        const imdField = document.getElementById('imd');

        if (!speciesTable || !etaField || !imdField) return;

        const eta = parseFloat(etaField.value) || 0;

        if (eta <= 0) {
            imdField.value = '';
            return;
        }

        // Find the maximum diameter from all species rows
        const diameterFields = speciesTable.querySelectorAll('.diameter-field');
        let maxDiameter = 0;

        diameterFields.forEach(field => {
            const diameter = parseFloat(field.value) || 0;
            if (diameter > maxDiameter) {
                maxDiameter = diameter;
            }
        });

        if (maxDiameter > 0) {
            // Imd = max diameter (in cm) / età (in years)
            const imd = maxDiameter / eta;
            imdField.value = imd.toFixed(2);
        } else {
            imdField.value = '';
        }
    }

    calculateImh() {
        const speciesTable = document.querySelector('.species-table tbody');
        const etaField = document.getElementById('eta-soprassuolo');
        const imhField = document.getElementById('imh');

        if (!speciesTable || !etaField || !imhField) return;

        const eta = parseFloat(etaField.value) || 0;

        if (eta <= 0) {
            imhField.value = '';
            return;
        }

        // Find the maximum height from all species rows
        const heightFields = speciesTable.querySelectorAll('.height-field');
        let maxHeight = 0;

        heightFields.forEach(field => {
            const height = parseFloat(field.value) || 0;
            if (height > maxHeight) {
                maxHeight = height;
            }
        });

        if (maxHeight > 0) {
            // Imh = max height (in m) / età (in years)
            const imh = maxHeight / eta;
            imhField.value = imh.toFixed(2);
        } else {
            imhField.value = '';
        }
    }

    calculateImv() {
        const etaField = document.getElementById('eta-soprassuolo');
        const imvField = document.getElementById('imv');
        const volumeTotaleField = document.getElementById('volume-totale');

        if (!etaField || !imvField || !volumeTotaleField) return;

        const eta = parseFloat(etaField.value) || 0;
        const totalVolume = parseFloat(volumeTotaleField.value) || 0;

        if (eta <= 0) {
            imvField.value = '';
            return;
        }

        if (totalVolume > 0) {
            // Imv = total volume (mc) / età (in years)
            const imv = totalVolume / eta;
            imvField.value = imv.toFixed(2);
        } else {
            imvField.value = '';
        }
    }

    // ========================================
    // MISSING METHODS
    // ========================================

    updateAllParticelleSuperficie() {
        const pfInput = document.getElementById('particella');
        if (!pfInput) return;

        // Get current data to determine which PFs need updating
        const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');
        const pfToUpdate = new Set();

        // Find all unique PF values that need updating
        particelleData.forEach(particella => {
            if (particella.formData && particella.formData['particella']) {
                pfToUpdate.add(particella.formData['particella']);
            }
        });

        // Also add current form's PF
        const currentPF = pfInput.value.trim();
        if (currentPF) {
            pfToUpdate.add(currentPF);
        }

        // Update all particelle data with new superficie particella values
        let dataChanged = false;
        particelleData.forEach(particella => {
            if (particella.formData && particella.formData['particella']) {
                const particellaPF = particella.formData['particella'];
                if (pfToUpdate.has(particellaPF)) {
                    const newTotal = this.calculateTotalSuperficieForPF(particellaPF);
                    const newValue = newTotal > 0 ? newTotal.toFixed(4) : '';

                    if (particella.formData['superficie-particella'] !== newValue) {
                        particella.formData['superficie-particella'] = newValue;
                        dataChanged = true;
                    }
                }
            }
        });

        // Save updated data if changes were made
        if (dataChanged) {
            localStorage.setItem('project-particelle', JSON.stringify(particelleData));
            console.log('Updated all particelle superficie values');

            // Refresh the particelle table if forestModule is available
            if (window.forestModule && typeof window.forestModule.loadParticellaCards === 'function') {
                window.forestModule.loadParticellaCards();
                console.log('Refreshed particelle table in background');
            }
        }
    }

    loadSuperficieSottoparticella() {
        const pfInput = document.getElementById('particella');
        const spfInput = document.getElementById('sottoparticella');
        const superficieSottoparticellaInput = document.getElementById('superficie-sottoparticella');

        if (!pfInput || !spfInput || !superficieSottoparticellaInput) return;

        const currentPF = pfInput.value.trim();
        const currentSPF = spfInput.value.trim();

        if (!currentPF || !currentSPF) {
            return;
        }

        // Look for existing data for this PF+SPF combination
        const particelleData = JSON.parse(localStorage.getItem('project-particelle') || '[]');

        for (let particella of particelleData) {
            if (particella.formData) {
                const particellaPF = particella.formData['particella'];
                const particellaSPF = particella.formData['sottoparticella'];

                if (particellaPF === currentPF && particellaSPF === currentSPF) {
                    const savedSuperficie = particella.formData['superficie-sottoparticella'];
                    if (savedSuperficie && !superficieSottoparticellaInput.value) {
                        superficieSottoparticellaInput.value = savedSuperficie;
                        console.log('Loaded existing superficie sottoparticella:', savedSuperficie);
                        break;
                    }
                }
            }
        }
    }

    // ========================================
    // INTERVENTION CALCULATIONS
    // ========================================

    calculateInterventionEta() {
        const annoRilievoField = document.getElementById('anno-rilievo');
        const etaSoprassuoloField = document.getElementById('eta-soprassuolo');
        const interventionTable = document.querySelector('.intervention-table tbody');

        if (!annoRilievoField || !etaSoprassuoloField || !interventionTable) return;

        const annoRilievo = parseFloat(annoRilievoField.value) || 0;
        const etaSoprassuolo = parseFloat(etaSoprassuoloField.value) || 0;

        // Calculate for all intervention rows
        const interventionRows = interventionTable.querySelectorAll('tr');
        interventionRows.forEach(row => {
            const annoInterventoField = row.querySelector('.intervention-anno-field');
            const etaInterventoField = row.querySelector('.intervention-eta-field');

            if (annoInterventoField && etaInterventoField) {
                const annoIntervento = parseFloat(annoInterventoField.value) || 0;

                if (annoIntervento > 0 && annoRilievo > 0 && etaSoprassuolo >= 0) {
                    // Formula: (anno intervento - anno rilievo) + età soprassuolo
                    const etaIntervento = (annoIntervento - annoRilievo) + etaSoprassuolo;
                    etaInterventoField.value = etaIntervento >= 0 ? etaIntervento : '';
                } else {
                    etaInterventoField.value = '';
                }
            }
        });
    }

    calculateInterventionProvv() {
        const superficieSottoField = document.getElementById('superficie-sottoparticella');
        const etaSoprassuoloField = document.getElementById('eta-soprassuolo');
        const imvField = document.getElementById('imv');
        const volumeTotaleField = document.getElementById('volume-totale');
        const intensitaInterventoField = document.getElementById('intensita-intervento');
        const interventionTable = document.querySelector('.intervention-table tbody');

        if (!superficieSottoField || !etaSoprassuoloField || !imvField || !volumeTotaleField || !intensitaInterventoField || !interventionTable) return;

        const superficieSotto = parseFloat(superficieSottoField.value) || 0;
        const etaSoprassuolo = parseFloat(etaSoprassuoloField.value) || 0;
        const imv = parseFloat(imvField.value) || 0;
        const volumeTotale = parseFloat(volumeTotaleField.value) || 0;
        const intensitaIntervento = parseFloat(intensitaInterventoField.value) || 0;

        // Calculate for all intervention rows
        const interventionRows = interventionTable.querySelectorAll('tr');
        interventionRows.forEach(row => {
            const etaInterventoField = row.querySelector('.intervention-eta-field');
            const provvField = row.querySelector('.intervention-provv-field');

            if (etaInterventoField && provvField) {
                const etaIntervento = parseFloat(etaInterventoField.value) || 0;

                if (superficieSotto > 0 && imv > 0 && etaIntervento >= 0 && etaSoprassuolo >= 0) {
                    // Formula: ((Superficie sottoparticella * (Imv * (età intervento - età soprassuolo))) + Volume totale) * (intensità intervento / 100)
                    const etaDifference = etaIntervento - etaSoprassuolo;
                    const totalBeforeReduction = (superficieSotto * (imv * etaDifference)) + volumeTotale;

                    // Apply intensità intervento as percentage to keep
                    const keepFactor = intensitaIntervento > 0 ? (intensitaIntervento / 100) : 1;
                    const provv = totalBeforeReduction * keepFactor;

                    provvField.value = provv >= 0 ? provv.toFixed(2) : '';
                } else {
                    provvField.value = '';
                }
            }
        });
    }

    calculateInterventionRipresa() {
        const imvField = document.getElementById('imv');
        const interventionTable = document.querySelector('.intervention-table tbody');

        if (!imvField || !interventionTable) return;

        const imv = parseFloat(imvField.value) || 0;

        // Calculate for all intervention rows
        const interventionRows = interventionTable.querySelectorAll('tr');
        interventionRows.forEach(row => {
            const superficieInterventoField = row.querySelector('.intervention-superficie-field');
            const ripreseField = row.querySelector('.intervention-ripresa-field');

            if (superficieInterventoField && ripreseField) {
                const superficieIntervento = parseFloat(superficieInterventoField.value) || 0;

                if (superficieIntervento > 0 && imv > 0) {
                    // Formula: superficie intervento * Imv
                    const ripresa = superficieIntervento * imv;
                    ripreseField.value = ripresa.toFixed(2);
                } else {
                    ripreseField.value = '';
                }
            }
        });
    }

    // ========================================
    // VALIDATION METHODS
    // ========================================

    validateTotalPercentage() {
        const speciesTable = document.querySelector('.species-table tbody');
        if (!speciesTable) return true;

        const rows = speciesTable.querySelectorAll('tr');
        let totalPercentage = 0;
        const percentageFields = [];

        // Calculate total percentage across all species
        rows.forEach(row => {
            const percentageField = row.querySelector('td:nth-child(2) input');
            if (percentageField) {
                const percentage = parseFloat(percentageField.value) || 0;
                totalPercentage += percentage;
                percentageFields.push(percentageField);
            }
        });

        // Remove previous error classes
        percentageFields.forEach(field => {
            field.classList.remove('percentage-error', 'percentage-warning');
        });

        // Check if total exceeds 100%
        if (totalPercentage > 100) {
            // Add error class to all percentage fields
            percentageFields.forEach(field => {
                field.classList.add('percentage-error');
            });

            alert(`Errore: La percentuale totale delle specie è ${totalPercentage}%, che supera il 100%. Per favore, regola le percentuali delle specie.`);
            return false;
        } else if (totalPercentage > 90 && totalPercentage <= 100) {
            // Add warning class when close to 100%
            percentageFields.forEach(field => {
                field.classList.add('percentage-warning');
            });
        }

        return true;
    }

    validateCadastralSuperficie() {
        const superficieSottoField = document.getElementById('superficie-sottoparticella');
        const cadastralSuperficieFields = document.querySelectorAll('.cadastral-superficie-field');
        const cadastralContainer = document.querySelector('.cadastral-container');

        if (!superficieSottoField || !cadastralContainer) return true;

        const maxSuperficie = parseFloat(superficieSottoField.value) || 0;
        let totalCadastralSuperficie = 0;

        // Calculate total cadastral superficie
        cadastralSuperficieFields.forEach(field => {
            const value = parseFloat(field.value) || 0;
            totalCadastralSuperficie += value;
        });

        // Check if total exceeds limit
        const isOverLimit = totalCadastralSuperficie > maxSuperficie;

        // Add or remove error styling
        if (isOverLimit) {
            cadastralContainer.classList.add('superficie-error');

            // Show error message
            let errorMsg = document.getElementById('cadastral-error-msg');
            if (!errorMsg) {
                errorMsg = document.createElement('div');
                errorMsg.id = 'cadastral-error-msg';
                errorMsg.className = 'error-message';
                errorMsg.innerHTML = `⚠️ Errore: La somma delle superfici catastali (${totalCadastralSuperficie.toFixed(4)} ha) supera la superficie sottoparticella (${maxSuperficie.toFixed(4)} ha)`;
                cadastralContainer.insertBefore(errorMsg, cadastralContainer.firstChild);
            } else {
                errorMsg.innerHTML = `⚠️ Errore: La somma delle superfici catastali (${totalCadastralSuperficie.toFixed(4)} ha) supera la superficie sottoparticella (${maxSuperficie.toFixed(4)} ha)`;
            }
        } else {
            cadastralContainer.classList.remove('superficie-error');

            // Remove error message
            const errorMsg = document.getElementById('cadastral-error-msg');
            if (errorMsg) {
                errorMsg.remove();
            }
        }

        return !isOverLimit;
    }

    // ========================================
    // SETUP LISTENERS
    // ========================================

    setupCalculationListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupAutomaticCalculations();
            this.setupFormFieldListeners();
        });
    }

    setupFormFieldListeners() {
        // Add input validation for superficie sottoparticella (real-time)
        const superficieSottoInput = document.getElementById('superficie-sottoparticella');
        if (superficieSottoInput) {
            superficieSottoInput.addEventListener('input', (e) => {
                const value = e.target.value;
                // Allow only numbers, dots, and commas
                const sanitized = value.replace(/[^0-9.,]/g, '');
                if (sanitized !== value) {
                    e.target.value = sanitized;
                }
            });

            superficieSottoInput.addEventListener('blur', () => {
                this.validateAndFormatDecimals(superficieSottoInput);
            });
        }

        // Add listeners to superficie particella (this is auto-calculated, but format on manual edit)
        const superficieParticellaInput = document.getElementById('superficie-particella');
        if (superficieParticellaInput) {
            superficieParticellaInput.addEventListener('input', (e) => {
                const value = e.target.value;
                // Allow only numbers, dots, and commas
                const sanitized = value.replace(/[^0-9.,]/g, '');
                if (sanitized !== value) {
                    e.target.value = sanitized;
                }
            });

            superficieParticellaInput.addEventListener('blur', () => {
                this.validateAndFormatDecimals(superficieParticellaInput);
            });
        }

        // Add listeners to existing intervention superficie fields
        const existingInterventionFields = document.querySelectorAll('.intervention-superficie-field');
        existingInterventionFields.forEach(field => {
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
                this.validateAndFormatDecimals(field);
            });
        });

        // Add listeners to existing cadastral superficie fields
        const existingCadastralFields = document.querySelectorAll('.cadastral-superficie-field');
        existingCadastralFields.forEach(field => {
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
                this.validateAndFormatDecimals(field);
            });
        });

        console.log('Form field listeners with 4-decimal formatting setup completed');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalculationModule;
}