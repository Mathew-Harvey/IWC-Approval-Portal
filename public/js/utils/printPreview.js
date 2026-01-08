/**
 * Print Preview Modal
 * Shows a preview of the document before printing
 * 
 * Usage:
 *   PrintPreview.init();
 *   PrintPreview.show('swms');  // or 'erp', 'wms', 'whsmp'
 */

const PrintPreview = {
    currentDocument: null,
    
    init() {
        this.createModal();
        this.interceptPrintButtons();
        console.log('🖨️ PrintPreview initialized');
    },
    
    createModal() {
        const modal = document.createElement('div');
        modal.id = 'printPreviewModal';
        modal.className = 'modal print-preview-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="PrintPreview.close()"></div>
            <div class="modal-content print-preview-content">
                <div class="modal-header print-preview-header">
                    <div class="preview-title">
                        <h2>📄 Document Preview</h2>
                        <span id="previewDocName" class="preview-doc-name"></span>
                    </div>
                    <div class="preview-controls">
                        <button class="btn btn-icon" onclick="PrintPreview.zoomOut()" title="Zoom Out">➖</button>
                        <span id="previewZoomLevel">100%</span>
                        <button class="btn btn-icon" onclick="PrintPreview.zoomIn()" title="Zoom In">➕</button>
                        <button class="btn btn-icon" onclick="PrintPreview.toggleFitWidth()" title="Fit Width">↔️</button>
                    </div>
                    <button class="modal-close" onclick="PrintPreview.close()">×</button>
                </div>
                <div class="modal-body print-preview-body">
                    <div class="preview-scroll-container">
                        <div class="preview-page-container" id="previewContainer">
                            <iframe id="previewFrame" class="preview-frame"></iframe>
                        </div>
                    </div>
                </div>
                <div class="modal-footer print-preview-footer">
                    <div class="preview-info">
                        <span id="previewPageInfo">Page 1</span>
                    </div>
                    <div class="preview-actions">
                        <button class="btn btn-secondary" onclick="PrintPreview.close()">
                            Cancel
                        </button>
                        <button class="btn btn-primary" onclick="PrintPreview.print()">
                            🖨️ Print Document
                        </button>
                        <button class="btn btn-primary" onclick="PrintPreview.openInNewTab()">
                            ↗️ Open in New Tab
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },
    
    interceptPrintButtons() {
        // Map of button IDs to document types
        const buttonMappings = [
            { btnId: 'btnPrintSWMS', docType: 'swms', docName: 'Safe Work Method Statement' },
            { btnId: 'btnPrintERP', docType: 'erp', docName: 'Emergency Response Plan' },
            { btnId: 'btnPrintWMS', docType: 'wms', docName: 'Work Method Statement' },
            { btnId: 'btnPrintWHSMP', docType: 'whsmp', docName: 'WHS Management Plan' },
            { btnId: 'btnGeneratePDF', docType: 'pdf', docName: 'PDF Package' }
        ];
        
        buttonMappings.forEach(({ btnId, docType, docName }) => {
            const btn = document.getElementById(btnId);
            if (!btn) return;
            
            // Store original click handler
            const originalHandler = btn.onclick;
            
            // Replace with preview handler
            btn.onclick = (e) => {
                e.preventDefault();
                this.show(docType, docName, originalHandler);
            };
        });
    },
    
    zoomLevel: 100,
    fitWidth: false,
    
    show(docType, docName, printHandler) {
        this.currentDocument = { docType, docName, printHandler };
        this.zoomLevel = 100;
        this.fitWidth = false;
        
        // Update title
        document.getElementById('previewDocName').textContent = docName;
        
        // Generate preview content
        const previewHtml = this.generatePreview(docType);
        
        // Load into iframe
        const frame = document.getElementById('previewFrame');
        frame.srcdoc = previewHtml;
        
        // Show modal
        document.getElementById('printPreviewModal').classList.add('active');
        
        // Update zoom display
        this.updateZoomDisplay();
    },
    
    close() {
        document.getElementById('printPreviewModal').classList.remove('active');
        this.currentDocument = null;
    },
    
    generatePreview(docType) {
        // Get the template content
        let content = '';
        
        try {
            // Get form data from App
            const formData = typeof App !== 'undefined' ? App.getFormData() : {};
            const templateData = typeof App !== 'undefined' ? App.prepareTemplateData(formData) : formData;
            
            // Get the template
            const templateId = this.getTemplateId(docType);
            const template = document.getElementById(templateId);
            
            if (template && typeof Handlebars !== 'undefined') {
                const compiled = Handlebars.compile(template.innerHTML);
                content = compiled(templateData);
            } else {
                content = '<p>Template not found or Handlebars not loaded.</p>';
            }
        } catch (error) {
            console.error('Preview generation error:', error);
            content = `<p>Error generating preview: ${error.message}</p>`;
        }
        
        // Wrap in full HTML document with styles
        return this.wrapInDocument(content);
    },
    
    getTemplateId(docType) {
        const templates = {
            'swms': 'swms-template',
            'erp': 'erp-template',
            'wms': 'wms-template',
            'whsmp': 'whsmp-template',
            'pdf': 'wms-template'  // Default for PDF
        };
        return templates[docType] || 'wms-template';
    },
    
    wrapInDocument(content) {
        // Get the document stylesheet
        const styleSheet = Array.from(document.styleSheets)
            .filter(sheet => {
                try {
                    return sheet.cssRules && sheet.href?.includes('styles.css');
                } catch (e) {
                    return false;
                }
            })
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n');
                } catch (e) {
                    return '';
                }
            })
            .join('\n');
        
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Document Preview</title>
                <style>
                    ${styleSheet}
                    
                    /* Preview-specific overrides */
                    body {
                        margin: 0;
                        padding: 20px;
                        background: white;
                    }
                    
                    .document, .wms-document, .swms-document {
                        max-width: 210mm;
                        margin: 0 auto;
                        box-shadow: none;
                        border: 1px solid #ddd;
                    }
                    
                    @page {
                        size: A4 portrait;
                        margin: 10mm;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
    },
    
    zoomIn() {
        this.zoomLevel = Math.min(this.zoomLevel + 25, 200);
        this.fitWidth = false;
        this.updateZoomDisplay();
    },
    
    zoomOut() {
        this.zoomLevel = Math.max(this.zoomLevel - 25, 50);
        this.fitWidth = false;
        this.updateZoomDisplay();
    },
    
    toggleFitWidth() {
        this.fitWidth = !this.fitWidth;
        if (this.fitWidth) {
            this.zoomLevel = 100;  // Reset for calculation
        }
        this.updateZoomDisplay();
    },
    
    updateZoomDisplay() {
        const container = document.getElementById('previewContainer');
        const frame = document.getElementById('previewFrame');
        const zoomText = document.getElementById('previewZoomLevel');
        
        if (this.fitWidth) {
            container.style.width = '100%';
            frame.style.transform = 'scale(1)';
            frame.style.width = '100%';
            zoomText.textContent = 'Fit';
        } else {
            const scale = this.zoomLevel / 100;
            frame.style.transform = `scale(${scale})`;
            frame.style.transformOrigin = 'top center';
            frame.style.width = `${100 / scale}%`;
            zoomText.textContent = `${this.zoomLevel}%`;
        }
    },
    
    print() {
        if (this.currentDocument?.printHandler) {
            this.close();
            // Call original print handler
            this.currentDocument.printHandler();
        } else {
            // Direct print from iframe
            const frame = document.getElementById('previewFrame');
            frame.contentWindow.print();
        }
    },
    
    openInNewTab() {
        const frame = document.getElementById('previewFrame');
        const content = frame.srcdoc;
        
        const newWindow = window.open('', '_blank');
        newWindow.document.write(content);
        newWindow.document.close();
    }
};

// Export for browser
if (typeof window !== 'undefined') {
    window.PrintPreview = PrintPreview;
}

