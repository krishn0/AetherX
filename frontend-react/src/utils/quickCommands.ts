/**
 * Quick Commands for Operation Office
 */

export interface QuickCommand {
    command: string;
    description: string;
    aliases?: string[];
    category: 'allocation' | 'view' | 'system' | 'help';
}

export const QUICK_COMMANDS: QuickCommand[] = [
    {
        command: '/allocate-critical',
        description: 'Allocate resources to critical severity zones only (8-10)',
        aliases: ['/ac', '/critical'],
        category: 'allocation'
    },
    {
        command: '/allocate-all',
        description: 'Allocate resources to all active disaster zones',
        aliases: ['/aa', '/all'],
        category: 'allocation'
    },
    {
        command: '/status',
        description: 'Show system status summary',
        aliases: ['/s'],
        category: 'system'
    },
    {
        command: '/clear-selection',
        description: 'Clear current zone selection',
        aliases: ['/clear', '/cs'],
        category: 'view'
    },
    {
        command: '/toggle-safe-areas',
        description: 'Toggle safe area visibility on map',
        aliases: ['/safe', '/tsa'],
        category: 'view'
    },
    {
        command: '/toggle-heatmap',
        description: 'Toggle disaster severity heatmap',
        aliases: ['/heat', '/hm'],
        category: 'view'
    },
    {
        command: '/toggle-clusters',
        description: 'Toggle resource marker clustering',
        aliases: ['/cluster', '/tc'],
        category: 'view'
    },
    {
        command: '/focus',
        description: 'Focus map on specific zone (usage: /focus ZONE-ID)',
        aliases: ['/f'],
        category: 'view'
    },
    {
        command: '/filter',
        description: 'Filter resources by type (usage: /filter Ambulance)',
        aliases: ['/ft'],
        category: 'view'
    },
    {
        command: '/help',
        description: 'Show all available commands',
        aliases: ['/h', '/?'],
        category: 'help'
    },
    {
        command: '/reinforce',
        description: 'Request reinforcement resources',
        aliases: ['/rf'],
        category: 'allocation'
    }
];

/**
 * Parse command from user input
 */
export function parseCommand(input: string): { command: string; args: string[] } | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return null;

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    return { command, args };
}

/**
 * Find command by name or alias
 */
export function findCommand(commandName: string): QuickCommand | undefined {
    return QUICK_COMMANDS.find(cmd =>
        cmd.command === commandName || cmd.aliases?.includes(commandName)
    );
}

/**
 * Get command suggestions based on partial input
 */
export function getCommandSuggestions(partial: string): QuickCommand[] {
    if (!partial.startsWith('/')) return [];

    const search = partial.toLowerCase();
    return QUICK_COMMANDS.filter(cmd =>
        cmd.command.startsWith(search) ||
        cmd.aliases?.some(alias => alias.startsWith(search)) ||
        cmd.description.toLowerCase().includes(search.slice(1))
    ).slice(0, 5);
}

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: QuickCommand['category']): QuickCommand[] {
    return QUICK_COMMANDS.filter(cmd => cmd.category === category);
}
