import React from 'react';
import type { Tool, ToolGroup } from '@/types';
import { TOOL_GROUPS } from '@/types';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/hooks/useI18n';
import { useSupportId } from '@/hooks/useSupportId';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Zap,
  Files,
  Scissors,
  Minimize2,
  Shield,
  ScanText,
  Stamp,
  PenTool,
  FileInput,
  RotateCw,
  Trash2,
  FileStack,
  Images,
  Image as ImageIcon,
  FileText,
  FileOutput,
  Feather,
  Layers,
  FileOutput as ExtractIcon,
  Table,
  MessageSquare,
  Lock
} from 'lucide-react';

interface SidebarProps {
  currentTool: Tool | null;
  onToolSelect: (tool: Tool) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedGroup: ToolGroup;
  onOpenFeedback: () => void;
}

// Tool definitions with icons
const TOOLS: Array<{ id: Tool; icon: React.ElementType; tier: number }> = [
  // Tier 1: Core tools
  { id: 'organize-pdf', icon: Files, tier: 1 },
  { id: 'merge-pdf', icon: Files, tier: 1 },
  { id: 'split-pdf', icon: Scissors, tier: 1 },
  { id: 'compress-pdf', icon: Minimize2, tier: 1 },
  { id: 'protect-pdf', icon: Shield, tier: 1 },
  { id: 'ocr-pdf', icon: ScanText, tier: 1 },

  // Tier 2: Edit tools
  { id: 'watermark-pdf', icon: Stamp, tier: 2 },
  { id: 'edit-pdf', icon: PenTool, tier: 3 },
  { id: 'add-form-fields-pdf', icon: FileInput, tier: 3 },
  { id: 'rotate-pdf', icon: RotateCw, tier: 2 },
  { id: 'delete-pages-pdf', icon: Trash2, tier: 2 },
  { id: 'extract-pages-pdf', icon: FileStack, tier: 2 },

  // Tier 3: Convert tools
  { id: 'images-to-pdf', icon: Images, tier: 3 },
  { id: 'pdf-to-images', icon: ImageIcon, tier: 3 },
  { id: 'pdf-to-word', icon: FileText, tier: 3 },
  { id: 'word-to-pdf', icon: FileOutput, tier: 3 },
  { id: 'sign-pdf', icon: Feather, tier: 3 },
  { id: 'flatten-pdf', icon: Layers, tier: 3 },
  { id: 'extract-images-pdf', icon: ExtractIcon, tier: 3 },
  { id: 'tables-pdf', icon: Table, tier: 3 },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTool,
  onToolSelect,
  collapsed,
  selectedGroup,
  onOpenFeedback,
}) => {
  const { t } = useI18n();
  const supportId = useSupportId();
  const { isPremium } = useSubscription();

  // Filter tools based on selected group
  const filteredTools = TOOLS.filter((tool) =>
    TOOL_GROUPS[selectedGroup].includes(tool.id)
  );

  return (
    <aside
      className={`fixed left-0 top-0 h-screen border-r border-white/20 dark:border-white/10 transition-all duration-300 ease-in-out z-20 overflow-y-auto ${collapsed ? 'w-20' : 'w-72'} shadow-2xl`}
      style={{ paddingTop: '8rem' }}
    >
      <div className="card-glass"></div>
      <div className="relative z-10">
        {/* Section title */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
              {t('sidebar.tools')}
            </h2>
          </div>
        )}

        {/* Tools list */}
        <nav className="p-2">
          <ul className="space-y-1">
            {filteredTools.map((tool) => {
              const isActive = currentTool === tool.id;
              const Icon = tool.icon;

              return (
                <li key={tool.id}>
                  <Button
                    variant="ghost"
                    onClick={() => onToolSelect(tool.id)}
                    className={`group w-full justify-start gap-4 px-4 py-3 h-auto transition-all duration-300 rounded-lg mx-0 relative overflow-hidden ${isActive
                      ? 'text-gray-900 dark:text-white font-semibold'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    title={collapsed ? t(`tools.${tool.id}.name`) : undefined}
                    aria-label={t(`tools.${tool.id}.name`)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {/* Hover/Active Glass layers */}
                    <>
                      <div className={`card-glass opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100' : ''} group-hover:[filter:url(#liquid-refraction)]`}></div>
                      <div className={`card-glow opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-50' : ''}`}></div>
                    </>

                    <span className={`relative z-10 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200'}`}>
                      <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                    </span>
                    {!collapsed && (
                      <span className="relative z-10 text-sm truncate transition-colors duration-200 flex-1 text-left">
                        {t(`tools.${tool.id}.name`)}
                      </span>
                    )}
                    {tool.tier === 3 && !isPremium && !collapsed && (
                      <Lock size={12} className="relative z-10 text-amber-500/70 ml-2" />
                    )}
                    {isActive && !collapsed && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-accent-blue z-20 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>

          {/* Pro / Upgrade Section */}
          <div className="mt-4 px-2 pb-4">
            {isPremium ? (
              <div className={`flex items-center gap-3 p-3 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-500 ${collapsed ? 'justify-center' : ''}`}>
                <Zap size={18} className="fill-green-500" />
                {!collapsed && (
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider">{t('monetization.proStatus')}</span>
                    <span className="text-[10px] opacity-70">{t('monetization.activeSubscription')}</span>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => window.location.hash = '#upgrade'}
                className={`group relative flex items-center gap-3 p-3 rounded-2xl bg-accent-blue/10 border border-accent-blue/30 text-accent-blue transition-all hover:bg-accent-blue/20 hover:border-accent-blue/50 w-full overflow-hidden ${collapsed ? 'justify-center' : ''}`}
              >
                <div className="card-glass opacity-0 group-hover:opacity-100"></div>
                <Zap size={18} className="fill-accent-blue animate-pulse-slow relative z-10" />
                {!collapsed && (
                  <div className="flex flex-col items-start relative z-10 text-left">
                    <span className="text-xs font-bold uppercase tracking-wider">{t('monetization.upgradeTitle')}</span>
                    <span className="text-[10px] opacity-70 italic line-clamp-1">{t('monetization.upgradeSubtitle')}</span>
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Resources Footer */}
          <div className="mt-4 pt-4 border-t border-white/10">
            {!collapsed && (
              <div className="px-3 space-y-4">
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-500/80">
                  {t('common.resources')}
                </h3>

                {/* Support ID Display */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group/id relative overflow-hidden transition-all hover:bg-white/10">
                  <div className="flex flex-col gap-1 relative z-10">
                    <span className="text-[9px] uppercase tracking-wider font-bold text-gray-400/80">
                      {t('common.supportId')}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-ocean-400/90 font-bold tracking-tight">
                        {supportId}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-md hover:bg-ocean-500/10 text-gray-500 hover:text-ocean-400 transition-colors"
                        onClick={() => {
                          navigator.clipboard.writeText(supportId);
                        }}
                        title="Copy ID"
                      >
                        <Files size={12} />
                      </Button>
                    </div>
                  </div>
                  {/* Subtle glow effect */}
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-ocean-500/10 blur-xl rounded-full transition-all group-hover/id:scale-150"></div>
                </div>

                {/* Feedback Button */}
                <Button
                  variant="ghost"
                  onClick={onOpenFeedback}
                  className="w-full justify-start gap-3 h-auto py-2.5 px-3 rounded-xl text-gray-500 hover:text-ocean-500 hover:bg-ocean-500/5 transition-all group"
                >
                  <MessageSquare size={16} className="transition-transform group-hover:scale-110" />
                  <span className="text-sm font-medium">{t('common.feedback')}</span>
                </Button>
              </div>
            )}

            {collapsed && (
              <div className="flex flex-col items-center gap-4 py-2">
                <div
                  className="w-2 h-2 rounded-full bg-ocean-500 animate-pulse cursor-help"
                  title={`${t('common.supportId')}: ${supportId}`}
                  onClick={() => navigator.clipboard.writeText(supportId)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenFeedback}
                  className="h-9 w-9 rounded-lg text-gray-500 hover:text-ocean-500 hover:bg-ocean-500/5"
                  title={t('common.feedback')}
                >
                  <MessageSquare size={18} />
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
};
