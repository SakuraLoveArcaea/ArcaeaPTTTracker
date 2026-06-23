<template>
    <div class="changelog-container scroll-container">
        <div v-html="parsedHtml" class="changelog-content"></div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import changelogRaw from '../../../../../CHANGELOG.md?raw';

const parsedHtml = computed(() => {
    let html = changelogRaw;

    // Escape HTML to prevent XSS (though changelog is trusted)
    html = html
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h4 class="changelog-h4">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="changelog-h3">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="changelog-h2">$1</h2>');

    // Bold text **bold**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="changelog-strong">$1</strong>');

    // Inline code `code`
    html = html.replace(/`(.*?)`/g, '<code class="changelog-code">$1</code>');

    // Nested list item (indented)
    html = html.replace(/^[ \t]{2,}[\*\-][ \t]+(.*$)/gim, '<li class="changelog-li-nested">$1</li>');
    // Top-level list item
    html = html.replace(/^[ \t]*[\*\-][ \t]+(.*$)/gim, '<li class="changelog-li">$1</li>');

    // Horizontal Rule ---
    html = html.replace(/^---$/gim, '<hr class="changelog-hr" />');

    // Split by newlines and wrap plain lines in p blocks
    const lines = html.split('\n');
    const processedLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        // If it already starts with our custom HTML tags, leave it as is
        if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<hr') || trimmed.startsWith('<code')) {
            return line;
        }
        return `<p class="changelog-p">${line}</p>`;
    });

    return processedLines.join('\n');
});
</script>

<style scoped lang="scss">
.changelog-container {
    max-height: 600px;
    overflow-y: auto;
    padding: 0.5rem 1rem;
    box-sizing: border-box;
    text-align: left;
}

/* Custom Scrollbar for modern look */
.scroll-container::-webkit-scrollbar {
    width: 6px;
}
.scroll-container::-webkit-scrollbar-track {
    background: transparent;
}
.scroll-container::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}
.scroll-container::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
}

.changelog-content {
    font-family: inherit;
    line-height: 1.6;
}

:deep(.changelog-h2) {
    font-size: 1.6rem;
    font-weight: 800;
    margin-top: 0;
    margin-bottom: 1rem;
    color: var(--text-color);
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.5rem;
}

:deep(.changelog-h3) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    color: #3b82f6; /* Accent color */
}

:deep(.changelog-h4) {
    font-size: 1rem;
    font-weight: 600;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: var(--text-color);
}

:deep(.changelog-p) {
    margin: 0 0 0.5rem 0;
    color: var(--text-color);
}

:deep(.changelog-strong) {
    font-weight: 700;
    color: var(--text-color);
}

:deep(.changelog-code) {
    font-family: 'Courier New', Courier, monospace;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    padding: 0.1rem 0.3rem;
    border-radius: 4px;
    font-size: 0.85em;
}

:deep(.changelog-li) {
    display: list-item;
    list-style-type: disc;
    margin-left: 1.25rem;
    margin-bottom: 0.4rem;
    color: var(--text-color);
}

:deep(.changelog-li-nested) {
    display: list-item;
    list-style-type: circle;
    margin-left: 2.5rem;
    margin-bottom: 0.3rem;
    font-size: 0.9em;
    color: var(--text-muted);
}

:deep(.changelog-hr) {
    border: none;
    border-top: 1px solid var(--border-color);
    margin: 1.5rem 0;
}

/* Light mode overrides */
:root:not(.p-dark) {
    .scroll-container::-webkit-scrollbar-thumb {
        background: rgba(15, 23, 42, 0.1);
    }
    .scroll-container::-webkit-scrollbar-thumb:hover {
        background: rgba(15, 23, 42, 0.2);
    }
    :deep(.changelog-h3) {
        color: #2563eb;
    }
    :deep(.changelog-code) {
        background: rgba(37, 99, 235, 0.05);
        color: #2563eb;
    }
}
</style>
