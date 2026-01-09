# Document Templates

**All document templates are stored here as standalone `.hbs` files.**

Edit these files to modify document content and styling.

## Template Files

| File | Description |
|------|-------------|
| `wms.hbs` | Work Method Statement |
| `erp.hbs` | Emergency Response Plan |
| `whsmp.hbs` | Work Health and Safety Management Plan |
| `swms.hbs` | Safe Work Method Statement |
| `email.hbs` | Email Notification |

## How Templates Work

1. Each `.hbs` file is a **standalone** Handlebars template
2. Each template contains its own `<style>` block with all CSS
3. Templates are loaded from `/templates/` at runtime
4. The `Templates` object in `js/templateLoader.js` handles loading and rendering

## Editing Templates

1. Open the `.hbs` file you want to edit
2. Modify the HTML structure or CSS styles
3. Save the file
4. **Refresh the page** - changes take effect immediately

### Template Structure

Each template has this structure:

```handlebars
{{!-- 
  Template Name
  Required data fields listed here
--}}

<style>
/* All CSS for this template */
:root {
    --primary: #0ea5e9;
    /* ... other variables ... */
}

.wms-document {
    /* ... styles ... */
}

@media print {
    /* Print-specific styles */
}
</style>

<div class="wms-document">
    <!-- HTML template with {{variable}} placeholders -->
</div>
```

### CSS Variables

Templates use these CSS variables (defined in each `<style>` block):

```css
--primary: #0ea5e9;     /* Main brand color */
--primary-dark: #0284c7;
--accent: #f59e0b;      /* Warning/highlight */
--success: #10b981;     /* Success/pass */
--danger: #ef4444;      /* Error/fail */
```

### Handlebars Syntax

Common patterns:

```handlebars
{{variableName}}                    <!-- Output variable -->
{{#if condition}}...{{/if}}         <!-- Conditional -->
{{#unless condition}}...{{/unless}} <!-- Inverse conditional -->
{{#each items}}{{this}}{{/each}}    <!-- Loop through array -->
{{formatDate dateString}}           <!-- Format date as DD/MM/YYYY -->
```

## Adding a New Template

1. Create a new `.hbs` file in this folder (e.g., `my-template.hbs`)
2. Include the full `<style>` block (copy from existing template)
3. Add documentation comment at top listing required data
4. Register in `js/templateLoader.js`:

```javascript
available: {
    'wms': 'wms.hbs',
    'erp': 'erp.hbs',
    'my-template': 'my-template.hbs'  // Add here
}
```

5. Call from app code:

```javascript
const html = await Templates.render('my-template', data);
```

## Print Styles

Each template includes `@media print` styles for PDF generation:

- Page breaks handled automatically
- UI elements hidden
- Colors print correctly with `print-color-adjust: exact`

## Deployment

When deploying, ensure templates are copied to `/public/templates/`:

```bash
node -e "const fs=require('fs'); fs.readdirSync('./templates').filter(f=>f.endsWith('.hbs')).forEach(f=>fs.copyFileSync('./templates/'+f,'./public/templates/'+f))"
```

## Troubleshooting

**Template not loading?**
- Check browser console for errors
- Ensure file exists in `/public/templates/`
- Verify template name matches in `templateLoader.js`

**Styles not applying?**
- Check CSS is inside the `<style>` block in the template
- Verify CSS variables are defined
- Check for typos in class names
